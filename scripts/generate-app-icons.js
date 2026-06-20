const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');

const palette = {
  paper: [248, 246, 241, 255],
  paperWarm: [255, 253, 248, 255],
  paperDeep: [239, 231, 218, 255],
  ink: [23, 21, 18, 255],
  hairline: [231, 223, 210, 255],
  sage: [139, 165, 150, 255],
  cobalt: [93, 119, 166, 255],
  coral: [201, 111, 82, 255],
  violet: [140, 124, 168, 255],
  gold: [178, 146, 91, 255],
  white: [255, 253, 248, 255],
  shadow: [49, 42, 31, 255],
};

function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function createCanvas(width, height, transparent = false) {
  const data = new Uint8ClampedArray(width * height * 4);
  if (!transparent) {
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const dx = (x - width * 0.35) / width;
        const dy = (y - height * 0.24) / height;
        const glow = clamp(Math.sqrt(dx * dx + dy * dy) / 0.78, 0, 1);
        const vertical = y / height;
        const base = mix(palette.paperWarm, palette.paper, glow);
        const color = mix(base, palette.paperDeep, vertical * 0.18 + glow * 0.12);
        const i = (y * width + x) * 4;
        data[i] = color[0];
        data[i + 1] = color[1];
        data[i + 2] = color[2];
        data[i + 3] = 255;
      }
    }
  }
  return { data, width, height };
}

function blendPixel(canvas, x, y, color, alpha) {
  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height || alpha <= 0) return;
  const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
  const srcA = (color[3] / 255) * alpha;
  const dstA = canvas.data[i + 3] / 255;
  const outA = srcA + dstA * (1 - srcA);
  if (outA <= 0) return;
  canvas.data[i] = Math.round((color[0] * srcA + canvas.data[i] * dstA * (1 - srcA)) / outA);
  canvas.data[i + 1] = Math.round((color[1] * srcA + canvas.data[i + 1] * dstA * (1 - srcA)) / outA);
  canvas.data[i + 2] = Math.round((color[2] * srcA + canvas.data[i + 2] * dstA * (1 - srcA)) / outA);
  canvas.data[i + 3] = Math.round(outA * 255);
}

function drawCircle(canvas, cx, cy, radius, color, opacity = 1) {
  const minX = Math.floor(cx - radius - 2);
  const maxX = Math.ceil(cx + radius + 2);
  const minY = Math.floor(cy - radius - 2);
  const maxY = Math.ceil(cy + radius + 2);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const distance = Math.sqrt((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2);
      const coverage = clamp(radius + 0.5 - distance, 0, 1);
      blendPixel(canvas, x, y, color, coverage * opacity);
    }
  }
}

function drawRing(canvas, cx, cy, radius, stroke, color, opacity = 1) {
  const outer = radius + stroke / 2;
  const inner = radius - stroke / 2;
  const minX = Math.floor(cx - outer - 2);
  const maxX = Math.ceil(cx + outer + 2);
  const minY = Math.floor(cy - outer - 2);
  const maxY = Math.ceil(cy + outer + 2);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const d = Math.sqrt((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2);
      const outerCov = clamp(outer + 0.5 - d, 0, 1);
      const innerCov = clamp(d - inner + 0.5, 0, 1);
      blendPixel(canvas, x, y, color, outerCov * innerCov * opacity);
    }
  }
}

function cubicPoint(points, t) {
  const mt = 1 - t;
  return {
    x:
      mt ** 3 * points[0].x +
      3 * mt ** 2 * t * points[1].x +
      3 * mt * t ** 2 * points[2].x +
      t ** 3 * points[3].x,
    y:
      mt ** 3 * points[0].y +
      3 * mt ** 2 * t * points[1].y +
      3 * mt * t ** 2 * points[2].y +
      t ** 3 * points[3].y,
  };
}

function drawCubicStroke(canvas, points, radius, color, opacity = 1, steps = 280) {
  for (let i = 0; i <= steps; i += 1) {
    const p = cubicPoint(points, i / steps);
    drawCircle(canvas, p.x, p.y, radius, color, opacity);
  }
}

