import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { mockDoses } from '../data/mockDoses.ts';
import { countRemaining, sortByTime, type Dose } from '../lib/doses.ts';

type TodayPageProps = {
  doses?: readonly Dose[];
};

function remainingMessage(remaining: number, total: number): string {
  if (total === 0) return 'No doses planned for today.';
  const noun = total === 1 ? 'dose' : 'doses';
  if (remaining === 0) return `All ${total} ${noun} ticked for today.`;
  return `${remaining} of ${total} ${noun} still to take.`;
}

export default function TodayPage({ doses = mockDoses }: TodayPageProps) {
  const sorted = useMemo(() => sortByTime(doses), [doses]);
  const [takenIds, setTakenIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const remaining = countRemaining(sorted, takenIds);

  function toggle(id: string) {
    setTakenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="border-b border-slate-200 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="font-semibold text-teal-800 underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
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
          {remainingMessage(remaining, sorted.length)}
        </p>

        {sorted.length > 0 && (
          <ul className="mt-6 space-y-3" aria-label="Doses in time order">
            {sorted.map((dose) => {
              const taken = takenIds.has(dose.id);
              const inputId = `dose-${dose.id}`;
              return (
                <li key={dose.id}>
                  <label
                    htmlFor={inputId}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-teal-700 ${
                      taken
                        ? 'border-teal-700 bg-teal-50'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      checked={taken}
                      onChange={() => toggle(dose.id)}
                      className="size-6 shrink-0 accent-teal-700"
                    />
                    <time
                      dateTime={dose.time}
                      className="w-14 shrink-0 font-mono text-lg font-semibold"
                    >
                      {dose.time}
                    </time>
                    <span className="flex-1">
                      <span className="block font-semibold">
                        {dose.medicine}
                      </span>
                      <span className="block text-slate-700">
                        {dose.amount}
                      </span>
                    </span>
                    <span
                      className={`text-sm font-medium ${taken ? 'text-teal-800' : 'text-slate-700'}`}
                    >
                      {taken ? 'Taken' : 'To take'}
                    </span>
                  </label>
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

      <footer className="border-t border-slate-200 bg-slate-100 px-4 py-6 text-center text-sm text-slate-800 sm:px-6">
        <p>
          For education only. Not medical advice. In an emergency, call your
          local emergency number.
        </p>
      </footer>
    </div>
  );
}
