import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { BottomNav } from '../components/layout/BottomNav';
import { Splash } from '../components/common/Splash';
import { OnboardingScreen } from '../features/onboarding/OnboardingScreen';
import { TodayScreen } from '../features/home/TodayScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { MedicationsScreen } from '../features/medications/MedicationsScreen';
import { SymptomsScreen } from '../features/symptoms/SymptomsScreen';
import { CycleScreen } from '../features/cycle/CycleScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { AboutScreen } from '../features/about/AboutScreen';
import { DayDetailsModal } from '../features/day-details/DayDetailsModal';
import { useLocalStore } from '../hooks/useLocalStore';
import { useTreatmentPlan } from '../hooks/useTreatmentPlan';
import { useCycleTracker } from '../hooks/useCycleTracker';
import { useNotifications } from '../hooks/useNotifications';
import { useSymptoms } from '../hooks/useSymptoms';
import { registerSW } from '../pwa/registerSW';
import type { MoodLevel } from '../types/domain';

export type Screen = 'today' | 'calendar' | 'medications' | 'symptoms' | 'more';

export const App = () => {
  const [isSplash, setSplash] = useState(true);
  const [screen, setScreen] = useState<Screen>('today');
  const [moreTab, setMoreTab] = useState<'cycle' | 'settings' | 'about' | 'day'>('cycle');

  const { state, patch } = useLocalStore();
  const { requestPermission } = useNotifications();
  const { todayDoses, createPlan, updateDoseStatus } = useTreatmentPlan(state, patch);
  const { cycleDay, startPeriod, endPeriod, undoEndPeriod } = useCycleTracker(state, patch);
  const { todayEntry, saveEntry } = useSymptoms(state, patch);

  useEffect(() => {
    registerSW();
    const timer = setTimeout(() => setSplash(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const handleOnboardingStart = (startDate: string, prefill: boolean, profileName: 'Солнышко' | 'Любимая' | 'Котик') => {
    patch((prev) => ({
      ...prev,
      onboardingCompleted: true,
      settings: { ...prev.settings, profileName, disclaimerSeen: true },
      treatmentPlan: prefill ? createPlan(startDate) : initializeEmptyPlan(startDate)
    }));
  };

  const initializeEmptyPlan = (startDate: string) => ({ ...createPlan(startDate), doses: [] });

  const saveMood = (mood: MoodLevel) => {
    saveEntry({
      ...(todayEntry ?? {
        date: todayDate,
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
          cycleDay={cycleDay}
          todayDoses={todayDoses}
          updateDoseStatus={updateDoseStatus}
          onSaveMood={saveMood}
          mood={todayEntry?.mood}
        />
      )}
      {screen === 'calendar' && <CalendarScreen state={state} />}
      {screen === 'medications' && <MedicationsScreen state={state} />}
      {screen === 'symptoms' && <SymptomsScreen todayEntry={todayEntry} onSave={saveEntry} />}
      {screen === 'more' && (
        <>
          <div className="row" style={{ marginBottom: 10 }}>
            <button className="btn" onClick={() => setMoreTab('cycle')}>Цикл</button>
            <button className="btn" onClick={() => setMoreTab('settings')}>Настройки</button>
            <button className="btn" onClick={() => setMoreTab('about')}>О приложении</button>
            <button className="btn" onClick={() => setMoreTab('day')}>Детали дня</button>
          </div>
          {moreTab === 'cycle' && <CycleScreen entries={state.cycleEntries} onStart={startPeriod} onEnd={endPeriod} onUndoEnd={undoEndPeriod} cycleDay={cycleDay} />}
          {moreTab === 'settings' && <SettingsScreen state={state} patch={patch} />}
          {moreTab === 'about' && <AboutScreen />}
          {moreTab === 'day' && <DayDetailsModal date={todayDate} state={state} />}
        </>
      )}
      <BottomNav screen={screen} onChange={setScreen} />
    </div>
  );
};
