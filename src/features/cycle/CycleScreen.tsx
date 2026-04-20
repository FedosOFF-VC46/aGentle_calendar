import { format } from 'date-fns';
import type { CycleEntry } from '../../types/domain';

export const CycleScreen = ({
  entries,
  onStart,
  onEnd,
  onUndoEnd,
  cycleDay
}: {
  entries: CycleEntry[];
  onStart: (date: string) => void;
  onEnd: (date: string) => void;
  onUndoEnd: () => void;
  cycleDay: number | null;
}) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  return (
    <div>
      <h1 className="h1">Цикл</h1>
      <div className="card">
        <p>День цикла: {cycleDay ?? '—'}</p>
        <div className="row">
          <button className="btn" onClick={() => onStart(today)}>
            Начались месячные
          </button>
          <button className="btn secondary" onClick={() => onEnd(today)}>
            Закончились месячные
          </button>
          <button className="btn warn" onClick={onUndoEnd}>
            Отменить окончание
          </button>
        </div>
      </div>
      <div className="card">
        <h2 className="h2">Журнал циклов</h2>
        {!entries.length && <p className="muted">Пока без отметок.</p>}
        {entries.map((entry) => (
          <div key={entry.id} className="space">
            <span>{entry.startDate}</span>
            <span>{entry.endDate ?? 'активно'}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
