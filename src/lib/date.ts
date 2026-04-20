import { addDays, format, parseISO } from 'date-fns';

export const toISODate = (date: Date): string => format(date, 'yyyy-MM-dd');
export const fromISODate = (date: string): Date => parseISO(`${date}T00:00:00`);
export const dayShift = (date: string, amount: number): string => toISODate(addDays(fromISODate(date), amount));
