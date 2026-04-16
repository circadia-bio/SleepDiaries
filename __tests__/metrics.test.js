/**
 * __tests__/metrics.test.js
 *
 * Tests for utils/metrics.js — computeMetrics()
 *
 * computeMetrics receives an array of morning diary entries and derives
 * aggregate sleep stats. All fields are independently testable by supplying
 * controlled answer objects.
 *
 * Answer key reference (morning questionnaire):
 *   mq1  — bedtime          { hour, minute }
 *   mq3  — sleep onset latency  { hours, minutes }
 *   mq4  — any night wakings?   'yes' | 'no'
 *   mq4b — number of wakings    number  (when mq4 === 'yes')
 *   mq5  — WASO duration        { hours, minutes }
 *   mq7  — rise time            { hour, minute }
 *   mq8  — early waking?        'yes' | 'no'
 *   mq9  — alcohol units        number
 *   mq11 — sleep quality        1–5
 *   mq12 — restedness           1–5
 */

import { computeMetrics } from '../utils/metrics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a minimal morning entry with fully specified timing answers.
 *
 * @param {Object} answers - Merged into a safe default set
 */
const makeEntry = (answers = {}) => ({
  id: 'test-morning',
  type: 'morning',
  date: '2024-01-15',
  completedAt: '2024-01-15T08:00:00.000Z',
  answers: {
    mq1:  { hour: 23, minute: 0 },   // bedtime 23:00
    mq3:  { hours: 0, minutes: 15 }, // SOL 15 min
    mq4:  'no',                       // no wakings
    mq5:  { hours: 0, minutes: 0 },  // no WASO
    mq7:  { hour: 7, minute: 0 },    // rise 07:00
    mq8:  'no',                       // no early waking
    mq9:  0,                          // no alcohol
    mq11: 4,                          // quality 4/5
    mq12: 3,                          // restedness 3/5
    ...answers,
  },
});

// ─── 1. Empty input ───────────────────────────────────────────────────────────

describe('computeMetrics — empty input', () => {
  it('returns n=0 and null averages when given no entries', () => {
    const result = computeMetrics([]);
    expect(result.n).toBe(0);
    expect(result.avgSleepDuration).toBeNull();
    expect(result.avgSleepEfficiency).toBeNull();
    expect(result.avgSleepOnsetLatency).toBeNull();
    expect(result.avgWASO).toBeNull();
    expect(result.avgQuality).toBeNull();
    expect(result.avgRestedness).toBeNull();
    expect(result.avgNightWakings).toBeNull();
    expect(result.avgAlcohol).toBeNull();
    expect(result.earlyWakingPct).toBeNull();
  });
});

// ─── 2. Sleep duration ────────────────────────────────────────────────────────

describe('computeMetrics — sleep duration', () => {
  it('computes TST for an overnight sleep (23:00 → 07:00, SOL 15 min, no WASO)', () => {
    // TIB = (07:00 + 1440) - 23:00 = 480 min = 8 h
    // TST = 480 - 15 - 0 = 465 min = 7h 45m
    const result = computeMetrics([makeEntry()]);
    expect(result.avgSleepDuration).toBeCloseTo(465);
  });

  it('handles same-day bedtime and rise (e.g. nap: 14:00 → 15:30, SOL 5 min)', () => {
    const entry = makeEntry({
      mq1: { hour: 14, minute: 0 },
      mq7: { hour: 15, minute: 30 },
      mq3: { hours: 0, minutes: 5 },
      mq5: { hours: 0, minutes: 0 },
    });
    // TIB = 90, TST = 85
    const result = computeMetrics([entry]);
    expect(result.avgSleepDuration).toBeCloseTo(85);
  });

  it('floors TST at 0 when SOL + WASO exceed TIB', () => {
    const entry = makeEntry({
      mq1: { hour: 23, minute: 0 },
      mq7: { hour: 23, minute: 30 },
      mq3: { hours: 0, minutes: 40 }, // SOL 40 min
      mq5: { hours: 0, minutes: 20 }, // WASO 20 min — total 60 min > TIB 30 min
    });
    const result = computeMetrics([entry]);
    expect(result.avgSleepDuration).toBe(0);
  });

  it('averages TST over multiple entries', () => {
    // Entry 1: TST 465 (as above)
    // Entry 2: bedtime 00:00, rise 08:00, SOL 30, no WASO → TIB 480, TST 450
    const e1 = makeEntry();
    const e2 = makeEntry({
      mq1: { hour: 0, minute: 0 },
      mq7: { hour: 8, minute: 0 },
      mq3: { hours: 0, minutes: 30 },
      mq5: { hours: 0, minutes: 0 },
    });
    const result = computeMetrics([e1, e2]);
    expect(result.avgSleepDuration).toBeCloseTo((465 + 450) / 2);
  });
});

// ─── 3. Sleep efficiency ──────────────────────────────────────────────────────

describe('computeMetrics — sleep efficiency', () => {
  it('calculates efficiency as TST/TIB × 100 (rounded)', () => {
    // TIB 480, TST 465 → 96.875% → rounded 97
    const result = computeMetrics([makeEntry()]);
    expect(result.avgSleepEfficiency).toBeCloseTo(97, 0);
  });

  it('returns null efficiency when bedtime or rise time is absent', () => {
    const entry = makeEntry({ mq1: undefined, mq7: undefined });
    const result = computeMetrics([entry]);
    expect(result.avgSleepEfficiency).toBeNull();
  });
});

// ─── 4. Sleep onset latency ───────────────────────────────────────────────────

