import type { AppState } from '../types/domain';

export const APP_STATE_VERSION = 2;

export const defaultState: AppState = {
  version: APP_STATE_VERSION,
  onboardingCompleted: false,
  treatmentPlan: null,
  cycleEntries: [],
  symptomsByDate: {},
  notesByDate: {},
  settings: {
    appName: 'Нежный Календарик',
    profileName: 'Любимая',
    notificationsEnabled: false,
    showCyclovitaTrack: true,
    disclaimerSeen: false
  }
};
