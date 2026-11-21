import type { Medicine } from '../lib/doses.ts';

/**
 * Made-up sample medicines for the demo. Not real patient data.
 * Listed out of order on purpose: one medicine has two times, and two
 * share 08:00, so time order and A–Z tie-breaking are both exercised.
 * Replaced by the database in Week 5.
 */
export const mockMedicines: readonly Medicine[] = [
  { id: 1, name: 'Medicine D', dose: '1 tablet', times: ['20:00', '08:00'] },
  { id: 2, name: 'Medicine B', dose: '2 capsules', times: ['13:00'] },
  { id: 3, name: 'Medicine A', dose: '5 ml', times: ['08:00'] },
  { id: 4, name: 'Medicine C', dose: '1 tablet', times: ['18:00'] },
];
