import type { ApiErrorBody, DoseLogDto, MedicineDto } from './api-types.ts';
import type {
  DoseLogInput,
  MedicineInput,
  MedicineUpdate,
} from './validation.ts';

/** An error from our API, with a safe message and per-field messages. */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(
    status: number,
    message: string,
    fields: Record<string, string> = {},
  ) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  } catch {
    throw new ApiError(
      0,
      'Could not reach the server. Check your connection and try again.',
    );
  }
  if (res.status === 204) return undefined as T;

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Not JSON (e.g. the API is not running): handled below.
  }
  if (!res.ok) {
    const err = (body ?? {}) as Partial<ApiErrorBody>;
    throw new ApiError(
      res.status,
      err.error ?? 'Something went wrong. Please try again.',
      err.fields ?? {},
    );
  }
  return body as T;
}

const json = (data: unknown) => JSON.stringify(data);

export const api = {
  listMedicines: () => request<MedicineDto[]>('/api/medicines'),
  getMedicine: (id: string) =>
    request<MedicineDto>(`/api/medicines/${encodeURIComponent(id)}`),
  createMedicine: (input: MedicineInput) =>
    request<MedicineDto>('/api/medicines', {
      method: 'POST',
      body: json(input),
    }),
  updateMedicine: (id: string, patch: MedicineUpdate) =>
    request<MedicineDto>(`/api/medicines/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: json(patch),
    }),
  deleteMedicine: (id: string) =>
    request<void>(`/api/medicines/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  listDoseLogs: (doseDate: string) =>
    request<DoseLogDto[]>(
      `/api/dose-logs?date=${encodeURIComponent(doseDate)}`,
    ),
  tick: (input: DoseLogInput) =>
    request<DoseLogDto>('/api/dose-logs', {
      method: 'POST',
      body: json(input),
    }),
  undoTick: (id: string) =>
    request<void>(`/api/dose-logs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};
