/**
 * __tests__/i18n.test.js
 *
 * Tests for i18n/index.js — the t() helper and locale resolution.
 *
 * expo-localization's getLocales() throws in Jest (no native runtime), so
 * i18n/index.js falls back to English automatically. All tests therefore
 * validate against the English bundle (i18n/en.js).
 *
 * Coverage:
 *   1. Simple key lookup
 *   2. Nested key lookup
 *   3. Missing key — returns raw key string
 *   4. {{variable}} interpolation
 *   5. Pluralisation (_one / _other)
 *   6. Pluralisation with interpolation combined
 *   7. Direct access to _one / _other keys
 *   8. Non-string node — returns key
 *   9. strings export completeness checks
 */

import t, { strings, locale } from '../i18n';

// ─── 1. Simple key lookup ─────────────────────────────────────────────────────

describe('t() — simple keys', () => {
  it('returns the English string for a top-level nested key', () => {
    expect(t('login.cta')).toBe("Let's go");
  });

  it('returns the correct value for settings.title', () => {
    expect(t('settings.title')).toBe('Settings');
  });

  it('returns the correct value for common.ok', () => {
    expect(t('common.ok')).toBe('OK');
  });
});

// ─── 2. Nested key lookup ─────────────────────────────────────────────────────

describe('t() — deeply nested keys', () => {
  it('resolves three levels deep (profile.glossary.sleepDuration.title)', () => {
    expect(t('profile.glossary.sleepDuration.title')).toBe('Sleep Duration');
  });

  it('resolves entry.a11y.morningStart', () => {
    expect(t('entry.a11y.morningStart')).toBe('Start morning entry');
  });

  it('resolves questionnaire.saveErrorTitle', () => {
    expect(t('questionnaire.saveErrorTitle')).toBe('Could not save entry');
  });
});

// ─── 3. Missing keys ─────────────────────────────────────────────────────────

describe('t() — missing keys', () => {
  it('returns the raw key when the path does not exist', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('returns the raw key for a partially valid path', () => {
    expect(t('login.doesNotExist')).toBe('login.doesNotExist');
  });

  it('returns the raw key when an intermediate node is not an object', () => {
    // 'login.cta' is a string; descending further should return the key
    expect(t('login.cta.further')).toBe('login.cta.further');
  });
});

// ─── 4. Interpolation ────────────────────────────────────────────────────────

describe('t() — {{variable}} interpolation', () => {
  it('replaces a single variable', () => {
    // 'entry.statsUnlock' = 'Sleep stats unlock after {{count}} more morning entries'
    expect(t('entry.statsUnlock', { count: 5 })).toBe(
      'Sleep stats unlock after 5 more morning entries'
    );
  });

  it('leaves unreplaced placeholders intact when variable is missing', () => {
    expect(t('entry.statsUnlock', {})).toBe(
      'Sleep stats unlock after {{count}} more morning entries'
    );
  });

  it('coerces numeric values to strings', () => {
    expect(t('report.notEnoughSubtitle', { count: 14 })).toBe(
      'Complete at least 14 morning entries to generate your report.'
    );
  });
});

// ─── 5. Pluralisation ────────────────────────────────────────────────────────

describe('t() — pluralisation', () => {
  it('uses the _one variant when count === 1', () => {
    expect(t('home.entriesNeeded', { count: 1 })).toBe('1 more entry needed');
  });

  it('uses the _other variant when count > 1', () => {
    expect(t('home.entriesNeeded', { count: 3 })).toBe('3 more entries needed');
  });

  it('uses _other for count === 0', () => {
    expect(t('home.entriesNeeded', { count: 0 })).toBe('0 more entries needed');
  });

  it('report.morningEntries — singular', () => {
    expect(t('report.morningEntries', { count: 1 })).toBe('1 morning entry');
  });

  it('report.morningEntries — plural', () => {
    expect(t('report.morningEntries', { count: 7 })).toBe('7 morning entries');
  });
});

// ─── 6. Direct _one / _other key access ──────────────────────────────────────

describe('t() — direct plural key access', () => {
  it('resolves home.entriesNeeded_one directly', () => {
    expect(t('home.entriesNeeded_one', { count: 1 })).toBe('1 more entry needed');
  });

  it('resolves home.entriesNeeded_other directly', () => {
    expect(t('home.entriesNeeded_other', { count: 5 })).toBe('5 more entries needed');
  });
});

// ─── 7. Non-string nodes return the key ──────────────────────────────────────

describe('t() — non-string values', () => {
  it('returns the key when the resolved value is an object (not a leaf string)', () => {
    // 'profile.glossary' resolves to an object, not a string
    expect(t('profile.glossary')).toBe('profile.glossary');
  });

  it('returns the key when the resolved value is an array (instructions.slides)', () => {
    expect(t('instructions.slides')).toBe('instructions.slides');
  });
});

// ─── 8. locale fallback ───────────────────────────────────────────────────────

describe('locale resolution', () => {
  it('falls back to "en" in the Jest environment (no native runtime)', () => {
    // expo-localization throws → resolveTranslations() returns { locale: 'en' }
    expect(locale).toBe('en');
  });
});

// ─── 9. strings export — key completeness spot-checks ────────────────────────

describe('strings export', () => {
  it('exports the English bundle as a plain object', () => {
    expect(typeof strings).toBe('object');
    expect(strings).not.toBeNull();
  });

  it('contains all top-level namespace keys', () => {
    const expected = [
      'login', 'home', 'entry', 'profile', 'pastEntries', 'export',
      'report', 'settings', 'profileQuestionnaires', 'questionnaireModal',
      'questionnaire', 'instructions', 'common', 'medications',
    ];
    for (const key of expected) {
      expect(strings).toHaveProperty(key);
    }
  });

  it('questionnaire block contains both back/next and saveError keys', () => {
    expect(strings.questionnaire.back).toBe('Back');
    expect(strings.questionnaire.next).toBe('Next');
    expect(strings.questionnaire.saveErrorTitle).toBe('Could not save entry');
    expect(strings.questionnaire.saveErrorBody).toMatch(/something went wrong/i);
  });

  it('report block contains efficiency status labels', () => {
    expect(strings.report.efficiencyGood).toBeTruthy();
    expect(strings.report.efficiencyLow).toBeTruthy();
  });

  it('entry.a11y contains all five accessibility labels', () => {
    const a11y = strings.entry.a11y;
    expect(a11y.morningStart).toBeTruthy();
    expect(a11y.morningCompleted).toBeTruthy();
    expect(a11y.eveningStart).toBeTruthy();
    expect(a11y.eveningCompleted).toBeTruthy();
    expect(a11y.eveningLocked).toBeTruthy();
  });
});
