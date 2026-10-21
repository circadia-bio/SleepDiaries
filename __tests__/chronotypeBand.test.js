/**
 * __tests__/chronotypeBand.test.js
 *
 * Tests for utils/chronotypeBand.js and the band-width helpers in
 * storage/storage.js:
 *   1. getChronotypeBand — centre from MSFsc, widths, and when no band is drawn
 *   2. isMidSleepInBand — edges, outside, and a band that straddles midnight
 *   3. formatBandClock
 *   4. Agreement with the real MCTQ scoring in data/questionnaires.js
 *   5. loadBandWidth / saveBandWidth round-trip and validation
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BAND_WIDTH_OPTIONS,
  DEFAULT_BAND_WIDTH,
  getChronotypeBand,
  isMidSleepInBand,
  isValidBandWidth,
  formatBandClock,
} from '../utils/chronotypeBand';
import { MCTQ } from '../data/questionnaires';
import { loadBandWidth, saveBandWidth, clearAll } from '../storage/storage';

const mctqResult = (msf_sc, answers = { mctq_wd: 5 }) => ({
  id: 'mctq',
  answers,
  score: { msf_sc, sjl: 0.5 },
});

let warnSpy;

beforeEach(async () => {
  await AsyncStorage.clear();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

// ─── 1. getChronotypeBand ─────────────────────────────────────────────────────

describe('getChronotypeBand', () => {
  it('centres the band on MSFsc in shifted minutes (03:30 → 27.5 h)', () => {
    const band = getChronotypeBand(mctqResult(3.5));
    expect(band).toEqual({ centre: 1650, lo: 1620, hi: 1680, halfWidth: 30 });
    expect(formatBandClock(band.lo)).toBe('03:00');
    expect(formatBandClock(band.hi)).toBe('04:00');
  });

  it('keeps an evening MSFsc on the same day (no shift at or after noon)', () => {
    expect(getChronotypeBand(mctqResult(23.5)).centre).toBe(1410);
  });

  it('shifts a late-morning MSFsc to the next day', () => {
    expect(getChronotypeBand(mctqResult(11.5)).centre).toBe(690 + 1440);
  });

  it.each(BAND_WIDTH_OPTIONS)('uses a half-width of %i minutes', (half) => {
    const band = getChronotypeBand(mctqResult(3.5), half);
    expect(band.halfWidth).toBe(half);
    expect(band.hi - band.lo).toBe(half * 2);
  });

  it('falls back to the default width for an unknown half-width', () => {
    expect(getChronotypeBand(mctqResult(3.5), 20).halfWidth).toBe(DEFAULT_BAND_WIDTH);
    expect(getChronotypeBand(mctqResult(3.5), undefined).halfWidth).toBe(DEFAULT_BAND_WIDTH);
  });

  it('returns null when there is no usable MCTQ result', () => {
    expect(getChronotypeBand(null)).toBeNull();
    expect(getChronotypeBand(undefined)).toBeNull();
    expect(getChronotypeBand({ id: 'mctq', answers: {}, score: null })).toBeNull();
    expect(getChronotypeBand({ id: 'mctq', answers: {}, score: 3.5 })).toBeNull();
    expect(getChronotypeBand(mctqResult(NaN))).toBeNull();
    expect(getChronotypeBand(mctqResult(undefined))).toBeNull();
  });

  it('returns null when the participant has no free days (7 work days)', () => {
    expect(getChronotypeBand(mctqResult(3.5, { mctq_wd: 7 }))).toBeNull();
  });

  it('still draws a band when the work-day count is missing or below 7', () => {
    expect(getChronotypeBand(mctqResult(3.5, {}))).not.toBeNull();
    expect(getChronotypeBand(mctqResult(3.5, { mctq_wd: 0 }))).not.toBeNull();
    expect(getChronotypeBand(mctqResult(3.5, { mctq_wd: 6 }))).not.toBeNull();
  });
});

describe('isValidBandWidth', () => {
  it('accepts only the offered widths', () => {
    BAND_WIDTH_OPTIONS.forEach((w) => expect(isValidBandWidth(w)).toBe(true));
    [0, 10, 60, '30', null, undefined, NaN].forEach((w) => expect(isValidBandWidth(w)).toBe(false));
  });

  it('offers the default width', () => {
    expect(BAND_WIDTH_OPTIONS).toContain(DEFAULT_BAND_WIDTH);
  });
});

// ─── 2. isMidSleepInBand ──────────────────────────────────────────────────────

describe('isMidSleepInBand', () => {
  const band = getChronotypeBand(mctqResult(3.5)); // 03:00–04:00

  it('is true inside the band and on both edges', () => {
    expect(isMidSleepInBand(1650, band)).toBe(true);
    expect(isMidSleepInBand(1620, band)).toBe(true);
    expect(isMidSleepInBand(1680, band)).toBe(true);
  });

  it('is false just outside the band', () => {
    expect(isMidSleepInBand(1619, band)).toBe(false);
    expect(isMidSleepInBand(1681, band)).toBe(false);
  });

  it('handles fractional midpoints', () => {
    expect(isMidSleepInBand(1680.4, band)).toBe(false);
    expect(isMidSleepInBand(1679.5, band)).toBe(true);
  });

  it('compares on a 24-hour circle for a band that straddles midnight', () => {
    // MSFsc 23:50 → centre 1430, band 23:20–00:20
    const late = getChronotypeBand(mctqResult(23 + 50 / 60));
    expect(late.centre).toBe(1430);
    expect(isMidSleepInBand(1450, late)).toBe(true);   // 00:10
    expect(isMidSleepInBand(1410, late)).toBe(true);   // 23:30
    expect(isMidSleepInBand(1471, late)).toBe(false);  // 00:31
  });

  it('is false when there is no band or the midpoint is not a number', () => {
    expect(isMidSleepInBand(1650, null)).toBe(false);
    expect(isMidSleepInBand(NaN, band)).toBe(false);
    expect(isMidSleepInBand(undefined, band)).toBe(false);
  });

  it('gets wider with the chosen half-width', () => {
    const wide = getChronotypeBand(mctqResult(3.5), 45);
    expect(isMidSleepInBand(1690, band)).toBe(false);
    expect(isMidSleepInBand(1690, wide)).toBe(true);
  });
});

// ─── 3. formatBandClock ───────────────────────────────────────────────────────

describe('formatBandClock', () => {
  it('formats shifted minutes as a 24-hour clock time', () => {
    expect(formatBandClock(1650)).toBe('03:30');
    expect(formatBandClock(1440)).toBe('00:00');
    expect(formatBandClock(1410)).toBe('23:30');
    expect(formatBandClock(2160)).toBe('12:00');
  });
});

// ─── 4. Agreement with the real MCTQ scoring ──────────────────────────────────

describe('band from a scored MCTQ', () => {
  const answers = {
    mctq_wd: 5,
    mctq_bt_w: { hour: 23, minute: 0 },
    mctq_sl_w: 15,
    mctq_wt_w: { hour: 7, minute: 0 },
    mctq_bt_f: { hour: 0, minute: 30 },
    mctq_sl_f: 15,
    mctq_wt_f: { hour: 9, minute: 0 },
  };

  it('is centred on the MSFsc the questionnaire computes', () => {
    const score = MCTQ.score(answers);
    expect(score.msf_sc).toBeCloseTo(4.7, 2);

    const band = getChronotypeBand({ id: 'mctq', answers, score });
    expect(band.centre).toBe(Math.round(score.msf_sc * 60) + 1440);
    expect(formatBandClock(band.centre)).toBe('04:42');
  });

  it('draws no band when the same answers say every day is a work day', () => {
    const everyDay = { ...answers, mctq_wd: 7 };
    expect(getChronotypeBand({ id: 'mctq', answers: everyDay, score: MCTQ.score(everyDay) })).toBeNull();
  });
});

// ─── 5. Stored band width ─────────────────────────────────────────────────────

describe('band width storage', () => {
  it('defaults to 30 minutes when nothing is saved', async () => {
    expect(await loadBandWidth()).toBe(DEFAULT_BAND_WIDTH);
  });

  it('round-trips every offered width', async () => {
    for (const w of BAND_WIDTH_OPTIONS) {
      await saveBandWidth(w);
      expect(await loadBandWidth()).toBe(w);
    }
  });

  it('rejects a width that is not offered and keeps the previous one', async () => {
    await saveBandWidth(45);
    await expect(saveBandWidth(20)).rejects.toThrow('Invalid band width');
    expect(await loadBandWidth()).toBe(45);
  });

  it('ignores a corrupted stored value', async () => {
    await AsyncStorage.setItem('chronotype_band_width', 'wide');
    expect(await loadBandWidth()).toBe(DEFAULT_BAND_WIDTH);
    await AsyncStorage.setItem('chronotype_band_width', '999');
    expect(await loadBandWidth()).toBe(DEFAULT_BAND_WIDTH);
  });

  it('is cleared by clearAll', async () => {
    await saveBandWidth(15);
    await clearAll();
    expect(await loadBandWidth()).toBe(DEFAULT_BAND_WIDTH);
  });
});
