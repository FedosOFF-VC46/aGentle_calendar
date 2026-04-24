import { exportBackup, importBackup, resetState } from '../../lib/storage';
import type { AppState } from '../../types/domain';
import { Disclaimer } from '../../components/common/Disclaimer';

export const SettingsScreen = ({
  state,
  patch,
  onEnableNotifications
}: {
  state: AppState;
  patch: (updater: (s: AppState) => AppState) => void;
  onEnableNotifications: () => Promise<void>;
}) => {
  const onExport = () => {
    const blob = new Blob([JSON.stringify(exportBackup(state), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gentle-calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (file: File) => {
    const text = await file.text();
    patch(() => importBackup(text));
  };

  return (
    <div>
      <h1 className="h1">Настройки и данные</h1>
      <Disclaimer />
      <div className="card card-soft">
        <label>Название приложения</label>
        <select value={state.settings.appName} onChange={(event) => patch((prev) => ({ ...prev, settings: { ...prev.settings, appName: event.target.value as AppState['settings']['appName'] } }))}>
          <option>Нежный Календарик</option>
          <option>Забота рядом</option>
          <option>Тихий Ритм</option>
          <option>Лепесток</option>
        </select>
        <label>Обращение</label>
        <select value={state.settings.profileName} onChange={(event) => patch((prev) => ({ ...prev, settings: { ...prev.settings, profileName: event.target.value as AppState['settings']['profileName'] } }))}>
          <option>Солнышко</option>
          <option>Любимая</option>
          <option>Котик</option>
        </select>
        <div className="setting-row" style={{ marginTop: 12 }}>
          <div>
            <strong>Напоминания о приеме</strong>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Для включения и настройки повторов открой вкладку "Напоминания" в разделе "Еще".
            </p>
          </div>
          <button className="btn action-btn" onClick={onEnableNotifications}>
            Разрешить
          </button>
        </div>
        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <button className="btn action-btn" onClick={onExport}>Экспорт JSON</button>
          <label className="btn secondary action-btn" htmlFor="import-json">Импорт JSON</label>
          <input id="import-json" type="file" accept="application/json" style={{ display: 'none' }} onChange={(event) => event.target.files?.[0] && onImport(event.target.files[0])} />
        </div>
        <button className="btn warn action-btn" style={{ marginTop: 10 }} onClick={() => patch(() => resetState())}>Сброс данных</button>
        <p className="muted">Все данные хранятся только на этом устройстве.</p>
      </div>
    </div>
  );
};
