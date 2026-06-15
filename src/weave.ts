import type { Capture, Project, WeaveCluster } from './types';

const keywordMap: Array<{ title: string; keywords: string[]; tags: string[] }> = [
  { title: '产品层级', keywords: ['第一屏', '命令中心', '下钻', 'Today'], tags: ['产品', '界面'] },
  { title: '编织引擎', keywords: ['编织', '关系', '聚类', 'API', 'AI'], tags: ['编织', 'AI', '规则'] },
  { title: '视觉语言', keywords: ['字体', '宋体', '视觉', '纸感'], tags: ['视觉', '字体'] },
  { title: '数据底座', keywords: ['SQLite', 'AsyncStorage', '存储', '搜索'], tags: ['存储', 'SQLite'] },
  { title: '内容沉淀', keywords: ['文章', '写作', '知识', '定位'], tags: ['写作', '定位'] },
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
        reason: project ? `与「${project.name}」的推进高度相关` : '由标签和关键词自动聚合',
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
