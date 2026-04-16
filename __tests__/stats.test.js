/**
 * __tests__/stats.test.js
 *
 * Tests for utils/stats.js — computeStats()
 *
 * The streak and daysInStudy calculations depend on today's date, so we pin
 * the clock to a known value with jest.useFakeTimers() for determinism.
 */

import { computeStats } from '../utils/stats';

// Pin "today" to 2024-01-20 for all tests.
const TODAY = '2024-01-20';

beforeAll(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(`${TODAY}T12:00:00.000Z`));
});

afterAll(() => {
  jest.useRealTimers();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEntry = (date, type) => ({
  id: `${date}-${type}`,
  type,
  date,
  completedAt: `${date}T08:00:00.000Z`,
  answers: {},
});

// ─── 1. Empty / no entries ────────────────────────────────────────────────────

describe('computeStats — no entries', () => {
  it('returns zero counts and zero daysInStudy when entries is empty', () => {
    const result = computeStats([]);
    expect(result.morningCount).toBe(0);
    expect(result.eveningCount).toBe(0);
    expect(result.daysInStudy).toBe(0);
    expect(result.streak).toBe(0);
  });
});

// ─── 2. Entry type counts ─────────────────────────────────────────────────────

describe('computeStats — type counts', () => {
  it('counts morning and evening entries separately', () => {
    const entries = [
      makeEntry('2024-01-15', 'morning'),
      makeEntry('2024-01-15', 'evening'),
      makeEntry('2024-01-16', 'morning'),
    ];
    const { morningCount, eveningCount } = computeStats(entries);
    expect(morningCount).toBe(2);
    expect(eveningCount).toBe(1);
  });

  it('handles only morning entries', () => {
    const entries = [makeEntry('2024-01-18', 'morning'), makeEntry('2024-01-19', 'morning')];
    const { morningCount, eveningCount } = computeStats(entries);
    expect(morningCount).toBe(2);
    expect(eveningCount).toBe(0);
  });

  it('handles only evening entries', () => {
    const entries = [makeEntry('2024-01-19', 'evening')];
    const { morningCount, eveningCount } = computeStats(entries);
    expect(morningCount).toBe(0);
    expect(eveningCount).toBe(1);
  });
});

// ─── 3. daysInStudy ───────────────────────────────────────────────────────────

describe('computeStats — daysInStudy', () => {
  it('is 1 when the only entry is from today', () => {
    const { daysInStudy } = computeStats([makeEntry(TODAY, 'morning')]);
    expect(daysInStudy).toBe(1);
  });

  it('is 6 when first entry was 5 days ago', () => {
    const { daysInStudy } = computeStats([makeEntry('2024-01-15', 'morning')]);
    expect(daysInStudy).toBe(6);
  });

  it('uses the earliest date across entry types', () => {
    const entries = [
      makeEntry('2024-01-18', 'evening'),
      makeEntry('2024-01-15', 'morning'), // earliest
      makeEntry('2024-01-20', 'morning'),
    ];
    // today(1-20) - firstDate(1-15) = 5 days → daysInStudy = 6
    const { daysInStudy } = computeStats(entries);
    expect(daysInStudy).toBe(6);
  });
});

// ─── 4. streak ────────────────────────────────────────────────────────────────

describe('computeStats — streak', () => {
  it('is 0 when there are no morning entries for today', () => {
    const entries = [makeEntry('2024-01-19', 'evening')]; // no morning
    const { streak } = computeStats(entries);
    expect(streak).toBe(0);
  });

  it('is 1 when only today has a morning entry', () => {
    const { streak } = computeStats([makeEntry(TODAY, 'morning')]);
    expect(streak).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    const entries = [
      makeEntry('2024-01-20', 'morning'), // today
      makeEntry('2024-01-19', 'morning'), // -1
      makeEntry('2024-01-18', 'morning'), // -2
    ];
    const { streak } = computeStats(entries);
    expect(streak).toBe(3);
  });

  it('breaks the streak when a day is missing', () => {
    const entries = [
      makeEntry('2024-01-20', 'morning'), // today
      // 2024-01-19 missing — streak breaks here
      makeEntry('2024-01-18', 'morning'),
    ];
    const { streak } = computeStats(entries);
    expect(streak).toBe(1);
  });

  it('does not count evening entries toward the streak', () => {
    const entries = [
      makeEntry('2024-01-20', 'morning'),
      makeEntry('2024-01-19', 'evening'), // evening only — does not extend streak
    ];
    const { streak } = computeStats(entries);
    expect(streak).toBe(1);
  });

  it('is 0 when the most recent morning entry was yesterday and today is missing', () => {
    // Today = 2024-01-20, latest morning = 2024-01-19
    const entries = [makeEntry('2024-01-19', 'morning')];
    const { streak } = computeStats(entries);
    expect(streak).toBe(0);
  });
});
