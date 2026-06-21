import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { defaultState } from './src/seed';
import { loadSparkWeaveState, saveSparkWeaveState } from './src/storage';
import { fonts, getTheme, SparkTheme } from './src/theme';
import type { AppTab, Capture, FeedbackEntry, Project, SparkWeaveState, ThemeMode, Thought } from './src/types';
import { IconGlyph, type SparkIconName, WeaveConstellation } from './src/visuals';
import { buildWeaveClusters } from './src/weave';

const tagOptions = ['产品', '视觉', '编织', '存储', '写作', '复盘', 'AI', '执行'];

const tabItems: Array<{ id: AppTab; label: string; icon: SparkIconName }> = [
  { id: 'inbox', label: '收件箱', icon: 'inbox' },
  { id: 'weave', label: '编织', icon: 'network' },
  { id: 'outputs', label: '项目', icon: 'folder' },
  { id: 'profile', label: '主页', icon: 'circle' },
];

const bannerCopy: Record<AppTab, string> = {
  inbox: '收件箱 · 先收进来',
  weave: '编织 · 解释关系',
  outputs: '项目 · 项目 / 思维 / 灵感',
  profile: '主页 · 今日推进',
};

type InboxFilterId = 'all' | 'inbox' | 'active' | 'project' | 'archived';
type InboxViewMode = 'list' | 'carousel';

const inboxFilters: Array<{ id: InboxFilterId; label: string }> = [
  { id: 'all', label: '全部' },
  { id: 'inbox', label: '待整理' },
  { id: 'active', label: '推进中' },
  { id: 'project', label: '有归属' },
  { id: 'archived', label: '已归档' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <SparkWeaveApp />
    </SafeAreaProvider>
  );
}

