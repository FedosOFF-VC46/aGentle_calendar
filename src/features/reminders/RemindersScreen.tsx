import { useEffect, useMemo, useRef, useState } from 'react';
import type { AppState, MedicationDose } from '../../types/domain';

const reminderIntervals = [5, 10, 15, 20, 30, 45, 60, 90, 120];

const getDoseTimestamp = (dose: MedicationDose) => new Date(`${dose.date}T${dose.currentTime}:00`).getTime();

const formatDelayLabel = (dose: MedicationDose) => {
  const dueAt = getDoseTimestamp(dose);
  if (Number.isNaN(dueAt)) return 'Время приема уже наступило';

  const diffMinutes = Math.max(Math.floor((Date.now() - dueAt) / 60_000), 0);
  if (diffMinutes < 1) return 'Нужно принять сейчас';
  if (diffMinutes < 60) return `Просрочено на ${diffMinutes} мин`;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (!minutes) return `Просрочено на ${hours} ч`;
  return `Просрочено на ${hours} ч ${minutes} мин`;
};

export const RemindersScreen = ({
  state,
  patch,
  isSupported,
  permission,
  onEnableNotifications,
  onMarkDoseDone,
  onTestReminder
}: {
  state: AppState;
  patch: (updater: (state: AppState) => AppState) => void;
  isSupported: boolean;
  permission: NotificationPermission;
  onEnableNotifications: () => Promise<void>;
  onMarkDoseDone: (doseId: string) => void;
  onTestReminder: (title: string) => Promise<boolean>;
}) => {
  const [testTitle, setTestTitle] = useState('Тестовое напоминание');
  const [testDelaySeconds, setTestDelaySeconds] = useState('10');
  const [testStatus, setTestStatus] = useState('');
  const timeoutRef = useRef<number | null>(null);

  const medicationsById = useMemo(
    () => new Map(state.treatmentPlan?.medications.map((medication) => [medication.id, medication])),
    [state.treatmentPlan]
  );

  const activeReminders = useMemo(
    () =>
      (state.treatmentPlan?.doses ?? [])
        .filter((dose) => (dose.status === 'scheduled' || dose.status === 'postponed') && getDoseTimestamp(dose) <= Date.now())
        .sort((a, b) => getDoseTimestamp(a) - getDoseTimestamp(b)),
    [state.treatmentPlan]
  );

  const browserStatusLabel =
    !isSupported
      ? 'На этом устройстве уведомления браузером не поддерживаются'
      : permission === 'granted'
        ? 'Разрешение браузера уже выдано'
        : permission === 'denied'
          ? 'Браузер сейчас блокирует уведомления для сайта'
          : 'Разрешение браузера еще не запрошено';

  useEffect(() => () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
  }, []);

  const scheduleTestReminder = () => {
    if (!isSupported) {
      setTestStatus('На этом устройстве тест недоступен: уведомления не поддерживаются.');
      return;
    }

    if (permission !== 'granted') {
      setTestStatus('Сначала разреши уведомления для сайта.');
      return;
    }

    const seconds = Number(testDelaySeconds);
    if (!Number.isFinite(seconds) || seconds < 1) {
      setTestStatus('Укажи задержку не меньше 1 секунды.');
      return;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    const title = testTitle.trim() || 'Тестовое напоминание';
    setTestStatus(`Тест запущен. Уведомление придет через ${seconds} сек.`);

    timeoutRef.current = window.setTimeout(async () => {
      const shown = await onTestReminder(title);
      setTestStatus(shown ? 'Тестовое уведомление отправлено.' : 'Не удалось показать уведомление.');
      timeoutRef.current = null;
    }, seconds * 1000);
  };

  return (
    <div>
      <h1 className="h1">Напоминания о приеме</h1>
      <p className="muted">Здесь можно включить повторные напоминания и быстро отметить, что препарат уже выпит.</p>

      <div className="card card-soft">
        <div className="settings-stack">
          <div className="setting-row">
            <div>
              <strong>Статус уведомлений</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>{browserStatusLabel}</p>
            </div>
            <button
              className="btn action-btn"
              type="button"
              onClick={onEnableNotifications}
              disabled={!isSupported || permission === 'granted'}
            >
              {permission === 'granted' ? 'Разрешено' : 'Разрешить'}
            </button>
          </div>

          <div className="setting-row">
            <div>
              <strong>Повторные напоминания</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>
                После времени приема приложение будет напоминать, пока препарат не отмечен как принятый.
              </p>
            </div>
            <button
              className={`btn action-btn ${state.settings.notificationsEnabled ? 'success' : 'secondary'}`}
              type="button"
              disabled={!isSupported || permission !== 'granted'}
              onClick={() =>
                patch((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    notificationsEnabled: !prev.settings.notificationsEnabled
                  }
                }))
              }
            >
              {state.settings.notificationsEnabled ? 'Выключить' : 'Включить'}
            </button>
          </div>

          <div>
            <label htmlFor="reminder-interval">Интервал повторов</label>
            <select
              id="reminder-interval"
              value={state.settings.medicationReminderIntervalMinutes}
              onChange={(event) =>
                patch((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    medicationReminderIntervalMinutes: Number(event.target.value)
                  }
                }))
              }
              disabled={!state.settings.notificationsEnabled}
            >
              {reminderIntervals.map((minutes) => (
                <option key={minutes} value={minutes}>
                  Каждые {minutes} мин
                </option>
              ))}
            </select>
          </div>

          <p className="muted" style={{ margin: 0 }}>
            На Android в установленном PWA это лучший доступный веб-вариант, но когда приложение полностью закрыто системой, браузер может задерживать локальные напоминания.
          </p>
        </div>
      </div>

      <div className="card card-soft">
        <div className="space">
          <strong>Активные напоминания</strong>
          <span className="badge">{activeReminders.length}</span>
        </div>

        {!activeReminders.length && (
          <p className="muted" style={{ marginBottom: 0 }}>
            Сейчас нет просроченных приемов. Как только время приема наступит, карточка появится здесь.
          </p>
        )}

        {activeReminders.map((dose) => {
          const medication = medicationsById.get(dose.medicationId);
          if (!medication) return null;

          return (
            <div className="reminder-item" key={dose.id}>
              <div className="reminder-item__content">
                <strong>{medication.name}</strong>
                <p className="muted" style={{ margin: '4px 0 0' }}>
                  {dose.date} в {dose.currentTime} • {formatDelayLabel(dose)}
                </p>
              </div>
              <button className="btn success action-btn" type="button" onClick={() => onMarkDoseDone(dose.id)}>
                Препарат выпит
              </button>
            </div>
          );
        })}
      </div>

      <div className="card card-soft">
        <strong>Тест уведомлений</strong>
        <p className="muted">
          Введи текст и через сколько секунд должно прийти уведомление. Это помогает проверить, что установленное приложение действительно показывает напоминания.
        </p>

        <div className="settings-stack">
          <div>
            <label htmlFor="test-reminder-title">Текст напоминания</label>
            <input
              id="test-reminder-title"
              className="input"
              value={testTitle}
              onChange={(event) => setTestTitle(event.target.value)}
              placeholder="Например: Пора выпить таблетку"
            />
          </div>

          <div>
            <label htmlFor="test-reminder-delay">Через сколько секунд</label>
            <input
              id="test-reminder-delay"
              className="input"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={testDelaySeconds}
              onChange={(event) => setTestDelaySeconds(event.target.value)}
            />
          </div>

          <button className="btn action-btn" type="button" onClick={scheduleTestReminder}>
            Протестировать
          </button>

          {!!testStatus && <p className="muted" style={{ margin: 0 }}>{testStatus}</p>}
        </div>
      </div>
    </div>
  );
};
