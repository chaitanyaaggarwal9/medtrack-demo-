import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { Dose } from '../lib/doses.ts';
import TodayPage from './TodayPage.tsx';

const doses: Dose[] = [
  { id: 'x2', medicine: 'Later med', amount: '1 tablet', time: '18:00' },
  { id: 'x1', medicine: 'Early med', amount: '2 capsules', time: '07:30' },
];

function renderPage(list: Dose[] = doses) {
  return render(
    <MemoryRouter>
      <TodayPage doses={list} />
    </MemoryRouter>,
  );
}

describe('TodayPage', () => {
  it('shows the heading and the disclaimer', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: "Today's checklist" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not medical advice/i)).toBeInTheDocument();
  });

  it('lists doses in time order', () => {
    renderPage();
    const items = within(
      screen.getByRole('list', { name: 'Doses in time order' }),
    ).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('07:30');
    expect(items[0]).toHaveTextContent('Early med');
    expect(items[1]).toHaveTextContent('18:00');
  });

  it('updates the count as doses are ticked and unticked', () => {
    renderPage();
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('2 of 2 doses still to take.');

    const early = screen.getByRole('checkbox', { name: /Early med/ });
    fireEvent.click(early);
    expect(early).toBeChecked();
    expect(status).toHaveTextContent('1 of 2 doses still to take.');

    fireEvent.click(screen.getByRole('checkbox', { name: /Later med/ }));
    expect(status).toHaveTextContent('All 2 doses ticked for today.');

    fireEvent.click(early);
    expect(early).not.toBeChecked();
    expect(status).toHaveTextContent('1 of 2 doses still to take.');
  });

  it('handles a day with no doses', () => {
    renderPage([]);
    expect(screen.getByRole('status')).toHaveTextContent(
      'No doses planned for today.',
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
