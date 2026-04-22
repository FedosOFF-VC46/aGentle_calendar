import { useEffect, useMemo, useState, type CSSProperties, type ComponentType, type SVGProps } from 'react';
import { addMonths, eachDayOfInterval, endOfMonth, format, getDay, isSameMonth, startOfMonth, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getCurrentCycleDay } from '../../lib/calendarMeta';
import { createId } from '../../lib/ids';
import type { AppState, CalendarTag } from '../../types/domain';

type MarkerId = 'dose-pending' | 'dose-done' | 'symptoms' | 'note' | 'event' | 'task' | CalendarTag;

type MarkerMeta = {
  id: MarkerId;
  label: string;
  color: string;
  priority: number;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
};

const SparkIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2.2 9.2 6.8 13.8 8l-4.6 1.2L8 13.8l-1.2-4.6L2.2 8l4.6-1.2L8 2.2Z" />
  </svg>
);

const LeafIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M13 3.5c-4.8.1-8.8 2.4-9.6 7.7 3.2.4 6.9-.4 8.9-2.7C13.8 6.9 13.7 5 13 3.5Z" />
    <path d="M5.2 10.8c1.1-1.7 2.7-3 4.8-3.9" />
  </svg>
);

const HeartIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 13.1 3.4 8.7a2.8 2.8 0 0 1 4-3.9L8 5.4l.6-.6a2.8 2.8 0 1 1 4 3.9L8 13.1Z" />
  </svg>
);

const MoonIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M10.7 2.8a5.7 5.7 0 1 0 2.5 10.5A6.5 6.5 0 0 1 10.7 2.8Z" />
  </svg>
);

const PillIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2.5" y="5.2" width="11" height="5.6" rx="2.8" />
    <path d="M7.2 5.2v5.6" />
  </svg>
);

const CheckArcIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3.4 8.4 6.5 11l6.1-6.2" />
    <path d="M13.4 8A5.4 5.4 0 1 1 8 2.6" />
  </svg>
);

const PulseIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.2 8h2.4l1.3-2.3 2.2 5 1.8-3h3.9" />
  </svg>
);

const NoteIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 2.7h5l3 3V13a.8.8 0 0 1-.8.8H4.8A.8.8 0 0 1 4 13V2.7Z" />
    <path d="M9 2.7v3h3" />
  </svg>
);

const FlagIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M4 13.4V2.6" />
    <path d="m4 3.2 6-.7v5.1L4 8.3" />
  </svg>
);

const DropIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2.4c1.6 2.2 3.7 4.2 3.7 6.5A3.7 3.7 0 1 1 4.3 9c0-2.3 2.1-4.4 3.7-6.6Z" />
  </svg>
);

const KiteIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M8 2.4 12.8 8 8 13.6 3.2 8 8 2.4Z" />
    <path d="M8 13.6v1.3" />
  </svg>
);

const MARKER_META: MarkerMeta[] = [
  { id: 'dose-pending', label: 'Приемы', color: '#8fc8a8', priority: 1, Icon: PillIcon },
  { id: 'dose-done', label: 'Все приняты', color: '#66a88a', priority: 0, Icon: CheckArcIcon },
  { id: 'symptoms', label: 'Симптомы', color: '#c8b4f2', priority: 2, Icon: PulseIcon },
  { id: 'note', label: 'Заметка', color: '#f0c8a6', priority: 3, Icon: NoteIcon },
  { id: 'event', label: 'Событие', color: '#8ab6e0', priority: 4, Icon: FlagIcon },
  { id: 'task', label: 'Задача', color: '#f3d287', priority: 5, Icon: KiteIcon },
  { id: 'important', label: 'Важно', color: '#f2b5a7', priority: 6, Icon: SparkIcon },
  { id: 'self-care', label: 'Забота о себе', color: '#b8d6b1', priority: 7, Icon: LeafIcon },
  { id: 'intimacy', label: 'Интим', color: '#f5adc8', priority: 8, Icon: HeartIcon },
  { id: 'rest', label: 'Отдых', color: '#b9c8ec', priority: 9, Icon: MoonIcon },
  { id: 'period', label: 'Цикл', color: '#f1a0bc', priority: 10, Icon: DropIcon }
];

const TAG_OPTIONS = MARKER_META.filter((marker): marker is MarkerMeta & { id: CalendarTag } =>
  ['important', 'self-care', 'intimacy', 'rest', 'period'].includes(marker.id)
);

const markerMetaMap = new Map(MARKER_META.map((item) => [item.id, item]));

