import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';
import type { AppState } from '../types/domain';

export const getPeriodDates = (state: AppState) =>
  Object.values(state.calendarTagsByDate)
    .filter((entry) => entry.tags.includes('period'))
    .map((entry) => entry.date)
    .sort();

export const getCurrentCycleDay = (state: AppState, referenceDate: string) => {
  const periodDates = getPeriodDates(state);
  if (!periodDates.length) return null;

  const periodSet = new Set(periodDates);
  const latestPeriodDate = [...periodDates].reverse().find((date) => date <= referenceDate);
  if (!latestPeriodDate) return null;

  let start = latestPeriodDate;
  let cursor = parseISO(latestPeriodDate);

  while (true) {
    const previousDate = format(addDays(cursor, -1), 'yyyy-MM-dd');
    if (!periodSet.has(previousDate)) break;
    start = previousDate;
    cursor = parseISO(previousDate);
  }

  return differenceInCalendarDays(parseISO(referenceDate), parseISO(start)) + 1;
};
