import { useState } from 'react';
import { Disclaimer } from '../../components/common/Disclaimer';

interface Props {
  onStart: (prefill: boolean, profileName: 'Солнышко' | 'Любимая' | 'Котик') => void;
  onEnableNotifications: () => Promise<void>;
}

export const OnboardingScreen = ({ onStart, onEnableNotifications }: Props) => {
  const [step, setStep] = useState(1);
  const [profileName, setProfileName] = useState<'Солнышко' | 'Любимая' | 'Котик'>('Любимая');

  return (
    <div className="onboard">
      <div className="card hero-card" style={{ width: '100%' }}>
        <div className="hero-card__glow" />
        <p className="eyebrow">Новый старт</p>
        <h1 className="hero-title">Нежный Календарик</h1>
        <p className="muted">Шаг {step} из 5 — заботливо, спокойно и без перегруза.</p>
        {step === 1 && <Disclaimer />}
        {step === 2 && (
          <>
            <h3 className="h2">Как тебя называть?</h3>
            <select value={profileName} onChange={(event) => setProfileName(event.target.value as typeof profileName)}>
              <option>Солнышко</option>
              <option>Любимая</option>
              <option>Котик</option>
            </select>
          </>
        )}
        {step === 3 && (
          <>
            <h3 className="h2">Про лекарства потом</h3>
            <p className="muted">Старт лечения теперь задается отдельно у каждого препарата прямо в схеме. Это удобнее, если лекарства начинаются в разные даты.</p>
          </>
        )}
        {step === 4 && (
          <>
            <h3 className="h2">Нежные уведомления</h3>
            <button className="btn action-btn" type="button" onClick={onEnableNotifications}>
              Включить уведомления
            </button>
          </>
        )}
        {step === 5 && (
          <div className="row">
            <button className="btn action-btn" onClick={() => onStart(true, profileName)}>
              Заполнить по моей схеме
            </button>
            <button className="btn secondary action-btn" onClick={() => onStart(false, profileName)}>
              Начать с пустого
            </button>
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          {step < 5 ? (
            <button className="btn action-btn" type="button" onClick={() => setStep((prev) => prev + 1)}>
              Далее
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
