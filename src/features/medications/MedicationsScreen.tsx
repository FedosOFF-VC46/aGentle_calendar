import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { AppState } from '../../types/domain';

const filters = ['all', 'today', 'tablet', 'suppository', 'post-menstrual'] as const;
type Filter = (typeof filters)[number];

const filterLabels: Record<Filter, string> = {
  all: 'Все',
  today: 'Сегодня',
  tablet: 'Таблетки',
  suppository: 'Свечи',
  'post-menstrual': 'После цикла'
};

export const MedicationsScreen = ({ state }: { state: AppState }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const today = format(new Date(), 'yyyy-MM-dd');

  const filtered = useMemo(() => {
    const doses = state.treatmentPlan?.doses ?? [];
    if (filter === 'today') return doses.filter((dose) => dose.date === today);
    if (filter === 'tablet' || filter === 'suppository') {
      const medicationIds = state.treatmentPlan?.medications.filter((med) => med.intakeKind === filter).map((med) => med.id) ?? [];
      return doses.filter((dose) => medicationIds.includes(dose.medicationId));
    }
    if (filter === 'post-menstrual') {
      const ids = ['maxilac', 'clindacin', 'acylact'];
      return doses.filter((dose) => ids.includes(dose.medicationId));
    }
    return doses;
  }, [filter, state.treatmentPlan, today]);

  const medMap = new Map(state.treatmentPlan?.medications.map((med) => [med.id, med]));

  return (
    <div>
      <h1 className="h1">Приемы</h1>
      <p className="muted">Собрали приемы в компактный список, чтобы на телефоне было легко быстро пробежать глазами по графику.</p>
      <div className="tab-row" style={{ overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map((item) => (
          <button key={item} className={`btn chip-btn ${filter === item ? 'secondary active' : 'ghost'}`} onClick={() => setFilter(item)}>
            {filterLabels[item]}
          </button>
        ))}
      </div>
      {filtered.slice(0, 120).map((dose) => {
        const med = medMap.get(dose.medicationId);
        if (!med) return null;
        return (
          <div className="card card-soft" key={dose.id}>
            <div className="space">
              <strong>{med.name}</strong>
              <span className="badge">{dose.date} {dose.currentTime}</span>
            </div>
            <p className="muted">{med.dosage}, {med.quantity}, {med.withFood}</p>
            <small>{med.notes.join(' · ')}</small>
          </div>
        );
      })}
    </div>
  );
};
