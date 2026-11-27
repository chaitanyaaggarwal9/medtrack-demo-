import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { mockFetch, on, sentBody } from '../test-utils/mockFetch.ts';
import MedicineFormPage from './MedicineFormPage.tsx';

const ID = 'b0000000-0000-4000-8000-000000000001';

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/app/medicines/new" element={<MedicineFormPage />} />
        <Route path="/app/medicines/:id/edit" element={<MedicineFormPage />} />
        <Route path="/app/medicines" element={<h1>My medicines</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('MedicineFormPage: add', () => {
  it('has a visible label on every field', () => {
    mockFetch();
    renderAt('/app/medicines/new');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Add a medicine' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Medicine name')).toBeInTheDocument();
    expect(screen.getByLabelText('Dose')).toBeInTheDocument();
    expect(screen.getByLabelText('Time 1')).toBeInTheDocument();
  });

  it('shows what to fix when fields are empty, and sends nothing', async () => {
    const fetchMock = mockFetch();
    renderAt('/app/medicines/new');
    fireEvent.click(screen.getByRole('button', { name: 'Save medicine' }));
    expect(
      await screen.findByText('Enter the medicine name.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Enter the dose exactly as it is written on the label.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Add at least one time.')).toBeInTheDocument();
    expect(screen.getByLabelText('Medicine name')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saves a new medicine with two times and goes to My medicines', async () => {
    const fetchMock = mockFetch(
      on('POST', '/api/medicines', {
        status: 201,
        body: {
          id: ID,
          name: 'Medicine Z',
          doseText: '1 tablet',
          times: ['08:00', '20:00'],
        },
      }),
    );
    renderAt('/app/medicines/new');
    fireEvent.change(screen.getByLabelText('Medicine name'), {
      target: { value: 'Medicine Z' },
    });
    fireEvent.change(screen.getByLabelText('Dose'), {
      target: { value: '1 tablet' },
    });
    fireEvent.change(screen.getByLabelText('Time 1'), {
      target: { value: '08:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add another time' }));
    fireEvent.change(screen.getByLabelText('Time 2'), {
      target: { value: '20:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save medicine' }));

    expect(
      await screen.findByRole('heading', { name: 'My medicines' }),
    ).toBeInTheDocument();
    expect(sentBody(fetchMock, 0)).toEqual({
      name: 'Medicine Z',
      doseText: '1 tablet',
      times: ['08:00', '20:00'],
    });
  });

  it('allows at most 6 times', () => {
    mockFetch();
    renderAt('/app/medicines/new');
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Add another time' }));
    }
    expect(screen.getByLabelText('Time 6')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add another time' }),
    ).not.toBeInTheDocument();
  });

  it('shows the server message when saving fails', async () => {
    mockFetch(
      on('POST', '/api/medicines', {
        status: 500,
        body: { error: 'Something went wrong.' },
      }),
    );
    renderAt('/app/medicines/new');
    fireEvent.change(screen.getByLabelText('Medicine name'), {
      target: { value: 'Medicine Z' },
    });
    fireEvent.change(screen.getByLabelText('Dose'), {
      target: { value: '1 tablet' },
    });
    fireEvent.change(screen.getByLabelText('Time 1'), {
      target: { value: '08:00' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save medicine' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Could not save. Please check your connection and try again.',
    );
  });
});

describe('MedicineFormPage: edit', () => {
  it('loads the medicine, then saves the change with PATCH', async () => {
    const fetchMock = mockFetch(
      on('GET', `/api/medicines/${ID}`, {
        status: 200,
        body: {
          id: ID,
          name: 'Medicine A',
          doseText: '5 ml',
          times: ['08:00'],
        },
      }),
      on('PATCH', `/api/medicines/${ID}`, {
        status: 200,
        body: {
          id: ID,
          name: 'Medicine A',
          doseText: '10 ml',
          times: ['08:00'],
        },
      }),
    );
    renderAt(`/app/medicines/${ID}/edit`);
    expect(await screen.findByDisplayValue('Medicine A')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Edit medicine' }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Dose'), {
      target: { value: '10 ml' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save medicine' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('PATCH');
    expect(sentBody(fetchMock, 1)).toMatchObject({ doseText: '10 ml' });
  });

  it('says so when the medicine is not found (or not mine)', async () => {
    mockFetch(
      on('GET', `/api/medicines/${ID}`, {
        status: 404,
        body: { error: 'Not found' },
      }),
    );
    renderAt(`/app/medicines/${ID}/edit`);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not find that medicine.',
    );
  });
});
