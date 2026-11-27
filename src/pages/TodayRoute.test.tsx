import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { mockFetch, on, sentBody } from '../test-utils/mockFetch.ts';
import TodayRoute from './TodayRoute.tsx';

const MED = {
  id: 'b0000000-0000-4000-8000-000000000001',
  name: 'Medicine A',
  doseText: '5 ml',
  times: ['08:00', '20:00'],
};
const LOG = {
  id: 'c0000000-0000-4000-8000-000000000001',
  medicineId: MED.id,
  doseDate: '2026-11-21',
  scheduledTime: '08:00',
  takenAt: new Date(2026, 10, 21, 8, 5).toISOString(),
};

function renderPage() {
  render(
    <MemoryRouter>
      <TodayRoute />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 21, 9, 30));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('TodayRoute (saved ticks)', () => {
  it("loads my medicines and today's saved ticks from the API", async () => {
    const fetchMock = mockFetch(
      on('GET', '/api/medicines', { status: 200, body: [MED] }),
      on('GET', '/api/dose-logs', { status: 200, body: [LOG] }),
    );
    renderPage();
    expect(screen.getByText('Loading your medicines…')).toBeInTheDocument();
    expect(
      await screen.findByText('1 of 2 doses still to take.'),
    ).toBeInTheDocument();
    expect(screen.getByText('08:05')).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      '/api/dose-logs?date=2026-11-21',
    );
    expect(
      screen.getByText('Demo data only. Ticks are saved for the demo user.'),
    ).toBeInTheDocument();
  });

  it('ticking sends the medicine, my day and the planned time', async () => {
    const fetchMock = mockFetch(
      on('GET', '/api/medicines', { status: 200, body: [MED] }),
      on('GET', '/api/dose-logs', { status: 200, body: [] }),
      on('POST', '/api/dose-logs', {
        status: 201,
        body: { ...LOG, scheduledTime: '20:00' },
      }),
    );
    renderPage();
    fireEvent.click(await screen.findByLabelText(/20:00/));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(sentBody(fetchMock, 2)).toEqual({
      medicineId: MED.id,
      doseDate: '2026-11-21',
      scheduledTime: '20:00',
    });
  });

  it('undo deletes the saved tick by its id', async () => {
    const fetchMock = mockFetch(
      on('GET', '/api/medicines', { status: 200, body: [MED] }),
      on('GET', '/api/dose-logs', { status: 200, body: [LOG] }),
      on('DELETE', `/api/dose-logs/${LOG.id}`, { status: 204 }),
    );
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', {
        name: /Undo tick for Medicine A at 08:00/,
      }),
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('DELETE');
    expect(
      await screen.findByText('2 of 2 doses still to take.'),
    ).toBeInTheDocument();
  });

  it('if saving a tick fails, the tick is taken back and an error is shown', async () => {
    mockFetch(
      on('GET', '/api/medicines', { status: 200, body: [MED] }),
      on('GET', '/api/dose-logs', { status: 200, body: [] }),
      on('POST', '/api/dose-logs', { status: 500, body: { error: 'x' } }),
    );
    renderPage();
    const box = await screen.findByLabelText(/20:00/);
    fireEvent.click(box);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save the tick for Medicine A at 20:00. Please try again.',
    );
    expect(box).not.toBeChecked();
    expect(screen.getByText('2 of 2 doses still to take.')).toBeInTheDocument();
  });

  it('shows a friendly error with Try again when loading fails', async () => {
    mockFetch(
      on('GET', '/api/medicines', { status: 500, body: { error: 'x' } }),
    );
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your medicines.',
    );
    expect(
      screen.getByRole('button', { name: 'Try again' }),
    ).toBeInTheDocument();
  });
});
