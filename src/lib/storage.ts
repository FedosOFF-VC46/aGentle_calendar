import { APP_STATE_VERSION, defaultState } from './defaultState';
import type { AppState, ExportedBackup } from '../types/domain';

const STORAGE_KEY = 'gentle-calendar-state';

const migrate = (raw: Partial<AppState>): AppState => ({
  ...defaultState,
  ...raw,
  version: APP_STATE_VERSION,
  settings: {
    ...defaultState.settings,
    ...raw.settings
  }
});

export const loadState = (): AppState => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return defaultState;
    const parsed = JSON.parse(value) as Partial<AppState>;
    return migrate(parsed);
  } catch {
    return defaultState;
  }
};

export const saveState = (state: AppState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const exportBackup = (state: AppState): ExportedBackup => ({
  exportedAt: new Date().toISOString(),
  source: 'Нежный Календарик',
  version: APP_STATE_VERSION,
  payload: state
});

export const importBackup = (json: string): AppState => {
  const backup = JSON.parse(json) as ExportedBackup;
  return migrate(backup.payload ?? {});
};

export const resetState = (): AppState => {
  localStorage.removeItem(STORAGE_KEY);
  return defaultState;
};
