export type CaptureStatus = 'inbox' | 'active' | 'archived' | 'done';

export type Capture = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  projectId?: string;
  status: CaptureStatus;
  createdAt: string;
  nextAction?: string;
};

export type Project = {
  id: string;
  name: string;
  brief: string;
  tags: string[];
  status: 'active' | 'paused' | 'archived';
  progress: number;
};

export type ThoughtStatus = 'draft' | 'active' | 'done';

export type Thought = {
  id: string;
  projectId: string;
  title: string;
  brief: string;
  model: '金字塔结构' | '决策分层' | '行动闭环';
  tags: string[];
  captureIds: string[];
  status: ThoughtStatus;
};

export type WeaveCluster = {
  id: string;
  title: string;
  model: string;
  reason: string;
  connectionReason: string;
  sharedProblem: string;
  suggestedAction: string;
  tags: string[];
  captureIds: string[];
  projectId?: string;
  strength: number;
};

export type AppTab = 'inbox' | 'weave' | 'outputs' | 'profile';

export type ThemeMode = 'light' | 'dark';

export type AppSettings = {
  dailyAssistantEnabled: boolean;
};

export type FeedbackEntry = {
  id: string;
  targetType: 'cluster' | 'output';
  targetId: string;
  score: number;
  text: string;
  createdAt: string;
};

export type SparkWeaveState = {
  captures: Capture[];
  projects: Project[];
  thoughts: Thought[];
  themeMode: ThemeMode;
  settings: AppSettings;
  feedback: FeedbackEntry[];
};
