import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import type { Medicine } from '../lib/doses.ts';
import AddMedicinePage from './AddMedicinePage.tsx';
import TodayPage from './TodayPage.tsx';

function renderPage(list: readonly Medicine[]) {
  return render(
    <MemoryRouter initialEntries={['/app']}>
      <Routes>
        <Route path="/app" element={<TodayPage medicines={list} />} />
        <Route path="/app/medicines/new" element={<AddMedicinePage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function rows() {
  return within(
    screen.getByRole('list', { name: 'Doses in time order' }),
  ).getAllByRole('listitem');
}

function status() {
  return screen.getByRole('status');
}

const twoTimes: Medicine[] = [
  { id: 1, name: 'Twice med', dose: '1 tablet', times: ['20:00', '08:00'] },
  { id: 2, name: 'Once med', dose: '5 ml', times: ['13:00'] },
];

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
  vi.setSystemTime(new Date(2026, 10, 7, 8, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('TodayPage: no medicines / no times', () => {
  it('empty list shows the empty message, the Add link, the disclaimer, and no list', () => {
    renderPage([]);
    expect(status()).toHaveTextContent(/^No doses planned for today\.$/);
    expect(
      screen.getByRole('link', { name: 'Add a medicine' }),
    ).toHaveAttribute('href', '/app/medicines/new');
    expect(
      screen.queryByRole('list', { name: 'Doses in time order' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      /not medical advice/i,
    );
  });

  it('a medicine with an empty times array produces no rows (empty state)', () => {
    renderPage([{ id: 1, name: 'No times', dose: '1 tablet', times: [] }]);
    expect(status()).toHaveTextContent('No doses planned for today.');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByText('No times')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Add a medicine' }),
    ).toBeInTheDocument();
  });

  it('a mix of medicines with and without times only lists the timed ones', () => {
    renderPage([
      { id: 1, name: 'Empty one', dose: '1', times: [] },
      { id: 2, name: 'Timed one', dose: '1', times: ['09:00'] },
      { id: 3, name: 'Empty two', dose: '1', times: [] },
      { id: 4, name: 'Timed two', dose: '1', times: ['07:00', '21:00'] },
    ]);
    const texts = rows().map((li) => li.textContent);
    expect(texts).toHaveLength(3);
    expect(texts[0]).toMatch(/^07:00Timed two/);
    expect(texts[1]).toMatch(/^09:00Timed one/);
    expect(texts[2]).toMatch(/^21:00Timed two/);
    expect(screen.queryByText(/Empty/)).not.toBeInTheDocument();
    expect(status()).toHaveTextContent('3 of 3 doses still to take.');
    expect(
      screen.queryByRole('link', { name: 'Add a medicine' }),
    ).not.toBeInTheDocument();
  });

  it('shows the disclaimer in the normal (non-empty) state too', () => {
    renderPage(twoTimes);
    expect(screen.getByRole('contentinfo')).toHaveTextContent(
      /For education only\. Not medical advice\./,
    );
  });
});

describe('TodayPage: all taken', () => {
  it('ticking every row (including both times of one medicine) says all N ticked', () => {
    renderPage(twoTimes);
    expect(status()).toHaveTextContent('3 of 3 doses still to take.');
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    expect(status()).toHaveTextContent(/^All 3 doses ticked for today\.$/);
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toBeChecked();
      expect(box).toBeDisabled();
    }
    expect(screen.queryByText('To take')).not.toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /^Undo tick for/ }),
    ).toHaveLength(3);
  });

  it('uses singular grammar for a single dose', () => {
    renderPage([{ id: 1, name: 'Solo', dose: '1 tablet', times: ['09:00'] }]);
    expect(status()).toHaveTextContent(/^1 of 1 dose still to take\.$/);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(status()).toHaveTextContent(/^All 1 dose ticked for today\.$/);
  });

  it('shows no praise or advice when everything is ticked', () => {
    renderPage(twoTimes);
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    const main = screen.getByRole('main');
    expect(main).not.toHaveTextContent(
      /well done|great|good job|congrat|awesome|nice|keep it up|you should|remember to|!/i,
    );
  });
});

describe('TodayPage: untick (Undo)', () => {
  // fireEvent dispatches click even on a disabled input; tick() should
  // still refuse to re-tick (and overwrite the time of) a taken row.
  it('clicking a disabled (ticked) checkbox does nothing', () => {
    renderPage(twoTimes);
    const box = screen.getByRole('checkbox', { name: /13:00.*Once med/ });
    fireEvent.click(box);
    const announcer = screen.getByTestId('announcer');
    const before = announcer.textContent;

    vi.setSystemTime(new Date(2026, 10, 7, 9, 0));
    fireEvent.click(box);
    fireEvent.click(box);

    expect(box).toBeChecked();
    expect(box.closest('li')).toHaveTextContent('Taken at 08:12');
    expect(status()).toHaveTextContent('2 of 3 doses still to take.');
    expect(announcer.textContent).toBe(before);
  });

  it('Undo on 08:00 of a two-time medicine leaves 20:00 ticked', () => {
    renderPage(twoTimes);
    const morning = screen.getByRole('checkbox', { name: /08:00.*Twice med/ });
    const evening = screen.getByRole('checkbox', { name: /20:00.*Twice med/ });
    fireEvent.click(morning);
    fireEvent.click(evening);
    expect(status()).toHaveTextContent('1 of 3 doses still to take.');

    fireEvent.click(
      screen.getByRole('button', { name: 'Undo tick for Twice med at 08:00' }),
    );

    expect(morning).not.toBeChecked();
    expect(morning).toBeEnabled();
    expect(evening).toBeChecked();
    expect(evening.closest('li')).toHaveTextContent('Taken at 08:12');
    expect(
      screen.getByRole('button', { name: 'Undo tick for Twice med at 20:00' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', {
        name: 'Undo tick for Twice med at 08:00',
      }),
    ).not.toBeInTheDocument();
    expect(status()).toHaveTextContent('2 of 3 doses still to take.');
  });

  it('undoing every dose after all ticked returns to the full count', () => {
    renderPage(twoTimes);
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    expect(status()).toHaveTextContent('All 3 doses ticked for today.');

    for (const undo of screen.getAllByRole('button', { name: /^Undo tick/ })) {
      fireEvent.click(undo);
    }
    expect(status()).toHaveTextContent(/^3 of 3 doses still to take\.$/);
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).not.toBeChecked();
      expect(box).toBeEnabled();
    }
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getAllByText('To take')).toHaveLength(3);
  });

  it('tick, undo, tick again on a two-time medicine shows the new time on that row only', () => {
    renderPage(twoTimes);
    const morning = screen.getByRole('checkbox', { name: /08:00.*Twice med/ });
    const evening = screen.getByRole('checkbox', { name: /20:00.*Twice med/ });
    fireEvent.click(evening); // 08:12
    fireEvent.click(morning); // 08:12
    fireEvent.click(
      screen.getByRole('button', { name: 'Undo tick for Twice med at 08:00' }),
    );

    vi.setSystemTime(new Date(2026, 10, 7, 10, 3));
    fireEvent.click(morning);

    expect(morning.closest('li')).toHaveTextContent('Taken at 10:03');
    expect(morning.closest('li')).not.toHaveTextContent('08:12');
    expect(evening.closest('li')).toHaveTextContent('Taken at 08:12');
    expect(screen.getByTestId('announcer')).toHaveTextContent(
      'Twice med at 08:00 marked as taken at 10:03.',
    );
  });
});

