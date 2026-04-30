/**
 * __tests__/export.test.js
 *
 * Tests for the JSON export / import consistency of storage/storage.js.
 *
 * Coverage:
 *   1. exportToJSON — output structure (top-level keys, entry shape, field formats)
 *   2. exportToJSON — questionnaire section shape
 *   3. Field-format validation — clock fields, duration fields, medication arrays
 *   4. Round-trip fidelity — export → parse → importFromJSON → re-export preserves entries
 *   5. exportToJSON returns null when there is nothing to export
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  exportToJSON,
  importFromJSON,
  loadEntries,
  saveQuestionnaire,
  clearAll,
} from '../storage/storage';

// Reset in-memory AsyncStorage between tests.
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

/**
 * A realistic morning entry that exercises every field shape:
 *   - clock fields   (mq1, mq6, mq7)  → { hour, minute }
 *   - duration fields (mq3, mq5, mq8b) → { hours, minutes }
 *   - medication array (mq10b)          → [{ id, name, dose, times }]
 */
const MORNING_ENTRY = {
  id:          '2024-01-15-morning',
  type:        'morning',
  date:        '2024-01-15',
  completedAt: '2024-01-15T08:00:00.000Z',
  answers: {
    mq1:  { hour: 23, minute: 0  },    // bedtime
    mq3:  { hours: 0, minutes: 15 },   // sleep onset latency
    mq4:  'yes',
    mq4b: 2,
    mq5:  { hours: 0, minutes: 30 },   // WASO
    mq6:  { hour: 7,  minute: 0  },    // final wake (unused in metrics but stored)
    mq7:  { hour: 7,  minute: 30 },    // rise time
    mq8:  'yes',
    mq8b: { hours: 0, minutes: 20 },   // early waking duration
    mq9:  1,
    mq10b: [
      { id: 1705000000000, name: 'Melatonin', dose: '5 mg', times: ['22:00'] },
    ],
    mq11: 3,
    mq12: 4,
  },
};

const EVENING_ENTRY = {
  id:          '2024-01-14-evening',
  type:        'evening',
  date:        '2024-01-14',
  completedAt: '2024-01-14T22:00:00.000Z',
  answers: {
    eq1:  'yes',
    eq1b: { hours: 0, minutes: 45 },   // nap duration
    eq2:  2,
    eq3:  0,
    eq4b: [],                           // no evening medications
  },
};

const ESS_RESULT = {
  id:          'ess',
  completedAt: '2024-01-15T09:00:00.000Z',
  answers:     { ess1:2, ess2:1, ess3:2, ess4:0, ess5:1, ess6:0, ess7:1, ess8:2 },
  score:       9,
};

// Seed AsyncStorage with both diary entries
const seedEntries = async () => {
  await AsyncStorage.setItem('entries', JSON.stringify([MORNING_ENTRY, EVENING_ENTRY]));
};

// ─── 1. Top-level export structure ────────────────────────────────────────────

describe('exportToJSON — top-level structure', () => {
  it('returns null when there are no entries and no questionnaire results', async () => {
    expect(await exportToJSON('Lucas')).toBeNull();
  });

  it('returns a non-null string when entries exist', async () => {
    await seedEntries();
    const raw = await exportToJSON('Lucas');
    expect(raw).not.toBeNull();
    expect(typeof raw).toBe('string');
  });

  it('is valid JSON', async () => {
    await seedEntries();
    const raw = await exportToJSON('Lucas');
    expect(() => JSON.parse(raw)).not.toThrow();
  });

  it('contains all required top-level keys', async () => {
    await seedEntries();
    const obj = JSON.parse(await exportToJSON('Lucas'));
    expect(obj).toHaveProperty('participant');
    expect(obj).toHaveProperty('researchCode');
    expect(obj).toHaveProperty('exportedAt');
    expect(obj).toHaveProperty('entries');
    expect(obj).toHaveProperty('questionnaires');
  });

  it('participant matches the name passed in', async () => {
    await seedEntries();
    const obj = JSON.parse(await exportToJSON('Lucas'));
    expect(obj.participant).toBe('Lucas');
  });

  it('exportedAt is a valid ISO 8601 timestamp', async () => {
    await seedEntries();
    const obj = JSON.parse(await exportToJSON('Lucas'));
    expect(new Date(obj.exportedAt).toISOString()).toBe(obj.exportedAt);
  });

  it('entries is an array', async () => {
    await seedEntries();
    const obj = JSON.parse(await exportToJSON('Lucas'));
    expect(Array.isArray(obj.entries)).toBe(true);
  });

  it('questionnaires is an array', async () => {
    await seedEntries();
    const obj = JSON.parse(await exportToJSON('Lucas'));
    expect(Array.isArray(obj.questionnaires)).toBe(true);
  });
});

// ─── 2. Per-entry shape ───────────────────────────────────────────────────────

