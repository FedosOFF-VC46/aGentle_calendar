import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { AppState, MedicationDose, MoodLevel } from '../../types/domain';

interface Props {
  state: AppState;
  cycleDay: number | null;
  updateDoseStatus: (doseId: string, status: 'done' | 'skipped' | 'postponed', time?: string) => void;
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

export const TodayScreen = ({ state, cycleDay, todayDoses, updateDoseStatus, onSaveMood, mood }: Props) => {
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
        {todayDoses.map((dose) => {
          const med = medsById.get(dose.medicationId);
          if (!med) return null;
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
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn" onClick={() => updateDoseStatus(dose.id, 'done')}>
                  Принято
                </button>
                <button className="btn secondary" onClick={() => updateDoseStatus(dose.id, 'skipped')}>
                  Пропустить
                </button>
                <button className="btn warn" onClick={() => updateDoseStatus(dose.id, 'postponed', '23:30')}>
                  Отложить
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h2 className="h2">Как ты сегодня себя чувствуешь?</h2>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {(Object.keys(moodLabels) as MoodLevel[]).map((item) => (
            <button key={item} className={`btn ${mood === item ? 'secondary' : ''}`} onClick={() => onSaveMood(item)}>
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
