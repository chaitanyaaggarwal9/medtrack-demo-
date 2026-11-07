import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { Medicine } from '../lib/doses.ts';
import { mockMedicines } from '../mocks/medicines.ts';
import AddMedicinePage from './AddMedicinePage.tsx';
import TodayPage from './TodayPage.tsx';

const medicines: Medicine[] = [
  { id: 1, name: 'Later med', dose: '1 tablet', times: ['18:00'] },
  { id: 2, name: 'Early med', dose: '2 capsules', times: ['07:30'] },
];

function renderPage(list: readonly Medicine[] = medicines) {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<TodayPage medicines={list} />} />
        <Route path="/app/medicines/new" element={<AddMedicinePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function rowTexts() {
  return within(screen.getByRole('list', { name: 'Doses in time order' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date(2026, 10, 7, 8, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TodayPage', () => {
  it('shows the heading and the disclaimer', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: "Today's checklist" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });

  it('shows the mock medicines in time order, A–Z at the same time, one row per time', () => {
    render(
      <MemoryRouter>
        <TodayPage />
      </MemoryRouter>,
    );
    const texts = rowTexts();
    expect(texts).toHaveLength(5);
    expect(texts[0]).toMatch(/^08:00Medicine A/);
    expect(texts[1]).toMatch(/^08:00Medicine D/);
    expect(texts[2]).toMatch(/^13:00Medicine B/);
    expect(texts[3]).toMatch(/^18:00Medicine C/);
    expect(texts[4]).toMatch(/^20:00Medicine D/);
    expect(mockMedicines).toHaveLength(4);
  });

  it('labels each checkbox with the medicine name and time', () => {
    renderPage();
    const box = screen.getByRole('checkbox', { name: /07:30.*Early med/ });
    expect(box).not.toBeChecked();
  });

  it('ticking marks the dose taken, shows the tick time and lowers the count', () => {
    renderPage();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('2 of 2 doses still to take.');

    const early = screen.getByRole('checkbox', { name: /Early med/ });
    fireEvent.click(early);

    expect(early).toBeChecked();
    expect(status).toHaveTextContent('1 of 2 doses still to take.');
    const row = early.closest('li')!;
    expect(row).toHaveTextContent('Taken at 08:12');
    expect(row).not.toHaveTextContent('To take');
  });

  it('a ticked dose cannot be unticked by the checkbox, only by Undo', () => {
    renderPage();
    const early = screen.getByRole('checkbox', { name: /Early med/ });
    fireEvent.click(early);
    expect(early).toBeDisabled();
    fireEvent.click(early);
    expect(early).toBeChecked();
  });

  it('moves focus to Undo after a tick and back to the checkbox after Undo', () => {
    renderPage();
    const early = screen.getByRole('checkbox', { name: /Early med/ });
    early.focus();
    fireEvent.click(early);

    const undo = screen.getByRole('button', {
      name: 'Undo tick for Early med at 07:30',
    });
    expect(undo).toHaveFocus();

    fireEvent.click(undo);
    expect(early).toHaveFocus();
    expect(early).not.toBeChecked();
    expect(early).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: /Undo/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 of 2 doses still to take.',
    );
  });

  it('announces ticks and undos to screen readers', () => {
    renderPage();
    const announcer = screen.getByTestId('announcer');
    expect(announcer).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(screen.getByRole('checkbox', { name: /Early med/ }));
    expect(announcer).toHaveTextContent(
      'Early med at 07:30 marked as taken at 08:12.',
    );

    fireEvent.click(screen.getByRole('button', { name: /Undo/ }));
    expect(announcer).toHaveTextContent('Tick undone for Early med at 07:30.');
  });

  it('re-ticking after Undo records the new time', () => {
    renderPage();
    const early = screen.getByRole('checkbox', { name: /Early med/ });
    fireEvent.click(early);
    fireEvent.click(screen.getByRole('button', { name: /Undo/ }));

    vi.setSystemTime(new Date(2026, 10, 7, 9, 45));
    fireEvent.click(early);
    expect(early.closest('li')).toHaveTextContent('Taken at 09:45');
  });

  it('says all doses are ticked, with no praise or advice', () => {
    renderPage();
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/^All 2 doses ticked for today\.$/);
    expect(document.body).not.toHaveTextContent(
      /well done|great|should|complete/i,
    );
  });

  it('clears ticks at local midnight', () => {
    vi.setSystemTime(new Date(2026, 10, 7, 23, 59, 0));
    renderPage();
    fireEvent.click(screen.getByRole('checkbox', { name: /Early med/ }));
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2');

    act(() => {
      vi.advanceTimersByTime(59_000);
    });
    expect(screen.getByRole('status')).toHaveTextContent('1 of 2');

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    expect(screen.getByRole('status')).toHaveTextContent(
      '2 of 2 doses still to take.',
    );
    expect(
      screen.getByRole('checkbox', { name: /Early med/ }),
    ).not.toBeChecked();
  });

  it('with no medicines, says so and links to adding one', () => {
    renderPage([]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'No doses planned for today.',
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: 'Add a medicine' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Add a medicine' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });
});
