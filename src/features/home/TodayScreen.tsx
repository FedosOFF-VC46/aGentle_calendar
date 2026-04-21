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

export const TodayScreen = (props: Props) => {
  const { state, cycleDay, todayDoses = [], updateDoseStatus, onSaveMood, mood } = props;
  const today = format(new Date(), 'EEEE, d MMMM', { locale: ru });
  const medsById = new Map(state.treatmentPlan?.medications.map((med) => [med.id, med]));

  return (
    <>
      <h1 className="h1">Забота о себе</h1>
      <p className="muted">{today}</p>
      <div className="card">
        <div className="space">
          <strong>Сегодняшний план</strong>
          <span className="badge">День цикла: {cycleDay ?? '—'}</span>
        </div>
        {!todayDoses.length && <p className="muted">Сегодня все спокойно ✨</p>}
        {todayDoses.map((dose: MedicationDose) => {
          const med = medsById.get(dose.medicationId);
          if (!med) return null;
          const isDone = dose.status === 'done';
          const isSkipped = dose.status === 'skipped';
          const isPostponed = dose.status === 'postponed';
          return (
            <div key={dose.id} className="card" style={{ marginBottom: 8, padding: 10 }}>
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
                <button type="button" className={`btn ${isDone ? 'success' : ''}`} onClick={() => updateDoseStatus(dose.id, 'done')} disabled={isDone}>
                  Принято
                </button>
                <button type="button" className={`btn secondary ${isSkipped ? 'active' : ''}`} onClick={() => updateDoseStatus(dose.id, 'skipped')} disabled={isSkipped}>
                  Пропустить
                </button>
                <button type="button" className={`btn warn ${isPostponed ? 'active' : ''}`} onClick={() => updateDoseStatus(dose.id, 'postponed', '23:30')}>
                  Отложить
                </button>
                {dose.status !== 'scheduled' && (
                  <button type="button" className="btn ghost" onClick={() => updateDoseStatus(dose.id, 'scheduled', dose.plannedTime)}>
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
