import { useEffect, useMemo, useState } from 'react';
import { addDays, format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getCurrentCycleDay } from '../../lib/calendarMeta';
import type { AppState, IntakeStatus, MedicationDose, MoodLevel } from '../../types/domain';

interface Props {
  state: AppState;
  updateDoseStatus: (doseId: string, status: IntakeStatus, time?: string) => void;
  onSaveMood: (date: string, mood: MoodLevel) => void;
}

const moodLabels: Record<MoodLevel, string> = {
  excellent: 'отлично',
  normal: 'нормально',
  'not-great': 'не очень',
  bad: 'плохо'
};

const statusLabels: Record<IntakeStatus, string> = {
  scheduled: 'Запланировано',
  done: 'Принято',
  skipped: 'Пропущено',
  postponed: 'Отложено'
};
const intakeKindLabels = {
  tablet: 'Таблетка',
  capsule: 'Капсула',
  suppository: 'Свеча',
  vitamin: 'Витамины'
} as const;
const foodLabels = {
  before: 'до еды',
  during: 'во время еды',
  after: 'после еды',
  any: 'не важно'
} as const;

type TimeFilter = 'all' | 'morning' | 'day' | 'evening' | 'night';

const isInTimeBucket = (time: string, bucket: TimeFilter) => {
  if (bucket === 'all') return true;
  const hours = Number(time.split(':')[0]);
  if (Number.isNaN(hours)) return false;
  if (bucket === 'morning') return hours >= 5 && hours < 12;
  if (bucket === 'day') return hours >= 12 && hours < 18;
  if (bucket === 'evening') return hours >= 18 && hours <= 23;
  return hours >= 0 && hours < 5;
};

const postponeByHour = (time: string) => {
  const [hoursRaw, minutesRaw] = time.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return '23:30';

  const totalMinutes = Math.min(hours * 60 + minutes + 60, 23 * 60 + 59);
  const nextHours = Math.floor(totalMinutes / 60);
  const nextMinutes = totalMinutes % 60;

  return `${String(nextHours).padStart(2, '0')}:${String(nextMinutes).padStart(2, '0')}`;
};

