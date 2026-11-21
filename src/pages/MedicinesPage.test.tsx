import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { mockFetch, on } from '../test-utils/mockFetch.ts';
import MedicinesPage from './MedicinesPage.tsx';

const A = {
  id: 'b0000000-0000-4000-8000-000000000001',
  name: 'Medicine A',
  doseText: '5 ml',
  times: ['08:00'],
};
const D = {
  id: 'b0000000-0000-4000-8000-000000000004',
  name: 'Medicine D',
  doseText: '1 tablet',
  times: ['08:00', '20:00'],
};

function renderPage() {
  render(
    <MemoryRouter>
      <MedicinesPage />
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('MedicinesPage', () => {
  it('lists my medicines with Edit and Delete for each', async () => {
    mockFetch(on('GET', '/api/medicines', { status: 200, body: [A, D] }));
    renderPage();
    expect(await screen.findByText('Medicine A')).toBeInTheDocument();
    expect(screen.getByText('Times: 08:00, 20:00')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Edit Medicine D' }),
    ).toHaveAttribute('href', `/app/medicines/${D.id}/edit`);
    expect(
      screen.getByRole('button', { name: 'Delete Medicine A' }),
    ).toBeInTheDocument();
  });

  it('Delete asks first; Cancel keeps the medicine and sends nothing', async () => {
    const fetchMock = mockFetch(
      on('GET', '/api/medicines', { status: 200, body: [A] }),
    );
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Medicine A' }),
    );
    expect(
      screen.getByText('Delete Medicine A? Its ticks will be deleted too.'),
    ).toBeInTheDocument();
    // "Cancel" is as easy as "Yes": same place, a normal button.
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText('Medicine A')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Delete Medicine A' }),
      ).toHaveFocus(),
    );
  });

  it('Yes, delete removes it and says so', async () => {
    const fetchMock = mockFetch(
      on('GET', '/api/medicines', { status: 200, body: [A, D] }),
      on('DELETE', `/api/medicines/${A.id}`, { status: 204 }),
    );
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Medicine A' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(
      await screen.findByText('Medicine A was deleted.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete Medicine A' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Medicine D')).toBeInTheDocument();
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('DELETE');
  });

  it('shows an error and keeps the medicine when delete fails', async () => {
    mockFetch(
      on('GET', '/api/medicines', { status: 200, body: [A] }),
      on('DELETE', `/api/medicines/${A.id}`, {
        status: 500,
        body: { error: 'x' },
      }),
    );
    renderPage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Delete Medicine A' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not delete Medicine A. Please try again.',
    );
    expect(screen.getByText('Medicine A')).toBeInTheDocument();
  });

  it('shows a friendly message when nothing can be loaded', async () => {
    mockFetch(
      on('GET', '/api/medicines', { status: 500, body: { error: 'x' } }),
    );
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not load your medicines.',
    );
  });
});
