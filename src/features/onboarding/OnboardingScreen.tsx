import { useState } from 'react';
import { Disclaimer } from '../../components/common/Disclaimer';

interface Props {
  onStart: (startDate: string, prefill: boolean, profileName: 'Солнышко' | 'Любимая' | 'Котик') => void;
  onEnableNotifications: () => Promise<void>;
}

export const OnboardingScreen = ({ onStart, onEnableNotifications }: Props) => {
  const [step, setStep] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [profileName, setProfileName] = useState<'Солнышко' | 'Любимая' | 'Котик'>('Любимая');

  return (
    <div className="onboard">
      <div className="card" style={{ width: '100%' }}>
        <h1 className="h1">Нежный Календарик</h1>
        <p className="muted">Шаг {step} из 5 — заботливо и спокойно.</p>
        {step === 1 && <Disclaimer />}
        {step === 2 && (
          <>
            <h3 className="h2">Дата начала лечения</h3>
            <input className="input" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </>
        )}
        {step === 3 && (
          <>
            <h3 className="h2">Как тебя называть?</h3>
            <select value={profileName} onChange={(event) => setProfileName(event.target.value as typeof profileName)}>
              <option>Солнышко</option>
              <option>Любимая</option>
              <option>Котик</option>
            </select>
          </>
        )}
        {step === 4 && (
          <>
            <h3 className="h2">Нежные уведомления</h3>
            <button className="btn" type="button" onClick={onEnableNotifications}>
              Включить уведомления
            </button>
          </>
        )}
        {step === 5 && (
          <div className="row">
            <button className="btn" onClick={() => onStart(startDate, true, profileName)}>
              Заполнить по моей схеме
            </button>
            <button className="btn secondary" onClick={() => onStart(startDate, false, profileName)}>
              Начать с пустого
            </button>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          {step < 5 ? (
            <button className="btn" type="button" onClick={() => setStep((prev) => prev + 1)}>
              Далее
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