describe('computeMetrics — sleep onset latency', () => {
  it('returns the average SOL in minutes', () => {
    const e1 = makeEntry({ mq3: { hours: 0, minutes: 10 } }); // 10 min
    const e2 = makeEntry({ mq3: { hours: 0, minutes: 20 } }); // 20 min
    const result = computeMetrics([e1, e2]);
    expect(result.avgSleepOnsetLatency).toBeCloseTo(15);
  });

  it('treats missing SOL fields as 0 minutes', () => {
    const entry = makeEntry({ mq3: undefined });
    const result = computeMetrics([entry]);
    // durationToMinutes(undefined) === 0
    expect(result.avgSleepOnsetLatency).toBeCloseTo(0);
  });
});

// ─── 5. WASO ─────────────────────────────────────────────────────────────────

describe('computeMetrics — WASO', () => {
  it('returns the average WASO in minutes', () => {
    const e1 = makeEntry({ mq5: { hours: 0, minutes: 30 } });
    const e2 = makeEntry({ mq5: { hours: 1, minutes: 0 } });  // 60 min
    const result = computeMetrics([e1, e2]);
    expect(result.avgWASO).toBeCloseTo(45);
  });
});

// ─── 6. Night wakings ─────────────────────────────────────────────────────────

describe('computeMetrics — night wakings', () => {
  it('records 0 wakings when mq4 is "no"', () => {
    const result = computeMetrics([makeEntry({ mq4: 'no' })]);
    expect(result.avgNightWakings).toBe(0);
  });

  it('records mq4b wakings when mq4 is "yes"', () => {
    const result = computeMetrics([makeEntry({ mq4: 'yes', mq4b: 3 })]);
    expect(result.avgNightWakings).toBe(3);
  });

  it('ignores entries without a waking answer (mq4 not present)', () => {
    const entry = makeEntry({ mq4: undefined, mq4b: undefined });
    const result = computeMetrics([entry]);
    // nw array stays empty → null average
    expect(result.avgNightWakings).toBeNull();
  });

  it('averages over multiple entries', () => {
    const e1 = makeEntry({ mq4: 'no' });            // 0
    const e2 = makeEntry({ mq4: 'yes', mq4b: 4 }); // 4
    const result = computeMetrics([e1, e2]);
    expect(result.avgNightWakings).toBeCloseTo(2);
  });
});

// ─── 7. Quality and restedness ────────────────────────────────────────────────

describe('computeMetrics — quality & restedness', () => {
  it('averages mq11 (quality) across entries', () => {
    const entries = [
      makeEntry({ mq11: 2 }),
      makeEntry({ mq11: 4 }),
    ];
    const result = computeMetrics(entries);
    expect(result.avgQuality).toBeCloseTo(3);
  });

  it('averages mq12 (restedness) across entries', () => {
    const entries = [
      makeEntry({ mq12: 1 }),
      makeEntry({ mq12: 5 }),
    ];
    const result = computeMetrics(entries);
    expect(result.avgRestedness).toBeCloseTo(3);
  });

  it('returns null quality when no entry has mq11', () => {
    const result = computeMetrics([makeEntry({ mq11: undefined })]);
    expect(result.avgQuality).toBeNull();
  });
});

// ─── 8. Alcohol ───────────────────────────────────────────────────────────────

describe('computeMetrics — alcohol', () => {
  it('averages alcohol units (mq9) across entries', () => {
    const entries = [
      makeEntry({ mq9: 0 }),
      makeEntry({ mq9: 2 }),
      makeEntry({ mq9: 4 }),
    ];
    const result = computeMetrics(entries);
    expect(result.avgAlcohol).toBeCloseTo(2);
  });

  it('returns null when no entry has mq9', () => {
    const result = computeMetrics([makeEntry({ mq9: undefined })]);
    expect(result.avgAlcohol).toBeNull();
  });
});

// ─── 9. Early waking percentage ──────────────────────────────────────────────

describe('computeMetrics — earlyWakingPct', () => {
  it('is 0% when no early waking was reported', () => {
    const entries = [makeEntry({ mq8: 'no' }), makeEntry({ mq8: 'no' })];
    const result = computeMetrics(entries);
    expect(result.earlyWakingPct).toBe(0);
  });

  it('is 100% when all entries report early waking', () => {
    const entries = [makeEntry({ mq8: 'yes' }), makeEntry({ mq8: 'yes' })];
    const result = computeMetrics(entries);
    expect(result.earlyWakingPct).toBe(100);
  });

  it('is 50% when half the entries report early waking', () => {
    const entries = [makeEntry({ mq8: 'yes' }), makeEntry({ mq8: 'no' })];
    const result = computeMetrics(entries);
    expect(result.earlyWakingPct).toBe(50);
  });

  it('returns null when no entry has mq8', () => {
    const result = computeMetrics([makeEntry({ mq8: undefined })]);
    expect(result.earlyWakingPct).toBeNull();
  });
});

// ─── 10. Robustness ───────────────────────────────────────────────────────────

describe('computeMetrics — robustness', () => {
  it('skips entries whose answers field is null or undefined', () => {
    const entries = [
      { id: 'bad', type: 'morning', date: '2024-01-15', answers: null },
      makeEntry(),
    ];
    const result = computeMetrics(entries);
    expect(result.n).toBe(2); // n counts all, only 1 contributes to averages
    expect(result.avgSleepDuration).toBeCloseTo(465); // from the valid entry
  });

  it('returns n equal to the total number of entries passed in', () => {
    const entries = [makeEntry(), makeEntry(), makeEntry()];
    expect(computeMetrics(entries).n).toBe(3);
  });
});
