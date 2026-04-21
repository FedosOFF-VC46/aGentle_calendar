import { useMemo, useState } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { AppState } from '../../types/domain';

export const CalendarScreen = ({ state }: { state: AppState }) => {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leading = (getDay(monthStart) + 6) % 7;
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const selectedSummary = useMemo(() => {
    const doses = state.treatmentPlan?.doses.filter((dose) => dose.date === selectedDate) ?? [];
    const tasks = state.treatmentPlan?.tasks.filter((task) => task.date === selectedDate) ?? [];
    const symptoms = state.symptomsByDate[selectedDate];
    const note = state.notesByDate[selectedDate];
    const cycleMark = state.cycleEntries.some((cycle) => cycle.startDate <= selectedDate && (!cycle.endDate || cycle.endDate >= selectedDate));
    return { doses, tasks, symptoms, note, cycleMark };
  }, [selectedDate, state]);

  return (
    <div>
      <h1 className="h1">Календарь</h1>
      <div className="space" style={{ marginBottom: 8 }}>
        <button className="btn ghost" onClick={() => setVisibleMonth((prev) => subMonths(prev, 1))}>
          ← Месяц назад
        </button>
        <strong>{format(monthStart, 'LLLL yyyy', { locale: ru })}</strong>
        <button className="btn ghost" onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}>
          Месяц вперед →
        </button>
      </div>
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="ind" style={{ background: '#8fc8a8' }} />
          Есть приемы
        </div>
        <div className="legend-item">
          <span className="ind" style={{ background: '#66a88a' }} />
          Все приемы приняты
        </div>
        <div className="legend-item">
          <span className="ind" style={{ background: '#d7b6f6' }} />
          Есть симптомы
        </div>
        <div className="legend-item">
          <span className="ind" style={{ background: '#f3c4b6' }} />
          Есть заметка
        </div>
        <div className="legend-item">
          <span className="ind" style={{ background: '#f5adc8' }} />
          Идет цикл
        </div>
        <div className="legend-item">
          <span className="ind" style={{ background: '#ffd9b8' }} />
          Есть задача
        </div>
      </div>
      <div className="grid-calendar">
        {weekDays.map((item) => (
          <div key={item} className="weekday-cell">
            {item}
          </div>
        ))}
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
          const inVisibleMonth = isSameMonth(day, monthStart);
          return (
            <button
              type="button"
              key={date}
              className={`day-cell ${date === todayDate ? 'today' : ''} ${date === selectedDate ? 'selected' : ''}`}
              style={{ opacity: inVisibleMonth ? 1 : 0.4 }}
              onClick={() => setSelectedDate(date)}
            >
              {format(day, 'd')}
              <div className="indicators">
                {doses.length > 0 && <span className="ind" style={{ background: '#8fc8a8' }} />}
                {hasSymptoms && <span className="ind" style={{ background: '#d7b6f6' }} />}
                {hasNote && <span className="ind" style={{ background: '#f3c4b6' }} />}
                {cycleMark && <span className="ind" style={{ background: '#f5adc8' }} />}
                {hasTask && <span className="ind" style={{ background: '#ffd9b8' }} />}
                {done && <span className="ind" style={{ background: '#66a88a' }} />}
              </div>
            </button>
          );
        })}
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <h2 className="h2">{format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}</h2>
        <p className="muted">
          Приемы: {selectedSummary.doses.length} · Задачи: {selectedSummary.tasks.length} · Симптомы: {selectedSummary.symptoms ? 'да' : 'нет'} ·
          {' '}Заметка: {selectedSummary.note ? 'да' : 'нет'} · Цикл: {selectedSummary.cycleMark ? 'да' : 'нет'}
        </p>
      </div>
    </div>
  );
};