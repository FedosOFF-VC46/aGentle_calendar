import type { AppState } from '../types/domain';

export const useDailyTasks = (state: AppState) => {
  if (!state.treatmentPlan) return { tasks: [] };
  return { tasks: state.treatmentPlan.tasks };
};
