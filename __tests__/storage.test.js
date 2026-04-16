/**
 * __tests__/storage.test.js
 *
 * Tests for storage/storage.js — focusing on:
 *   1. safeParseJSON — corruption recovery
 *   2. loadEntries / saveEntry — basic round-trip
 *   3. importFromJSON — merge and replace modes, questionnaire import
 */

// AsyncStorage is auto-mocked by jest-expo via the RN mock infrastructure.
// We use the mock's in-memory store to simulate device storage.
import AsyncStorage from '@react-native-async-storage/async-storage';

// Pull in the functions under test. Because storage.js uses ES module syntax
// we rely on babel-preset-expo (already configured) to transpile it for Jest.
import {
  loadEntries,
  saveEntry,
  loadName,
  saveName,
  loadQuestionnaire,
  saveQuestionnaire,
  importFromJSON,
  clearAll,
} from '../storage/storage';

// Reset in-memory AsyncStorage between every test.
beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeEntry = (date, type, overrides = {}) => ({
  id: `${date}-${type}`,
  type,
  date,
  completedAt: `${date}T08:00:00.000Z`,
  answers: { mq1: { hour: 22, minute: 30 } },
  ...overrides,
});

// ─── 1. safeParseJSON (tested indirectly via loadEntries) ─────────────────────

describe('safeParseJSON (via loadEntries)', () => {
  it('returns [] when storage is empty', async () => {
    expect(await loadEntries()).toEqual([]);
  });

  it('returns [] when stored value is not valid JSON', async () => {
    // Simulate corrupt storage
    await AsyncStorage.setItem('entries', 'not-valid-json{{{{');
    const result = await loadEntries();
    expect(result).toEqual([]);
  });

  it('returns [] when stored value is null', async () => {
    // AsyncStorage.getItem returns null for missing keys
    const result = await loadEntries();
    expect(result).toEqual([]);
  });

  it('returns the parsed array when storage contains valid JSON', async () => {
    const entry = makeEntry('2024-01-15', 'morning');
    await AsyncStorage.setItem('entries', JSON.stringify([entry]));
    const result = await loadEntries();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2024-01-15-morning');
  });
});

// ─── 2. loadName / saveName ───────────────────────────────────────────────────

describe('saveName / loadName', () => {
  it('returns null when no name is stored', async () => {
    expect(await loadName()).toBeNull();
  });

  it('stores and retrieves a name', async () => {
    await saveName('Lucas');
    expect(await loadName()).toBe('Lucas');
  });
});

// ─── 3. saveEntry ─────────────────────────────────────────────────────────────

describe('saveEntry', () => {
  it('saves a new entry and returns it', async () => {
    const entry = await saveEntry('morning', { mq1: { hour: 22, minute: 0 } });
    expect(entry.type).toBe('morning');
    expect(entry.answers.mq1).toEqual({ hour: 22, minute: 0 });
  });

  it('prepends the new entry so it appears first', async () => {
    // Pre-seed an older entry
    const old = makeEntry('2024-01-10', 'morning');
    await AsyncStorage.setItem('entries', JSON.stringify([old]));

    await saveEntry('morning', {});
    const entries = await loadEntries();
    // Newest entry should be first
    expect(entries[0].type).toBe('morning');
    expect(entries).toHaveLength(2);
  });

  it('replaces an existing entry for the same date and type', async () => {
    await saveEntry('morning', { mq1: { hour: 22, minute: 0 } });
    await saveEntry('morning', { mq1: { hour: 23, minute: 30 } });
    const entries = await loadEntries();
    // Should still only have one morning entry for today
    expect(entries).toHaveLength(1);
    expect(entries[0].answers.mq1).toEqual({ hour: 23, minute: 30 });
  });
});

// ─── 4. saveQuestionnaire / loadQuestionnaire ─────────────────────────────────

describe('saveQuestionnaire / loadQuestionnaire', () => {
  it('returns null for a questionnaire that has not been completed', async () => {
    expect(await loadQuestionnaire('ess')).toBeNull();
  });

  it('saves and retrieves a questionnaire result', async () => {
    const answers = { ess1: 2, ess2: 1 };
    const result = await saveQuestionnaire('ess', answers, 12);
    expect(result.id).toBe('ess');
    expect(result.score).toBe(12);

    const loaded = await loadQuestionnaire('ess');
    expect(loaded.score).toBe(12);
    expect(loaded.answers).toEqual(answers);
  });

  it('handles corrupt questionnaire data gracefully', async () => {
    await AsyncStorage.setItem('questionnaire_ess', 'not-json');
    expect(await loadQuestionnaire('ess')).toBeNull();
  });
});

