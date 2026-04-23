import { useEffect, useMemo, useState } from 'react';
import {
  addMonths,
  differenceInCalendarDays,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths
} from 'date-fns';
import { createId } from '../../lib/ids';
import { dayShift, fromISODate, toISODate } from '../../lib/date';
import type { IntakeKind, Medication, MedicationScheduleMode } from '../../types/domain';

interface Props {
  medications: Medication[];
  onSave: (medications: Medication[]) => void;
}

interface ManualPickerState {
  medicationId: string;
  draftDates: string[];
  monthCursor: string;
}

const intakeKinds: IntakeKind[] = ['tablet', 'capsule', 'suppository', 'vitamin'];
const foodModes: Array<Medication['withFood']> = ['before', 'during', 'after', 'any'];
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const monthLabels = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
const todayIso = new Date().toISOString().slice(0, 10);

const intakeKindLabels: Record<IntakeKind, string> = {
  tablet: 'Таблетка',
  capsule: 'Капсула',
  suppository: 'Свеча',
  vitamin: 'Витамины'
};
const foodModeLabels: Record<Medication['withFood'], string> = {
  before: 'До еды',
  during: 'Во время еды',
  after: 'После еды',
  any: 'Не важно'
};

const uniqueSorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b));

const deriveEndDate = (startDate: string, durationDays: number) => dayShift(startDate, Math.max(durationDays, 1) - 1);
const deriveDuration = (startDate: string, endDate: string) =>
  Math.max(differenceInCalendarDays(fromISODate(endDate), fromISODate(startDate)) + 1, 1);

const getMonthGrid = (monthCursor: string) => {
  const monthDate = parseISO(`${monthCursor}T00:00:00`);
  const first = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
  const days: Date[] = [];

  for (let cursor = first; cursor <= last; cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1)) {
    days.push(cursor);
  }

  return days;
};

const formatManualHint = (dates: string[]) => {
  if (!dates.length) return 'Даты пока не выбраны';
  if (dates.length === 1) return `1 дата: ${format(fromISODate(dates[0]), 'dd.MM')}`;
  return `${dates.length} дат: ${format(fromISODate(dates[0]), 'dd.MM')} - ${format(fromISODate(dates[dates.length - 1]), 'dd.MM')}`;
};

const getManualDatesFromLegacy = (medication: Medication, startDate: string) =>
  medication.manualDates?.length
    ? uniqueSorted(medication.manualDates)
    : uniqueSorted((medication.specificDays ?? []).map((day) => dayShift(startDate, day - 1)));

const normalizeMedication = (medication: Medication): Medication => {
  const startDate = medication.startDate ?? todayIso;
  const defaultTimes = medication.defaultTimes.length ? medication.defaultTimes : ['09:00'];
  const manualDates = getManualDatesFromLegacy(medication, startDate);
  const scheduleMode: MedicationScheduleMode = medication.scheduleMode ?? (manualDates.length ? 'manual' : 'continuous');
  const baseDuration = Math.max(medication.durationDays ?? 1, 1);
  const endDate = medication.endDate ?? deriveEndDate(startDate, baseDuration);
  const durationDays = deriveDuration(startDate, endDate);

  return {
    ...medication,
    startDate,
    endDate: scheduleMode === 'continuous' ? endDate : undefined,
    durationDays,
    defaultTimes,
    scheduleMode,
    manualDates,
    specificDays: undefined
  };
};

const summarizeMedication = (medication: Medication) => {
  const times = medication.defaultTimes.join(', ');
  const schedule =
    medication.scheduleMode === 'manual'
      ? formatManualHint(medication.manualDates ?? [])
      : `${format(fromISODate(medication.startDate ?? todayIso), 'dd.MM')} - ${format(fromISODate(medication.endDate ?? medication.startDate ?? todayIso), 'dd.MM')}`;

  return `${times} · ${schedule}`;
};

