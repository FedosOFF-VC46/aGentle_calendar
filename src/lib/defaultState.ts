import type { AppState } from '../types/domain';

export const APP_STATE_VERSION = 4;

export const defaultState: AppState = {
  version: APP_STATE_VERSION,
  onboardingCompleted: false,
  treatmentPlan: null,
  cycleEntries: [],
  symptomsByDate: {},
  notesByDate: {},
  calendarTagsByDate: {},
  settings: {
    appName: 'Нежный Календарик',
    profileName: 'Любимая',
    notificationsEnabled: false,
    medicationReminderIntervalMinutes: 15,
    showCyclovitaTrack: true,
    disclaimerSeen: false
  }
};
