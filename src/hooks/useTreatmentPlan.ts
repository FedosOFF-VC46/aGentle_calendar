import { useMemo } from 'react';
import { format } from 'date-fns';
import { buildInitialPlan, rebuildPlanDoses } from '../lib/treatmentEngine';
import type { AppState, IntakeStatus, Medication } from '../types/domain';

export const useTreatmentPlan = (state: AppState, patch: (updater: (s: AppState) => AppState) => void) => {
  const today = format(new Date(), 'yyyy-MM-dd');

  const todayDoses = useMemo(
    () => state.treatmentPlan?.doses.filter((dose) => dose.date === today).sort((a, b) => a.currentTime.localeCompare(b.currentTime)) ?? [],
    [state.treatmentPlan, today]
  );

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
                  currentTime: status === 'postponed' && time ? time : dose.currentTime
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

  return { todayDoses, createPlan, updateDoseStatus, updateMedications };
};