// ─── 5. importFromJSON ────────────────────────────────────────────────────────

describe('importFromJSON — merge mode', () => {
  it('imports entries into an empty store', async () => {
    const parsed = {
      entries: [makeEntry('2024-01-10', 'morning'), makeEntry('2024-01-10', 'evening')],
    };
    const result = await importFromJSON(parsed, 'merge');
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(await loadEntries()).toHaveLength(2);
  });

  it('skips entries that already exist (same id)', async () => {
    const existing = makeEntry('2024-01-10', 'morning', { answers: { mq1: { hour: 21, minute: 0 } } });
    await AsyncStorage.setItem('entries', JSON.stringify([existing]));

    const incoming = makeEntry('2024-01-10', 'morning', { answers: { mq1: { hour: 23, minute: 0 } } });
    const result = await importFromJSON({ entries: [incoming] }, 'merge');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    // Existing answer should be untouched
    const entries = await loadEntries();
    expect(entries[0].answers.mq1.hour).toBe(21);
  });

  it('adds only new entries when some already exist', async () => {
    const existing = makeEntry('2024-01-10', 'morning');
    await AsyncStorage.setItem('entries', JSON.stringify([existing]));

    const parsed = {
      entries: [
        makeEntry('2024-01-10', 'morning'),   // duplicate — skip
        makeEntry('2024-01-11', 'morning'),   // new — import
      ],
    };
    const result = await importFromJSON(parsed, 'merge');
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
    expect(await loadEntries()).toHaveLength(2);
  });

  it('imports questionnaire results not already present', async () => {
    const parsed = {
      entries: [makeEntry('2024-01-10', 'morning')],
      questionnaires: [
        { id: 'ess', completedAt: '2024-01-10T09:00:00Z', answers: { ess1: 2 }, score: 8 },
      ],
    };
    await importFromJSON(parsed, 'merge');
    const q = await loadQuestionnaire('ess');
    expect(q.score).toBe(8);
  });

  it('does not overwrite an existing questionnaire result in merge mode', async () => {
    await saveQuestionnaire('ess', { ess1: 3 }, 15);
    const parsed = {
      entries: [],
      questionnaires: [
        { id: 'ess', completedAt: '2024-01-10T09:00:00Z', answers: { ess1: 0 }, score: 0 },
      ],
    };
    await importFromJSON(parsed, 'merge');
    const q = await loadQuestionnaire('ess');
    expect(q.score).toBe(15); // original preserved
  });
});

describe('importFromJSON — replace mode', () => {
  it('replaces all existing entries', async () => {
    const existing = [makeEntry('2024-01-05', 'morning'), makeEntry('2024-01-06', 'morning')];
    await AsyncStorage.setItem('entries', JSON.stringify(existing));

    const incoming = [makeEntry('2024-02-01', 'morning')];
    const result = await importFromJSON({ entries: incoming }, 'replace');

    expect(result.imported).toBe(1);
    const entries = await loadEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0].date).toBe('2024-02-01');
  });

  it('overwrites existing questionnaire results in replace mode', async () => {
    await saveQuestionnaire('ess', { ess1: 3 }, 15);
    const parsed = {
      entries: [makeEntry('2024-01-10', 'morning')],
      questionnaires: [
        { id: 'ess', completedAt: '2024-01-10T09:00:00Z', answers: { ess1: 0 }, score: 0 },
      ],
    };
    await importFromJSON(parsed, 'replace');
    const q = await loadQuestionnaire('ess');
    expect(q.score).toBe(0); // replaced
  });
});

describe('importFromJSON — validation', () => {
  it('throws if the parsed object has no entries array', async () => {
    await expect(importFromJSON({ foo: 'bar' }, 'merge')).rejects.toThrow();
  });

  it('throws if the parsed object is null', async () => {
    await expect(importFromJSON(null, 'merge')).rejects.toThrow();
  });

  it('throws if all entries are invalid (missing required fields)', async () => {
    await expect(importFromJSON({ entries: [{ bad: true }] }, 'merge')).rejects.toThrow(
      'No valid entries found'
    );
  });

  it('filters out invalid entries but imports valid ones', async () => {
    const parsed = {
      entries: [
        { bad: true },                        // invalid — no id/type/date/answers
        makeEntry('2024-01-10', 'morning'),   // valid
      ],
    };
    const result = await importFromJSON(parsed, 'merge');
    expect(result.imported).toBe(1);
  });
});
