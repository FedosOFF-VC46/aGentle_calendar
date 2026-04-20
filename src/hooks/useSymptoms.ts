import { format } from 'date-fns';
import type { AppState, SymptomEntry } from '../types/domain';

export const useSymptoms = (state: AppState, patch: (updater: (s: AppState) => AppState) => void) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayEntry = state.symptomsByDate[today];

  const saveEntry = (entry: SymptomEntry) => {
    patch((prev) => ({ ...prev, symptomsByDate: { ...prev.symptomsByDate, [entry.date]: entry } }));
  };

  return { todayEntry, saveEntry };
};
