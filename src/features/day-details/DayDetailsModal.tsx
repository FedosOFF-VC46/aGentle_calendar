import type { AppState } from '../../types/domain';

export const DayDetailsModal = ({ date, state }: { date: string; state: AppState }) => {
  const doses = state.treatmentPlan?.doses.filter((dose) => dose.date === date) ?? [];
  const note = state.notesByDate[date];
  const symptom = state.symptomsByDate[date];

  return (
    <div className="card">
      <h2 className="h2">Детали дня: {date}</h2>
      <p className="muted">Приемы: {doses.length}</p>
      <p className="muted">Симптомы: {symptom ? 'отмечены' : 'нет'}</p>
      <p className="muted">Заметка: {note?.text ?? 'Здесь пока нет заметок'}</p>
    </div>
  );
};
