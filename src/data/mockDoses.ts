import type { Dose } from '../lib/doses.ts';

/**
 * Made-up sample doses for the demo. Not real patient data.
 * Deliberately listed out of time order so sorting is exercised.
 * Replaced by the database in Week 5.
 */
export const mockDoses: readonly Dose[] = [
  { id: 'd3', medicine: 'Medicine C', amount: '1 tablet', time: '13:00' },
  { id: 'd1', medicine: 'Medicine A', amount: '1 tablet', time: '08:00' },
  { id: 'd5', medicine: 'Medicine A', amount: '1 tablet', time: '20:00' },
  { id: 'd2', medicine: 'Medicine B', amount: '2 capsules', time: '08:30' },
  { id: 'd4', medicine: 'Medicine D', amount: '5 ml', time: '18:00' },
];
