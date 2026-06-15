import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { defaultState } from './src/seed';
import { loadSparkWeaveState, saveSparkWeaveState } from './src/storage';
import { fonts, getTheme, SparkTheme } from './src/theme';
import type { AppTab, Capture, Project, SparkWeaveState, ThemeMode } from './src/types';
import { buildWeaveClusters } from './src/weave';

const tagOptions = ['产品', '视觉', '编织', '存储', '写作', '复盘', 'AI', '执行'];

const tabItems: Array<{ id: AppTab; label: string; symbol: string }> = [
  { id: 'today', label: '今日', symbol: '今' },
  { id: 'inbox', label: '收件箱', symbol: '收' },
  { id: 'weave', label: '编织', symbol: '织' },
  { id: 'projects', label: '项目', symbol: '项' },
];

export default function App() {
  const [sparkState, setSparkState] = useState<SparkWeaveState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('today');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [focusProject, setFocusProject] = useState<Project | null>(null);
  const [selectedCapture, setSelectedCapture] = useState<Capture | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [query, setQuery] = useState('');

  const theme = useMemo(() => getTheme(sparkState.themeMode), [sparkState.themeMode]);
  const clusters = useMemo(
    () => buildWeaveClusters(sparkState.captures, sparkState.projects),
    [sparkState.captures, sparkState.projects],
  );

  useEffect(() => {
    loadSparkWeaveState().then((nextState) => {
      setSparkState(nextState);
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveSparkWeaveState(sparkState);
    }
  }, [hydrated, sparkState]);

  const filteredCaptures = useMemo(() => {
    const normalized = query.trim();
    if (!normalized) {
      return sparkState.captures;
    }
    return sparkState.captures.filter((capture) => {
      const text = `${capture.title} ${capture.body} ${capture.tags.join(' ')}`;
      return text.includes(normalized);
    });
  }, [query, sparkState.captures]);

  function updateCapture(id: string, patch: Partial<Capture>) {
    setSparkState((current) => ({
      ...current,
      captures: current.captures.map((capture) => (capture.id === id ? { ...capture, ...patch } : capture)),
    }));
  }

  function addCapture(body: string, tags: string[], projectId?: string) {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }

    const firstLine = trimmed.split('\n')[0].trim();
    const title = firstLine.length > 18 ? `${firstLine.slice(0, 18)}...` : firstLine;

    setSparkState((current) => ({
      ...current,
      captures: [
        {
          id: `capture-${Date.now()}`,
          title,
          body: trimmed,
          tags,
          projectId,
          status: 'inbox',
          createdAt: new Date().toISOString(),
          nextAction: tags.includes('项目') || projectId ? '归入项目并补充下一步' : '稍后整理为标签或项目',
        },
        ...current.captures,
      ],
    }));
  }

  function setThemeMode(themeMode: ThemeMode) {
    setSparkState((current) => ({ ...current, themeMode }));
  }

  const activeCaptures = sparkState.captures.filter((capture) => capture.status === 'active');
  const inboxCaptures = sparkState.captures.filter((capture) => capture.status === 'inbox');
  const doneCaptures = sparkState.captures.filter((capture) => capture.status === 'done');
  const activeProjects = sparkState.projects.filter((project) => project.status !== 'archived');

  return (
    <View style={[styles.app, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 118 }]}
      >
        <TopBar theme={theme} onOpenSettings={() => setSettingsOpen(true)} />

        {activeTab === 'today' ? (
          <TodayScreen
            activeCaptures={activeCaptures}
            clusters={clusters}
            doneCount={doneCaptures.length}
            inboxCount={inboxCaptures.length}
            onOpenCapture={() => setCaptureOpen(true)}
            onOpenCaptureDetail={setSelectedCapture}
            onOpenProject={setSelectedProject}
            projects={activeProjects}
            theme={theme}
          />
        ) : null}

        {activeTab === 'inbox' ? (
          <InboxScreen
            captures={filteredCaptures}
            projects={sparkState.projects}
            query={query}
            onChangeQuery={setQuery}
            onOpenCapture={setSelectedCapture}
            onUpdateCapture={updateCapture}
            theme={theme}
          />
        ) : null}

        {activeTab === 'weave' ? (
          <WeaveScreen
            captures={sparkState.captures}
            clusters={clusters}
            onOpenCapture={setSelectedCapture}
            theme={theme}
          />
        ) : null}

        {activeTab === 'projects' ? (
          <ProjectsScreen
            captures={sparkState.captures}
            onFocusProject={setFocusProject}
            onOpenProject={setSelectedProject}
            projects={sparkState.projects}
            theme={theme}
          />
        ) : null}
      </ScrollView>

      <BottomBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenCapture={() => setCaptureOpen(true)}
        theme={theme}
      />

      <CaptureSheet
        onAddCapture={addCapture}
        onClose={() => setCaptureOpen(false)}
        projects={sparkState.projects}
        theme={theme}
        visible={captureOpen}
      />

      <CaptureDetailSheet
        capture={selectedCapture}
        onClose={() => setSelectedCapture(null)}
        onUpdateCapture={updateCapture}
        projects={sparkState.projects}
        theme={theme}
      />

      <ProjectDetailSheet
        captures={sparkState.captures}
        onClose={() => setSelectedProject(null)}
        onFocusProject={setFocusProject}
        project={selectedProject}
        theme={theme}
      />

      <FocusSheet
        captures={sparkState.captures}
        onClose={() => setFocusProject(null)}
        project={focusProject}
        theme={theme}
      />

      <SettingsSheet
        onClose={() => setSettingsOpen(false)}
        onSetTheme={setThemeMode}
        state={sparkState}
        theme={theme}
        visible={settingsOpen}
      />
    </View>
  );
}

