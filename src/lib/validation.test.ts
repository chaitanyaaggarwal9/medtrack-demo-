import {
  dateSchema,
  doseLogInputSchema,
  fieldErrors,
  idSchema,
  medicineInputSchema,
  medicineUpdateSchema,
  timeSchema,
} from './validation.ts';

const good = {
  name: 'Medicine A',
  doseText: '1 tablet',
  times: ['08:00', '20:00'],
};

describe('medicineInputSchema', () => {
  it('accepts a normal medicine and trims spaces', () => {
    const result = medicineInputSchema.parse({
      ...good,
      name: '  Medicine A  ',
    });
    expect(result).toEqual(good);
  });

  it.each([
    ['empty name', { ...good, name: '   ' }, 'name'],
    ['name over 100 characters', { ...good, name: 'x'.repeat(101) }, 'name'],
    ['empty dose', { ...good, doseText: '' }, 'doseText'],
    [
      'dose over 100 characters',
      { ...good, doseText: 'x'.repeat(101) },
      'doseText',
    ],
    ['no times', { ...good, times: [] }, 'times'],
    [
      '7 times',
      {
        ...good,
        times: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00'],
      },
      'times',
    ],
    ['the same time twice', { ...good, times: ['08:00', '08:00'] }, 'times'],
    ['a time like 99:99', { ...good, times: ['99:99'] }, 'times'],
    ['a time like 24:00', { ...good, times: ['24:00'] }, 'times'],
    ['a time without a leading zero', { ...good, times: ['8:00'] }, 'times'],
    ['a number instead of text', { ...good, name: 42 }, 'name'],
  ])('rejects %s', (_label, input, field) => {
    const result = medicineInputSchema.safeParse(input);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(fieldErrors(result.error)).toHaveProperty(field);
  });

  it('accepts exactly 100 characters and exactly 6 times', () => {
    const result = medicineInputSchema.safeParse({
      name: 'x'.repeat(100),
      doseText: 'y'.repeat(100),
      times: ['01:00', '02:00', '03:00', '04:00', '05:00', '06:00'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown fields such as userId (the server decides the user)', () => {
    const result = medicineInputSchema.safeParse({
      ...good,
      userId: 'someone-else',
    });
    expect(result.success).toBe(false);
  });

  it('gives plain-language messages that say how to fix the problem', () => {
    const result = medicineInputSchema.safeParse({
      name: '',
      doseText: '',
      times: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)).toEqual({
        name: 'Enter the medicine name.',
        doseText: 'Enter the dose exactly as it is written on the label.',
        times: 'Add at least one time.',
      });
    }
  });
});

describe('medicineUpdateSchema', () => {
  it('accepts a change to only one field', () => {
    expect(medicineUpdateSchema.safeParse({ times: ['09:00'] }).success).toBe(
      true,
    );
  });

  it('rejects an empty update', () => {
    expect(medicineUpdateSchema.safeParse({}).success).toBe(false);
  });

  it('still checks the rules of each field', () => {
    expect(medicineUpdateSchema.safeParse({ name: '' }).success).toBe(false);
  });
});

describe('ids, dates and times', () => {
  it('accepts a uuid and rejects other ids', () => {
    expect(
      idSchema.safeParse('a0000000-0000-4000-8000-000000000001').success,
    ).toBe(true);
    for (const bad of [
      '1',
      '',
      '../etc',
      'a0000000-0000-4000-8000-00000000000Z',
    ]) {
      expect(idSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('accepts real dates only', () => {
    expect(dateSchema.safeParse('2026-11-21').success).toBe(true);
    for (const bad of ['2026-13-01', '2026-02-30', '21/11/2026', '']) {
      expect(dateSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('accepts 00:00 and 23:59', () => {
    expect(timeSchema.safeParse('00:00').success).toBe(true);
    expect(timeSchema.safeParse('23:59').success).toBe(true);
  });

  it('checks a tick: medicine id, day and planned time', () => {
    const tick = {
      medicineId: 'b0000000-0000-4000-8000-000000000001',
      doseDate: '2026-11-21',
      scheduledTime: '08:00',
    };
    expect(doseLogInputSchema.safeParse(tick).success).toBe(true);
    expect(
      doseLogInputSchema.safeParse({ ...tick, scheduledTime: '8am' }).success,
    ).toBe(false);
    expect(
      doseLogInputSchema.safeParse({ ...tick, takenAt: 'yesterday' }).success,
    ).toBe(false);
  });
});
