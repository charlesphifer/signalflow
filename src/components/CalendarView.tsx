import { useMemo } from 'react';
import type { CalendarEvent } from '../types';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const DAY_NAMES = [
  { full: 'Sun', short: 'S' },
  { full: 'Mon', short: 'M' },
  { full: 'Tue', short: 'T' },
  { full: 'Wed', short: 'W' },
  { full: 'Thu', short: 'T' },
  { full: 'Fri', short: 'F' },
  { full: 'Sat', short: 'S' },
];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Build a date key string YYYY-MM-DD from a Date object */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Check whether two dates fall in the same month+year */

/**
 * Build the calendar grid for the given month.
 * Returns an array of rows, each row is an array of 7 cells.
 * Each cell is { date: Date, isPadding: boolean }.
 */
function buildCalendarGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDay.getDay(); // 0=Sun

  const rows: { date: Date; isPadding: boolean }[][] = [];
  let row: { date: Date; isPadding: boolean }[] = [];

  // Padding cells for days before the 1st
  const prevMonth = new Date(year, month, 0);
  const daysInPrevMonth = prevMonth.getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const padDate = new Date(year, month - 1, daysInPrevMonth - i);
    row.push({ date: padDate, isPadding: true });
  }

  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    row.push({ date, isPadding: false });
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }

  // Padding cells for days after the last day
  if (row.length > 0) {
    let padDay = 1;
    while (row.length < 7) {
      const padDate = new Date(year, month + 1, padDay);
      row.push({ date: padDate, isPadding: true });
      padDay++;
    }
    rows.push(row);
  }

  return rows;
}