describe('TodayPage: names and text', () => {
  it('two medicines with identical names at the same time get two rows and distinct checkboxes', () => {
    renderPage([
      { id: 7, name: 'Same name', dose: 'dose seven', times: ['08:00'] },
      { id: 3, name: 'Same name', dose: 'dose three', times: ['08:00'] },
    ]);
    const boxes = screen.getAllByRole('checkbox', { name: /08:00.*Same name/ });
    expect(boxes).toHaveLength(2);
    expect(boxes[0]!.id).not.toBe(boxes[1]!.id);
    // Tie broken by id: id 3 first.
    expect(rows()[0]).toHaveTextContent('dose three');
    expect(rows()[1]).toHaveTextContent('dose seven');

    fireEvent.click(boxes[1]!);
    expect(boxes[1]).toBeChecked();
    expect(boxes[0]).not.toBeChecked();
    expect(status()).toHaveTextContent('1 of 2 doses still to take.');
  });

  it('orders same-time names A–Z ignoring case', () => {
    renderPage([
      { id: 1, name: 'banana', dose: '1', times: ['08:00'] },
      { id: 2, name: 'Cherry', dose: '1', times: ['08:00'] },
      { id: 3, name: 'apple', dose: '1', times: ['08:00'] },
      { id: 4, name: 'Apricot', dose: '1', times: ['08:00'] },
    ]);
    const names = rows().map(
      (li) => li.querySelector('span.font-semibold')?.textContent,
    );
    expect(names).toEqual(['apple', 'Apricot', 'banana', 'Cherry']);
  });

  it('renders text exactly as typed, including whitespace and special characters', () => {
    renderPage([
      {
        id: 1,
        name: '  Méd X (night) & co ',
        dose: '½ tab — "with" food',
        times: ['21:00'],
      },
    ]);
    const li = rows()[0]!;
    const nameEl = within(li).getByText('Méd X (night) & co', {
      normalizer: (s) => s.trim(),
    });
    expect(nameEl.textContent).toBe('  Méd X (night) & co ');
    expect(within(li).getByText('½ tab — "with" food').textContent).toBe(
      '½ tab — "with" food',
    );
  });

  it('renders HTML-like strings as text, not markup', () => {
    const evil = '<img src=x onerror="alert(1)"><b>bold</b>';
    renderPage([
      { id: 1, name: evil, dose: '<script>x()</script>', times: ['09:00'] },
    ]);
    const li = rows()[0]!;
    expect(li.querySelector('img')).toBeNull();
    expect(li.querySelector('b')).toBeNull();
    expect(li.querySelector('script')).toBeNull();
    expect(within(li).getByText(evil)).toBeInTheDocument();
    expect(within(li).getByText('<script>x()</script>')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox'));
    expect(
      screen.getByRole('button', { name: `Undo tick for ${evil} at 09:00` }),
    ).toBeInTheDocument();
  });
});

describe('TodayPage: midnight', () => {
  it('ticks from before midnight are gone after midnight, and ticking after midnight works', () => {
    vi.setSystemTime(new Date(2026, 10, 7, 23, 58));
    renderPage(twoTimes);
    for (const box of screen.getAllByRole('checkbox')) fireEvent.click(box);
    expect(status()).toHaveTextContent('All 3 doses ticked for today.');

    act(() => {
      vi.advanceTimersByTime(2 * 60_000);
    });
    expect(status()).toHaveTextContent('3 of 3 doses still to take.');
    expect(
      screen.queryByRole('button', { name: /Undo/ }),
    ).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5 * 60_000);
    });
    const morning = screen.getByRole('checkbox', { name: /08:00.*Twice med/ });
    fireEvent.click(morning);
    expect(morning).toBeChecked();
    expect(morning.closest('li')).toHaveTextContent('Taken at 00:05');
    expect(status()).toHaveTextContent('2 of 3 doses still to take.');
  });

  it('a tick after midnight starts a fresh day even if the midnight timer has not fired yet', () => {
    vi.setSystemTime(new Date(2026, 10, 7, 23, 59));
    renderPage(twoTimes);
    fireEvent.click(screen.getByRole('checkbox', { name: /20:00.*Twice med/ }));
    expect(status()).toHaveTextContent('2 of 3');

    // Jump the clock without running timers (e.g. a sleeping laptop).
    vi.setSystemTime(new Date(2026, 10, 8, 0, 30));
    fireEvent.click(screen.getByRole('checkbox', { name: /13:00.*Once med/ }));

    expect(
      screen.getByRole('checkbox', { name: /20:00.*Twice med/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /13:00.*Once med/ }),
    ).toBeChecked();
    expect(status()).toHaveTextContent('2 of 3 doses still to take.');
  });

  it('keeps resetting across two midnights in a row', () => {
    vi.setSystemTime(new Date(2026, 10, 7, 23, 59));
    renderPage(twoTimes);
    act(() => {
      vi.advanceTimersByTime(60_000); // 00:00 on the 8th
    });
    fireEvent.click(screen.getByRole('checkbox', { name: /13:00.*Once med/ }));
    expect(status()).toHaveTextContent('2 of 3');

    act(() => {
      vi.advanceTimersByTime(24 * 60 * 60_000); // 00:00 on the 9th
    });
    expect(status()).toHaveTextContent('3 of 3 doses still to take.');
  });
});

