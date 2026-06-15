import type { ThemeMode } from './types';

export const fonts = {
  display: 'Songti SC',
  body: 'PingFang SC',
  fallbackDisplay: 'serif',
};

export function getTheme(mode: ThemeMode) {
  const isDark = mode === 'dark';

  return {
    mode,
    isDark,
    colors: {
      background: isDark ? '#151413' : '#f8f6f1',
      surface: isDark ? '#1f1d1a' : '#fffdf8',
      surfaceSoft: isDark ? '#292622' : '#f1eee6',
      ink: isDark ? '#f4efe5' : '#171512',
      muted: isDark ? '#a9a095' : '#736c62',
      faint: isDark ? '#3a352f' : '#dfd8cc',
      line: isDark ? '#3a352f' : '#e7dfd2',
      sage: '#8ba596',
      cobalt: '#5d77a6',
      coral: '#c96f52',
      violet: '#8c7ca8',
      gold: '#b2925b',
      success: '#6f9276',
      shadow: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(49, 42, 31, 0.08)',
    },
  };
}

export type SparkTheme = ReturnType<typeof getTheme>;