function drawDiamond(canvas, cx, cy, rx, ry, color, opacity = 1) {
  const minX = Math.floor(cx - rx - 2);
  const maxX = Math.ceil(cx + rx + 2);
  const minY = Math.floor(cy - ry - 2);
  const maxY = Math.ceil(cy + ry + 2);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const d = Math.abs(x + 0.5 - cx) / rx + Math.abs(y + 0.5 - cy) / ry;
      const coverage = clamp((1 - d) * Math.min(rx, ry), 0, 1);
      blendPixel(canvas, x, y, color, coverage * opacity);
    }
  }
}

function drawGrid(canvas, scale) {
  const color = [...palette.hairline];
  for (const x of [208, 336, 512, 688, 816]) {
    for (let y = 116; y <= 908; y += 5) drawCircle(canvas, x * scale, y * scale, 1.1 * scale, color, 0.38);
  }
  for (const y of [208, 336, 512, 688, 816]) {
    for (let x = 116; x <= 908; x += 5) drawCircle(canvas, x * scale, y * scale, 1.1 * scale, color, 0.34);
  }
}

function drawMark(canvas, scale = 1, includeNodes = true, includeBackdrop = true) {
  const s = scale;
  if (includeBackdrop) {
    drawGrid(canvas, s);
    drawCircle(canvas, 512 * s, 512 * s, 330 * s, [255, 253, 248, 125], 0.18);
    drawRing(canvas, 512 * s, 512 * s, 288 * s, 5.5 * s, palette.hairline, 0.48);
    drawRing(canvas, 512 * s, 512 * s, 184 * s, 4.2 * s, palette.hairline, 0.34);
  }

  const paths = [
    {
      color: palette.cobalt,
      radius: 15.5 * s,
      points: [
        { x: 198 * s, y: 650 * s },
        { x: 300 * s, y: 262 * s },
        { x: 695 * s, y: 276 * s },
        { x: 830 * s, y: 620 * s },
      ],
    },
    {
      color: palette.coral,
      radius: 15.5 * s,
      points: [
        { x: 186 * s, y: 402 * s },
        { x: 376 * s, y: 766 * s },
        { x: 666 * s, y: 766 * s },
        { x: 838 * s, y: 386 * s },
      ],
    },
    {
      color: palette.sage,
      radius: 13.5 * s,
      points: [
        { x: 278 * s, y: 758 * s },
        { x: 184 * s, y: 454 * s },
        { x: 378 * s, y: 250 * s },
        { x: 516 * s, y: 344 * s },
      ],
    },
    {
      color: palette.sage,
      radius: 13.5 * s,
      points: [
        { x: 516 * s, y: 344 * s },
        { x: 672 * s, y: 452 * s },
        { x: 704 * s, y: 608 * s },
        { x: 560 * s, y: 704 * s },
      ],
    },
    {
      color: palette.violet,
      radius: 12.5 * s,
      points: [
        { x: 298 * s, y: 318 * s },
        { x: 470 * s, y: 662 * s },
        { x: 654 * s, y: 262 * s },
        { x: 766 * s, y: 526 * s },
      ],
    },
    {
      color: palette.gold,
      radius: 10 * s,
      points: [
        { x: 276 * s, y: 512 * s },
        { x: 410 * s, y: 404 * s },
        { x: 610 * s, y: 408 * s },
        { x: 748 * s, y: 516 * s },
      ],
    },
  ];

  for (const pathSpec of paths) {
    const shifted = pathSpec.points.map((p) => ({ x: p.x, y: p.y + 14 * s }));
    drawCubicStroke(canvas, shifted, pathSpec.radius + 10 * s, palette.shadow, 0.08, 240);
  }
  for (const pathSpec of paths) drawCubicStroke(canvas, pathSpec.points, pathSpec.radius + 11 * s, palette.white, 0.74, 240);
  for (const pathSpec of paths) drawCubicStroke(canvas, pathSpec.points, pathSpec.radius, pathSpec.color, 1, 280);

  if (includeNodes) {
    const nodes = [
      [198, 650, 34, palette.cobalt],
      [830, 620, 34, palette.cobalt],
      [186, 402, 31, palette.coral],
      [838, 386, 31, palette.coral],
      [516, 344, 29, palette.sage],
      [560, 704, 29, palette.sage],
      [298, 318, 25, palette.violet],
      [748, 516, 23, palette.gold],
    ];
    for (const [x, y, r, color] of nodes) {
      drawCircle(canvas, x * s, (y + 11) * s, (r + 6) * s, palette.shadow, 0.06);
      drawCircle(canvas, x * s, y * s, r * s, palette.white, 1);
      drawRing(canvas, x * s, y * s, (r - 2) * s, 8 * s, color, 1);
    }
  }

  drawCircle(canvas, 512 * s, 512 * s, 95 * s, [255, 253, 248, 255], 0.84);
  drawCircle(canvas, 512 * s, 524 * s, 82 * s, palette.shadow, 0.05);
  drawDiamond(canvas, 512 * s, 512 * s, 125 * s, 125 * s, palette.gold, 1);
  drawDiamond(canvas, 512 * s, 512 * s, 68 * s, 68 * s, palette.white, 1);
  drawDiamond(canvas, 512 * s, 512 * s, 26 * s, 26 * s, palette.gold, 0.92);
}

