import { format } from 'date-fns';
import { useState } from 'react';
import type { SymptomEntry } from '../../types/domain';

const alarmOptions = ['сильная сыпь', 'отек', 'одышка', 'выраженная рвота', 'сильная боль в животе', 'очень обильное кровотечение', 'высокая температура', 'резкое ухудшение самочувствия'];

export const SymptomsScreen = ({
  todayEntry,
  onSave
}: {
  todayEntry?: SymptomEntry;
  onSave: (entry: SymptomEntry) => void;
}) => {
  const date = format(new Date(), 'yyyy-MM-dd');
  const [entry, setEntry] = useState<SymptomEntry>(
    todayEntry ?? {
      date,
      painLevel: 0,
      bleeding: 'none',
      nausea: false,
      weakness: false,
      dizziness: false,
      discharge: false,
      mood: 'normal',
      appetite: 'normal',
      alarmingSymptoms: []
    }
  );

  const toggleAlarm = (item: string) => {
    setEntry((prev) => ({
      ...prev,
      alarmingSymptoms: prev.alarmingSymptoms.includes(item)
        ? prev.alarmingSymptoms.filter((alarm) => alarm !== item)
        : [...prev.alarmingSymptoms, item]
    }));
  };

  return (
    <div>
      <h1 className="h1">Симптомы</h1>
      <p className="muted">Только самое важное на одном экране, остальное можно коротко дописать в комментарии.</p>
      <div className="card card-soft">
        <label>Боль: {entry.painLevel}</label>
        <input type="range" min={0} max={10} value={entry.painLevel} onChange={(event) => setEntry((prev) => ({ ...prev, painLevel: Number(event.target.value) }))} />
        <label>Кровотечение</label>
        <select value={entry.bleeding} onChange={(event) => setEntry((prev) => ({ ...prev, bleeding: event.target.value as SymptomEntry['bleeding'] }))}>
          <option value="none">нет</option>
          <option value="light">слабое</option>
          <option value="moderate">умеренное</option>
          <option value="heavy">сильное</option>
        </select>
        <div className="row" style={{ flexWrap: 'wrap', marginTop: 10 }}>
          {alarmOptions.map((item) => (
            <button key={item} className={`btn chip-btn ${entry.alarmingSymptoms.includes(item) ? 'warn active' : 'ghost'}`} onClick={() => toggleAlarm(item)}>
              {item}
            </button>
          ))}
        </div>
        {entry.alarmingSymptoms.length > 0 && (
          <p className="muted" style={{ marginTop: 8 }}>
            Стоит связаться с врачом и перепроверить самочувствие.
          </p>
        )}
        <textarea
          className="input"
          placeholder="Комментарий"
          value={entry.comment ?? ''}
          onChange={(event) => setEntry((prev) => ({ ...prev, comment: event.target.value }))}
        />
        <button className="btn action-btn success" style={{ marginTop: 10 }} onClick={() => onSave(entry)}>
          Сохранить
        </button>
      </div>
    </div>
  );
};
