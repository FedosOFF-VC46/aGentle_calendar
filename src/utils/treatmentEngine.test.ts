import { describe, expect, it } from 'vitest';
import { buildInitialPlan, applyPostMenstrualStage } from '../lib/treatmentEngine';

describe('treatmentEngine', () => {
  it('builds first 30 days with required meds', () => {
    const plan = buildInitialPlan('2026-01-10');
    const day1 = plan.doses.filter((dose) => dose.date === '2026-01-10').map((dose) => dose.medicationId);
    expect(day1).toContain('doxycycline');
    expect(day1).toContain('duphaston');
    expect(day1).toContain('tranexam');
    expect(day1).toContain('fluconazole');
    expect(day1).toContain('vitamin-d');
  });

  it('starts post-menstrual stage after period end', () => {
    const base = buildInitialPlan('2026-01-10');
    const next = applyPostMenstrualStage(base, '2026-01-20');
    const firstPost = next.doses.filter((dose) => dose.date === '2026-01-21').map((dose) => dose.medicationId);
    expect(firstPost).toContain('maxilac');
    expect(firstPost).toContain('clindacin');
  });
});
