/**
 * __tests__/dataSafety.test.js
 *
 * Tests for utils/dataSafety.js (when to show the install / back-up reminder)
 * and the storage helpers that remember exports and dismissals.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BACKUP_MIN_ENTRIES,
  BACKUP_INTERVAL_DAYS,
  BACKUP_DISMISS_DAYS,
  INSTALL_DISMISS_DAYS,
  pickReminder,
  requestPersistentStorage,
  isStandalonePwa,
  isTouchDevice,
} from '../utils/dataSafety';
import {
  recordExport,
  loadLastExportAt,
  loadDismissals,
  dismissReminder,
  clearAll,
} from '../storage/storage';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-10-19T12:00:00Z').getTime();
const daysAgo = (n) => NOW - n * DAY;

// A phone browser (not installed) with a few entries.
const webPhone = { isWeb: true, standalone: false, touch: true, now: NOW };

// ─── Install reminder ────────────────────────────────────────────────────────

describe('install reminder', () => {
  it('shows on a touch browser once there is at least one entry', () => {
    expect(pickReminder({ ...webPhone, entryCount: 1 })).toBe('install');
  });

  it('waits for the first entry', () => {
    expect(pickReminder({ ...webPhone, entryCount: 0 })).toBeNull();
  });

  it('is skipped on native, in an installed PWA, and on non-touch browsers', () => {
    expect(pickReminder({ ...webPhone, isWeb: false, entryCount: 3 })).toBeNull();
    expect(pickReminder({ ...webPhone, standalone: true, entryCount: 3 })).toBeNull();
    expect(pickReminder({ ...webPhone, touch: false, entryCount: 3 })).toBeNull();
  });

  it('stays quiet after being dismissed, then returns', () => {
    const recent = { install: daysAgo(INSTALL_DISMISS_DAYS - 1) };
    const old = { install: daysAgo(INSTALL_DISMISS_DAYS + 1) };
    expect(pickReminder({ ...webPhone, entryCount: 3, dismissals: recent })).toBeNull();
    expect(pickReminder({ ...webPhone, entryCount: 3, dismissals: old })).toBe('install');
  });
});

// ─── Backup reminder ─────────────────────────────────────────────────────────

describe('backup reminder', () => {
  const native = { isWeb: false, now: NOW };

  it('needs a minimum number of entries', () => {
    expect(pickReminder({ ...native, entryCount: BACKUP_MIN_ENTRIES - 1 })).toBeNull();
    expect(pickReminder({ ...native, entryCount: BACKUP_MIN_ENTRIES })).toBe('backup');
  });

  it('shows when the participant has never exported', () => {
    expect(pickReminder({ ...native, entryCount: 10, lastExportAt: null })).toBe('backup');
  });

  it('stays quiet after a recent export and returns after the interval', () => {
    expect(pickReminder({ ...native, entryCount: 10, lastExportAt: daysAgo(BACKUP_INTERVAL_DAYS - 1) })).toBeNull();
    expect(pickReminder({ ...native, entryCount: 10, lastExportAt: daysAgo(BACKUP_INTERVAL_DAYS) })).toBe('backup');
  });

  it('stays quiet after being dismissed, then returns', () => {
    const recent = { backup: daysAgo(BACKUP_DISMISS_DAYS - 1) };
    const old = { backup: daysAgo(BACKUP_DISMISS_DAYS + 1) };
    expect(pickReminder({ ...native, entryCount: 10, dismissals: recent })).toBeNull();
    expect(pickReminder({ ...native, entryCount: 10, dismissals: old })).toBe('backup');
  });

  it('works on the web too', () => {
    expect(pickReminder({ isWeb: true, standalone: true, touch: true, entryCount: 8, now: NOW })).toBe('backup');
  });
});

// ─── Priority ────────────────────────────────────────────────────────────────

describe('reminder priority', () => {
  it('shows the install reminder before the backup reminder', () => {
    expect(pickReminder({ ...webPhone, entryCount: 10 })).toBe('install');
  });

  it('falls through to the backup reminder once install is dismissed', () => {
    expect(
      pickReminder({ ...webPhone, entryCount: 10, dismissals: { install: daysAgo(1) } })
    ).toBe('backup');
  });

  it('returns null when nothing is due', () => {
    expect(pickReminder({ ...webPhone, standalone: true, entryCount: 10, lastExportAt: daysAgo(1) })).toBeNull();
  });

  it('copes with missing arguments', () => {
    expect(pickReminder()).toBeNull();
  });
});

// ─── Web helpers outside a browser ───────────────────────────────────────────

describe('web helpers in a non-web environment', () => {
  it('report false and never throw', async () => {
    expect(isStandalonePwa()).toBe(false);
    expect(isTouchDevice()).toBe(false);
    await expect(requestPersistentStorage()).resolves.toBe(false);
  });
});

// ─── Stored export time and dismissals ───────────────────────────────────────

describe('stored reminder state', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('has no last export until one is recorded', async () => {
    expect(await loadLastExportAt()).toBeNull();
  });

  it('round-trips the last export time', async () => {
    await recordExport(NOW);
    expect(await loadLastExportAt()).toBe(NOW);
  });

  it('treats a corrupted last export value as none', async () => {
    await AsyncStorage.setItem('last_export_at', 'yesterday');
    expect(await loadLastExportAt()).toBeNull();
  });

  it('remembers dismissals per reminder without overwriting the other', async () => {
    expect(await loadDismissals()).toEqual({});
    await dismissReminder('install', NOW);
    await dismissReminder('backup', NOW + 1);
    expect(await loadDismissals()).toEqual({ install: NOW, backup: NOW + 1 });
  });

  it('treats corrupted dismissals as empty', async () => {
    await AsyncStorage.setItem('data_safety_dismissals', 'not-json{{');
    expect(await loadDismissals()).toEqual({});
    await AsyncStorage.setItem('data_safety_dismissals', '[1,2]');
    expect(await loadDismissals()).toEqual({});
  });

  it('is removed by clearAll (log out / delete account)', async () => {
    await recordExport(NOW);
    await dismissReminder('backup', NOW);
    await clearAll();
    expect(await loadLastExportAt()).toBeNull();
    expect(await loadDismissals()).toEqual({});
  });
});
