import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import AppShell from '../components/AppShell.tsx';
import { focusRing, linkClass, secondaryButton } from '../components/styles.ts';
import { api } from '../lib/api.ts';
import type { MedicineDto } from '../lib/api-types.ts';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; medicines: MedicineDto[] };

/** /app/medicines: my medicines, with Edit and Delete (with a confirm step). */
export default function MedicinesPage() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const focusAfter = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .listMedicines()
      .then((medicines) => active && setState({ status: 'ready', medicines }))
      .catch(() => active && setState({ status: 'error' }));
    return () => {
      active = false;
    };
  }, []);

  // Keep keyboard focus in a sensible place after confirm / cancel / delete.
  useEffect(() => {
    const id = focusAfter.current;
    if (id === null) return;
    focusAfter.current = null;
    document.getElementById(id)?.focus();
  });

  async function remove(medicine: MedicineDto) {
    setBusy(true);
    setError('');
    try {
      await api.deleteMedicine(medicine.id);
      setState((prev) =>
        prev.status === 'ready'
          ? {
              ...prev,
              medicines: prev.medicines.filter((m) => m.id !== medicine.id),
            }
          : prev,
      );
      setConfirmingId(null);
      setMessage(`${medicine.name} was deleted.`);
      focusAfter.current = 'medicines-heading';
    } catch {
      setError(`Could not delete ${medicine.name}. Please try again.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1
        id="medicines-heading"
        tabIndex={-1}
        className={`text-3xl font-bold tracking-tight ${focusRing}`}
      >
        My medicines
      </h1>
      <p role="status" aria-live="polite" className="mt-2 text-slate-700">
        {message}
      </p>
      {error && (
        <p
          role="alert"
          className="mt-2 rounded-lg border border-red-800 bg-red-50 p-3 font-medium text-red-900"
        >
          {error}
        </p>
      )}

      <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        <Link to="/app/medicines/new" className={linkClass}>
          Add a medicine
        </Link>
        <Link to="/app" className={linkClass}>
          Back to today&apos;s checklist
        </Link>
      </p>

      {state.status === 'loading' && (
        <p role="status" className="mt-6 text-slate-700">
          Loading your medicines…
        </p>
      )}
      {state.status === 'error' && (
        <p
          role="alert"
          className="mt-6 rounded-lg border border-red-800 bg-red-50 p-3 font-medium text-red-900"
        >
          We could not load your medicines. Please reload the page.
        </p>
      )}
      {state.status === 'ready' && state.medicines.length === 0 && (
        <p className="mt-6 text-slate-700">You have no medicines yet.</p>
      )}
      {state.status === 'ready' && state.medicines.length > 0 && (
        <ul className="mt-6 space-y-3" aria-label="My medicines">
          {state.medicines.map((m) => (
            <li key={m.id} className="rounded-xl border border-slate-300 p-4">
              <p className="font-semibold">{m.name}</p>
              <p className="text-slate-700">{m.doseText}</p>
              <p className="text-slate-700">Times: {m.times.join(', ')}</p>

              {confirmingId === m.id ? (
                <div
                  role="group"
                  aria-label={`Confirm delete ${m.name}`}
                  className="mt-3 rounded-lg border border-red-800 bg-red-50 p-3"
                >
                  <p className="font-medium text-red-900">
                    Delete {m.name}? Its ticks will be deleted too.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3">
                    <button
                      id={`confirm-delete-${m.id}`}
                      type="button"
                      disabled={busy}
                      onClick={() => void remove(m)}
                      className={`rounded-lg bg-red-800 px-4 py-2 font-semibold text-white hover:bg-red-900 disabled:opacity-60 ${focusRing}`}
                    >
                      Yes, delete
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingId(null);
                        focusAfter.current = `delete-${m.id}`;
                      }}
                      className={secondaryButton}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    to={`/app/medicines/${m.id}/edit`}
                    aria-label={`Edit ${m.name}`}
                    className={secondaryButton}
                  >
                    Edit
                  </Link>
                  <button
                    id={`delete-${m.id}`}
                    type="button"
                    aria-label={`Delete ${m.name}`}
                    onClick={() => {
                      setConfirmingId(m.id);
                      setMessage('');
                      focusAfter.current = `confirm-delete-${m.id}`;
                    }}
                    className={secondaryButton}
                  >
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