function TopBar({ theme, onOpenSettings }: { theme: SparkTheme; onOpenSettings: () => void }) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text selectable style={[styles.brand, { color: theme.colors.ink }]}>
          SparkWeave
        </Text>
        <Text selectable style={[styles.subtitle, { color: theme.colors.muted }]}>
          把零散想法，织成可执行的下一步
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onOpenSettings}
        style={[styles.iconButton, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}
      >
        <Text style={{ color: theme.colors.ink, fontFamily: fonts.body, fontSize: 18 }}>设</Text>
      </Pressable>
    </View>
  );
}

function TodayScreen({
  activeCaptures,
  clusters,
  doneCount,
  inboxCount,
  onOpenCapture,
  onOpenCaptureDetail,
  onOpenProject,
  projects,
  theme,
}: {
  activeCaptures: Capture[];
  clusters: ReturnType<typeof buildWeaveClusters>;
  doneCount: number;
  inboxCount: number;
  onOpenCapture: () => void;
  onOpenCaptureDetail: (capture: Capture) => void;
  onOpenProject: (project: Project) => void;
  projects: Project[];
  theme: SparkTheme;
}) {
  const focusCapture = activeCaptures[0];
  const leadCluster = clusters[0];
  const leadProject = projects[0];

  return (
    <View style={styles.screenStack}>
      <View style={[styles.heroPanel, panelStyle(theme)]}>
        <Text selectable style={[styles.kicker, { color: theme.colors.coral }]}>
          今日工作台
        </Text>
        <Text selectable style={[styles.heroTitle, { color: theme.colors.ink }]}>
          先捕捉，再编织。
        </Text>
        <Text selectable style={[styles.heroCopy, { color: theme.colors.muted }]}>
          今天只展示最该行动的线索，细节留给收件箱、编织图谱和项目页。
        </Text>
        <Pressable accessibilityRole="button" onPress={onOpenCapture} style={styles.captureInput}>
          <Text style={[styles.capturePlaceholder, { color: theme.colors.muted }]}>写下一个刚出现的想法...</Text>
          <View style={[styles.smallAction, { backgroundColor: theme.colors.ink }]}>
            <Text style={[styles.smallActionText, { color: theme.colors.background }]}>捕捉</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.metricGrid}>
        <MetricCard label="待整理" value={String(inboxCount)} tone={theme.colors.cobalt} theme={theme} />
        <MetricCard label="推进中" value={String(activeCaptures.length)} tone={theme.colors.sage} theme={theme} />
        <MetricCard label="已完成" value={String(doneCount)} tone={theme.colors.coral} theme={theme} />
      </View>

      <SectionHeader label="今日焦点" theme={theme} />
      {focusCapture ? (
        <Pressable onPress={() => onOpenCaptureDetail(focusCapture)} style={[styles.card, panelStyle(theme)]}>
          <View style={styles.rowBetween}>
            <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
              {focusCapture.title}
            </Text>
            <Text style={[styles.pill, { color: theme.colors.coral, borderColor: theme.colors.line }]}>下一步</Text>
          </View>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            {focusCapture.nextAction}
          </Text>
          <TagRow tags={focusCapture.tags} theme={theme} />
        </Pressable>
      ) : (
        <EmptyState title="今天还没有焦点" copy="从捕捉一个想法开始。" theme={theme} />
      )}

      <SectionHeader label="编织洞察" theme={theme} />
      {leadCluster ? (
        <View style={[styles.card, panelStyle(theme)]}>
          <NodePreview theme={theme} />
          <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
            {leadCluster.title}
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            {leadCluster.reason}，已连接 {leadCluster.captureIds.length} 条灵感。
          </Text>
          <TagRow tags={leadCluster.tags} theme={theme} />
        </View>
      ) : null}

      <SectionHeader label="项目推进" theme={theme} />
      {leadProject ? (
        <Pressable onPress={() => onOpenProject(leadProject)} style={[styles.card, panelStyle(theme)]}>
          <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
            {leadProject.name}
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            {leadProject.brief}
          </Text>
          <Progress value={leadProject.progress} theme={theme} />
        </Pressable>
      ) : null}
    </View>
  );
}

