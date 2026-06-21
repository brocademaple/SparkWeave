import type { Capture, Project, WeaveCluster } from './types';

const keywordMap: Array<{
  title: string;
  model: '金字塔结构' | '决策分层' | '行动闭环';
  keywords: string[];
  tags: string[];
  sharedProblem: string;
  suggestedAction: string;
}> = [
  {
    title: '产品层级',
    model: '金字塔结构',
    keywords: ['第一屏', '命令中心', '下钻', 'Today'],
    tags: ['产品', '界面'],
    sharedProblem: '这些灵感都在处理“第一屏该承载什么”的判断，核心是减少入口噪音，让用户更快进入创作状态。',
    suggestedAction: '把首页信息压缩成一个主建议、一个快速捕捉入口和少量过程指标。',
  },
  {
    title: '编织引擎',
    model: '决策分层',
    keywords: ['编织', '关系', '聚类', 'API', 'AI'],
    tags: ['编织', 'AI', '规则'],
    sharedProblem: '这些灵感共同指向“系统为什么能把素材连起来”，需要先让连接逻辑可解释，再考虑模型增强。',
    suggestedAction: '为每个主题簇固定输出连接原因、共同问题和下一步动作。',
  },
  {
    title: '视觉语言',
    model: '金字塔结构',
    keywords: ['字体', '宋体', '视觉', '纸感'],
    tags: ['视觉', '字体'],
    sharedProblem: '这些灵感在寻找创作者工具的气质：既要像知识产品一样安静，也要保留灵感编织的仪式感。',
    suggestedAction: '收敛到更轻的 iOS 层级、克制卡片和少量玻璃质感，不做炫技式图谱。',
  },
  {
    title: '数据底座',
    model: '决策分层',
    keywords: ['SQLite', 'AsyncStorage', '存储', '搜索'],
    tags: ['存储', 'SQLite'],
    sharedProblem: '这些灵感都在提醒：素材、关系边、反馈和输出是长期资产，不能只停留在临时状态里。',
    suggestedAction: '先保持存储接口隔离，后续迁移 SQLite 并支持 Markdown/JSON 导出。',
  },
  {
    title: '内容沉淀',
    model: '行动闭环',
    keywords: ['文章', '写作', '知识', '定位'],
    tags: ['写作', '定位'],
    sharedProblem: '这些灵感都围绕“收藏越多，产出越少”的断层，真正缺的是把素材组织成判断和开头。',
    suggestedAction: '用这组素材生成一篇《为什么收藏越多，产出越少？》的文章结构。',
  },
];

export function buildWeaveClusters(captures: Capture[], projects: Project[]): WeaveCluster[] {
  const clusters = keywordMap
    .map((rule, index) => {
      const matched = captures.filter((capture) => {
        const haystack = `${capture.title} ${capture.body} ${capture.tags.join(' ')}`;
        return (
          rule.tags.some((tag) => capture.tags.includes(tag)) ||
          rule.keywords.some((keyword) => haystack.includes(keyword))
        );
      });

      if (!matched.length) {
        return null;
      }

      const projectId = mostFrequent(matched.map((capture) => capture.projectId).filter(Boolean) as string[]);
      const project = projects.find((item) => item.id === projectId);

      return {
        id: `cluster-${index}`,
        title: rule.title,
        model: rule.model,
        reason: project ? `与「${project.name}」的推进高度相关` : '由标签和关键词自动聚合',
        connectionReason: project
          ? `这些素材共享标签或关键词，并且多数都指向「${project.name}」，适合被放在同一条创作线索里判断。`
          : '这些素材共享标签或关键词，说明它们可能是在不同时间围绕同一个问题反复出现。',
        sharedProblem: rule.sharedProblem,
        suggestedAction: rule.suggestedAction,
        tags: rule.tags,
        captureIds: matched.map((capture) => capture.id),
        projectId,
        strength: Math.min(1, 0.35 + matched.length * 0.18),
      };
    })
    .filter(Boolean) as WeaveCluster[];

  return clusters.sort((a, b) => b.strength - a.strength);
}

function mostFrequent(values: string[]) {
  const counts = new Map<string, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}