function SparkWeaveApp() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [sparkState, setSparkState] = useState<SparkWeaveState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('inbox');
  const [captureOpen, setCaptureOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [weaveBoardOpen, setWeaveBoardOpen] = useState(false);
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

  function setDailyAssistantEnabled(dailyAssistantEnabled: boolean) {
    setSparkState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        dailyAssistantEnabled,
      },
    }));
  }

  function addFeedback(feedback: Omit<FeedbackEntry, 'id' | 'createdAt'>) {
    setSparkState((current) => ({
      ...current,
      feedback: [
        {
          ...feedback,
          id: `feedback-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
        ...current.feedback,
      ],
    }));
  }

  const activeCaptures = sparkState.captures.filter((capture) => capture.status === 'active');
  const inboxCaptures = sparkState.captures.filter((capture) => capture.status === 'inbox');
  const doneCaptures = sparkState.captures.filter((capture) => capture.status === 'done');
  const activeProjects = sparkState.projects.filter((project) => project.status !== 'archived');
  const compactPhone = width <= 390;

  return (
    <View style={[styles.app, { backgroundColor: theme.colors.background }]}>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + 118,
            paddingTop: Math.max(insets.top + 4, 48),
          },
        ]}
      >
        <CenteredBanner activeTab={activeTab} theme={theme} />

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
            compactPhone={compactPhone}
            onOpenBoard={() => setWeaveBoardOpen(true)}
            theme={theme}
          />
        ) : null}

        {activeTab === 'outputs' ? (
          <OutputsScreen
            captures={sparkState.captures}
            onFocusProject={setFocusProject}
            onOpenProject={setSelectedProject}
            projects={sparkState.projects}
            thoughts={sparkState.thoughts}
            theme={theme}
          />
        ) : null}

        {activeTab === 'profile' ? (
          <ProfileScreen
            activeCaptures={activeCaptures}
            clusters={clusters}
            dailyAssistantEnabled={sparkState.settings.dailyAssistantEnabled}
            doneCount={doneCaptures.length}
            inboxCount={inboxCaptures.length}
            onOpenCapture={() => setCaptureOpen(true)}
            onOpenCaptureDetail={setSelectedCapture}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenProject={setSelectedProject}
            projects={activeProjects}
            compactPhone={compactPhone}
            theme={theme}
          />
        ) : null}
      </ScrollView>

      <View
        pointerEvents="none"
        style={[
          styles.bottomBarBackdrop,
          {
            backgroundColor: theme.colors.background,
            height: insets.bottom + 112,
          },
        ]}
      />

      <BottomBar
        activeTab={activeTab}
        bottomInset={insets.bottom}
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
        feedback={sparkState.feedback}
        onAddFeedback={addFeedback}
        onClose={() => setSelectedProject(null)}
        onFocusProject={setFocusProject}
        project={selectedProject}
        thoughts={sparkState.thoughts}
        theme={theme}
      />

      <FocusSheet
        captures={sparkState.captures}
        onClose={() => setFocusProject(null)}
        project={focusProject}
        thoughts={sparkState.thoughts}
        theme={theme}
      />

      <WeaveBoardSheet
        captures={sparkState.captures}
        clusters={clusters}
        onClose={() => setWeaveBoardOpen(false)}
        projects={sparkState.projects}
        theme={theme}
        thoughts={sparkState.thoughts}
        visible={weaveBoardOpen}
      />

      <SettingsSheet
        onClose={() => setSettingsOpen(false)}
        onSetDailyAssistantEnabled={setDailyAssistantEnabled}
        onSetTheme={setThemeMode}
        state={sparkState}
        theme={theme}
        visible={settingsOpen}
      />
    </View>
  );
}

function CenteredBanner({ activeTab, theme }: { activeTab: AppTab; theme: SparkTheme }) {
  return (
    <View style={styles.centeredBanner}>
      <Text selectable numberOfLines={1} style={[styles.bannerBrand, { color: theme.colors.ink }]}>
        SparkWeave
      </Text>
      <Text selectable numberOfLines={1} style={[styles.bannerContext, { color: theme.colors.faint }]}>
        {bannerCopy[activeTab]}
      </Text>
    </View>
  );
}

function ProfileScreen({
  activeCaptures,
  clusters,
  dailyAssistantEnabled,
  doneCount,
  inboxCount,
  onOpenCapture,
  onOpenCaptureDetail,
  onOpenSettings,
  onOpenProject,
  projects,
  compactPhone,
  theme,
}: {
  activeCaptures: Capture[];
  clusters: ReturnType<typeof buildWeaveClusters>;
  dailyAssistantEnabled: boolean;
  doneCount: number;
  inboxCount: number;
  onOpenCapture: () => void;
  onOpenCaptureDetail: (capture: Capture) => void;
  onOpenSettings: () => void;
  onOpenProject: (project: Project) => void;
  projects: Project[];
  compactPhone: boolean;
  theme: SparkTheme;
}) {
  const focusCapture = activeCaptures[0];
  const leadCluster = clusters[0];
  const leadProject = projects[0];

  return (
    <View style={styles.screenStack}>
      <LinearGradient
        colors={[theme.colors.surface, theme.colors.surfaceWarm, theme.colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.heroPanel, panelStyle(theme)]}
      >
        <View style={styles.profileHeroTopRow}>
          <View style={styles.kickerRow}>
            <IconGlyph color={theme.colors.coral} name="sparkles" size={15} strokeWidth={1.8} />
            <Text selectable style={[styles.kicker, { color: theme.colors.coral }]}>
              个人主页
            </Text>
          </View>
          <Pressable
            accessibilityLabel="打开创作偏好"
            accessibilityRole="button"
            onPress={onOpenSettings}
            style={[styles.profileSettingsButton, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}
          >
            <IconGlyph color={theme.colors.ink} name="settings" size={20} strokeWidth={1.7} />
          </Pressable>
        </View>
        <Text selectable style={[styles.heroTitle, { color: theme.colors.ink }]}>
          今天的创作痕迹。
        </Text>
        <Text selectable style={[styles.heroCopy, { color: theme.colors.muted }]}>
          像 commit 日志一样记录灵感、编织和产物，让创作过程也有可见的进度感。
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onOpenCapture}
          style={[styles.captureInput, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}
        >
          <IconGlyph color={theme.colors.muted} name="search" size={18} strokeWidth={1.8} />
          <Text style={[styles.capturePlaceholder, { color: theme.colors.muted }]}>补充一条新的灵感记录...</Text>
          <View style={[styles.smallAction, { backgroundColor: theme.colors.ink }]}>
            <Text style={[styles.smallActionText, { color: theme.colors.background }]}>捕捉</Text>
          </View>
        </Pressable>
      </LinearGradient>

      <View style={[styles.metricGrid, compactPhone ? styles.metricGridCompact : null]}>
        <MetricCard compact={compactPhone} label="新灵感" value={String(inboxCount)} tone={theme.colors.cobalt} theme={theme} />
        <MetricCard compact={compactPhone} label="编织中" value={String(activeCaptures.length)} tone={theme.colors.sage} theme={theme} />
        <MetricCard compact={compactPhone} label="已产出" value={String(doneCount)} tone={theme.colors.coral} theme={theme} />
      </View>

      <SectionHeader label="今日建议" theme={theme} />
      {dailyAssistantEnabled ? (
        <View style={[styles.card, styles.glassPanel, panelStyle(theme)]}>
          <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
            {leadCluster ? leadCluster.title : '先从一个素材开始'}
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            {leadCluster
              ? leadCluster.suggestedAction
              : '今天可以先捕捉 3 条最近反复出现的想法，系统会帮你找到第一组可编织的主题。'}
          </Text>
          {leadCluster ? <InfoBlock label="为什么推荐" value={leadCluster.sharedProblem} theme={theme} /> : null}
        </View>
      ) : (
        <View style={[styles.card, panelStyle(theme)]}>
          <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
            按需使用模式
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            Daily Assistant 已关闭。SparkWeave 会保持安静，只在你主动打开和发起创作目标时提供建议。
          </Text>
        </View>
      )}

      <SectionHeader label="过程记录" theme={theme} />
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
        <EmptyState title="今天还没有记录" copy="从捕捉一个想法开始。" theme={theme} />
      )}

      <SectionHeader label="最近编织" theme={theme} />
      {leadCluster ? (
        <View style={[styles.card, panelStyle(theme)]}>
          <WeaveConstellation compact clusters={clusters.slice(0, 4)} theme={theme} />
          <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
            {leadCluster.title}
          </Text>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            {leadCluster.reason}，已连接 {leadCluster.captureIds.length} 条灵感。
          </Text>
          <TagRow tags={leadCluster.tags} theme={theme} />
        </View>
      ) : null}

      <SectionHeader label="产物进度" theme={theme} />
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
  const { width } = useWindowDimensions();
  const [activeFilter, setActiveFilter] = useState<InboxFilterId>('all');
  const [viewMode, setViewMode] = useState<InboxViewMode>('list');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselGap = 12;
  const carouselSideInset = 6;
  const carouselCardWidth = Math.min(Math.max(272, width * 0.78), width - 96);
  const visibleCaptures = useMemo(() => {
    return captures.filter((capture) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'project') return Boolean(capture.projectId);
      return capture.status === activeFilter;
    });
  }, [activeFilter, captures]);

  useEffect(() => {
    setCarouselIndex(0);
  }, [activeFilter, query, viewMode, visibleCaptures.length]);

  function updateCarouselIndex(offsetX: number) {
    const nextIndex = Math.round(offsetX / (carouselCardWidth + carouselGap));
    setCarouselIndex(Math.min(Math.max(nextIndex, 0), Math.max(visibleCaptures.length - 1, 0)));
  }

  return (
    <View style={styles.screenStack}>
      <TextInput
        onChangeText={onChangeQuery}
        placeholder="搜索标签、项目或内容"
        placeholderTextColor={theme.colors.muted}
        style={[styles.searchInput, { color: theme.colors.ink, borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}
        value={query}
      />
      <View style={styles.inboxToolbox}>
        <View style={styles.inboxToolbarRow}>
          <View style={styles.filterRow}>
            {inboxFilters.map((item) => {
              const active = activeFilter === item.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => setActiveFilter(item.id)}
                  style={[
                    styles.filterChip,
                    {
                      borderColor: active ? `${theme.colors.ink}22` : theme.colors.line,
                      backgroundColor: active ? `${theme.colors.ink}0d` : theme.colors.surface,
                    },
                  ]}
                >
                  <Text style={[styles.filterChipText, { color: active ? theme.colors.ink : theme.colors.muted }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.viewToggle, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}>
            {[
              { id: 'list' as const, label: '列表' },
              { id: 'carousel' as const, label: '滑卡' },
            ].map((item) => {
              const active = viewMode === item.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={item.id}
                  onPress={() => setViewMode(item.id)}
                  style={[styles.viewToggleItem, { backgroundColor: active ? theme.colors.ink : 'transparent' }]}
                >
                  <Text style={[styles.viewToggleText, { color: active ? theme.colors.background : theme.colors.muted }]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
      {visibleCaptures.length ? (
        viewMode === 'carousel' ? (
          <View style={styles.carouselBlock}>
            <ScrollView
              decelerationRate="fast"
              horizontal
              onMomentumScrollEnd={(event) => updateCarouselIndex(event.nativeEvent.contentOffset.x)}
              showsHorizontalScrollIndicator={false}
              snapToInterval={carouselCardWidth + carouselGap}
              snapToAlignment="start"
              contentContainerStyle={[styles.carouselTrack, { paddingHorizontal: carouselSideInset }]}
            >
              {visibleCaptures.map((capture) => {
                const project = projects.find((item) => item.id === capture.projectId);
                return (
                  <View key={capture.id} style={{ width: carouselCardWidth }}>
                    <CaptureCard
                      capture={capture}
                      compact
                      project={project}
                      onOpenCapture={onOpenCapture}
                      onUpdateCapture={onUpdateCapture}
                      theme={theme}
                    />
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.carouselDots}>
              {visibleCaptures.map((capture, index) => (
                <View
                  key={capture.id}
                  style={[
                    styles.carouselDot,
                    {
                      backgroundColor: index === carouselIndex ? theme.colors.ink : theme.colors.line,
                      width: index === carouselIndex ? 16 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        ) : (
          visibleCaptures.map((capture) => {
            const project = projects.find((item) => item.id === capture.projectId);
            return (
              <CaptureCard
                capture={capture}
                key={capture.id}
                project={project}
                onOpenCapture={onOpenCapture}
                onUpdateCapture={onUpdateCapture}
                theme={theme}
              />
            );
          })
        )
      ) : (
        <EmptyState title="没有匹配素材" copy="换一个筛选条件，或者先捕捉一条新的灵感。" theme={theme} />
      )}
    </View>
  );
}

function CaptureCard({
  capture,
  compact,
  project,
  onOpenCapture,
  onUpdateCapture,
  theme,
}: {
  capture: Capture;
  compact?: boolean;
  project?: Project;
  onOpenCapture: (capture: Capture) => void;
  onUpdateCapture: (id: string, patch: Partial<Capture>) => void;
  theme: SparkTheme;
}) {
  return (
    <Pressable
      key={capture.id}
      onPress={() => onOpenCapture(capture)}
      style={[styles.captureCard, compact ? styles.captureCardCompact : null, panelStyle(theme)]}
    >
      <View style={styles.rowBetween}>
        <Text
          selectable
          numberOfLines={compact ? 2 : 1}
          style={[styles.captureTitle, compact ? styles.captureTitleCompact : null, { color: theme.colors.ink, flex: 1 }]}
        >
          {capture.title}
        </Text>
        <Text style={[styles.captureStatus, { color: theme.colors.coral, backgroundColor: `${theme.colors.coral}12` }]}>
          {statusLabel(capture.status)}
        </Text>
      </View>
      <Text
        selectable
        numberOfLines={compact ? 3 : 2}
        style={[styles.captureBody, compact ? styles.captureBodyCompact : null, { color: theme.colors.muted }]}
      >
        {capture.body}
      </Text>
      <View style={styles.captureMetaRow}>
        {project ? (
          <Text selectable numberOfLines={1} style={[styles.caption, styles.captureProject, { color: theme.colors.cobalt }]}>
            归属：{project.name}
          </Text>
        ) : null}
        <TagRow tags={capture.tags.slice(0, 2)} theme={theme} />
      </View>
      <View style={styles.captureActions}>
        <MiniButton label="推进" onPress={() => onUpdateCapture(capture.id, { status: 'active' })} theme={theme} />
        <MiniButton label="完成" onPress={() => onUpdateCapture(capture.id, { status: 'done' })} theme={theme} />
        <MiniButton label="归档" onPress={() => onUpdateCapture(capture.id, { status: 'archived' })} theme={theme} />
      </View>
    </Pressable>
  );
}

function WeaveScreen({
  captures,
  clusters,
  compactPhone,
  onOpenCapture,
  onOpenBoard,
  theme,
}: {
  captures: Capture[];
  clusters: ReturnType<typeof buildWeaveClusters>;
  compactPhone: boolean;
  onOpenCapture: (capture: Capture) => void;
  onOpenBoard: () => void;
  theme: SparkTheme;
}) {
  return (
    <View style={styles.screenStack}>
      <View style={[styles.mapPanel, compactPhone ? styles.mapPanelCompact : null, panelStyle(theme)]}>
        <View style={styles.mapPanelTopbar}>
          <View>
            <Text selectable style={[styles.fieldLabel, { color: theme.colors.ink }]}>编织总览</Text>
            <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>先用稳定思维模型看关系，再进入横屏调整。</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onOpenBoard}
            style={[styles.iconAction, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}
          >
            <IconGlyph color={theme.colors.ink} name="expand" size={16} strokeWidth={1.9} />
          </Pressable>
        </View>
        <WeaveConstellation compact={compactPhone} clusters={clusters.slice(0, 5)} theme={theme} />
      </View>

      {clusters.map((cluster) => (
        <View key={cluster.id} style={[styles.card, panelStyle(theme)]}>
          <View style={styles.rowBetween}>
            <View style={styles.clusterHeading}>
              <Text selectable style={[styles.cardTitle, { color: theme.colors.ink }]}>
                {cluster.title}
              </Text>
              <Text selectable style={[styles.caption, { color: theme.colors.coral }]}>{cluster.model}</Text>
            </View>
            <Text style={[styles.statusText, { color: theme.colors.gold }]}>{Math.round(cluster.strength * 100)}%</Text>
          </View>
          <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
            {cluster.reason}
          </Text>
          <InfoBlock label="为什么连接" value={cluster.connectionReason} theme={theme} />
          <InfoBlock label="共同指向" value={cluster.sharedProblem} theme={theme} />
          <InfoBlock label="建议动作" value={cluster.suggestedAction} theme={theme} />
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

function OutputsScreen({
  captures,
  onFocusProject,
  onOpenProject,
  projects,
  thoughts,
  theme,
}: {
  captures: Capture[];
  onFocusProject: (project: Project) => void;
  onOpenProject: (project: Project) => void;
  projects: Project[];
  thoughts: Thought[];
  theme: SparkTheme;
}) {
  return (
    <View style={styles.screenStack}>
      {projects.map((project) => {
        const projectThoughts = thoughts.filter((thought) => thought.projectId === project.id);
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
              {projectThoughts.length} 条思维 · {linked.length} 条灵感
            </Text>
            <View style={styles.thoughtPreviewStack}>
              {projectThoughts.slice(0, 2).map((thought) => (
                <View key={thought.id} style={[styles.thoughtPreviewCard, { borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}>
                  <View style={styles.rowBetween}>
                    <Text selectable numberOfLines={1} style={[styles.fieldLabel, styles.thoughtPreviewTitle, { color: theme.colors.ink }]}>
                      {thought.title}
                    </Text>
                    <Text style={[styles.caption, { color: theme.colors.coral }]}>{thought.model}</Text>
                  </View>
                  <Text selectable numberOfLines={2} style={[styles.caption, { color: theme.colors.muted }]}>
                    {thought.brief}
                  </Text>
                </View>
              ))}
            </View>
            <View style={styles.actionRow}>
              <MiniButton label="查看项目" onPress={() => onOpenProject(project)} theme={theme} />
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
  bottomInset,
  onChangeTab,
  onOpenCapture,
  theme,
}: {
  activeTab: AppTab;
  bottomInset: number;
  onChangeTab: (tab: AppTab) => void;
  onOpenCapture: () => void;
  theme: SparkTheme;
}) {
  return (
    <View
      style={[
        styles.bottomBar,
        {
          backgroundColor: theme.isDark ? 'rgba(31, 29, 26, 0.86)' : 'rgba(255, 253, 248, 0.86)',
          borderColor: theme.colors.line,
          bottom: bottomInset + 14,
        },
      ]}
    >
      {tabItems.slice(0, 2).map((item) => (
        <TabButton key={item.id} active={activeTab === item.id} item={item} onPress={() => onChangeTab(item.id)} theme={theme} />
      ))}
      <CaptureFab onPress={onOpenCapture} theme={theme} />
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
  item: (typeof tabItems)[number];
  onPress: () => void;
  theme: SparkTheme;
}) {
  const activeProgress = useRef(new Animated.Value(active ? 1 : 0)).current;
  const pressProgress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(activeProgress, {
      damping: 16,
      mass: 0.72,
      stiffness: 190,
      toValue: active ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [active, activeProgress]);

  function pressTo(value: number) {
    Animated.spring(pressProgress, {
      damping: 17,
      mass: 0.56,
      stiffness: 340,
      toValue: value,
      useNativeDriver: true,
    }).start();
  }

  const activeScale = activeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.78, 1],
  });
  const activeOpacity = activeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const contentScale = Animated.multiply(
    pressProgress,
    activeProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.04],
    }),
  );
  const activeBackground = theme.isDark ? 'rgba(244, 239, 229, 0.12)' : 'rgba(23, 21, 18, 0.07)';
  const activeBorder = theme.isDark ? 'rgba(244, 239, 229, 0.16)' : 'rgba(23, 21, 18, 0.09)';

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onPressIn={() => pressTo(0.92)}
      onPressOut={() => pressTo(1)}
      style={styles.tabButton}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          styles.tabActiveBlob,
          {
            backgroundColor: activeBackground,
            borderColor: activeBorder,
            opacity: activeOpacity,
            transform: [{ scaleX: activeScale }, { scaleY: activeProgress }],
          },
        ]}
      />
      <Animated.View style={[styles.tabContent, { transform: [{ scale: contentScale }] }]}>
        <View style={styles.tabIconWrap}>
          <IconGlyph color={active ? theme.colors.ink : theme.colors.muted} name={item.icon} size={22} strokeWidth={active ? 2.15 : 1.7} />
        </View>
        <Text style={[styles.tabLabel, active ? styles.tabLabelActive : null, { color: active ? theme.colors.ink : theme.colors.muted }]}>
          {item.label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function CaptureFab({ onPress, theme }: { onPress: () => void; theme: SparkTheme }) {
  const pressProgress = useRef(new Animated.Value(1)).current;

  function pressTo(value: number) {
    Animated.spring(pressProgress, {
      damping: 16,
      mass: 0.58,
      stiffness: 360,
      toValue: value,
      useNativeDriver: true,
    }).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => pressTo(0.9)}
      onPressOut={() => pressTo(1)}
      style={styles.fabSlot}
    >
      <Animated.View
        style={[
          styles.fab,
          {
            backgroundColor: theme.colors.ink,
            transform: [{ scale: pressProgress }],
          },
        ]}
      >
        <IconGlyph color={theme.colors.background} name="plus" size={30} strokeWidth={2.4} />
      </Animated.View>
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
        placeholder="例如：这个功能应该放在项目详情，首页只保留入口..."
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
      <WeaveConstellation compact clusters={[]} theme={theme} />
      <View style={styles.actionRow}>
        <MiniButton label="设为推进" onPress={() => onUpdateCapture(capture.id, { status: 'active' })} theme={theme} />
        <MiniButton label="完成" onPress={() => onUpdateCapture(capture.id, { status: 'done' })} theme={theme} />
      </View>
    </BaseSheet>
  );
}

function ProjectDetailSheet({
  captures,
  feedback,
  onAddFeedback,
  project,
  theme,
  onClose,
  onFocusProject,
  thoughts,
}: {
  captures: Capture[];
  feedback: FeedbackEntry[];
  onAddFeedback: (feedback: Omit<FeedbackEntry, 'id' | 'createdAt'>) => void;
  project: Project | null;
  theme: SparkTheme;
  onClose: () => void;
  onFocusProject: (project: Project) => void;
  thoughts: Thought[];
}) {
  if (!project) {
    return null;
  }

  const linked = captures.filter((capture) => capture.projectId === project.id);
  const projectThoughts = thoughts.filter((thought) => thought.projectId === project.id);
  const feedbackCount = feedback.filter((item) => item.targetType === 'output' && item.targetId === project.id).length;

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
      <SectionHeader label="思维结构" theme={theme} />
      {projectThoughts.map((thought) => {
        const thoughtCaptures = captures.filter((capture) => thought.captureIds.includes(capture.id));
        return (
          <View key={thought.id} style={[styles.infoBlock, { borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}>
            <View style={styles.rowBetween}>
              <Text selectable style={[styles.fieldLabel, { color: theme.colors.ink, flex: 1 }]}>{thought.title}</Text>
              <Text style={[styles.caption, { color: theme.colors.coral }]}>{thought.model}</Text>
            </View>
            <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>{thought.brief}</Text>
            <Text selectable style={[styles.caption, { color: theme.colors.cobalt }]}>
              连接 {thoughtCaptures.length} 条灵感
            </Text>
          </View>
        );
      })}
      <SectionHeader label="关联灵感" theme={theme} />
      {linked.slice(0, 4).map((capture) => (
        <View key={capture.id} style={[styles.linkRow, { borderColor: theme.colors.line }]}>
          <Text selectable style={[styles.linkText, { color: theme.colors.ink }]}>
            {capture.title}
          </Text>
          <Text style={{ color: theme.colors.muted }}>{statusLabel(capture.status)}</Text>
        </View>
      ))}
      <SectionHeader label="Agent 反馈" theme={theme} />
      <FeedbackPanel
        feedbackCount={feedbackCount}
        onAddFeedback={onAddFeedback}
        targetId={project.id}
        targetType="output"
        theme={theme}
      />
      <PrimaryButton label="进入项目专注" onPress={() => onFocusProject(project)} theme={theme} />
    </BaseSheet>
  );
}

function FeedbackPanel({
  feedbackCount,
  onAddFeedback,
  targetId,
  targetType,
  theme,
}: {
  feedbackCount: number;
  onAddFeedback: (feedback: Omit<FeedbackEntry, 'id' | 'createdAt'>) => void;
  targetId: string;
  targetType: FeedbackEntry['targetType'];
  theme: SparkTheme;
}) {
  const [score, setScore] = useState(0);
  const [text, setText] = useState('');

  function submit() {
    if (!score) {
      return;
    }

    onAddFeedback({
      targetId,
      targetType,
      score,
      text: text.trim(),
    });
    setScore(0);
    setText('');
  }

  return (
    <View style={[styles.feedbackPanel, { borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}>
      <Text selectable style={[styles.bodyText, { color: theme.colors.muted }]}>
        这个产物是否符合你的想法？反馈会用于后续提示词、模板和检索排序。
      </Text>
      <View style={styles.scoreRow}>
        {[1, 2, 3, 4, 5].map((item) => {
          const active = score === item;
          return (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setScore(item)}
              style={[
                styles.scoreButton,
                {
                  borderColor: active ? theme.colors.coral : theme.colors.line,
                  backgroundColor: active ? `${theme.colors.coral}18` : theme.colors.surface,
                },
              ]}
            >
              <Text style={{ color: active ? theme.colors.coral : theme.colors.ink, fontFamily: fonts.bodyMedium }}>{item}</Text>
            </Pressable>
          );
        })}
      </View>
      <TextInput
        multiline
        onChangeText={setText}
        placeholder="可选：哪里有用，哪里不符合你的想法？"
        placeholderTextColor={theme.colors.muted}
        style={[styles.feedbackInput, { color: theme.colors.ink, borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}
        value={text}
      />
      <View style={styles.rowBetween}>
        <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>
          已记录 {feedbackCount} 次反馈
        </Text>
        <MiniButton disabled={!score} label={score ? '提交反馈' : '先选评分'} onPress={submit} theme={theme} />
      </View>
    </View>
  );
}

function FocusSheet({
  captures,
  project,
  theme,
  onClose,
  thoughts,
}: {
  captures: Capture[];
  project: Project | null;
  theme: SparkTheme;
  onClose: () => void;
  thoughts: Thought[];
}) {
  if (!project) {
    return null;
  }

  const linked = captures.filter((capture) => capture.projectId === project.id && capture.status !== 'done');
  const primaryThought = thoughts.find((thought) => thought.projectId === project.id && thought.status !== 'done');
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
      <InfoBlock label="当前思维" value={primaryThought?.title ?? '先整理一条思维主线'} theme={theme} />
      <InfoBlock label="上下文" value={task?.nextAction ?? project.brief} theme={theme} />
      <View style={styles.actionRow}>
        <MiniButton label="完成" onPress={onClose} theme={theme} />
        <MiniButton label="稍后" onPress={onClose} theme={theme} />
      </View>
    </BaseSheet>
  );
}

function WeaveBoardSheet({
  captures,
  clusters,
  onClose,
  projects,
  theme,
  thoughts,
  visible,
}: {
  captures: Capture[];
  clusters: ReturnType<typeof buildWeaveClusters>;
  onClose: () => void;
  projects: Project[];
  theme: SparkTheme;
  thoughts: Thought[];
  visible: boolean;
}) {
  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
      supportedOrientations={['landscape-left', 'landscape-right']}
      visible={visible}
    >
      <View style={[styles.landscapeShell, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.landscapeTopbar, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}>
          <View>
            <Text selectable style={[styles.sheetTitle, { color: theme.colors.ink }]}>编织工作台</Text>
            <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>
              横屏先承担总览和结构调整，竖屏后续再做轻量优化。
            </Text>
          </View>
          <MiniButton label="收起" onPress={onClose} theme={theme} />
        </View>

        <View style={styles.landscapeBody}>
          <View style={[styles.landscapeBoard, { borderColor: theme.colors.line, backgroundColor: theme.colors.surface }]}>
            <Text selectable style={[styles.fieldLabel, { color: theme.colors.ink }]}>关系总览</Text>
            <WeaveConstellation clusters={clusters.slice(0, 5)} theme={theme} />
          </View>

          <ScrollView
            contentContainerStyle={styles.landscapeSidebar}
            showsVerticalScrollIndicator={false}
            style={styles.landscapeSidebarPane}
          >
            <SectionHeader label="思维模型" theme={theme} />
            {clusters.map((cluster) => (
              <View key={cluster.id} style={[styles.infoBlock, { borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}>
                <View style={styles.rowBetween}>
                  <Text selectable style={[styles.fieldLabel, { color: theme.colors.ink, flex: 1 }]}>{cluster.title}</Text>
                  <Text style={[styles.caption, { color: theme.colors.coral }]}>{cluster.model}</Text>
                </View>
                <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>{cluster.sharedProblem}</Text>
                <Text selectable style={[styles.caption, { color: theme.colors.cobalt }]}>建议：{cluster.suggestedAction}</Text>
              </View>
            ))}

            <SectionHeader label="项目 / 思维 / 灵感" theme={theme} />
            {projects.map((project) => {
              const projectThoughts = thoughts.filter((thought) => thought.projectId === project.id);
              return (
                <View key={project.id} style={[styles.infoBlock, { borderColor: theme.colors.line, backgroundColor: theme.colors.surfaceSoft }]}>
                  <Text selectable style={[styles.fieldLabel, { color: theme.colors.ink }]}>{project.name}</Text>
                  <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>{project.brief}</Text>
                  {projectThoughts.map((thought) => {
                    const linkedCaptures = captures.filter((capture) => thought.captureIds.includes(capture.id));
                    return (
                      <View key={thought.id} style={[styles.thoughtLane, { borderColor: theme.colors.line }]}>
                        <View style={styles.rowBetween}>
                          <Text selectable style={[styles.caption, { color: theme.colors.ink, flex: 1 }]}>{thought.title}</Text>
                          <Text style={[styles.caption, { color: theme.colors.coral }]}>{thought.model}</Text>
                        </View>
                        <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>
                          {linkedCaptures.length} 条灵感
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function SettingsSheet({
  visible,
  state,
  theme,
  onClose,
  onSetDailyAssistantEnabled,
  onSetTheme,
}: {
  visible: boolean;
  state: SparkWeaveState;
  theme: SparkTheme;
  onClose: () => void;
  onSetDailyAssistantEnabled: (enabled: boolean) => void;
  onSetTheme: (mode: ThemeMode) => void;
}) {
  return (
    <BaseSheet visible={visible} onClose={onClose} theme={theme}>
      <Text selectable style={[styles.sheetTitle, { color: theme.colors.ink }]}>
        创作偏好
      </Text>
      <SettingsGroupTitle label="每日建议" theme={theme} />
      <View style={[styles.settingsRow, { borderColor: theme.colors.line }]}>
        <View style={styles.settingsCopy}>
          <Text style={[styles.fieldLabel, { color: theme.colors.ink }]}>Daily Assistant</Text>
          <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>每天给一个可推进的建议；关闭后保持按需使用。</Text>
        </View>
        <Switch
          onValueChange={onSetDailyAssistantEnabled}
          value={state.settings.dailyAssistantEnabled}
        />
      </View>

      <SettingsGroupTitle label="导入与连接" theme={theme} />
      <SettingsRow label="Obsidian" value="优先 connector · 待接入" theme={theme} />
      <SettingsRow label="Notion / 语雀" value="路线占位 · 后续连接" theme={theme} />

      <SettingsGroupTitle label="数据与导出" theme={theme} />
      <SettingsRow label="本地存储" value="AsyncStorage · MVP" theme={theme} />
      <SettingsRow label="迁移路线" value="Markdown / JSON 导出" theme={theme} />
      <SettingsRow label="Agent API" value="后续接入模型编织" theme={theme} />

      <SettingsGroupTitle label="外观" theme={theme} />
      <View style={[styles.settingsRow, { borderColor: theme.colors.line }]}>
        <View style={styles.settingsCopy}>
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
        <WeaveConstellation compact clusters={[]} theme={getTheme('dark')} />
      </View>
    </BaseSheet>
  );
}

function SettingsGroupTitle({ label, theme }: { label: string; theme: SparkTheme }) {
  return (
    <Text selectable style={[styles.settingsGroupTitle, { color: theme.colors.coral }]}>
      {label}
    </Text>
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
  const insets = useSafeAreaInsets();

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
              paddingBottom: Math.max(insets.bottom, 14),
            },
          ]}
        >
          <View style={[styles.sheetHandle, { backgroundColor: theme.colors.line }]} />
          <ScrollView
            contentContainerStyle={styles.sheetContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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

function MetricCard({
  compact,
  label,
  value,
  tone,
  theme,
}: {
  compact?: boolean;
  label: string;
  value: string;
  tone: string;
  theme: SparkTheme;
}) {
  const iconName: SparkIconName = label === '待整理' || label === '新灵感' ? 'inbox' : label === '推进中' || label === '编织中' ? 'timer' : 'check';
  return (
    <View style={[styles.metricCard, compact ? styles.metricCardCompact : null, panelStyle(theme)]}>
      <View style={[styles.metricIcon, { borderColor: `${tone}55`, backgroundColor: `${tone}12` }]}>
        <IconGlyph color={tone} name={iconName} size={16} strokeWidth={1.9} />
      </View>
      <View>
        <Text selectable style={[styles.metricValue, { color: tone }]}>
          {value}
        </Text>
        <Text selectable style={[styles.caption, { color: theme.colors.muted }]}>
          {label}
        </Text>
      </View>
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

function MiniButton({
  disabled,
  label,
  onPress,
  theme,
}: {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  theme: SparkTheme;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.miniButton,
        {
          borderColor: theme.colors.line,
          backgroundColor: theme.colors.surfaceSoft,
          opacity: disabled ? 0.52 : 1,
        },
      ]}
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
    backgroundColor: theme.isDark ? 'rgba(31, 29, 26, 0.92)' : 'rgba(255, 253, 248, 0.94)',
    borderColor: theme.colors.line,
    boxShadow: `0 10px 28px ${theme.colors.shadow}`,
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
    gap: 14,
    paddingHorizontal: 18,
    paddingTop: 64,
  },
  centeredBanner: {
    alignItems: 'center',
    gap: 0,
    justifyContent: 'center',
    minHeight: 38,
    paddingHorizontal: 28,
  },
  bannerBrand: {
    fontFamily: fonts.latinDisplay,
    fontSize: 19,
    letterSpacing: 0,
    lineHeight: 23,
  },
  bannerContext: {
    fontFamily: fonts.body,
    fontSize: 10,
    lineHeight: 14,
    maxWidth: 260,
    opacity: 0.82,
    textAlign: 'center',
  },
  screenStack: {
    gap: 16,
  },
  heroPanel: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    overflow: 'hidden',
    padding: 18,
  },
  kickerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  profileHeroTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileSettingsButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  kicker: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 31,
    letterSpacing: 0,
    lineHeight: 39,
  },
  heroCopy: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  captureInput: {
    alignItems: 'center',
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
    flexWrap: 'wrap',
    gap: 10,
  },
  metricGridCompact: {
    gap: 8,
  },
  metricCard: {
    alignItems: 'flex-start',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    gap: 9,
    minHeight: 84,
    padding: 12,
  },
  metricCardCompact: {
    flexBasis: '31%',
    minHeight: 78,
    minWidth: 0,
    padding: 10,
  },
  metricIcon: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  metricValue: {
    fontFamily: fonts.latinDisplay,
    fontSize: 31,
    lineHeight: 34,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.displayBold,
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
  captureCard: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
    padding: 14,
  },
  captureCardCompact: {
    gap: 7,
    padding: 12,
  },
  captureTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 19,
    lineHeight: 25,
  },
  captureTitleCompact: {
    fontSize: 17,
    lineHeight: 23,
  },
  captureBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
  },
  captureBodyCompact: {
    fontSize: 12,
    lineHeight: 18,
  },
  captureStatus: {
    borderRadius: 999,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  captureMetaRow: {
    gap: 8,
  },
  captureProject: {
    flexShrink: 1,
  },
  captureActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 2,
  },
  carouselBlock: {
    alignSelf: 'center',
    gap: 10,
    width: '100%',
  },
  carouselTrack: {
    gap: 12,
  },
  carouselDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
  },
  carouselDot: {
    borderRadius: 999,
    height: 6,
  },
  glassPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.44)',
  },
  cardTitle: {
    fontFamily: fonts.displayBold,
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
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  inboxToolbarRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  inboxToolbox: {
    gap: 10,
  },
  filterChip: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    overflow: 'hidden',
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  filterChipText: {
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 16,
  },
  viewToggle: {
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 2,
    padding: 3,
  },
  viewToggleItem: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  viewToggleText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  statusText: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
  },
  iconAction: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  mapPanelTopbar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  clusterHeading: {
    flex: 1,
    gap: 2,
  },
  thoughtPreviewStack: {
    gap: 8,
  },
  thoughtPreviewCard: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 10,
  },
  thoughtPreviewTitle: {
    flex: 1,
    fontSize: 14,
  },
  thoughtLane: {
    borderTopWidth: 1,
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
  },
  landscapeShell: {
    flex: 1,
    padding: 18,
  },
  landscapeTopbar: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    padding: 14,
  },
  landscapeBody: {
    flex: 1,
    flexDirection: 'row',
    gap: 14,
  },
  landscapeBoard: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1.2,
    gap: 12,
    padding: 14,
  },
  landscapeSidebarPane: {
    flex: 1,
  },
  landscapeSidebar: {
    gap: 12,
    paddingBottom: 24,
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
    paddingHorizontal: 11,
    paddingVertical: 7,
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
    height: 284,
    overflow: 'hidden',
    padding: 12,
  },
  mapPanelCompact: {
    height: 128,
    padding: 8,
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
    boxShadow: '0 14px 36px rgba(49, 42, 31, 0.12)',
  },
  bottomBarBackdrop: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    borderRadius: 18,
    gap: 2,
    justifyContent: 'center',
    minHeight: 48,
    overflow: 'hidden',
    paddingVertical: 7,
    position: 'relative',
  },
  tabActiveBlob: {
    borderRadius: 18,
    borderWidth: 1,
    bottom: 2,
    left: 3,
    position: 'absolute',
    right: 3,
    top: 2,
    zIndex: 0,
  },
  tabContent: {
    alignItems: 'center',
    gap: 2,
    justifyContent: 'center',
    position: 'relative',
    zIndex: 2,
  },
  tabIconWrap: {
    height: 22,
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
  },
  tabLabelActive: {
    fontFamily: fonts.bodyMedium,
  },
  fabSlot: {
    alignItems: 'center',
    height: 54,
    justifyContent: 'center',
    width: 58,
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
    boxShadow: '0 -18px 40px rgba(20, 17, 14, 0.16)',
  },
  sheetContent: {
    gap: 14,
    paddingBottom: 20,
  },
  sheetHandle: {
    alignSelf: 'center',
    borderRadius: 999,
    height: 4,
    width: 40,
  },
  sheetTitle: {
    fontFamily: fonts.displayBold,
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
  feedbackPanel: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
    padding: 12,
  },
  feedbackInput: {
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    minHeight: 72,
    padding: 12,
    textAlignVertical: 'top',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scoreButton: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
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
    fontFamily: fonts.latinDisplay,
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
  settingsCopy: {
    flex: 1,
    gap: 3,
  },
  settingsGroupTitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0,
    marginTop: 4,
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
  constellation: {
    borderCurve: 'continuous',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
