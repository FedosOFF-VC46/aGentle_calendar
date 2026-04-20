import { eachDayOfInterval, endOfMonth, format, getDay, startOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { AppState } from '../../types/domain';

export const CalendarScreen = ({ state }: { state: AppState }) => {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leading = (getDay(monthStart) + 6) % 7;

  return (
    <div>
      <h1 className="h1">Календарь</h1>
      <p className="muted">{format(monthStart, 'LLLL yyyy', { locale: ru })}</p>
      <div className="grid-calendar">
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const date = format(day, 'yyyy-MM-dd');
          const doses = state.treatmentPlan?.doses.filter((dose) => dose.date === date) ?? [];
          const done = doses.length > 0 && doses.every((dose) => dose.status === 'done');
          const hasSymptoms = Boolean(state.symptomsByDate[date]);
          const hasNote = Boolean(state.notesByDate[date]);
          const cycleMark = state.cycleEntries.some((cycle) => cycle.startDate <= date && (!cycle.endDate || cycle.endDate >= date));
          const hasTask = state.treatmentPlan?.tasks.some((task) => task.date === date);
          return (
            <div key={date} className="day-cell">
              {format(day, 'd')}
              <div className="indicators">
                {doses.length > 0 && <span className="ind" style={{ background: '#8fc8a8' }} />}
                {hasSymptoms && <span className="ind" style={{ background: '#d7b6f6' }} />}
                {hasNote && <span className="ind" style={{ background: '#f3c4b6' }} />}
                {cycleMark && <span className="ind" style={{ background: '#f5adc8' }} />}
                {hasTask && <span className="ind" style={{ background: '#ffd9b8' }} />}
                {done && <span className="ind" style={{ background: '#66a88a' }} />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
