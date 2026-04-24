import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { BottomNav } from '../components/layout/BottomNav';
import { Splash } from '../components/common/Splash';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { TodayScreen } from '../features/home/TodayScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { MedicationsScreen } from '../features/medications/MedicationsScreen';
import { SymptomsScreen } from '../features/symptoms/SymptomsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { TreatmentSettingsScreen } from '../features/settings/TreatmentSettingsScreen';
import { AboutScreen } from '../features/about/AboutScreen';
import { DayDetailsModal } from '../features/day-details/DayDetailsModal';
import { RemindersScreen } from '../features/reminders/RemindersScreen';
import { useLocalStore } from '../hooks/useLocalStore';
import { useTreatmentPlan } from '../hooks/useTreatmentPlan';
import { useNotifications } from '../hooks/useNotifications';
import { useMedicationReminders } from '../hooks/useMedicationReminders';
import { useSymptoms } from '../hooks/useSymptoms';
import { registerSW } from '../pwa/registerSW';
import type { MoodLevel } from '../types/domain';

export type Screen = 'today' | 'calendar' | 'medications' | 'symptoms' | 'more';

export const App = () => {
  const [isSplash, setSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>('today');
  const [moreTab, setMoreTab] = useState<'settings' | 'reminders' | 'treatment' | 'about' | 'day'>('settings');

  const { state, patch } = useLocalStore();
  const { isSupported, permission, requestPermission, notify } = useNotifications();
  const { createPlan, updateDoseStatus, updateMedications } = useTreatmentPlan(state, patch);
  const { todayEntry, saveEntry } = useSymptoms(state, patch);

  useMedicationReminders({ state, isSupported, permission, notify });

  useEffect(() => {
    registerSW();
    const timer = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const handleOnboardingStart = (prefill: boolean, profileName: 'Солнышко' | 'Любимая' | 'Котик') => {
    const startDate = todayDate;
    patch((prev) => ({
      ...prev,
      onboardingCompleted: true,
      settings: { ...prev.settings, profileName, disclaimerSeen: true },
      treatmentPlan: prefill ? createPlan(startDate) : initializeEmptyPlan(startDate)
    }));
  };

  const initializeEmptyPlan = (startDate: string) => ({ ...createPlan(startDate), doses: [] });

  const saveMood = (date: string, mood: MoodLevel) => {
    const currentEntry = state.symptomsByDate[date];
    saveEntry({
      ...(currentEntry ?? {
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
      }),
      mood
    });
  };

  if (isSplash) return <Splash />;
  if (!state.onboardingCompleted) {
    return (
      <OnboardingScreen
        onStart={handleOnboardingStart}
        onEnableNotifications={async () => {
          const permission = await requestPermission();
          patch((prev) => ({ ...prev, settings: { ...prev.settings, notificationsEnabled: permission === 'granted' } }));
        }}
      />
    );
  }

  return (
    <div className="app-shell">
      {screen === 'today' && (
        <TodayScreen
          state={state}
          updateDoseStatus={updateDoseStatus}
          onSaveMood={saveMood}
        />
      )}
      {screen === 'calendar' && <CalendarScreen state={state} patch={patch} updateDoseStatus={updateDoseStatus} />}
      {screen === 'medications' && <MedicationsScreen state={state} />}
      {screen === 'symptoms' && <SymptomsScreen todayEntry={todayEntry} onSave={saveEntry} />}
      {screen === 'more' && (
        <div>
          <h1 className="h1">Еще</h1>
          <p className="muted">Спокойные настройки и служебные разделы. Отметки цикла теперь живут прямо в календаре.</p>
          <div className="tab-row" style={{ marginBottom: 12 }}>
            <button className={`btn chip-btn ${moreTab === 'settings' ? 'active' : 'ghost'}`} onClick={() => setMoreTab('settings')}>Настройки</button>
            <button className={`btn chip-btn ${moreTab === 'reminders' ? 'active' : 'ghost'}`} onClick={() => setMoreTab('reminders')}>Напоминания</button>
            <button className={`btn chip-btn ${moreTab === 'treatment' ? 'active' : 'ghost'}`} onClick={() => setMoreTab('treatment')}>Схема</button>
            <button className={`btn chip-btn ${moreTab === 'day' ? 'active' : 'ghost'}`} onClick={() => setMoreTab('day')}>Сегодня</button>
            <button className={`btn chip-btn ${moreTab === 'about' ? 'active' : 'ghost'}`} onClick={() => setMoreTab('about')}>О приложении</button>
          </div>
          {moreTab === 'settings' && (
            <SettingsScreen
              state={state}
              patch={patch}
              onEnableNotifications={async () => {
                const permission = await requestPermission();
                patch((prev) => ({ ...prev, settings: { ...prev.settings, notificationsEnabled: permission === 'granted' } }));
              }}
            />
          )}
          {moreTab === 'reminders' && (
            <RemindersScreen
              state={state}
              patch={patch}
              isSupported={isSupported}
              permission={permission}
              onEnableNotifications={async () => {
                const nextPermission = await requestPermission();
                patch((prev) => ({
                  ...prev,
                  settings: {
                    ...prev.settings,
                    notificationsEnabled: nextPermission === 'granted'
                  }
                }));
              }}
              onMarkDoseDone={(doseId) => updateDoseStatus(doseId, 'done')}
              onTestReminder={(title) =>
                notify(title, {
                  body: 'Тестовое уведомление из приложения aGentle Calendar.',
                  tag: 'manual-test-reminder',
                  requireInteraction: true
                })
              }
            />
          )}
          {moreTab === 'treatment' && state.treatmentPlan && <TreatmentSettingsScreen medications={state.treatmentPlan.medications} onSave={updateMedications} />}
          {moreTab === 'about' && <AboutScreen />}
          {moreTab === 'day' && <DayDetailsModal date={todayDate} state={state} />}
        </div>
      )}
      <BottomNav screen={screen} onChange={setScreen} />
    </div>
  );
};