export const TodayScreen = (props: Props) => {
  const { state, updateDoseStatus, onSaveMood } = props;
  const [statusFilter, setStatusFilter] = useState<IntakeStatus | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [undoAction, setUndoAction] = useState<{ doseId: string; previousStatus: IntakeStatus; previousTime: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const selectedDateLabel = format(new Date(selectedDate), 'EEEE, d MMMM', { locale: ru });
  const cycleDay = getCurrentCycleDay(state, selectedDate);
  const selectedMood = state.symptomsByDate[selectedDate]?.mood;
  const dosesForDate = useMemo(
    () => state.treatmentPlan?.doses.filter((dose) => dose.date === selectedDate).sort((a, b) => a.currentTime.localeCompare(b.currentTime)) ?? [],
    [selectedDate, state.treatmentPlan]
  );
  const upcomingCount = dosesForDate.filter((dose) => dose.status === 'scheduled').length;
  const completedCount = dosesForDate.filter((dose) => dose.status === 'done').length;
  const medsById = new Map(state.treatmentPlan?.medications.map((med) => [med.id, med]));

  useEffect(() => {
    setUndoAction(null);
  }, [selectedDate]);

  const filteredDoses = useMemo(
    () =>
      dosesForDate.filter(
        (dose) => (statusFilter === 'all' || dose.status === statusFilter) && isInTimeBucket(dose.currentTime, timeFilter)
      ),
    [dosesForDate, statusFilter, timeFilter]
  );

  const onDoseAction = (dose: MedicationDose, status: IntakeStatus, time?: string) => {
    setUndoAction({ doseId: dose.id, previousStatus: dose.status, previousTime: dose.currentTime });
    updateDoseStatus(dose.id, status, time);
  };

  const undoLastAction = () => {
    if (!undoAction) return;
    updateDoseStatus(undoAction.doseId, undoAction.previousStatus, undoAction.previousTime);
    setUndoAction(null);
  };

  return (
    <>
      <section className="hero-card">
        <div className="hero-card__glow" />
        <p className="eyebrow">Сегодня</p>
        <h1 className="hero-title">Забота о себе</h1>
        <p className="muted">{selectedDateLabel}</p>
        <div className="hero-stats">
          <div className="hero-stat">
            <span className="muted">Запланировано</span>
            <strong>{dosesForDate.length}</strong>
          </div>
          <div className="hero-stat">
            <span className="muted">Еще впереди</span>
            <strong>{upcomingCount}</strong>
          </div>
          <div className="hero-stat">
            <span className="muted">Цикл</span>
            <strong>{cycleDay ? `день ${cycleDay}` : 'отмечай в календаре'}</strong>
          </div>
        </div>
      </section>

      <div className="card card-soft">
        <div className="space">
          <strong>{selectedDate === todayIso ? 'Сегодняшний план' : 'План на выбранный день'}</strong>
          <span className="badge">Выполнено {completedCount}/{dosesForDate.length}</span>
        </div>
        <div className="day-switcher">
          <button type="button" className="btn ghost chip-btn" onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), -1), 'yyyy-MM-dd'))}>
            ← Предыдущий
          </button>
          <div className="day-switcher__center">
            <strong>{selectedDateLabel}</strong>
            <input className="input" type="date" value={selectedDate} max={todayIso} onChange={(event) => setSelectedDate(event.target.value)} />
          </div>
          <button
            type="button"
            className="btn ghost chip-btn"
            onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
            disabled={selectedDate >= todayIso}
          >
            Следующий →
          </button>
        </div>
        <div className="today-filters">
          {(['all', 'scheduled', 'done', 'postponed', 'skipped'] as const).map((item) => (
            <button key={item} className={`btn chip-btn filter-chip ${statusFilter === item ? 'active' : ''}`} onClick={() => setStatusFilter(item)}>
              {item === 'all' ? 'Все статусы' : statusLabels[item]}
            </button>
          ))}
        </div>

        <div className="today-filters">
          {([
            ['all', 'Все время'],
            ['morning', 'Утро'],
            ['day', 'День'],
            ['evening', 'Вечер'],
            ['night', 'Ночь']
          ] as const).map(([key, label]) => (
            <button key={key} className={`btn chip-btn filter-chip ${timeFilter === key ? 'secondary active' : 'secondary'}`} onClick={() => setTimeFilter(key)}>
              {label}
            </button>
          ))}
        </div>

        {undoAction && (
          <div className="undo-banner">
            <span>Последнее действие применено</span>
            <button className="btn ghost" onClick={undoLastAction}>Отменить</button>
          </div>
        )}

        {!filteredDoses.length && <p className="muted">По выбранным фильтрам ничего нет ✨</p>}
        {filteredDoses.map((dose: MedicationDose) => {
          const med = medsById.get(dose.medicationId);
          if (!med) return null;
          const isDone = dose.status === 'done';
          const isSkipped = dose.status === 'skipped';
          const isPostponed = dose.status === 'postponed';
          return (
            <div key={dose.id} className={`card dose-card dose-${dose.status}`} style={{ marginBottom: 10, padding: 12 }}>
              <div className="space">
                <strong>{dose.currentTime}</strong>
                <span className="badge">{intakeKindLabels[med.intakeKind]}</span>
              </div>
              <div>{med.name}</div>
              <small className="muted">
                {med.dosage}, {med.quantity}, {foodLabels[med.withFood]}
              </small>
              <div className="space" style={{ marginTop: 6 }}>
                <small className="muted">Статус: {statusLabels[dose.status]}</small>
                {dose.currentTime !== dose.plannedTime && <small className="muted">Было: {dose.plannedTime}</small>}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className={`btn action-btn ${isDone ? 'success' : ''}`} onClick={() => onDoseAction(dose, 'done')} disabled={isDone}>
                  Принято
                </button>
                <button type="button" className={`btn secondary action-btn ${isSkipped ? 'active' : ''}`} onClick={() => onDoseAction(dose, 'skipped')} disabled={isSkipped}>
                  Пропустить
                </button>
                <button
                  type="button"
                  className={`btn warn action-btn ${isPostponed ? 'active' : ''}`}
                  onClick={() => onDoseAction(dose, 'postponed', postponeByHour(dose.currentTime))}
                >
                  Отложить
                </button>
                {dose.status === 'postponed' && (
                  <button type="button" className="btn ghost action-btn" onClick={() => onDoseAction(dose, 'scheduled', dose.plannedTime)}>
                    Вернуть в план
                  </button>
                )}
                {dose.status !== 'scheduled' && dose.status !== 'postponed' && (
                  <button type="button" className="btn ghost action-btn" onClick={() => onDoseAction(dose, 'scheduled', dose.plannedTime)}>
                    Сбросить статус
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card card-soft">
        <h2 className="h2">{selectedDate === todayIso ? 'Как ты сегодня себя чувствуешь?' : 'Как ты себя чувствовала в этот день?'}</h2>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(moodLabels) as MoodLevel[]).map((item) => (
            <button type="button" key={item} className={`btn chip-btn ${selectedMood === item ? 'secondary active' : ''}`} onClick={() => onSaveMood(selectedDate, item)}>
              {moodLabels[item]}
            </button>
          ))}
        </div>
      </div>
      <p className="muted" style={{ textAlign: 'center' }}>
        С любовью и заботой
      </p>
    </>
  );
};
