import { countRemaining, sortByTime, type Dose } from './doses.ts';

const doses: Dose[] = [
  { id: 'b', medicine: 'B', amount: '1', time: '13:00' },
  { id: 'a', medicine: 'A', amount: '1', time: '08:00' },
  { id: 'c', medicine: 'C', amount: '1', time: '20:30' },
];

describe('sortByTime', () => {
  it('orders doses from earliest to latest', () => {
    expect(sortByTime(doses).map((d) => d.id)).toEqual(['a', 'b', 'c']);
  });

  it('does not change the original array', () => {
    sortByTime(doses);
    expect(doses.map((d) => d.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('countRemaining', () => {
  it('counts every dose when none are taken', () => {
    expect(countRemaining(doses, new Set())).toBe(3);
  });

  it('subtracts taken doses', () => {
    expect(countRemaining(doses, new Set(['a', 'c']))).toBe(1);
  });

  it('ignores ids that are not in the list', () => {
    expect(countRemaining(doses, new Set(['zzz']))).toBe(3);
  });
});