const getSummaryForDate = (state: AppState, date: string) => {
  const doses = state.treatmentPlan?.doses.filter((dose) => dose.date === date) ?? [];
  const tasks = state.treatmentPlan?.tasks.filter((task) => task.date === date) ?? [];
  const events = state.treatmentPlan?.customEvents.filter((event) => event.date === date) ?? [];
  const symptoms = state.symptomsByDate[date];
  const note = state.notesByDate[date];
  const tags = state.calendarTagsByDate[date]?.tags ?? [];
  const allDone = doses.length > 0 && doses.every((dose) => dose.status === 'done');

  const markers: MarkerId[] = [];
  if (allDone) markers.push('dose-done');
  else if (doses.length > 0) markers.push('dose-pending');
  if (symptoms) markers.push('symptoms');
  if (note) markers.push('note');
  if (events.length > 0) markers.push('event');
  if (tasks.length > 0) markers.push('task');
  markers.push(...tags);

  return {
    doses,
    tasks,
    events,
    symptoms,
    note,
    tags,
    markers: markers
      .map((id) => markerMetaMap.get(id))
      .filter((item): item is MarkerMeta => Boolean(item))
      .sort((a, b) => a.priority - b.priority)
  };
};

const MarkerBadge = ({
  marker,
  active = false
}: {
  marker: MarkerMeta;
  active?: boolean;
}) => {
  const Icon = marker.Icon;
  return (
    <span className={`marker-badge ${active ? 'active' : ''}`} style={{ '--marker-color': marker.color } as CSSProperties} title={marker.label}>
      <Icon className="marker-glyph" />
    </span>
  );
};