describe('exportToJSON — diary entry shape', () => {
  beforeEach(seedEntries);

  const getEntries = async (name = 'Lucas') => {
    const obj = JSON.parse(await exportToJSON(name));
    return obj.entries;
  };

  it('each entry has id, type, date, completedAt, answers', async () => {
    const entries = await getEntries();
    for (const e of entries) {
      expect(e).toHaveProperty('id');
      expect(e).toHaveProperty('type');
      expect(e).toHaveProperty('date');
      expect(e).toHaveProperty('completedAt');
      expect(e).toHaveProperty('answers');
    }
  });

  it('type is "morning" or "evening"', async () => {
    const entries = await getEntries();
    for (const e of entries) {
      expect(['morning', 'evening']).toContain(e.type);
    }
  });

  it('date matches YYYY-MM-DD format', async () => {
    const entries = await getEntries();
    const re = /^\d{4}-\d{2}-\d{2}$/;
    for (const e of entries) {
      expect(e.date).toMatch(re);
    }
  });

  it('completedAt is a valid ISO timestamp', async () => {
    const entries = await getEntries();
    for (const e of entries) {
      expect(new Date(e.completedAt).toISOString()).toBe(e.completedAt);
    }
  });

  it('id is composed of date and type separated by a hyphen', async () => {
    const entries = await getEntries();
    for (const e of entries) {
      expect(e.id).toBe(`${e.date}-${e.type}`);
    }
  });
});

// ─── 3. Field format validation ───────────────────────────────────────────────

describe('exportToJSON — answer field formats', () => {
  beforeEach(seedEntries);

  const getMorning = async () => {
    const obj = JSON.parse(await exportToJSON('Lucas'));
    return obj.entries.find((e) => e.type === 'morning').answers;
  };

  const getEvening = async () => {
    const obj = JSON.parse(await exportToJSON('Lucas'));
    return obj.entries.find((e) => e.type === 'evening').answers;
  };

  // Clock fields: { hour: number, minute: number }
  it('mq1 (bedtime) is a clock object with hour and minute keys', async () => {
    const a = await getMorning();
    expect(a.mq1).toHaveProperty('hour');
    expect(a.mq1).toHaveProperty('minute');
    expect(typeof a.mq1.hour).toBe('number');
    expect(typeof a.mq1.minute).toBe('number');
  });

  it('mq7 (rise time) is a clock object', async () => {
    const a = await getMorning();
    expect(a.mq7).toHaveProperty('hour');
    expect(a.mq7).toHaveProperty('minute');
  });

  // Duration fields: { hours: number, minutes: number }
  it('mq3 (SOL) is a duration object with hours and minutes keys', async () => {
    const a = await getMorning();
    expect(a.mq3).toHaveProperty('hours');
    expect(a.mq3).toHaveProperty('minutes');
    expect(typeof a.mq3.hours).toBe('number');
    expect(typeof a.mq3.minutes).toBe('number');
  });

  it('mq5 (WASO) is a duration object', async () => {
    const a = await getMorning();
    expect(a.mq5).toHaveProperty('hours');
    expect(a.mq5).toHaveProperty('minutes');
  });

  it('mq8b (early waking duration) is a duration object when present', async () => {
    const a = await getMorning();
    if (a.mq8b !== undefined) {
      expect(a.mq8b).toHaveProperty('hours');
      expect(a.mq8b).toHaveProperty('minutes');
    }
  });

  it('eq1b (nap duration) is a duration object when present', async () => {
    const a = await getEvening();
    if (a.eq1b !== undefined) {
      expect(a.eq1b).toHaveProperty('hours');
      expect(a.eq1b).toHaveProperty('minutes');
    }
  });

  // Medication arrays
  it('mq10b is an array', async () => {
    const a = await getMorning();
    expect(Array.isArray(a.mq10b)).toBe(true);
  });

  it('eq4b is an array', async () => {
    const a = await getEvening();
    expect(Array.isArray(a.eq4b)).toBe(true);
  });

  it('medication entries have id, name, dose, and times fields', async () => {
    const a = await getMorning();
    for (const med of a.mq10b) {
      expect(med).toHaveProperty('id');
      expect(med).toHaveProperty('name');
      expect(med).toHaveProperty('dose');
      expect(med).toHaveProperty('times');
      expect(Array.isArray(med.times)).toBe(true);
    }
  });

  it('clock hour values are integers in range 0–23', async () => {
    const a = await getMorning();
    for (const key of ['mq1', 'mq7']) {
      if (a[key]) {
        expect(a[key].hour).toBeGreaterThanOrEqual(0);
        expect(a[key].hour).toBeLessThanOrEqual(23);
        expect(Number.isInteger(a[key].hour)).toBe(true);
      }
    }
  });

  it('clock minute values are integers in range 0–59', async () => {
    const a = await getMorning();
    for (const key of ['mq1', 'mq7']) {
      if (a[key]) {
        expect(a[key].minute).toBeGreaterThanOrEqual(0);
        expect(a[key].minute).toBeLessThanOrEqual(59);
        expect(Number.isInteger(a[key].minute)).toBe(true);
      }
    }
  });
});

