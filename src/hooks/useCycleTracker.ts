import { format } from 'date-fns';
import { applyPostMenstrualStage } from '../lib/treatmentEngine';
import { cancelCycleEnd, endCycle, getCycleDay, startCycle } from '../lib/cycleEngine';
import type { AppState } from '../types/domain';

export const useCycleTracker = (state: AppState, patch: (updater: (s: AppState) => AppState) => void) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const cycleDay = getCycleDay(state.cycleEntries, today);

  const startPeriod = (date: string) => patch((prev) => ({ ...prev, cycleEntries: startCycle(prev.cycleEntries, date) }));

  const endPeriod = (date: string) =>
    patch((prev) => ({
      ...prev,
      cycleEntries: endCycle(prev.cycleEntries, date),
      treatmentPlan: prev.treatmentPlan ? applyPostMenstrualStage(prev.treatmentPlan, date) : prev.treatmentPlan
    }));

  const undoEndPeriod = () => patch((prev) => ({ ...prev, cycleEntries: cancelCycleEnd(prev.cycleEntries) }));

  return { cycleDay, startPeriod, endPeriod, undoEndPeriod };
};