function InboxScreen({
  captures,
  projects,
  query,
  onChangeQuery,
  onOpenCapture,
  onUpdateCapture,
  theme,
}: {
  captures: Capture[];
  projects: Project[];
  query: string;
  onChangeQuery: (value: string) => void;
  onOpenCapture: (capture: Capture) => void;
  onUpdateCapture: (id: string, patch: Partial<Capture>) => void;
  theme: SparkTheme;
}) {
  return (
    <View style={styles.screenStack}>
      <ScreenTitle title="收件箱" copy="先收进来，再判断它属于哪里。" theme={theme} />
      <TextInput
        onChangeText={onChangeQuery}
        placeholder="搜索标签、项目或内容"
        placeholderTextColor={theme.colors.muted}
        style={[styles.searchInput, { color: theme.colors.ink, borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}
        value={query}
      />
      <View style={styles.filterRow}>
        {['全部', '待整理', '项目', '已归档'].map((item) => (
          <Text key={item} style={[styles.filterChip, { color: theme.colors.muted, borderColor: theme.colors.line }]}>
            {item}
          </Text>
        ))}
      </View>
      {captures.map((capture) => {
        const project = projects.find((item) => item.id === capture.projectId);
        return (
          <Pressable key={capture.id} onPress={() => onOpenCapture(capture)} style={[styles.card, panelStyle(theme)]}>
            <View style={styles.rowBetween}>
              <Text selectable style={[styles.cardTitle, { color: theme.colors.ink, flex: 1 }]}>
                {capture.title}
              </Text>
              <Text style={[styles.statusText, { color: theme.colors.coral }]}>{statusLabel(capture.status)}</Text>
            </View>
            <Text selectable numberOfLines={2} style={[styles.bodyText, { color: theme.colors.muted }]}>
              {capture.body}
            </Text>
            {project ? (
              <Text selectable style={[styles.caption, { color: theme.colors.cobalt }]}>
                归属：{project.name}
              </Text>
            ) : null}
            <TagRow tags={capture.tags} theme={theme} />
            <View style={styles.actionRow}>
              <MiniButton label="推进" onPress={() => onUpdateCapture(capture.id, { status: 'active' })} theme={theme} />
              <MiniButton label="完成" onPress={() => onUpdateCapture(capture.id, { status: 'done' })} theme={theme} />
              <MiniButton label="归档" onPress={() => onUpdateCapture(capture.id, { status: 'archived' })} theme={theme} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function WeaveScreen({
  captures,
  clusters,
  onOpenCapture,
  theme,
}: {
  captures: Capture[];
  clusters: ReturnType<typeof buildWeaveClusters>;
  onOpenCapture: (capture: Capture) => void;
  theme: SparkTheme;
}) {
  return (
    <View style={styles.screenStack}>
      <ScreenTitle title="编织" copy="本地规则会解释为什么这些想法应该靠近。" theme={theme} />
      <View style={[styles.mapPanel, panelStyle(theme)]}>
        <View style={[styles.mapLine, { backgroundColor: theme.colors.line, transform: [{ rotate: '12deg' }] }]} />
        <View style={[styles.mapLine, { backgroundColor: theme.colors.line, transform: [{ rotate: '-18deg' }], top: 132 }]} />
        {clusters.slice(0, 5).map((cluster, index) => (
          <View
            key={cluster.id}
            style={[
              styles.mapNode,
              {
                left: 22 + (index % 2) * 146,
                top: 26 + index * 46,
                borderColor: [theme.colors.sage, theme.colors.cobalt, theme.colors.coral, theme.colors.violet][index % 4],
              },
            ]}
          >
            <Text selectable style={[styles.nodeTitle, { color: theme.colors.ink }]}>
              {cluster.title}
            </Text>
            <Text style={[styles.nodeMeta, { color: theme.colors.muted }]}>{cluster.captureIds.length} 条</Text>
          </View>
        ))}
      </View>

      {clusters.map((cluster) => (
        <View key={cluster.id} style={[styles.card, panelStyle(theme)]}>
          <View style={styles.rowBetween}>
            <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
              {cluster.title}
            </Text>
            <Text style={[styles.statusText, { color: theme.colors.gold }]}>
              {Math.round(cluster.strength * 100)}%
            </Text>
          </View>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            {cluster.reason}
          </Text>
          <TagRow tags={cluster.tags} theme={theme} />
          {cluster.captureIds.slice(0, 3).map((id) => {
            const capture = captures.find((item) => item.id === id);
            if (!capture) {
              return null;
            }
            return (
              <Pressable key={id} onPress={() => onOpenCapture(capture)} style={[styles.linkRow, { borderColor: theme.colors.line }]}>
                <Text selectable style={[styles.linkText, { color: theme.colors.ink }]}>
                  {capture.title}
                </Text>
                <Text style={{ color: theme.colors.muted }}>查看</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function ProjectsScreen({
  captures,
  onFocusProject,
  onOpenProject,
  projects,
  theme,
}: {
  captures: Capture[];
  onFocusProject: (project: Project) => void;
  onOpenProject: (project: Project) => void;
  projects: Project[];
  theme: SparkTheme;
}) {
  return (
    <View style={styles.screenStack}>
      <ScreenTitle title="项目" copy="把关系洞察收束成可以推进的行动。" theme={theme} />
      {projects.map((project) => {
        const linked = captures.filter((capture) => capture.projectId === project.id);
        return (
          <Pressable key={project.id} onPress={() => onOpenProject(project)} style={[styles.card, panelStyle(theme)]}>
            <View style={styles.rowBetween}>
              <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
                {project.name}
              </Text>
              <Text style={[styles.statusText, { color: project.status === 'active' ? theme.colors.sage : theme.colors.muted }]}>
                {project.status === 'active' ? '进行中' : '暂停'}
              </Text>
            </View>
            <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
              {project.brief}
            </Text>
            <Progress value={project.progress} theme={theme} />
            <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>
              已连接 {linked.length} 条灵感
            </Text>
            <View style={styles.actionRow}>
              <MiniButton label="查看详情" onPress={() => onOpenProject(project)} theme={theme} />
              <MiniButton label="进入专注" onPress={() => onFocusProject(project)} theme={theme} />
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

function BottomBar({
  activeTab,
  onChangeTab,
  onOpenCapture,
  theme,
}: {
  activeTab: AppTab;
  onChangeTab: (tab: AppTab) => void;
  onOpenCapture: () => void;
  theme: SparkTheme;
}) {
  return (
    <View style={[styles.bottomBar, { backgroundColor: theme.colors.surface, borderColor: theme.colors.line }]}>
      {tabItems.slice(0, 2).map((item) => (
        <TabButton key={item.id} active={activeTab === item.id} item={item} onPress={() => onChangeTab(item.id)} theme={theme} />
      ))}
      <Pressable accessibilityRole="button" onPress={onOpenCapture} style={[styles.fab, { backgroundColor: theme.colors.ink }]}>
        <Text style={[styles.fabText, { color: theme.colors.background }]}>+</Text>
      </Pressable>
      {tabItems.slice(2).map((item) => (
        <TabButton key={item.id} active={activeTab === item.id} item={item} onPress={() => onChangeTab(item.id)} theme={theme} />
      ))}
    </View>
  );
}

function TabButton({
  active,
  item,
  onPress,
  theme,
}: {
  active: boolean;
  item: { id: AppTab; label: string; symbol: string };
  onPress: () => void;
  theme: SparkTheme;
}) {
  return (
    <Pressable accessibilityRole="tab" onPress={onPress} style={styles.tabButton}>
      <Text style={[styles.tabSymbol, { color: active ? theme.colors.ink : theme.colors.muted }]}>{item.symbol}</Text>
      <Text style={[styles.tabLabel, { color: active ? theme.colors.ink : theme.colors.muted }]}>{item.label}</Text>
    </Pressable>
  );
}

function CaptureSheet({
  visible,
  projects,
  theme,
  onAddCapture,
  onClose,
}: {
  visible: boolean;
  projects: Project[];
  theme: SparkTheme;
  onAddCapture: (body: string, tags: string[], projectId?: string) => void;
  onClose: () => void;
}) {
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['产品']);
  const [projectId, setProjectId] = useState(projects[0]?.id);

  function save() {
    onAddCapture(body, selectedTags, projectId);
    setBody('');
    setSelectedTags(['产品']);
    onClose();
  }

  return (
    <BaseSheet visible={visible} onClose={onClose} theme={theme}>
      <Text selectable style={[styles.sheetTitle, { color: theme.colors.ink }]}>
        捕捉
      </Text>
      <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
        先保存原始想法，稍后再让系统帮你编织关系。
      </Text>
      <TextInput
        multiline
        onChangeText={setBody}
        placeholder="例如：这个功能应该放在项目详情，而不是塞进首页..."
        placeholderTextColor={theme.colors.muted}
        style={[styles.textArea, { color: theme.colors.ink, borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}
        textAlignVertical="top"
        value={body}
      />
      <Text style={[styles.fieldLabel, { color: theme.colors.ink }]}>标签</Text>
      <View style={styles.wrapRow}>
        {tagOptions.map((tag) => {
          const active = selectedTags.includes(tag);
          return (
            <Pressable
              key={tag}
              onPress={() =>
                setSelectedTags((current) => (active ? current.filter((item) => item !== tag) : [...current, tag]))
              }
              style={[
                styles.selectChip,
                {
                  borderColor: active ? theme.colors.coral : theme.colors.line,
                  backgroundColor: active ? `${theme.colors.coral}18` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: active ? theme.colors.coral : theme.colors.muted }}>{tag}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.fieldLabel, { color: theme.colors.ink }]}>项目归属</Text>
      <View style={styles.wrapRow}>
        {projects.map((project) => {
          const active = projectId === project.id;
          return (
            <Pressable
              key={project.id}
              onPress={() => setProjectId(project.id)}
              style={[
                styles.selectChip,
                {
                  borderColor: active ? theme.colors.cobalt : theme.colors.line,
                  backgroundColor: active ? `${theme.colors.cobalt}18` : 'transparent',
                },
              ]}
            >
              <Text style={{ color: active ? theme.colors.cobalt : theme.colors.muted }}>{project.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <PrimaryButton label="保存到收件箱" onPress={save} theme={theme} />
    </BaseSheet>
  );
}

function CaptureDetailSheet({
  capture,
  projects,
  theme,
  onClose,
  onUpdateCapture,
}: {
  capture: Capture | null;
  projects: Project[];
  theme: SparkTheme;
  onClose: () => void;
  onUpdateCapture: (id: string, patch: Partial<Capture>) => void;
}) {
  if (!capture) {
    return null;
  }

  const project = projects.find((item) => item.id === capture.projectId);

  return (
    <BaseSheet visible={Boolean(capture)} onClose={onClose} theme={theme}>
      <Text selectable style={[styles.sheetTitle, { color: theme.colors.ink }]}>
        {capture.title}
      </Text>
      <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
        {capture.body}
      </Text>
      <TagRow tags={capture.tags} theme={theme} />
      <InfoBlock label="项目" value={project?.name ?? '未归属'} theme={theme} />
      <InfoBlock label="下一步" value={capture.nextAction ?? '等待整理'} theme={theme} />
      <NodePreview theme={theme} />
      <View style={styles.actionRow}>
        <MiniButton label="设为推进" onPress={() => onUpdateCapture(capture.id, { status: 'active' })} theme={theme} />
        <MiniButton label="完成" onPress={() => onUpdateCapture(capture.id, { status: 'done' })} theme={theme} />
      </View>
    </BaseSheet>
  );
}

function ProjectDetailSheet({
  captures,
  project,
  theme,
  onClose,
  onFocusProject,
}: {
  captures: Capture[];
  project: Project | null;
  theme: SparkTheme;
  onClose: () => void;
  onFocusProject: (project: Project) => void;
}) {
  if (!project) {
    return null;
  }

  const linked = captures.filter((capture) => capture.projectId === project.id);

  return (
    <BaseSheet visible={Boolean(project)} onClose={onClose} theme={theme}>
      <Text selectable style={[styles.sheetTitle, { color: theme.colors.ink }]}>
        {project.name}
      </Text>
      <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
        {project.brief}
      </Text>
      <Progress value={project.progress} theme={theme} />
      <TagRow tags={project.tags} theme={theme} />
      <SectionHeader label="关联灵感" theme={theme} />
      {linked.slice(0, 4).map((capture) => (
        <View key={capture.id} style={[styles.linkRow, { borderColor: theme.colors.line }]}>
          <Text selectable style={[styles.linkText, { color: theme.colors.ink }]}>
            {capture.title}
          </Text>
          <Text style={{ color: theme.colors.muted }}>{statusLabel(capture.status)}</Text>
        </View>
      ))}
      <PrimaryButton label="进入专注" onPress={() => onFocusProject(project)} theme={theme} />
    </BaseSheet>
  );
}

function FocusSheet({
  captures,
  project,
  theme,
  onClose,
}: {
  captures: Capture[];
  project: Project | null;
  theme: SparkTheme;
  onClose: () => void;
}) {
  if (!project) {
    return null;
  }

  const linked = captures.filter((capture) => capture.projectId === project.id && capture.status !== 'done');
  const task = linked[0];

  return (
    <BaseSheet visible={Boolean(project)} onClose={onClose} theme={theme} immersive>
      <Text selectable style={[styles.sheetTitle, { color: theme.colors.ink }]}>
        专注
      </Text>
      <View style={[styles.focusDial, { borderColor: theme.colors.cobalt }]}>
        <Text style={[styles.focusTime, { color: theme.colors.ink }]}>25:00</Text>
        <Text style={[styles.caption, { color: theme.colors.muted }]}>一轮深度推进</Text>
      </View>
      <InfoBlock label="当前项目" value={project.name} theme={theme} />
      <InfoBlock label="上下文" value={task?.nextAction ?? project.brief} theme={theme} />
      <View style={styles.actionRow}>
        <MiniButton label="完成" onPress={onClose} theme={theme} />
        <MiniButton label="稍后" onPress={onClose} theme={theme} />
      </View>
    </BaseSheet>
  );
}

function SettingsSheet({
  visible,
  state,
  theme,
  onClose,
  onSetTheme,
}: {
  visible: boolean;
  state: SparkWeaveState;
  theme: SparkTheme;
  onClose: () => void;
  onSetTheme: (mode: ThemeMode) => void;
}) {
  return (
    <BaseSheet visible={visible} onClose={onClose} theme={theme}>
      <Text selectable style={[styles.sheetTitle, { color: theme.colors.ink }]}>
        设置
      </Text>
      <SettingsRow label="本地存储" value="AsyncStorage · MVP" theme={theme} />
      <SettingsRow label="长期路线" value="SQLite + 可选云同步" theme={theme} />
      <SettingsRow label="API" value="后续接入模型编织" theme={theme} />
      <View style={[styles.settingsRow, { borderColor: theme.colors.line }]}>
        <View>
          <Text style={[styles.fieldLabel, { color: theme.colors.ink }]}>深色模式</Text>
          <Text style={[styles.caption, { color: theme.colors.muted }]}>石墨色作为 Focus / Weave 的沉浸气质</Text>
        </View>
        <Switch
          onValueChange={(value) => onSetTheme(value ? 'dark' : 'light')}
          value={state.themeMode === 'dark'}
        />
      </View>
      <View style={[styles.darkPreview, { backgroundColor: '#171615', borderColor: '#38332d' }]}>
        <Text style={[styles.cardTitle, { color: '#f5efe6' }]}>深色编织预览</Text>
        <NodePreview theme={getTheme('dark')} />
      </View>
    </BaseSheet>
  );
}

function BaseSheet({
  children,
  immersive,
  visible,
  theme,
  onClose,
}: {
  children: ReactNode;
  immersive?: boolean;
  visible: boolean;
  theme: SparkTheme;
  onClose: () => void;
}) {
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <KeyboardAvoidingView behavior="padding" style={styles.modalOverlay}>
        <Pressable style={styles.modalScrim} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: immersive ? (theme.isDark ? '#191817' : '#f3efe7') : theme.colors.surface,
              borderColor: theme.colors.line,
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.line }]} />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScreenTitle({ title, copy, theme }: { title: string; copy: string; theme: SparkTheme }) {
  return (
    <View>
      <Text selectable style={[styles.screenTitle, { color: theme.colors.ink }]}>
        {title}
      </Text>
      <Text selectable style={[styles.subtitle, { color: theme.colors.muted }]}>
        {copy}
      </Text>
    </View>
  );
}

function SectionHeader({ label, theme }: { label: string; theme: SparkTheme }) {
  return (
    <View style={styles.sectionHeader}>
      <Text selectable style={[styles.sectionTitle, { color: theme.colors.ink }]}>
        {label}
      </Text>
      <View style={[styles.sectionLine, { backgroundColor: theme.colors.line }]} />
    </View>
  );
}

function MetricCard({ label, value, tone, theme }: { label: string; value: string; tone: string; theme: SparkTheme }) {
  return (
    <View style={[styles.metricCard, panelStyle(theme)]}>
      <Text selectable style={[styles.metricValue, { color: tone }]}>
        {value}
      </Text>
      <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>
        {label}
      </Text>
    </View>
  );
}

function TagRow({ tags, theme }: { tags: string[]; theme: SparkTheme }) {
  return (
    <View style={styles.wrapRow}>
      {tags.map((tag) => (
        <Text key={tag} style={[styles.tag, { color: theme.colors.muted, borderColor: theme.colors.line }]}>
          {tag}
        </Text>
      ))}
    </View>
  );
}

function Progress({ value, theme }: { value: number; theme: SparkTheme }) {
  return (
    <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceSoft }]}>
      <View style={[styles.progressFill, { backgroundColor: theme.colors.sage, width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

function NodePreview({ theme }: { theme: SparkTheme }) {
  return (
    <View style={styles.nodePreview}>
      <View style={[styles.previewLine, { backgroundColor: theme.colors.line, transform: [{ rotate: '-12deg' }] }]} />
      <View style={[styles.previewLine, { backgroundColor: theme.colors.line, top: 42, transform: [{ rotate: '14deg' }] }]} />
      {[theme.colors.sage, theme.colors.cobalt, theme.colors.coral, theme.colors.violet].map((color, index) => (
        <View
          key={color}
          style={[
            styles.previewNode,
            {
              borderColor: color,
              left: 18 + index * 58,
              top: index % 2 === 0 ? 14 : 48,
            },
          ]}
        />
      ))}
    </View>
  );
}

function EmptyState({ title, copy, theme }: { title: string; copy: string; theme: SparkTheme }) {
  return (
    <View style={[styles.card, panelStyle(theme)]}>
      <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
        {title}
      </Text>
      <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
        {copy}
      </Text>
    </View>
  );
}

function InfoBlock({ label, value, theme }: { label: string; value: string; theme: SparkTheme }) {
  return (
    <View style={[styles.infoBlock, { borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}>
      <Text style={[styles.caption, { color: theme.colors.muted }]}>{label}</Text>
      <Text selectable style={[styles.bodyText, { color: theme.colors.ink }]}>
        {value}
      </Text>
    </View>
  );
}

function SettingsRow({ label, value, theme }: { label: string; value: string; theme: SparkTheme }) {
  return (
    <View style={[styles.settingsRow, { borderColor: theme.colors.line }]}>
      <Text style={[styles.fieldLabel, { color: theme.colors.ink }]}>{label}</Text>
      <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>
        {value}
      </Text>
    </View>
  );
}

function MiniButton({ label, onPress, theme }: { label: string; onPress: () => void; theme: SparkTheme }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[styles.miniButton, { borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}
    >
      <Text style={{ color: theme.colors.ink, fontFamily: fonts.body, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

function PrimaryButton({ label, onPress, theme }: { label: string; onPress: () => void; theme: SparkTheme }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.primaryButton, { backgroundColor: theme.colors.ink }]}>
      <Text style={[styles.primaryButtonText, { color: theme.colors.background }]}>{label}</Text>
    </Pressable>
  );
}

function panelStyle(theme: SparkTheme): StyleProp<ViewStyle> {
  return {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.line,
    boxShadow: `0 18px 46px ${theme.colors.shadow}`,
  };
}

function statusLabel(status: Capture['status']) {
  if (status === 'inbox') return '待整理';
  if (status === 'active') return '推进中';
  if (status === 'done') return '完成';
  return '归档';
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
  },
  scrollContent: {
    gap: 18,
    paddingHorizontal: 18,
    paddingTop: 64,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: fonts.display,
    fontSize: 32,
    letterSpacing: 0,
    lineHeight: 39,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  iconButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  screenStack: {
    gap: 16,
  },
  heroPanel: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 18,
  },
  kicker: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontFamily: fonts.display,
    fontSize: 40,
    letterSpacing: 0,
    lineHeight: 48,
  },
  heroCopy: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 23,
  },
  captureInput: {
    alignItems: 'center',
    borderColor: '#ded6c8',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    padding: 12,
  },
  capturePlaceholder: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  smallAction: {
    borderCurve: 'continuous',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  smallActionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 2,
    padding: 14,
  },
  metricValue: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 34,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
  },
  sectionLine: {
    flex: 1,
    height: 1,
  },
  card: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 16,
  },
  cardTitle: {
    fontFamily: fonts.display,
    fontSize: 21,
    lineHeight: 28,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
  },
  rowBetween: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  wrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  progressTrack: {
    borderRadius: 999,
    height: 8,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: 8,
  },
  searchInput: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: 999,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniButton: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    marginTop: 4,
    padding: 14,
  },
  primaryButtonText: {
    fontFamily: fonts.body,
    fontSize: 15,
    fontWeight: '700',
  },
  mapPanel: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    height: 292,
    overflow: 'hidden',
    padding: 14,
  },
  mapLine: {
    height: 1,
    left: 30,
    opacity: 0.9,
    position: 'absolute',
    top: 90,
    width: 270,
  },
  mapNode: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 2,
    padding: 10,
    position: 'absolute',
    width: 138,
  },
  nodeTitle: {
    fontFamily: fonts.display,
    fontSize: 17,
  },
  nodeMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
  },
  linkRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  linkText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  bottomBar: {
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    bottom: 26,
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    left: 18,
    padding: 8,
    position: 'absolute',
    right: 18,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
    paddingVertical: 7,
  },
  tabSymbol: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 21,
  },
  tabLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
  },
  fab: {
    alignItems: 'center',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  fabText: {
    fontFamily: fonts.body,
    fontSize: 30,
    lineHeight: 34,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    backgroundColor: 'rgba(20, 17, 14, 0.28)',
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    gap: 14,
    maxHeight: '88%',
    padding: 18,
    paddingBottom: 34,
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 4,
    width: 40,
  },
  sheetTitle: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 39,
  },
  textArea: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 15,
    minHeight: 128,
    padding: 14,
  },
  fieldLabel: {
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
  },
  selectChip: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoBlock: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  focusDial: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 168,
    justifyContent: 'center',
    width: 168,
  },
  focusTime: {
    fontFamily: fonts.display,
    fontSize: 42,
    lineHeight: 48,
  },
  settingsRow: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  darkPreview: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 14,
  },
  nodePreview: {
    height: 82,
    overflow: 'hidden',
  },
  previewLine: {
    height: 1,
    left: 24,
    position: 'absolute',
    top: 28,
    width: 220,
  },
  previewNode: {
    borderRadius: 999,
    borderWidth: 2,
    height: 22,
    position: 'absolute',
    width: 22,
  },
  screenTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 42,
  },
});
