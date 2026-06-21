import type { Capture, Project, SparkWeaveState, Thought } from './types';

export const seedProjects: Project[] = [
  {
    id: 'project-sparkweave',
    name: 'SparkWeave MVP',
    brief: '把捕捉、编织和项目执行做成一个每天能打开使用的闭环。',
    tags: ['产品', '原型', '执行'],
    status: 'active',
    progress: 0.42,
  },
  {
    id: 'project-writing',
    name: '知识产品写作',
    brief: '沉淀一套从碎片想法到文章结构的个人工作流。',
    tags: ['写作', '知识库'],
    status: 'active',
    progress: 0.28,
  },
  {
    id: 'project-review',
    name: '周复盘系统',
    brief: '把完成事项、反复出现的主题和下周动作连接起来。',
    tags: ['复盘', '节奏'],
    status: 'paused',
    progress: 0.18,
  },
];

export const seedCaptures: Capture[] = [
  {
    id: 'capture-1',
    title: '第一屏不要塞满功能',
    body: 'Today 应该像命令中心，只露出最关键的下一步和洞察，复杂信息放进下钻页。',
    tags: ['产品', '界面'],
    projectId: 'project-sparkweave',
    status: 'active',
    createdAt: '2026-06-15T09:24:00.000Z',
    nextAction: '把 Today 保持在 3 个主要区块以内',
  },
  {
    id: 'capture-2',
    title: '编织关系先用规则，不急着接 API',
    body: '用标签、项目、关键词把卡片聚成主题簇。等交互验证后，再让模型生成摘要和建议。',
    tags: ['编织', 'AI', '规则'],
    projectId: 'project-sparkweave',
    status: 'inbox',
    createdAt: '2026-06-15T10:12:00.000Z',
    nextAction: '定义本地规则和可解释的聚类原因',
  },
  {
    id: 'capture-3',
    title: '字体走宋体高级知识产品',
    body: '标题使用 Songti SC 一类的高反差中文衬线，正文用苹方保持工具感。',
    tags: ['视觉', '字体'],
    projectId: 'project-sparkweave',
    status: 'inbox',
    createdAt: '2026-06-15T11:03:00.000Z',
    nextAction: '把字体写进 design token',
  },
  {
    id: 'capture-4',
    title: '长期数据要迁 SQLite',
    body: '卡片、标签、项目、关系边和搜索都更适合结构化存储；MVP 先用 AsyncStorage。',
    tags: ['存储', 'SQLite'],
    projectId: 'project-sparkweave',
    status: 'active',
    createdAt: '2026-06-15T11:45:00.000Z',
    nextAction: '先把存储接口隔离出来',
  },
  {
    id: 'capture-5',
    title: '文章想法：从工具到工作室',
    body: 'SparkWeave 不只是任务清单，更像一个把想法慢慢织成行动的思考工作室。',
    tags: ['写作', '定位'],
    projectId: 'project-writing',
    status: 'done',
    createdAt: '2026-06-14T21:10:00.000Z',
    nextAction: '展开成 3 个小节',
  },
];

export const seedThoughts: Thought[] = [
  {
    id: 'thought-sparkweave-home',
    projectId: 'project-sparkweave',
    title: '首页应该只留下真正驱动行动的入口',
    brief: '先把首页收成一个轻量命令中心，复杂判断进入下钻页。',
    model: '金字塔结构',
    tags: ['产品', '界面'],
    captureIds: ['capture-1', 'capture-2'],
    status: 'active',
  },
  {
    id: 'thought-sparkweave-weave',
    projectId: 'project-sparkweave',
    title: '编织先解释关系，再决定是否接模型',
    brief: '先让连接逻辑可解释，等交互验证后再引入 AI 生成。',
    model: '决策分层',
    tags: ['编织', 'AI', '规则'],
    captureIds: ['capture-2', 'capture-4'],
    status: 'draft',
  },
  {
    id: 'thought-writing-angle',
    projectId: 'project-writing',
    title: '从碎片定位一条可写的文章主线',
    brief: '用多条灵感拼出文章的核心判断，再落成结构和下一步。',
    model: '行动闭环',
    tags: ['写作', '定位'],
    captureIds: ['capture-5'],
    status: 'active',
  },
];

export const defaultState: SparkWeaveState = {
  captures: seedCaptures,
  projects: seedProjects,
  thoughts: seedThoughts,
  themeMode: 'light',
  settings: {
    dailyAssistantEnabled: true,
  },
  feedback: [],
};
