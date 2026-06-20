import AsyncStorage from '@react-native-async-storage/async-storage';
import { defaultState } from './seed';
import type { SparkWeaveState } from './types';

const STORAGE_KEY = 'sparkweave:v1';

export async function loadSparkWeaveState(): Promise<SparkWeaveState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return defaultState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SparkWeaveState>;
    return {
      captures: parsed.captures?.length ? parsed.captures : defaultState.captures,
      projects: parsed.projects?.length ? parsed.projects : defaultState.projects,
      themeMode: parsed.themeMode ?? defaultState.themeMode,
      settings: {
        ...defaultState.settings,
        ...parsed.settings,
      },
      feedback: parsed.feedback ?? defaultState.feedback,
    };
  } catch {
    return defaultState;
  }
}

export async function saveSparkWeaveState(state: SparkWeaveState) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
