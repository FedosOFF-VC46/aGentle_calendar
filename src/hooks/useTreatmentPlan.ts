import { buildInitialPlan, rebuildPlanDoses } from '../lib/treatmentEngine';
import type { AppState, IntakeStatus, Medication } from '../types/domain';

export const useTreatmentPlan = (_state: AppState, patch: (updater: (s: AppState) => AppState) => void) => {
  const createPlan = (startDate: string) => buildInitialPlan(startDate);

  const updateDoseStatus = (doseId: string, status: IntakeStatus, time?: string) => {
    patch((prev) => {
      if (!prev.treatmentPlan) return prev;
      return {
        ...prev,
        treatmentPlan: {
          ...prev.treatmentPlan,
          doses: prev.treatmentPlan.doses.map((dose) =>
            dose.id === doseId
              ? {
                  ...dose,
                  status,
                  currentTime:
                    status === 'postponed' && time
                      ? time
                      : status === 'scheduled'
                        ? time ?? dose.plannedTime
                        : dose.currentTime
                }
              : dose
          )
        }
      };
    });
  };

  const updateMedications = (medications: Medication[]) => {
    patch((prev) => {
      if (!prev.treatmentPlan) return prev;
      return {
        ...prev,
        treatmentPlan: rebuildPlanDoses({ ...prev.treatmentPlan, medications })
      };
    });
  };

  return { createPlan, updateDoseStatus, updateMedications };
};