// ─── 4. Questionnaire section shape ──────────────────────────────────────────

describe('exportToJSON — questionnaire section', () => {
  beforeEach(async () => {
    await seedEntries();
    await saveQuestionnaire('ess', ESS_RESULT.answers, ESS_RESULT.score);
  });

  it('includes questionnaire results in the export', async () => {
    const obj = JSON.parse(await exportToJSON('Lucas'));
    expect(obj.questionnaires.length).toBeGreaterThan(0);
  });

  it('each questionnaire result has id, completedAt, answers, score', async () => {
    const obj = JSON.parse(await exportToJSON('Lucas'));
    for (const q of obj.questionnaires) {
      expect(q).toHaveProperty('id');
      expect(q).toHaveProperty('completedAt');
      expect(q).toHaveProperty('answers');
      expect(q).toHaveProperty('score');
    }
  });

  it('score is a number', async () => {
    const obj = JSON.parse(await exportToJSON('Lucas'));
    for (const q of obj.questionnaires) {
      expect(typeof q.score).toBe('number');
    }
  });

  it('answers is an object', async () => {
    const obj = JSON.parse(await exportToJSON('Lucas'));
    for (const q of obj.questionnaires) {
      expect(typeof q.answers).toBe('object');
      expect(q.answers).not.toBeNull();
    }
  });
});

// ─── 5. Round-trip fidelity ───────────────────────────────────────────────────

describe('exportToJSON — round-trip fidelity', () => {
  it('entries survive an export → import → re-export round trip', async () => {
    await seedEntries();

    // Export
    const firstExport = JSON.parse(await exportToJSON('Lucas'));

    // Clear store and re-import
    await AsyncStorage.clear();
    await importFromJSON(firstExport, 'replace');

    // Re-export
    const secondExport = JSON.parse(await exportToJSON('Lucas'));

    // Both exports should contain the same number of entries
    expect(secondExport.entries.length).toBe(firstExport.entries.length);

    // Entry IDs and dates should match exactly
    const firstIds  = firstExport.entries.map((e) => e.id).sort();
    const secondIds = secondExport.entries.map((e) => e.id).sort();
    expect(secondIds).toEqual(firstIds);
  });

  it('clock field shapes are preserved after round-trip', async () => {
    await seedEntries();
    const firstExport = JSON.parse(await exportToJSON('Lucas'));

    await AsyncStorage.clear();
    await importFromJSON(firstExport, 'replace');

    const entries = await loadEntries();
    const morning = entries.find((e) => e.type === 'morning');
    expect(morning.answers.mq1).toHaveProperty('hour');
    expect(morning.answers.mq1).toHaveProperty('minute');
    expect(morning.answers.mq3).toHaveProperty('hours');
    expect(morning.answers.mq3).toHaveProperty('minutes');
  });

  it('medication array is preserved after round-trip', async () => {
    await seedEntries();
    const firstExport = JSON.parse(await exportToJSON('Lucas'));

    await AsyncStorage.clear();
    await importFromJSON(firstExport, 'replace');

    const entries = await loadEntries();
    const morning = entries.find((e) => e.type === 'morning');
    expect(Array.isArray(morning.answers.mq10b)).toBe(true);
    expect(morning.answers.mq10b[0].name).toBe('Melatonin');
  });

  it('questionnaire results survive a round trip', async () => {
    await seedEntries();
    await saveQuestionnaire('ess', ESS_RESULT.answers, ESS_RESULT.score);

    const firstExport = JSON.parse(await exportToJSON('Lucas'));

    await AsyncStorage.clear();
    await importFromJSON(firstExport, 'replace');

    const secondExport = JSON.parse(await exportToJSON('Lucas'));
    const ess = secondExport.questionnaires.find((q) => q.id === 'ess');
    expect(ess).toBeDefined();
    expect(ess.score).toBe(9);
  });
});

// ─── 6. importFromJSON — validation edge cases ────────────────────────────────

describe('importFromJSON — JSON validation', () => {
  it('accepts a flat entries array (legacy format without wrapper object)', async () => {
    const flat = [MORNING_ENTRY];
    // validateImport handles both Array and { entries: Array } shapes
    const result = await importFromJSON(flat, 'merge');
    expect(result.imported).toBe(1);
  });

  it('accepts an empty entries array without throwing', async () => {
    const result = await importFromJSON({ entries: [] }, 'merge');
    expect(result.imported).toBe(0);
  });

  it('silently skips malformed questionnaire results during import', async () => {
    const parsed = {
      entries: [MORNING_ENTRY],
      questionnaires: [
        { id: 'ess' }, // missing answers and score — should be skipped silently
      ],
    };
    await expect(importFromJSON(parsed, 'merge')).resolves.not.toThrow();
  });
});