export const CalendarScreen = ({
  state,
  patch
}: {
  state: AppState;
  patch: (updater: (prev: AppState) => AppState) => void;
}) => {
  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [eventTitle, setEventTitle] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [isEditorOpen, setEditorOpen] = useState(false);

  const monthStart = startOfMonth(visibleMonth);
  const monthEnd = endOfMonth(visibleMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const leading = (getDay(monthStart) + 6) % 7;
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const todayDate = format(new Date(), 'yyyy-MM-dd');
  const cycleDay = useMemo(() => getCurrentCycleDay(state, todayDate), [state, todayDate]);

  const selectedSummary = useMemo(() => getSummaryForDate(state, selectedDate), [selectedDate, state]);

  useEffect(() => {
    setNoteDraft(state.notesByDate[selectedDate]?.text ?? '');
    setEventTitle('');
  }, [selectedDate, state.notesByDate]);

  useEffect(() => {
    if (!isEditorOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setEditorOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen]);

  const toggleTag = (tag: CalendarTag) => {
    patch((prev) => {
      const currentTags = prev.calendarTagsByDate[selectedDate]?.tags ?? [];
      const nextTags = currentTags.includes(tag) ? currentTags.filter((item) => item !== tag) : [...currentTags, tag];

      return {
        ...prev,
        calendarTagsByDate: nextTags.length
          ? {
              ...prev.calendarTagsByDate,
              [selectedDate]: { date: selectedDate, tags: nextTags }
            }
          : Object.fromEntries(Object.entries(prev.calendarTagsByDate).filter(([date]) => date !== selectedDate))
      };
    });
  };

  const saveNote = () => {
    const text = noteDraft.trim();
    patch((prev) => ({
      ...prev,
      notesByDate: text
        ? {
            ...prev.notesByDate,
            [selectedDate]: { date: selectedDate, text }
          }
        : Object.fromEntries(Object.entries(prev.notesByDate).filter(([date]) => date !== selectedDate))
    }));
  };

  const addEvent = () => {
    const title = eventTitle.trim();
    if (!title) return;

    patch((prev) => {
      if (!prev.treatmentPlan) return prev;
      return {
        ...prev,
        treatmentPlan: {
          ...prev.treatmentPlan,
          customEvents: [
            ...prev.treatmentPlan.customEvents,
            {
              id: createId('event'),
              date: selectedDate,
              title,
              type: 'custom',
              completed: false
            }
          ]
        }
      };
    });
    setEventTitle('');
  };

  const removeEvent = (eventId: string) => {
    patch((prev) => {
      if (!prev.treatmentPlan) return prev;
      return {
        ...prev,
        treatmentPlan: {
          ...prev.treatmentPlan,
          customEvents: prev.treatmentPlan.customEvents.filter((event) => event.id !== eventId)
        }
      };
    });
  };

  return (
    <div>
      <h1 className="h1">Календарь</h1>
      <div className="space" style={{ marginBottom: 8 }}>
        <button className="btn ghost" onClick={() => setVisibleMonth((prev) => subMonths(prev, 1))}>
          ← Месяц назад
        </button>
        <strong>{format(monthStart, 'LLLL yyyy', { locale: ru })}</strong>
        <button className="btn ghost" onClick={() => setVisibleMonth((prev) => addMonths(prev, 1))}>
          Месяц вперед →
        </button>
      </div>

      <div className="calendar-legend">
        {MARKER_META.map((marker) => (
          <div key={marker.id} className="legend-item">
            <MarkerBadge marker={marker} />
            {marker.label}
          </div>
        ))}
      </div>

      <div className="grid-calendar">
        {weekDays.map((item) => (
          <div key={item} className="weekday-cell">
            {item}
          </div>
        ))}
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const date = format(day, 'yyyy-MM-dd');
          const summary = getSummaryForDate(state, date);
          const inVisibleMonth = isSameMonth(day, monthStart);
          const visibleMarkers = summary.markers.slice(0, 3);
          const hiddenCount = Math.max(summary.markers.length - visibleMarkers.length, 0);

          return (
            <button
              type="button"
              key={date}
              className={`day-cell ${date === todayDate ? 'today' : ''} ${date === selectedDate ? 'selected' : ''}`}
              style={{ opacity: inVisibleMonth ? 1 : 0.42 }}
              onClick={() => setSelectedDate(date)}
            >
              <div className="day-number-row">
                <span>{format(day, 'd')}</span>
                {summary.markers.length > 0 && <span className="day-dot" />}
              </div>
              <div className="indicator-strip">
                {visibleMarkers.map((marker) => (
                  <MarkerBadge key={`${date}-${marker.id}`} marker={marker} active={date === selectedDate} />
                ))}
                {hiddenCount > 0 && <span className="marker-overflow">+{hiddenCount}</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="card calendar-summary-card" style={{ marginTop: 12 }}>
        <div className="space" style={{ alignItems: 'flex-start' }}>
          <div>
            <h2 className="h2">{format(new Date(selectedDate), 'd MMMM yyyy', { locale: ru })}</h2>
            <p className="muted" style={{ margin: 0 }}>
              Тапни по дню, чтобы открыть меню и быстро отметить событие, заметку или метку.
            </p>
          </div>
          <button type="button" className="btn ghost" onClick={() => setEditorOpen(true)}>
            Открыть
          </button>
        </div>

        <div className="calendar-overview-grid">
          <div className="overview-pill">
            <span className="muted">События</span>
            <strong>{selectedSummary.events.length}</strong>
          </div>
          <div className="overview-pill">
            <span className="muted">Приемы</span>
            <strong>{selectedSummary.doses.length}</strong>
          </div>
          <div className="overview-pill">
            <span className="muted">Самочувствие</span>
            <strong>{selectedSummary.symptoms ? 'есть' : 'нет'}</strong>
          </div>
          <div className="overview-pill">
            <span className="muted">Текущий цикл</span>
            <strong>{cycleDay ? `день ${cycleDay}` : 'не отмечен'}</strong>
          </div>
        </div>

        <div className="calendar-summary-markers">
          {selectedSummary.markers.length > 0 ? (
            selectedSummary.markers.map((marker) => (
              <span key={marker.id} className="summary-chip" style={{ '--marker-color': marker.color } as CSSProperties}>
                <marker.Icon className="marker-glyph" />
                {marker.label}
              </span>
            ))
          ) : (
            <span className="muted">На этот день пока ничего не отмечено.</span>
          )}
        </div>

        {(selectedSummary.events.length > 0 || selectedSummary.note) && (
          <div className="calendar-event-list">
            {selectedSummary.events.map((event) => (
              <div key={event.id} className="calendar-event-item">
                <span>{event.title}</span>
                <span className="muted">событие</span>
              </div>
            ))}
            {selectedSummary.note && (
              <div className="calendar-note-preview">
                <strong>Заметка</strong>
                <p>{selectedSummary.note.text}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditorOpen && (
        <div className="calendar-modal-backdrop" role="presentation" onClick={() => setEditorOpen(false)}>
          <div className="calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-editor-title" onClick={(event) => event.stopPropagation()}>
            <div className="calendar-modal-head">
              <div>
                <p className="calendar-modal-kicker">День</p>
                <h2 id="calendar-editor-title" className="calendar-modal-title">
                  {format(new Date(selectedDate), 'd MMM yyyy', { locale: ru })}
                </h2>
              </div>
              <button type="button" className="calendar-close" onClick={() => setEditorOpen(false)} aria-label="Закрыть">
                ×
              </button>
            </div>

            <div className="calendar-modal-section">
              <div className="calendar-modal-label">Метки</div>
              <div className="calendar-tag-row">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`tag-chip ${selectedSummary.tags.includes(tag.id) ? 'active' : ''}`}
                    style={{ '--tag-color': tag.color } as CSSProperties}
                    onClick={() => toggleTag(tag.id)}
                  >
                    <tag.Icon className="marker-glyph" />
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="calendar-modal-section">
              <label className="calendar-modal-label" htmlFor="event-title">
                Событие
              </label>
              <div className="row calendar-action-row">
                <input
                  id="event-title"
                  className="input"
                  value={eventTitle}
                  onChange={(event) => setEventTitle(event.target.value)}
                  placeholder="Например: визит к врачу"
                />
                <button type="button" className="btn success action-btn" onClick={addEvent}>
                  Добавить
                </button>
              </div>
              {selectedSummary.events.length > 0 && (
                <div className="calendar-event-list">
                  {selectedSummary.events.map((event) => (
                    <div key={event.id} className="calendar-event-item">
                      <span>{event.title}</span>
                      <button type="button" className="btn ghost action-btn" onClick={() => removeEvent(event.id)}>
                        Убрать
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="calendar-modal-section">
              <label className="calendar-modal-label" htmlFor="day-note">
                Заметка
              </label>
              <textarea
                id="day-note"
                rows={4}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Что важно запомнить в этот день"
              />
              <div className="row">
                <button type="button" className="btn action-btn" onClick={saveNote}>
                  Сохранить заметку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
