import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { AppState, IntakeStatus, MedicationDose, MoodLevel } from '../../types/domain';

interface Props {
  state: AppState;
  cycleDay: number | null;
  updateDoseStatus: (doseId: string, status: IntakeStatus, time?: string) => void;
  todayDoses: MedicationDose[];
  onSaveMood: (mood: MoodLevel) => void;
  mood?: MoodLevel;
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

export const TodayScreen = (props: Props) => {
  const { state, cycleDay, todayDoses = [], updateDoseStatus, onSaveMood, mood } = props;
  const [statusFilter, setStatusFilter] = useState<IntakeStatus | 'all'>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [undoAction, setUndoAction] = useState<{ doseId: string; previousStatus: IntakeStatus; previousTime: string } | null>(null);

  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru });
  const medsById = new Map(state.treatmentPlan?.medications.map((med) => [med.id, med]));

  const filteredDoses = useMemo(
    () =>
      todayDoses.filter(
        (dose) => (statusFilter === 'all' || dose.status === statusFilter) && isInTimeBucket(dose.currentTime, timeFilter)
      ),
    [statusFilter, timeFilter, todayDoses]
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
      <h1 className="h1">Забота о себе</h1>
      <p className="muted">{today}</p>
      <div className="card">
        <div className="space">
          <strong>Сегодняшний план</strong>
          <span className="badge">День цикла: {cycleDay ?? '—'}</span>
        </div>
        <div className="today-filters">
          {(['all', 'scheduled', 'done', 'postponed', 'skipped'] as const).map((item) => (
            <button key={item} className={`btn filter-chip ${statusFilter === item ? 'active' : ''}`} onClick={() => setStatusFilter(item)}>
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
            <button key={key} className={`btn filter-chip ${timeFilter === key ? 'secondary active' : 'secondary'}`} onClick={() => setTimeFilter(key)}>
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
            <div key={dose.id} className={`card dose-card dose-${dose.status}`} style={{ marginBottom: 8, padding: 10 }}>
              <div className="space">
                <strong>{dose.currentTime}</strong>
                <span className="badge">{med.intakeKind}</span>
              </div>
              <div>{med.name}</div>
              <small className="muted">
                {med.dosage}, {med.quantity}, {med.withFood}
              </small>
              <div className="space" style={{ marginTop: 6 }}>
                <small className="muted">Статус: {statusLabels[dose.status]}</small>
                {dose.currentTime !== dose.plannedTime && <small className="muted">Было: {dose.plannedTime}</small>}
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className={`btn ${isDone ? 'success' : ''}`} onClick={() => onDoseAction(dose, 'done')} disabled={isDone}>
                  Принято
                </button>
                <button type="button" className={`btn secondary ${isSkipped ? 'active' : ''}`} onClick={() => onDoseAction(dose, 'skipped')} disabled={isSkipped}>
                  Пропустить
                </button>
                <button type="button" className={`btn warn ${isPostponed ? 'active' : ''}`} onClick={() => onDoseAction(dose, 'postponed', '23:30')}>
                  Отложить
                </button>
                {dose.status !== 'scheduled' && (
                  <button type="button" className="btn ghost" onClick={() => onDoseAction(dose, 'scheduled', dose.plannedTime)}>
                    Сбросить
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="h2">Как ты сегодня себя чувствуешь?</h2>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(moodLabels) as MoodLevel[]).map((item) => (
            <button type="button" key={item} className={`btn ${mood === item ? 'secondary' : ''}`} onClick={() => onSaveMood(item)}>
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
