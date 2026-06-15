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

export type WeaveCluster = {
  id: string;
  title: string;
  reason: string;
  tags: string[];
  captureIds: string[];
  projectId?: string;
  strength: number;
};

export type AppTab = 'today' | 'inbox' | 'weave' | 'projects';

export type ThemeMode = 'light' | 'dark';

export type SparkWeaveState = {
  captures: Capture[];
  projects: Project[];
  themeMode: ThemeMode;
};