export const TreatmentSettingsScreen = ({ medications, onSave }: Props) => {
  const [drafts, setDrafts] = useState<Medication[]>(() => medications.map(normalizeMedication));
  const [newMedicationName, setNewMedicationName] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<IntakeKind | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [manualPicker, setManualPicker] = useState<ManualPickerState | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setDrafts(medications.map(normalizeMedication));
  }, [medications]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = (message: string) => setToast(message);

  const totalDosesHint = useMemo(
    () =>
      drafts.reduce((total, medication) => {
        const days = medication.scheduleMode === 'manual' ? medication.manualDates?.length ?? 0 : medication.durationDays ?? 1;
        return total + days * Math.max(medication.defaultTimes.length, 1);
      }, 0),
    [drafts]
  );

  const filteredDrafts = useMemo(() => {
    const searchLower = search.trim().toLowerCase();
    return drafts.filter((medication) => {
      const matchesSearch = !searchLower || medication.name.toLowerCase().includes(searchLower);
      const matchesType = typeFilter === 'all' || medication.intakeKind === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [drafts, search, typeFilter]);

  const update = (id: string, updater: (medication: Medication) => Medication) => {
    setDrafts((prev) => prev.map((medication) => (medication.id === id ? normalizeMedication(updater(medication)) : medication)));
  };

  const addMedication = () => {
    const cleanName = newMedicationName.trim();
    if (!cleanName) return;
    const nextMedication = normalizeMedication({
      id: createId('med'),
      name: cleanName,
      dosage: '1 доза',
      quantity: '1 прием',
      intakeKind: 'tablet',
      withFood: 'any',
      notes: ['Добавлено вручную'],
      defaultTimes: ['09:00'],
      durationDays: 7,
      startDate: todayIso,
      scheduleMode: 'continuous'
    });
    setDrafts((prev) => [...prev, nextMedication]);
    setExpandedIds((prev) => new Set(prev).add(nextMedication.id));
    setNewMedicationName('');
    showToast('Препарат добавлен');
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeMedication = (id: string) => {
    setDrafts((prev) => prev.filter((item) => item.id !== id));
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    showToast('Препарат удален');
  };

  const setContinuousMode = (id: string, enabled: boolean) => {
    const medication = drafts.find((item) => item.id === id);
    if (!medication) return;

    if (enabled) {
      update(id, (item) => ({
        ...item,
        scheduleMode: 'continuous',
        startDate: item.startDate ?? todayIso,
        endDate: item.endDate ?? deriveEndDate(item.startDate ?? todayIso, item.durationDays ?? 1)
      }));
      showToast('Включен непрерывный прием');
      return;
    }

    update(id, (item) => ({
      ...item,
      scheduleMode: 'manual',
      manualDates: item.manualDates?.length ? item.manualDates : [item.startDate ?? todayIso]
    }));
    setManualPicker({
      medicationId: id,
      draftDates: medication.manualDates?.length ? [...medication.manualDates] : [medication.startDate ?? todayIso],
      monthCursor: (medication.manualDates?.[0] ?? medication.startDate ?? todayIso).slice(0, 7)
    });
  };

  const addTime = (id: string) => {
    update(id, (item) => ({ ...item, defaultTimes: [...item.defaultTimes, '12:00'] }));
    showToast('Время приема добавлено');
  };

  const removeTime = (id: string, index: number) => {
    update(id, (item) => ({
      ...item,
      defaultTimes: item.defaultTimes.length === 1 ? item.defaultTimes : item.defaultTimes.filter((_, timeIndex) => timeIndex !== index)
    }));
    showToast('Время приема удалено');
  };

  const updateTime = (id: string, index: number, value: string) => {
    update(id, (item) => ({
      ...item,
      defaultTimes: item.defaultTimes.map((time, timeIndex) => (timeIndex === index ? value : time))
    }));
  };

  const openManualPicker = (medication: Medication) => {
    setManualPicker({
      medicationId: medication.id,
      draftDates: [...(medication.manualDates ?? [])],
      monthCursor: (medication.manualDates?.[0] ?? medication.startDate ?? todayIso).slice(0, 7)
    });
  };

  const toggleManualDate = (date: string) => {
    setManualPicker((prev) => {
      if (!prev) return prev;
      const draftDates = prev.draftDates.includes(date) ? prev.draftDates.filter((item) => item !== date) : [...prev.draftDates, date];
      return { ...prev, draftDates: uniqueSorted(draftDates) };
    });
  };

  const saveManualDates = () => {
    if (!manualPicker?.draftDates.length) return;
    update(manualPicker.medicationId, (item) => ({
      ...item,
      scheduleMode: 'manual',
      manualDates: manualPicker.draftDates
    }));
    setManualPicker(null);
    showToast('Даты приема сохранены');
  };

  const saveDrafts = () => {
    onSave(
      drafts.map((medication) => ({
        ...medication,
        manualDates: medication.scheduleMode === 'manual' ? uniqueSorted(medication.manualDates ?? []) : undefined,
        endDate: medication.scheduleMode === 'continuous' ? medication.endDate : undefined,
        durationDays:
          medication.scheduleMode === 'continuous'
            ? deriveDuration(medication.startDate ?? todayIso, medication.endDate ?? deriveEndDate(medication.startDate ?? todayIso, medication.durationDays ?? 1))
            : undefined,
        specificDays: undefined
      }))
    );
    showToast('Сохранено!');
  };

  const activePickerMedication = manualPicker ? drafts.find((item) => item.id === manualPicker.medicationId) : null;
  const monthGrid = manualPicker ? getMonthGrid(`${manualPicker.monthCursor}-01`) : [];

  return (
    <div>
      <h1 className="h1">Конструктор схемы лечения</h1>
      <p className="muted">Сделали карточки спокойнее: отдельно настраиваются время, непрерывный курс и ручные даты приема. После сохранения график пересчитается автоматически.</p>

      <div className="card card-soft">
        <div className="space">
          <strong>Планировщик</strong>
          <span className="badge">~ {totalDosesHint} приемов</span>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <input className="input" value={newMedicationName} placeholder="Новый препарат" onChange={(event) => setNewMedicationName(event.target.value)} />
          <button className="btn action-btn" onClick={addMedication}>Добавить</button>
        </div>
        <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 180 }} value={search} placeholder="Поиск по названию" onChange={(event) => setSearch(event.target.value)} />
          <select value={typeFilter} style={{ flex: 1, minWidth: 160 }} onChange={(event) => setTypeFilter(event.target.value as IntakeKind | 'all')}>
            <option value="all">Все типы</option>
            {intakeKinds.map((kind) => <option key={kind} value={kind}>{intakeKindLabels[kind]}</option>)}
          </select>
        </div>
      </div>

      {!filteredDrafts.length && <div className="card card-soft"><p className="muted" style={{ margin: 0 }}>По этому запросу ничего не найдено.</p></div>}

      {filteredDrafts.map((medication) => (
        <details key={medication.id} className="card details-card treatment-card" open={expandedIds.has(medication.id)}>
          <summary className="details-summary" onClick={(event) => {
            event.preventDefault();
            toggleExpanded(medication.id);
          }}>
            <div>
              <strong>{medication.name}</strong>
              <p className="muted" style={{ margin: '4px 0 0' }}>{summarizeMedication(medication)} · {intakeKindLabels[medication.intakeKind]}</p>
            </div>
            <div className="details-summary-actions">
              <button className="btn ghost action-btn" type="button" onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                removeMedication(medication.id);
              }}>Удалить</button>
              <span className={`calendar-accordion-arrow ${expandedIds.has(medication.id) ? 'open' : ''}`}>⌄</span>
            </div>
          </summary>
          {expandedIds.has(medication.id) && (
            <>
              <label>Название</label>
              <input className="input" value={medication.name} onChange={(event) => update(medication.id, (item) => ({ ...item, name: event.target.value }))} />

              <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label>Дозировка</label>
                  <input className="input" value={medication.dosage} onChange={(event) => update(medication.id, (item) => ({ ...item, dosage: event.target.value }))} />
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label>Количество</label>
                  <input className="input" value={medication.quantity} onChange={(event) => update(medication.id, (item) => ({ ...item, quantity: event.target.value }))} />
                </div>
              </div>

              <div className="row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label>Тип приема</label>
                  <select value={medication.intakeKind} onChange={(event) => update(medication.id, (item) => ({ ...item, intakeKind: event.target.value as IntakeKind }))}>
                    {intakeKinds.map((kind) => <option key={kind} value={kind}>{intakeKindLabels[kind]}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label>Относительно еды</label>
                  <select value={medication.withFood} onChange={(event) => update(medication.id, (item) => ({ ...item, withFood: event.target.value as Medication['withFood'] }))}>
                    {foodModes.map((mode) => <option key={mode} value={mode}>{foodModeLabels[mode]}</option>)}
                  </select>
                </div>
              </div>

              <div className="treatment-inline-head">
                <div>
                  <label style={{ marginBottom: 4 }}>Время приема</label>
                  <p className="muted treatment-inline-hint">Добавляй отдельные времена на день через плюс.</p>
                </div>
                <button type="button" className="btn ghost chip-btn" onClick={() => addTime(medication.id)}>+ Прием</button>
              </div>
              <div className="time-pill-list">
                {medication.defaultTimes.map((time, index) => (
                  <div className="time-pill" key={`${medication.id}-${index}`}>
                    <input className="time-input" type="time" value={time} onChange={(event) => updateTime(medication.id, index, event.target.value)} />
                    <button
                      type="button"
                      className="time-pill-remove"
                      onClick={() => removeTime(medication.id, index)}
                      disabled={medication.defaultTimes.length === 1}
                      aria-label="Удалить время приема"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="schedule-panel">
                <div className="space">
                  <div>
                    <label style={{ marginBottom: 4 }}>Непрерывный прием</label>
                    <p className="muted treatment-inline-hint">
                      {medication.scheduleMode === 'continuous'
                        ? 'Курс идет подряд от даты старта до даты окончания.'
                        : 'Даты приема выбираются вручную через календарь.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`toggle-switch ${medication.scheduleMode === 'continuous' ? 'active' : ''}`}
                    aria-pressed={medication.scheduleMode === 'continuous'}
                    onClick={() => setContinuousMode(medication.id, medication.scheduleMode !== 'continuous')}
                  >
                    <span className="toggle-switch__thumb" />
                  </button>
                </div>

                {medication.scheduleMode === 'continuous' ? (
                  <>
                    <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label>Дата старта</label>
                        <input
                          className="input"
                          type="date"
                          value={medication.startDate ?? todayIso}
                          onChange={(event) => update(medication.id, (item) => {
                            const nextStartDate = event.target.value;
                            return {
                              ...item,
                              startDate: nextStartDate,
                              endDate: deriveEndDate(nextStartDate, item.durationDays ?? 1)
                            };
                          })}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <label>Дата окончания</label>
                        <input
                          className="input"
                          type="date"
                          value={medication.endDate ?? deriveEndDate(medication.startDate ?? todayIso, medication.durationDays ?? 1)}
                          onChange={(event) => update(medication.id, (item) => {
                            const nextEndDate = event.target.value;
                            const fixedEndDate = nextEndDate < (item.startDate ?? todayIso) ? item.startDate ?? todayIso : nextEndDate;
                            return {
                              ...item,
                              endDate: fixedEndDate,
                              durationDays: deriveDuration(item.startDate ?? todayIso, fixedEndDate)
                            };
                          })}
                        />
                      </div>
                    </div>

                    <div style={{ marginTop: 8, maxWidth: 180 }}>
                      <label>Длительность (дней)</label>
                      <input
                        className="input"
                        type="number"
                        min={1}
                        value={medication.durationDays ?? 1}
                        onChange={(event) => update(medication.id, (item) => {
                          const durationDays = Math.max(Number(event.target.value) || 1, 1);
                          return {
                            ...item,
                            durationDays,
                            endDate: deriveEndDate(item.startDate ?? todayIso, durationDays)
                          };
                        })}
                      />
                    </div>
                  </>
                ) : (
                  <div className="manual-dates-panel">
                    <div>
                      <strong>Выберите даты вручную</strong>
                      <p className="muted" style={{ margin: '4px 0 0' }}>{formatManualHint(medication.manualDates ?? [])}</p>
                    </div>
                    <button type="button" className="btn secondary action-btn" onClick={() => openManualPicker(medication)}>
                      Открыть календарь
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </details>
      ))}

      <button className="btn success action-btn" onClick={saveDrafts}>Сохранить и пересчитать схему</button>

      {manualPicker && activePickerMedication && (
        <div className="calendar-modal-backdrop" role="presentation" onClick={() => setManualPicker(null)}>
          <div className="calendar-modal treatment-modal" role="dialog" aria-modal="true" aria-labelledby="manual-dates-title" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-modal-head">
              <div>
                <p className="calendar-modal-kicker">Ручной режим</p>
                <h2 id="manual-dates-title" className="calendar-modal-title">Выберите даты приема вручную</h2>
              </div>
              <button type="button" className="calendar-close" onClick={() => setManualPicker(null)} aria-label="Закрыть">×</button>
            </div>

            <div className="manual-picker-card">
              <div className="space" style={{ marginBottom: 8 }}>
                <button type="button" className="btn ghost chip-btn" onClick={() => setManualPicker((prev) => prev ? ({ ...prev, monthCursor: format(subMonths(parseISO(`${prev.monthCursor}-01T00:00:00`), 1), 'yyyy-MM') }) : prev)}>‹</button>
                <strong>{`${monthLabels[parseISO(`${manualPicker.monthCursor}-01T00:00:00`).getMonth()]} ${parseISO(`${manualPicker.monthCursor}-01T00:00:00`).getFullYear()}`}</strong>
                <button type="button" className="btn ghost chip-btn" onClick={() => setManualPicker((prev) => prev ? ({ ...prev, monthCursor: format(addMonths(parseISO(`${prev.monthCursor}-01T00:00:00`), 1), 'yyyy-MM') }) : prev)}>›</button>
              </div>
              <p className="muted" style={{ marginTop: 0 }}>Отмеченные даты сохранятся только для {activePickerMedication.name}. Можно выбрать любое количество дней.</p>
              <div className="manual-calendar-weekdays">
                {weekdays.map((day) => <span key={day}>{day}</span>)}
              </div>
              <div className="manual-calendar-grid">
                {monthGrid.map((date) => {
                  const isoDate = toISODate(date);
                  const selected = manualPicker.draftDates.includes(isoDate);
                  return (
                    <button
                      type="button"
                      key={isoDate}
                      className={`manual-calendar-day ${selected ? 'active' : ''} ${!isSameMonth(date, parseISO(`${manualPicker.monthCursor}-01T00:00:00`)) ? 'outside' : ''}`}
                      onClick={() => toggleManualDate(isoDate)}
                    >
                      {format(date, 'd')}
                    </button>
                  );
                })}
              </div>
              <div className="manual-picker-footer">
                <p className="muted" style={{ margin: 0 }}>{formatManualHint(manualPicker.draftDates)}</p>
                <button type="button" className="btn success action-btn" onClick={saveManualDates} disabled={!manualPicker.draftDates.length}>
                  Сохранить даты
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast-stack" aria-live="polite">
          <div className="toast-pill">{toast}</div>
        </div>
      )}
    </div>
  );
};
