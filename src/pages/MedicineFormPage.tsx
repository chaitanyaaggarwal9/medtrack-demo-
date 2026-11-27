import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import AppShell from '../components/AppShell.tsx';
import {
  focusRing,
  linkClass,
  primaryButton,
  secondaryButton,
} from '../components/styles.ts';
import { api, ApiError } from '../lib/api.ts';
import {
  fieldErrors,
  MAX_TEXT,
  MAX_TIMES,
  medicineInputSchema,
} from '../lib/validation.ts';

type Errors = Record<string, string>;
type Load = 'loading' | 'ready' | 'not-found' | 'error';

const inputClass = `mt-1 block w-full rounded-lg border border-slate-500 px-3 py-2 text-lg ${focusRing}`;
const invalidClass = 'border-red-800 border-2';

/**
 * /app/medicines/new and /app/medicines/:id/edit.
 * The user types name, dose and times exactly as on the label: the app
 * never suggests, calculates or checks a dose.
 */
export default function MedicineFormPage() {
  const { id } = useParams();
  const editing = id !== undefined;
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [doseText, setDoseText] = useState('');
  const [times, setTimes] = useState<string[]>(['']);
  const [errors, setErrors] = useState<Errors>({});
  const [load, setLoad] = useState<Load>(editing ? 'loading' : 'ready');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id === undefined) return;
    let active = true;
    api
      .getMedicine(id)
      .then((m) => {
        if (!active) return;
        setName(m.name);
        setDoseText(m.doseText);
        setTimes(m.times.length > 0 ? m.times : ['']);
        setLoad('ready');
      })
      .catch((error: unknown) => {
        if (!active) return;
        const notFound =
          error instanceof ApiError &&
          (error.status === 404 || error.status === 400);
        setLoad(notFound ? 'not-found' : 'error');
      });
    return () => {
      active = false;
    };
  }, [id]);

  function showErrors(next: Errors) {
    setErrors(next);
    // Move focus to the first field that needs fixing.
    const first = next.name
      ? 'name'
      : next.doseText
        ? 'doseText'
        : next.times
          ? 'time-0'
          : 'form-error';
    requestAnimationFrame(() => document.getElementById(first)?.focus());
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = medicineInputSchema.safeParse({
      name,
      doseText,
      times: times.filter((t) => t !== ''),
    });
    if (!result.success) {
      showErrors(fieldErrors(result.error));
      return;
    }
    setSaving(true);
    setErrors({});
    try {
      if (editing) await api.updateMedicine(id, result.data);
      else await api.createMedicine(result.data);
      navigate('/app/medicines');
    } catch (error) {
      if (error instanceof ApiError && Object.keys(error.fields).length > 0) {
        showErrors(error.fields);
      } else {
        showErrors({
          form:
            error instanceof ApiError && error.status === 404
              ? 'We could not find that medicine. It may have been deleted.'
              : 'Could not save. Please check your connection and try again.',
        });
      }
    } finally {
      setSaving(false);
    }
  }

  const title = editing ? 'Edit medicine' : 'Add a medicine';

  if (load !== 'ready') {
    return (
      <AppShell>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {load === 'loading' ? (
          <p role="status" className="mt-2 text-lg text-slate-700">
            Loading…
          </p>
        ) : (
          <p role="alert" className="mt-2 text-lg text-slate-700">
            {load === 'not-found'
              ? 'We could not find that medicine.'
              : 'We could not load this medicine. Please reload the page.'}
          </p>
        )}
        <p className="mt-6">
          <Link to="/app/medicines" className={linkClass}>
            Back to my medicines
          </Link>
        </p>
      </AppShell>
    );
  }

  const describedBy = (field: string, hint?: string) =>
    [hint, errors[field] ? `${field}-error` : undefined]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <AppShell>
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <p className="mt-2 text-slate-700">
        Type everything exactly as it is written on the label or prescription.
        All fields are required.
      </p>

      {errors.form && (
        <p
          id="form-error"
          role="alert"
          tabIndex={-1}
          className="mt-4 rounded-lg border border-red-800 bg-red-50 p-3 font-medium text-red-900"
        >
          {errors.form}
        </p>
      )}

      <form
        noValidate
        onSubmit={(e) => void onSubmit(e)}
        className="mt-6 space-y-6"
      >
        <div>
          <label htmlFor="name" className="block font-semibold">
            Medicine name
          </label>
          <input
            id="name"
            value={name}
            maxLength={MAX_TEXT}
            autoComplete="off"
            onChange={(e) => setName(e.target.value)}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={describedBy('name')}
            className={`${inputClass} ${errors.name ? invalidClass : ''}`}
          />
          {errors.name && (
            <p id="name-error" className="mt-1 font-medium text-red-900">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="doseText" className="block font-semibold">
            Dose
          </label>
          <p id="doseText-hint" className="text-sm text-slate-700">
            For example: 1 tablet
          </p>
          <input
            id="doseText"
            value={doseText}
            maxLength={MAX_TEXT}
            autoComplete="off"
            onChange={(e) => setDoseText(e.target.value)}
            aria-invalid={errors.doseText ? true : undefined}
            aria-describedby={describedBy('doseText', 'doseText-hint')}
            className={`${inputClass} ${errors.doseText ? invalidClass : ''}`}
          />
          {errors.doseText && (
            <p id="doseText-error" className="mt-1 font-medium text-red-900">
              {errors.doseText}
            </p>
          )}
        </div>

        <fieldset aria-describedby={errors.times ? 'times-error' : undefined}>
          <legend className="font-semibold">Times (24-hour)</legend>
          <ul className="mt-1 space-y-2">
            {times.map((time, index) => (
              <li key={index} className="flex items-end gap-3">
                <div className="flex-1">
                  <label htmlFor={`time-${index}`} className="block text-sm">
                    Time {index + 1}
                  </label>
                  <input
                    id={`time-${index}`}
                    type="time"
                    value={time}
                    onChange={(e) =>
                      setTimes((prev) =>
                        prev.map((t, i) => (i === index ? e.target.value : t)),
                      )
                    }
                    aria-invalid={errors.times ? true : undefined}
                    className={`${inputClass} ${errors.times ? invalidClass : ''}`}
                  />
                </div>
                {times.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setTimes((prev) => prev.filter((_, i) => i !== index))
                    }
                    className={secondaryButton}
                  >
                    Remove time {index + 1}
                  </button>
                )}
              </li>
            ))}
          </ul>
          {times.length < MAX_TIMES && (
            <button
              type="button"
              onClick={() => setTimes((prev) => [...prev, ''])}
              className={`mt-3 ${secondaryButton}`}
            >
              Add another time
            </button>
          )}
          {errors.times && (
            <p id="times-error" className="mt-1 font-medium text-red-900">
              {errors.times}
            </p>
          )}
        </fieldset>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={saving} className={primaryButton}>
            {saving ? 'Saving…' : 'Save medicine'}
          </button>
          <Link to="/app/medicines" className={linkClass}>
            Cancel
          </Link>
        </div>
      </form>
    </AppShell>
  );
}
