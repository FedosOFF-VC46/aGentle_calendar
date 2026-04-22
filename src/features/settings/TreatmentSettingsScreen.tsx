import { useMemo, useState } from 'react';
import { createId } from '../../lib/ids';
import type { IntakeKind, Medication } from '../../types/domain';

interface Props {
  medications: Medication[];
  onSave: (medications: Medication[]) => void;
}

const intakeKinds: IntakeKind[] = ['tablet', 'capsule', 'suppository', 'vitamin'];
const foodModes: Array<Medication['withFood']> = ['before', 'during', 'after', 'any'];

const parseTimes = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const parseDays = (value: string) =>
  value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0)
    .sort((a, b) => a - b);

const serializeDays = (days?: number[]) => (days?.length ? days.join(', ') : '');

export const TreatmentSettingsScreen = ({ medications, onSave }: Props) => {
  const [drafts, setDrafts] = useState<Medication[]>(medications);
  const [newMedicationName, setNewMedicationName] = useState('');

  const totalDosesHint = useMemo(
    () =>
      drafts.reduce((total, medication) => {
        const days = medication.specificDays?.length ? medication.specificDays.length : medication.durationDays ?? 1;
        return total + days * Math.max(medication.defaultTimes.length, 1);
      }, 0),
    [drafts]
  );

  const update = (id: string, updater: (medication: Medication) => Medication) => {
    setDrafts((prev) => prev.map((medication) => (medication.id === id ? updater(medication) : medication)));
  };

  const addMedication = () => {
    const cleanName = newMedicationName.trim();
    if (!cleanName) return;
    setDrafts((prev) => [
      ...prev,
      {
        id: createId('med'),
        name: cleanName,
        dosage: '1 доза',
        quantity: '1 прием',
        intakeKind: 'tablet',
        withFood: 'any',
        notes: ['Добавлено вручную'],
        defaultTimes: ['09:00'],
        durationDays: 7,
        startDay: 1
      }
    ]);
    setNewMedicationName('');
  };

  return (
    <div>
      <h1 className="h1">Конструктор схемы лечения</h1>
      <p className="muted">Настрой дозировки, время и дни курса. После сохранения график автоматически пересчитается для всех дней.</p>
      <div className="card card-soft">
        <div className="space">
          <strong>Планировщик</strong>
          <span className="badge">~ {totalDosesHint} приемов</span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <input className="input" value={newMedicationName} placeholder="Новый препарат" onChange={(event) => setNewMedicationName(event.target.value)} />
          <button className="btn action-btn" onClick={addMedication}>Добавить</button>
        </div>
      </div>

      {drafts.map((medication) => (
        <details key={medication.id} className="card details-card" open>
          <summary className="details-summary">
            <div>
              <strong>{medication.name}</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>{medication.defaultTimes.join(', ')} · {medication.intakeKind}</p>
            </div>
            <button className="btn ghost action-btn" type="button" onClick={(event) => {
              event.preventDefault();
              setDrafts((prev) => prev.filter((item) => item.id !== medication.id));
            }}>Удалить</button>
          </summary>
          <label>Название</label>
          <input className="input" value={medication.name} onChange={(event) => update(medication.id, (item) => ({ ...item, name: event.target.value }))} />
          <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>Дозировка</label>
              <input className="input" value={medication.dosage} onChange={(event) => update(medication.id, (item) => ({ ...item, dosage: event.target.value }))} />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>Количество</label>
              <input className="input" value={medication.quantity} onChange={(event) => update(medication.id, (item) => ({ ...item, quantity: event.target.value }))} />
            </div>
          </div>
          <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>Тип приема</label>
              <select value={medication.intakeKind} onChange={(event) => update(medication.id, (item) => ({ ...item, intakeKind: event.target.value as IntakeKind }))}>
                {intakeKinds.map((kind) => <option key={kind}>{kind}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>Относительно еды</label>
              <select value={medication.withFood} onChange={(event) => update(medication.id, (item) => ({ ...item, withFood: event.target.value as Medication['withFood'] }))}>
                {foodModes.map((mode) => <option key={mode}>{mode}</option>)}
              </select>
            </div>
          </div>
          <label style={{ marginTop: 8, display: 'block' }}>Время приема (через запятую)</label>
          <input
            className="input"
            value={medication.defaultTimes.join(', ')}
            onChange={(event) => update(medication.id, (item) => ({ ...item, defaultTimes: parseTimes(event.target.value) }))}
            placeholder="08:00, 20:00"
          />
          <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>Старт с дня</label>
              <input
                className="input"
                type="number"
                min={1}
                value={medication.startDay ?? 1}
                onChange={(event) => update(medication.id, (item) => ({ ...item, startDay: Number(event.target.value) || 1 }))}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label>Длительность (дней)</label>
              <input
                className="input"
                type="number"
                min={1}
                value={medication.durationDays ?? 1}
                onChange={(event) => update(medication.id, (item) => ({ ...item, durationDays: Number(event.target.value) || 1 }))}
              />
            </div>
          </div>
          <label style={{ marginTop: 8, display: 'block' }}>Точные дни курса (опционально)</label>
          <input
            className="input"
            value={serializeDays(medication.specificDays)}
            placeholder="например: 1, 4, 9"
            onChange={(event) => update(medication.id, (item) => ({ ...item, specificDays: parseDays(event.target.value) }))}
          />
        </details>
      ))}

      <button className="btn success action-btn" onClick={() => onSave(drafts)}>Сохранить и пересчитать схему</button>
    </div>
  );
};
