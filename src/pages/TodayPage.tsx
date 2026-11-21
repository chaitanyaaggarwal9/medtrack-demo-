import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import Disclaimer from '../components/Disclaimer.tsx';
import { mockMedicines } from '../mocks/medicines.ts';
import {
  buildTodayRows,
  formatLocalTime,
  localDayKey,
  msUntilNextLocalMidnight,
  remainingMessage,
  type DoseRow,
  type Medicine,
} from '../lib/doses.ts';

type TodayPageProps = {
  medicines?: readonly Medicine[];
};

/** Ticks belong to one local calendar day; a new day starts empty. */
type Ticks = {
  day: string;
  takenAt: ReadonlyMap<string, string>;
};

const EMPTY_TICKS: ReadonlyMap<string, string> = new Map();

const focusRing =
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700';

export default function TodayPage({
  medicines = mockMedicines,
}: TodayPageProps) {
  // "Today" is the user's own calendar day and resets at their midnight.
  const [today, setToday] = useState(() => localDayKey(new Date()));
  const [ticks, setTicks] = useState<Ticks>(() => ({
    day: today,
    takenAt: EMPTY_TICKS,
  }));
  const [announcement, setAnnouncement] = useState('');
  const pendingFocusId = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(
      () => setToday(localDayKey(new Date())),
      msUntilNextLocalMidnight(new Date()),
    );
    return () => clearTimeout(timer);
  }, [today]);

  // Move focus after a tick (to Undo) or an undo (back to the checkbox),
  // so keyboard users never lose their place.
  useEffect(() => {
    const id = pendingFocusId.current;
    if (id === null) return;
    pendingFocusId.current = null;
    document.getElementById(id)?.focus();
  });

  const takenAt = ticks.day === today ? ticks.takenAt : EMPTY_TICKS;
  const rows = useMemo(
    () => buildTodayRows(medicines, takenAt),
    [medicines, takenAt],
  );
  const remaining = rows.filter((row) => !row.taken).length;

  function tick(row: DoseRow) {
    // Never re-tick a taken dose (that would overwrite its time); only Undo
    // can remove a tick.
    if (row.taken) return;
    const now = new Date();
    const day = localDayKey(now);
    const time = formatLocalTime(now);
    setToday(day);
    setTicks((prev) => {
      const base = prev.day === day ? prev.takenAt : EMPTY_TICKS;
      if (base.has(row.key)) return prev;
      const next = new Map(base);
      next.set(row.key, time);
      return { day, takenAt: next };
    });
    setAnnouncement(`${row.name} at ${row.time} marked as taken at ${time}.`);
    pendingFocusId.current = `undo-${row.key}`;
  }

  function undo(row: DoseRow) {
    setTicks((prev) => {
      const next = new Map(prev.takenAt);
      next.delete(row.key);
      return { day: prev.day, takenAt: next };
    });
    setAnnouncement(`Tick undone for ${row.name} at ${row.time}.`);
    pendingFocusId.current = `dose-${row.key}`;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className={`font-semibold text-teal-800 underline-offset-4 hover:underline ${focusRing}`}
        >
          MedTrack Demo
        </Link>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Today&apos;s checklist
        </h1>
        <p
          role="status"
          aria-live="polite"
          className="mt-2 text-lg text-slate-700"
        >
          {remainingMessage(remaining, rows.length)}
        </p>
        {/* Separate live region for tick / undo confirmations. */}
        <p aria-live="polite" className="sr-only" data-testid="announcer">
          {announcement}
        </p>

        {rows.length === 0 ? (
          <p className="mt-6">
            <Link
              to="/app/medicines/new"
              className={`font-semibold text-teal-800 underline underline-offset-4 ${focusRing}`}
            >
              Add a medicine
            </Link>
          </p>
        ) : (
          <ul className="mt-6 space-y-3" aria-label="Doses in time order">
            {rows.map((row) => {
              const inputId = `dose-${row.key}`;
              return (
                <li
                  key={row.key}
                  className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border p-4 ${
                    row.taken
                      ? 'border-teal-700 bg-teal-50'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <input
                    id={inputId}
                    type="checkbox"
                    checked={row.taken}
                    // Once ticked, only Undo can remove the tick.
                    disabled={row.taken}
                    onChange={() => tick(row)}
                    className={`size-6 shrink-0 cursor-pointer accent-teal-700 disabled:cursor-default ${focusRing}`}
                  />
                  <label
                    htmlFor={inputId}
                    className={`flex flex-1 items-center gap-4 ${row.taken ? '' : 'cursor-pointer'}`}
                  >
                    <time
                      dateTime={row.time}
                      className="w-14 shrink-0 font-mono text-lg font-semibold"
                    >
                      {row.time}
                    </time>
                    <span>
                      <span className="block font-semibold">{row.name}</span>
                      <span className="block text-slate-700">{row.dose}</span>
                    </span>
                  </label>
                  {row.taken ? (
                    <span className="flex items-center gap-3">
                      <span className="text-sm font-medium text-teal-900">
                        Taken at{' '}
                        <time dateTime={row.takenAt}>{row.takenAt}</time>
                      </span>
                      <button
                        id={`undo-${row.key}`}
                        type="button"
                        onClick={() => undo(row)}
                        aria-label={`Undo tick for ${row.name} at ${row.time}`}
                        className={`rounded-md border border-teal-800 bg-white px-3 py-1 text-sm font-semibold text-teal-900 hover:bg-teal-100 ${focusRing}`}
                      >
                        Undo
                      </button>
                    </span>
                  ) : (
                    <span className="text-sm font-medium text-slate-700">
                      To take
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <p className="mt-6 text-sm text-slate-700">
          Sample data only. Ticks are not saved yet and reset when you reload
          the page.
        </p>
      </main>

      <Disclaimer />
    </div>
  );
}
