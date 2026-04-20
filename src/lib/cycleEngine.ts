import { differenceInCalendarDays } from 'date-fns';
import { fromISODate } from './date';
import { createId } from './ids';
import type { CycleEntry } from '../types/domain';

export const startCycle = (entries: CycleEntry[], startDate: string): CycleEntry[] => [
  ...entries,
  { id: createId('cycle'), startDate }
];

export const endCycle = (entries: CycleEntry[], endDate: string): CycleEntry[] => {
  const latestOpen = [...entries].reverse().find((entry) => !entry.endDate);
  if (!latestOpen) return entries;

  return entries.map((entry) => (entry.id === latestOpen.id ? { ...entry, endDate } : entry));
};

export const cancelCycleEnd = (entries: CycleEntry[]): CycleEntry[] => {
  const latestClosed = [...entries].reverse().find((entry) => Boolean(entry.endDate));
  if (!latestClosed) return entries;

  return entries.map((entry) => (entry.id === latestClosed.id ? { ...entry, endDate: undefined } : entry));
};

export const getCycleDay = (entries: CycleEntry[], date: string): number | null => {
  const started = [...entries].reverse().find((entry) => entry.startDate <= date && (!entry.endDate || entry.endDate >= date));
  if (!started) return null;
  return differenceInCalendarDays(fromISODate(date), fromISODate(started.startDate)) + 1;
};