describe('TodayPage: keyboard and accessibility', () => {
  it('every checkbox and Undo is a native, focusable control', () => {
    renderPage(twoTimes);
    const boxes = screen.getAllByRole('checkbox');
    expect(boxes).toHaveLength(3);
    for (const box of boxes) {
      expect(box.tagName).toBe('INPUT');
      expect(box).toHaveAttribute('type', 'checkbox');
      expect(box).not.toHaveAttribute('tabindex', '-1');
      box.focus();
      expect(box).toHaveFocus();
    }

    fireEvent.click(boxes[0]!);
    fireEvent.click(boxes[2]!);
    const undos = screen.getAllByRole('button', { name: /^Undo tick for/ });
    expect(undos).toHaveLength(2);
    for (const undo of undos) {
      expect(undo.tagName).toBe('BUTTON');
      expect(undo).toHaveAttribute('type', 'button');
      undo.focus();
      expect(undo).toHaveFocus();
    }
  });

  it("Undo's accessible name includes the medicine name and the planned time", () => {
    renderPage(twoTimes);
    fireEvent.click(screen.getByRole('checkbox', { name: /20:00.*Twice med/ }));
    expect(
      screen.getByRole('button', { name: 'Undo tick for Twice med at 20:00' }),
    ).toHaveTextContent('Undo');
  });

  // jsdom does not load Tailwind, so the 'block' spans do not add spaces
  // to the accessible name here the way they do in a real browser.
  it('every checkbox has a label containing time, name and dose', () => {
    renderPage(twoTimes);
    expect(
      screen.getByRole('checkbox', { name: /^08:00\s*Twice med\s*1 tablet$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^13:00\s*Once med\s*5 ml$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /^20:00\s*Twice med\s*1 tablet$/ }),
    ).toBeInTheDocument();
  });
});
