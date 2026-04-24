import { useEffect, useMemo, useRef } from 'react';
import type { AppState, MedicationDose } from '../types/domain';

const REMINDER_LOG_KEY = 'gentle-calendar-reminder-log';

type ReminderLog = Record<string, string>;

const readReminderLog = (): ReminderLog => {
  try {
    const raw = localStorage.getItem(REMINDER_LOG_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ReminderLog;
  } catch {
    return {};
  }
};

const saveReminderLog = (log: ReminderLog) => {
  localStorage.setItem(REMINDER_LOG_KEY, JSON.stringify(log));
};

const getDoseTimestamp = (dose: MedicationDose) => new Date(`${dose.date}T${dose.currentTime}:00`).getTime();

export const useMedicationReminders = ({
  state,
  isSupported,
  permission,
  notify
}: {
  state: AppState;
  isSupported: boolean;
  permission: NotificationPermission;
  notify: (title: string, options?: { body?: string; tag?: string; requireInteraction?: boolean }) => Promise<boolean>;
}) => {
  const reminderLogRef = useRef<ReminderLog>(readReminderLog());

  const pendingDoses = useMemo(() => {
    const medicationsById = new Map(state.treatmentPlan?.medications.map((medication) => [medication.id, medication]));

    return (state.treatmentPlan?.doses ?? [])
      .filter((dose) => (dose.status === 'scheduled' || dose.status === 'postponed') && medicationsById.has(dose.medicationId))
      .map((dose) => ({ dose, medication: medicationsById.get(dose.medicationId)! }));
  }, [state.treatmentPlan]);

  useEffect(() => {
    const activeDoseIds = new Set(pendingDoses.map(({ dose }) => dose.id));
    const nextLog = Object.fromEntries(
      Object.entries(reminderLogRef.current).filter(([doseId]) => activeDoseIds.has(doseId))
    );

    if (Object.keys(nextLog).length !== Object.keys(reminderLogRef.current).length) {
      reminderLogRef.current = nextLog;
      saveReminderLog(nextLog);
    }
  }, [pendingDoses]);

  useEffect(() => {
    if (!isSupported || permission !== 'granted' || !state.settings.notificationsEnabled) return;

    let cancelled = false;

    const checkReminders = async () => {
      const intervalMs = Math.max(state.settings.medicationReminderIntervalMinutes, 1) * 60 * 1000;
      const now = Date.now();
      let didChangeLog = false;

      for (const { dose, medication } of pendingDoses) {
        const dueAt = getDoseTimestamp(dose);
        if (Number.isNaN(dueAt) || dueAt > now) continue;

        const lastNotifiedAt = reminderLogRef.current[dose.id] ? new Date(reminderLogRef.current[dose.id]).getTime() : 0;
        if (lastNotifiedAt && now - lastNotifiedAt < intervalMs) continue;

        const shown = await notify(`Пора принять: ${medication.name}`, {
          body: `Время ${dose.currentTime}. Буду напоминать каждые ${state.settings.medicationReminderIntervalMinutes} мин, пока не отметишь прием.`,
          tag: `dose-${dose.id}`,
          requireInteraction: true
        });

        if (!shown || cancelled) continue;

        reminderLogRef.current[dose.id] = new Date(now).toISOString();
        didChangeLog = true;
      }

      if (didChangeLog) {
        saveReminderLog(reminderLogRef.current);
      }
    };

    void checkReminders();
    const timerId = window.setInterval(() => {
      void checkReminders();
    }, 30_000);

    return () => {
      cancelled = true;
      window.clearInterval(timerId);
    };
  }, [
    isSupported,
    notify,
    pendingDoses,
    permission,
    state.settings.medicationReminderIntervalMinutes,
    state.settings.notificationsEnabled
  ]);
};