function resizeNearestAlpha(canvas, targetSize) {
  const out = createCanvas(targetSize, targetSize, true);
  const scale = canvas.width / targetSize;
  for (let y = 0; y < targetSize; y += 1) {
    for (let x = 0; x < targetSize; x += 1) {
      const sx = Math.floor((x + 0.5) * scale);
      const sy = Math.floor((y + 0.5) * scale);
      const si = (sy * canvas.width + sx) * 4;
      const di = (y * targetSize + x) * 4;
      out.data[di] = canvas.data[si];
      out.data[di + 1] = canvas.data[si + 1];
      out.data[di + 2] = canvas.data[si + 2];
      out.data[di + 3] = canvas.data[si + 3];
    }
  }
  return out;
}

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i];
    for (let k = 0; k < 8; k += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  }
  return ~crc >>> 0;
}

function pngChunk(type, data) {
  const typeBuf = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

function writePng(canvas, filename) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(canvas.width, 0);
  header.writeUInt32BE(canvas.height, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const stride = canvas.width * 4;
  const raw = Buffer.alloc((stride + 1) * canvas.height);
  for (let y = 0; y < canvas.height; y += 1) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(canvas.data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(path.join(ASSETS, filename), png);
}

function buildIcon() {
  const canvas = createCanvas(1024, 1024);
  drawMark(canvas, 1, true, true);
  writePng(canvas, 'icon.png');
}

function buildForeground(filename, size) {
  const canvas = createCanvas(1024, 1024, true);
  const mark = createCanvas(1024, 1024, true);
  drawMark(mark, 0.74, true, false);
  const offset = Math.round((1024 - 1024 * 0.74) / 2);
  for (let y = 0; y < 1024; y += 1) {
    for (let x = 0; x < 1024; x += 1) {
      const sx = x - offset;
      const sy = y - offset;
      if (sx < 0 || sy < 0 || sx >= 1024 || sy >= 1024) continue;
      const si = (sy * 1024 + sx) * 4;
      const alpha = mark.data[si + 3] / 255;
      if (alpha > 0) blendPixel(canvas, x, y, [mark.data[si], mark.data[si + 1], mark.data[si + 2], mark.data[si + 3]], 1);
    }
  }
  writePng(size === 1024 ? canvas : resizeNearestAlpha(canvas, size), filename);
}

buildIcon();
buildForeground('adaptive-icon.png', 1024);
buildForeground('splash-icon.png', 1024);
buildForeground('favicon.png', 48);

console.log('Generated SparkWeave icons in assets/');
