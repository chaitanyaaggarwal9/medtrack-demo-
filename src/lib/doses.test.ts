import {
  buildTodayRows,
  doseKey,
  formatLocalTime,
  localDayKey,
  msUntilNextLocalMidnight,
  remainingMessage,
  type Medicine,
} from './doses.ts';

const medicines: Medicine[] = [
  { id: 1, name: 'zeta', dose: '1', times: ['13:00'] },
  { id: 2, name: 'Beta', dose: '1', times: ['20:00', '08:00'] },
  { id: 3, name: 'alpha', dose: '1', times: ['13:00'] },
];

describe('buildTodayRows', () => {
  const none = new Map<string, string>();

  it('orders rows by time, earliest first', () => {
    const times = buildTodayRows(medicines, none).map((r) => r.time);
    expect(times).toEqual(['08:00', '13:00', '13:00', '20:00']);
  });

  it('shows a medicine with two times as two rows', () => {
    const rows = buildTodayRows(medicines, none).filter(
      (r) => r.name === 'Beta',
    );
    expect(rows.map((r) => r.time)).toEqual(['08:00', '20:00']);
    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
  });

  it('orders rows at the same time A–Z by name, ignoring case', () => {
    const at13 = buildTodayRows(medicines, none).filter(
      (r) => r.time === '13:00',
    );
    expect(at13.map((r) => r.name)).toEqual(['alpha', 'zeta']);
  });

  it('keeps text exactly as typed', () => {
    const typed: Medicine[] = [
      { id: 9, name: '  méd X (night) ', dose: '½ tab', times: ['21:00'] },
    ];
    const [row] = buildTodayRows(typed, none);
    expect(row?.name).toBe('  méd X (night) ');
    expect(row?.dose).toBe('½ tab');
  });

  it('marks ticked rows as taken with their tick time', () => {
    const ticks = new Map([[doseKey(2, '08:00'), '08:12']]);
    const rows = buildTodayRows(medicines, ticks);
    const morning = rows.find((r) => r.key === doseKey(2, '08:00'));
    const evening = rows.find((r) => r.key === doseKey(2, '20:00'));
    expect(morning).toMatchObject({ taken: true, takenAt: '08:12' });
    expect(evening?.taken).toBe(false);
    expect(evening?.takenAt).toBeUndefined();
  });

  it('does not change the input', () => {
    buildTodayRows(medicines, none);
    expect(medicines[1]?.times).toEqual(['20:00', '08:00']);
  });
});

describe('local date helpers', () => {
  it('uses the local calendar day, not UTC', () => {
    // 23:30 local on 7 Nov stays 7 Nov wherever the test runs.
    expect(localDayKey(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07');
    expect(localDayKey(new Date(2026, 10, 8, 0, 0))).toBe('2026-11-08');
  });

  it('formats local time as zero-padded HH:MM', () => {
    expect(formatLocalTime(new Date(2026, 0, 1, 8, 5))).toBe('08:05');
    expect(formatLocalTime(new Date(2026, 0, 1, 23, 59))).toBe('23:59');
  });

  it('measures time until the next local midnight', () => {
    expect(msUntilNextLocalMidnight(new Date(2026, 10, 7, 23, 59, 0))).toBe(
      60_000,
    );
  });
});

describe('remainingMessage', () => {
  it('handles empty, partial and complete days', () => {
    expect(remainingMessage(0, 0)).toBe('No doses planned for today.');
    expect(remainingMessage(3, 5)).toBe('3 of 5 doses still to take.');
    expect(remainingMessage(0, 5)).toBe('All 5 doses ticked for today.');
    expect(remainingMessage(1, 1)).toBe('1 of 1 dose still to take.');
  });
});

describe('buildTodayRows edge cases', () => {
  const none = new Map<string, string>();

  it('returns no rows for no medicines', () => {
    expect(buildTodayRows([], none)).toEqual([]);
  });

  it('returns no rows for a medicine with an empty times array', () => {
    expect(
      buildTodayRows([{ id: 1, name: 'x', dose: '1', times: [] }], none),
    ).toEqual([]);
  });

  it('skips medicines without times in a mixed list', () => {
    const rows = buildTodayRows(
      [
        { id: 1, name: 'none', dose: '1', times: [] },
        { id: 2, name: 'one', dose: '1', times: ['09:00'] },
      ],
      none,
    );
    expect(rows.map((r) => r.key)).toEqual(['2-0900']);
  });

  it('keeps two same-name medicines at the same time as separate rows, by id', () => {
    const rows = buildTodayRows(
      [
        { id: 5, name: 'Same', dose: 'a', times: ['08:00'] },
        { id: 2, name: 'same', dose: 'b', times: ['08:00'] },
      ],
      none,
    );
    expect(rows.map((r) => r.medicineId)).toEqual([2, 5]);
    expect(rows[0]?.key).not.toBe(rows[1]?.key);
  });

  it('ignores ticks whose key matches no row', () => {
    const rows = buildTodayRows(medicines, new Map([['99-0800', '08:00']]));
    expect(rows.every((r) => !r.taken)).toBe(true);
  });
});

describe('remainingMessage edge cases', () => {
  it('uses singular only when total is 1', () => {
    expect(remainingMessage(0, 1)).toBe('All 1 dose ticked for today.');
    expect(remainingMessage(1, 2)).toBe('1 of 2 doses still to take.');
  });

  it('contains no praise or advice', () => {
    for (const msg of [
      remainingMessage(0, 0),
      remainingMessage(0, 3),
      remainingMessage(2, 3),
    ]) {
      expect(msg).not.toMatch(/well done|great|should|!|good/i);
    }
  });
});

describe('msUntilNextLocalMidnight edge cases', () => {
  it('is a full day at exactly midnight and 1 ms just before it', () => {
    const ms = msUntilNextLocalMidnight(new Date(2026, 10, 7, 0, 0, 0, 0));
    // A full local day (allowing for a DST change on this date in some zones).
    expect(ms).toBeGreaterThanOrEqual(23 * 3600_000);
    expect(ms).toBeLessThanOrEqual(25 * 3600_000);
    expect(
      msUntilNextLocalMidnight(new Date(2026, 10, 7, 23, 59, 59, 999)),
    ).toBe(1);
  });
});
