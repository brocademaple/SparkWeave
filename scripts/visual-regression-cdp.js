const fs = require('node:fs/promises');
const path = require('node:path');

const CDP_URL = process.env.CDP_URL || 'http://127.0.0.1:9333';
const APP_URL = process.env.APP_URL || 'http://localhost:8099';
const OUT_DIR = process.env.OUT_DIR || path.join(process.cwd(), 'dist-check');
const WIDTH = Number(process.env.VIEWPORT_WIDTH || 390);
const HEIGHT = Number(process.env.VIEWPORT_HEIGHT || 844);

let seq = 0;

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const pages = await fetch(`${CDP_URL}/json/list`).then((response) => response.json());
  const page = pages.find((item) => item.url.includes('localhost')) || pages[0];
  if (!page?.webSocketDebuggerUrl) {
    throw new Error('No Chrome DevTools page found. Start Chrome with --remote-debugging-port=9333 first.');
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map();

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) {
      return;
    }
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) {
      reject(new Error(JSON.stringify(message.error)));
    } else {
      resolve(message.result);
    }
  };

  function send(method, params = {}) {
    const id = ++seq;
    ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
  }

  async function wait(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForLoad() {
    await new Promise((resolve) => {
      const handler = (event) => {
        const message = JSON.parse(event.data);
        if (message.method === 'Page.loadEventFired') {
          ws.removeEventListener('message', handler);
          resolve();
        }
      };
      ws.addEventListener('message', handler);
    });
  }

  async function screenshot(name) {
    await wait(700);
    const result = await send('Page.captureScreenshot', {
      captureBeyondViewport: false,
      format: 'png',
      fromSurface: true,
    });
    const file = path.join(OUT_DIR, `${name}.png`);
    await fs.writeFile(file, Buffer.from(result.data, 'base64'));
    return file;
  }

  async function elements() {
    const result = await send('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('[role="tab"],button')).map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            role: el.getAttribute('role'),
            text: (el.innerText || el.textContent || '').trim(),
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          };
        })
      `,
      returnByValue: true,
    });
    return result.result.value;
  }

  async function clickElement(match, label) {
    const all = await elements();
    const element = all.find(match);
    if (!element) {
      throw new Error(`Cannot find ${label}. Elements: ${JSON.stringify(all)}`);
    }
    const x = element.rect.x + element.rect.width / 2;
    const y = element.rect.y + element.rect.height / 2;
    await send('Input.dispatchMouseEvent', { button: 'left', clickCount: 1, type: 'mousePressed', x, y });
    await send('Input.dispatchMouseEvent', { button: 'left', clickCount: 1, type: 'mouseReleased', x, y });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    deviceScaleFactor: 3,
    height: HEIGHT,
    mobile: true,
    width: WIDTH,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: APP_URL });
  await waitForLoad();
  await wait(1000);

  const files = [];
  files.push(await screenshot(`today-${WIDTH}`));
  await clickElement((item) => item.role === 'tab' && item.text.includes('编织'), 'Weave tab');
  files.push(await screenshot(`weave-${WIDTH}`));
  await clickElement(
    (item) => item.role === 'button' && item.text === '' && item.rect.y > HEIGHT * 0.65,
    'bottom capture button',
  );
  files.push(await screenshot(`capture-sheet-${WIDTH}`));

  ws.close();
  console.log(JSON.stringify({ files, viewport: { width: WIDTH, height: HEIGHT } }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
