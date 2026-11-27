import { useCallback, useEffect, useRef, useState } from 'react';
import AppShell from '../components/AppShell.tsx';
import { secondaryButton } from '../components/styles.ts';
import { api, ApiError } from '../lib/api.ts';
import type { MedicineDto } from '../lib/api-types.ts';
import {
  doseKey,
  formatLocalTime,
  localDayKey,
  type DoseRow,
  type Medicine,
} from '../lib/doses.ts';
import TodayPage, { type Ticks } from './TodayPage.tsx';

type State =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; medicines: Medicine[]; ticks: Ticks };

const toMedicine = (m: MedicineDto): Medicine => ({
  id: m.id,
  name: m.name,
  dose: m.doseText,
  times: m.times,
});

/** /app: loads today's medicines and ticks from the API. */
export default function TodayRoute() {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  // Which saved dose_log id belongs to which row, so Undo can delete it.
  const logIds = useRef(new Map<string, string>());

  useEffect(() => {
    let active = true;
    const day = localDayKey(new Date());
    Promise.all([api.listMedicines(), api.listDoseLogs(day)])
      .then(([medicines, logs]) => {
        if (!active) return;
        const takenAt = new Map<string, string>();
        logIds.current = new Map();
        for (const log of logs) {
          const key = doseKey(log.medicineId, log.scheduledTime);
          takenAt.set(key, formatLocalTime(new Date(log.takenAt)));
          logIds.current.set(key, log.id);
        }
        setState({
          status: 'ready',
          medicines: medicines.map(toMedicine),
          ticks: { day, takenAt },
        });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [attempt]);

  const onTick = useCallback(async (row: DoseRow, day: string) => {
    try {
      const log = await api.tick({
        medicineId: row.medicineId,
        doseDate: day,
        scheduledTime: row.time,
      });
      logIds.current.set(row.key, log.id);
    } catch (error) {
      // Already ticked (e.g. in another tab): that is fine, find its id.
      if (!(error instanceof ApiError && error.status === 409)) throw error;
      const logs = await api.listDoseLogs(day);
      const match = logs.find(
        (l) => doseKey(l.medicineId, l.scheduledTime) === row.key,
      );
      if (match) logIds.current.set(row.key, match.id);
    }
  }, []);

  const onUndo = useCallback(async (row: DoseRow) => {
    const id = logIds.current.get(row.key);
    if (id === undefined) throw new Error('No saved tick to undo.');
    try {
      await api.undoTick(id);
    } catch (error) {
      // Already gone: that is what we wanted.
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
    logIds.current.delete(row.key);
  }, []);

  if (state.status === 'ready') {
    return (
      <TodayPage
        medicines={state.medicines}
        initialTicks={state.ticks}
        onTick={onTick}
        onUndo={onUndo}
      />
    );
  }

  return (
    <AppShell>
      <h1 className="text-3xl font-bold tracking-tight">
        Today&apos;s checklist
      </h1>
      {state.status === 'loading' ? (
        <p role="status" className="mt-2 text-lg text-slate-700">
          Loading your medicines…
        </p>
      ) : (
        <div className="mt-4">
          <p
            role="alert"
            className="rounded-lg border border-red-800 bg-red-50 p-3 font-medium text-red-900"
          >
            We could not load your medicines. Please check your connection and
            try again.
          </p>
          <button
            type="button"
            onClick={() => {
              setState({ status: 'loading' });
              setAttempt((n) => n + 1);
            }}
            className={`mt-4 ${secondaryButton}`}
          >
            Try again
          </button>
        </div>
      )}
    </AppShell>
  );
}