export default function CalendarView({ events }: CalendarViewProps) {
  const today = useMemo(() => new Date(), []);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const calendarRows = useMemo(
    () => buildCalendarGrid(currentYear, currentMonth),
    [currentYear, currentMonth],
  );

  // Build a lookup map: dateKey -> events for that day
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of events) {
      const existing = map.get(ev.date);
      if (existing) {
        existing.push(ev);
      } else {
        map.set(ev.date, [ev]);
      }
    }
    return map;
  }, [events]);

  // ── Event indicator colors ──
  const typeColors: Record<CalendarEvent['type'], { bg: string; border: string; text: string; cellBg: string; dot: string }> = {
    travel: {
      bg: 'bg-orange-950/40',
      border: 'border-orange-500/40',
      text: 'text-orange-400',
      cellBg: 'bg-orange-950/40',
      dot: 'bg-sunset-500',
    },
    site: {
      bg: 'bg-indigo-950/80',
      border: 'border-indigo-500/60',
      text: 'text-indigo-300',
      cellBg: 'bg-indigo-950/80',
      dot: 'bg-indigo-500',
    },
    golive: {
      bg: 'bg-emerald-950/40',
      border: 'border-emerald-500/50',
      text: 'text-emerald-400',
      cellBg: 'bg-emerald-950/40',
      dot: 'bg-emerald-500',
    },
  };

  /** Determine the single cell colour class based on event priority: go-live > site > travel */
  function getCellColors(dayEvents: CalendarEvent[]) {
    if (dayEvents.length === 0) {
      return { bg: 'bg-charcoal-900/40 border-charcoal-800/50', text: 'text-charcoal-400', badgeBg: '' };
    }
    const hasGoLive = dayEvents.some(e => e.type === 'golive');
    const hasSite = dayEvents.some(e => e.type === 'site');
    const hasTravel = dayEvents.some(e => e.type === 'travel');

    if (hasGoLive) {
      return {
        bg: 'bg-emerald-950/40 border-emerald-500/50',
        text: 'text-emerald-400',
        badgeBg: 'bg-emerald-950/40',
      };
    }
    if (hasSite) {
      return {
        bg: 'bg-indigo-950/80 border-indigo-500/60',
        text: 'text-indigo-300',
        badgeBg: 'bg-indigo-950/80',
      };
    }
    if (hasTravel) {
      return {
        bg: 'bg-orange-950/40 border-orange-500/40',
        text: 'text-orange-400',
        badgeBg: 'bg-orange-950/40',
      };
    }
    return { bg: 'bg-charcoal-900/40 border-charcoal-800/50', text: 'text-charcoal-400', badgeBg: '' };
  }

  /** Get type-specific colour for an event badge */

  return (
    <div className="flex-1 bg-charcoal-900 border border-charcoal-800 rounded-xl p-4 flex flex-col shadow-md overflow-hidden min-h-[500px]">
      {/* ── Header Row ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-charcoal-800 mb-4">
        <div>
          <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center space-x-2">
            {/* Inline SVG calendar icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-sunset-500 shrink-0"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>My Engineering Calendar (Outlook Sync)</span>
          </h2>
          <p className="text-xs text-charcoal-400">
            Showing blocked travel blocks, active site assessments, and go-live timelines
          </p>
        </div>

        {/* ── Legends ── */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs">
          <span className="flex items-center space-x-1.5 text-orange-400 bg-orange-950/40 px-2 py-0.5 border border-orange-800/30 rounded shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-sunset-500" />
            <span>Blocked Travel</span>
          </span>
          <span className="flex items-center space-x-1.5 text-indigo-300 bg-indigo-950/80 px-2 py-0.5 border border-indigo-800/50 rounded shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span>On-Site Surveys</span>
          </span>
          <span className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-950/50 px-2 py-0.5 border border-emerald-800/40 rounded shrink-0">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Go-Lives</span>
          </span>
        </div>
      </div>

      {/* ── Calendar Grid ── */}
      <div className="bg-charcoal-950/50 border border-charcoal-800/80 p-3 sm:p-4 rounded-xl flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Month / Year header */}
        <div className="text-center font-black text-white text-sm sm:text-base mb-4 tracking-wide uppercase">
          {/* Inline SVG calendar icon */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="inline-block mr-2 -mt-0.5 text-sunset-500"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {MONTH_NAMES[currentMonth]} {currentYear}
        </div>

        {/* Day-of-week header row */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-black tracking-wider uppercase text-charcoal-500 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d.full}>
              <span>{d.short}</span>
              <span className="hidden sm:inline">{d.full.slice(1)}</span>
            </div>
          ))}
        </div>

        {/* Calendar day cells */}
        <div className="grid grid-cols-7 gap-1.5 flex-1 min-h-[350px]">
          {calendarRows.flat().map((cell, idx) => {
            const dateKey = toDateKey(cell.date);
            const dayEvents = eventsByDate.get(dateKey) ?? [];
            const dayNum = cell.date.getDate();
            const colors = getCellColors(dayEvents);

            // Is this day today?
            const isToday = toDateKey(cell.date) === toDateKey(today);

            if (cell.isPadding) {
              return (
                <div
                  key={`pad-${idx}`}
                  className="bg-charcoal-900/10 border border-transparent rounded-lg p-1.5 text-[10px] text-charcoal-700"
                >
                  {dayNum}
                </div>
              );
            }

            // Check which event types are present on this day
            const uniqueTypes: CalendarEvent['type'][] = [];
            if (dayEvents.some(e => e.type === 'travel') && !uniqueTypes.includes('travel')) uniqueTypes.push('travel');
            if (dayEvents.some(e => e.type === 'site') && !uniqueTypes.includes('site')) uniqueTypes.push('site');
            if (dayEvents.some(e => e.type === 'golive') && !uniqueTypes.includes('golive')) uniqueTypes.push('golive');

            return (
              <div
                key={idx}
                className={`
                  border rounded-lg p-2 flex flex-col text-left justify-between min-h-[60px] relative
                  transition-colors group cursor-pointer hover:bg-charcoal-800/40
                  ${colors.bg} ${colors.text}
                  ${isToday ? 'ring-2 ring-sunset-500/60 ring-offset-1 ring-offset-charcoal-950/50' : ''}
                `}
              >
                {/* Day number */}
                <span className="text-xs font-black">{dayNum}</span>

                {/* Colored indicator dots (for days with no events, or in addition to badges) */}
                {dayEvents.length === 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {/* empty — no indicator if no events */}
                  </div>
                )}

                {/* Event badges */}
                <div className="space-y-1 mt-1">
                  {dayEvents.map((ev, eidx) => {
                    return (
                      <div
                        key={eidx}
                        className="text-[8px] leading-tight line-clamp-1 p-0.5 rounded font-sans truncate tracking-tight text-white/95"
                        style={{
                          backgroundColor:
                            ev.type === 'travel'
                              ? '#e66030'
                              : ev.type === 'site'
                                ? '#4d5382'
                                : '#10b981',
                          color: ev.type === 'travel' ? '#121217' : '#ffffff',
                        }}
                        title={ev.name}
                      >
                        {ev.name
                          .replace("Children's Research Hospital", '')
                          .replace('Memorial Hospital-', '')}
                      </div>
                    );
                  })}
                </div>

                {/* Colored dot indicators when events exist but no badges shown (alternative) */}
                {dayEvents.length > 0 && (
                  <div className="absolute top-1.5 right-1.5 flex gap-0.5">
                    {uniqueTypes.map((t) => (
                      <span
                        key={t}
                        className={`h-1.5 w-1.5 rounded-full ${typeColors[t].dot}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}