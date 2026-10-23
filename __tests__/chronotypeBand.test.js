/**
 * __tests__/chronotypeBand.test.js
 *
 * Tests for utils/chronotypeBand.js, the MCTQ helper it builds on, and the
 * band-width helpers in storage/storage.js:
 *   1. mctqSleepTimes — shared arithmetic, and MCTQ.score unchanged by it
 *   2. getChronotypeBands — centres, widths, and when a band is left out
 *   3. merged bands — close workday and free-day sleep drawn as one
 *   4. classifyMidSleep / isMidSleepInBand — work, free, both, neither
 *   5. formatBandClock
 *   6. loadBandWidth / saveBandWidth round-trip and validation
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  BAND_WIDTH_OPTIONS,
  DEFAULT_BAND_WIDTH,
  getChronotypeBands,
  classifyMidSleep,
  isMidSleepInBand,
  isValidBandWidth,
  formatBandClock,
} from '../utils/chronotypeBand';
import { MCTQ, mctqSleepTimes } from '../data/questionnaires';
import { loadBandWidth, saveBandWidth, clearAll } from '../storage/storage';

// Workdays: bed 23:00, 15 min to fall asleep, up 07:00      → MSW 03:07.5
// Free days: bed 00:30, 15 min to fall asleep, up 09:00     → MSF 04:52.5
const BASE = {
  mctq_wd: 5,
  mctq_bt_w: { hour: 23, minute: 0 },
  mctq_sl_w: 15,
  mctq_wt_w: { hour: 7, minute: 0 },
  mctq_bt_f: { hour: 0, minute: 30 },
  mctq_sl_f: 15,
  mctq_wt_f: { hour: 9, minute: 0 },
};

// Same workdays; free-day mid-sleep exactly 45 min after MSW (bed 23:00, up 08:30).
const FREE_45_LATER = { ...BASE, mctq_bt_f: { hour: 23, minute: 0 }, mctq_wt_f: { hour: 8, minute: 30 } };
// Same workdays; free-day mid-sleep 37 min after MSW (bed 23:00, up 08:15).
const FREE_37_LATER = { ...BASE, mctq_bt_f: { hour: 23, minute: 0 }, mctq_wt_f: { hour: 8, minute: 15 } };

const result = (answers) => ({ id: 'mctq', answers, score: MCTQ.score(answers) });

let warnSpy;

beforeEach(async () => {
  await AsyncStorage.clear();
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  warnSpy.mockRestore();
});

// ─── 1. mctqSleepTimes ────────────────────────────────────────────────────────

describe('mctqSleepTimes', () => {
  it('returns uncorrected mid-sleep and durations in decimal hours', () => {
    expect(mctqSleepTimes(BASE)).toEqual({
      wd: 5, fd: 2, sd_w: 7.75, sd_f: 8.25, msw: 3.125, msf: 4.875,
    });
  });

  it('falls back to the questionnaire defaults for missing answers', () => {
    const t = mctqSleepTimes({});
    Object.values(t).forEach((v) => expect(Number.isFinite(v)).toBe(true));
    expect(t.wd).toBe(5);
  });

  it('leaves MCTQ.score exactly as it was', () => {
    expect(MCTQ.score(BASE)).toEqual({ msf_sc: 4.7, sjl: 1.75 });
  });
});

// ─── 2. getChronotypeBands ────────────────────────────────────────────────────

describe('getChronotypeBands', () => {
  it('builds a workday band on MSW and a free-day band on MSF', () => {
    const bands = getChronotypeBands(result(BASE), 45);
    expect(bands.work).toEqual({ centre: 1628, lo: 1583, hi: 1673 });  // 03:08 ±45
    expect(bands.free).toEqual({ centre: 1733, lo: 1688, hi: 1778 });  // 04:53 ±45
    expect(bands.merged).toBe(false);
    expect(bands.single).toBeNull();
    expect(bands.halfWidth).toBe(45);
    expect(bands.lo).toBe(1583);
    expect(bands.hi).toBe(1778);
  });

  it('centres the free-day band on uncorrected MSF, not on MSFsc', () => {
    const bands = getChronotypeBands(result(BASE), 30);
    const msfsc = Math.round(MCTQ.score(BASE).msf_sc * 60) + 1440; // 1722
    expect(bands.free.centre).toBe(1733);
    expect(bands.free.centre).not.toBe(msfsc);
  });

  it.each(BAND_WIDTH_OPTIONS)('uses a half-width of %i minutes', (half) => {
    const bands = getChronotypeBands(result(BASE), half);
    expect(bands.halfWidth).toBe(half);
    expect(bands.work.hi - bands.work.lo).toBe(half * 2);
    expect(bands.free.hi - bands.free.lo).toBe(half * 2);
  });

  it('defaults to 45 minutes and falls back to it for an unknown width', () => {
    expect(DEFAULT_BAND_WIDTH).toBe(45);
    expect(BAND_WIDTH_OPTIONS).toContain(DEFAULT_BAND_WIDTH);
    expect(getChronotypeBands(result(BASE)).halfWidth).toBe(45);
    expect(getChronotypeBands(result(BASE), 20).halfWidth).toBe(45);
  });

  it('keeps an evening mid-sleep on the same day (no shift at or after noon)', () => {
    // Sleeps 14:00-22:00 on workdays: MSW 18:00, which is after noon so not shifted.
    const evening = { ...BASE, mctq_wd: 5, mctq_bt_w: { hour: 14, minute: 0 }, mctq_sl_w: 0, mctq_wt_w: { hour: 22, minute: 0 } };
    expect(getChronotypeBands(result(evening), 15).work.centre).toBe(18 * 60);
  });

  it('returns null when there is nothing to draw', () => {
    expect(getChronotypeBands(null)).toBeNull();
    expect(getChronotypeBands(undefined)).toBeNull();
    expect(getChronotypeBands({ id: 'mctq' })).toBeNull();
    expect(getChronotypeBands({ id: 'mctq', answers: null })).toBeNull();
    expect(getChronotypeBands({ id: 'mctq', answers: {} , score: { msf_sc: 4.7, sjl: 1 } })).toBeNull();
  });

  it('leaves out the free-day band with 7 work days (no free days)', () => {
    const bands = getChronotypeBands(result({ ...BASE, mctq_wd: 7 }), 45);
    expect(bands.work).not.toBeNull();
    expect(bands.free).toBeNull();
    expect(bands.merged).toBe(false);
    expect(bands.single).toBe(bands.work);
  });

  it('leaves out the workday band with 0 work days', () => {
    const bands = getChronotypeBands(result({ ...BASE, mctq_wd: 0 }), 45);
    expect(bands.work).toBeNull();
    expect(bands.free).not.toBeNull();
    expect(bands.single).toBe(bands.free);
  });

  it('returns null with 7 work days and no workday times', () => {
    const { mctq_bt_w, mctq_wt_w, ...rest } = { ...BASE, mctq_wd: 7 };
    expect(getChronotypeBands(result(rest), 45)).toBeNull();
  });

  it('leaves out a band whose times were not answered', () => {
    const { mctq_bt_f, ...noFreeBed } = BASE;
    const bands = getChronotypeBands({ id: 'mctq', answers: noFreeBed }, 45);
    expect(bands.work).not.toBeNull();
    expect(bands.free).toBeNull();
  });

  it('treats a missing work-day count as the questionnaire default of 5', () => {
    const { mctq_wd, ...noCount } = BASE;
    const bands = getChronotypeBands({ id: 'mctq', answers: noCount }, 45);
    expect(bands.work).not.toBeNull();
    expect(bands.free).not.toBeNull();
  });
});

describe('isValidBandWidth', () => {
  it('accepts only the offered widths', () => {
    BAND_WIDTH_OPTIONS.forEach((w) => expect(isValidBandWidth(w)).toBe(true));
    [0, 10, 60, '30', null, undefined, NaN].forEach((w) => expect(isValidBandWidth(w)).toBe(false));
  });
});

// ─── 3. Merged bands ──────────────────────────────────────────────────────────

describe('merged bands', () => {
  it('merges when the centres are closer than one half-width', () => {
    const bands = getChronotypeBands(result(FREE_37_LATER), 45);
    expect(bands.work.centre).toBe(1628);
    expect(bands.free.centre).toBe(1665);
    expect(bands.merged).toBe(true);
    expect(bands.single).toEqual({ centre: 1646.5, lo: 1583, hi: 1710 });
    expect(bands.lo).toBe(1583);
    expect(bands.hi).toBe(1710);
  });

  it('does not merge when the centres are exactly one half-width apart', () => {
    const bands = getChronotypeBands(result(FREE_45_LATER), 45);
    expect(bands.free.centre - bands.work.centre).toBe(45);
    expect(bands.merged).toBe(false);
  });

  it('merges at a wider width but not at a narrower one', () => {
    expect(getChronotypeBands(result(FREE_37_LATER), 45).merged).toBe(true);
    expect(getChronotypeBands(result(FREE_37_LATER), 30).merged).toBe(false);
    expect(getChronotypeBands(result(FREE_37_LATER), 15).merged).toBe(false);
  });

  it('classifies a night against the merged band as in or none', () => {
    const bands = getChronotypeBands(result(FREE_37_LATER), 45);
    expect(classifyMidSleep(1646, bands)).toBe('in');
    expect(classifyMidSleep(1700, bands)).toBe('in');
    expect(classifyMidSleep(1585, bands)).toBe('in');
    expect(classifyMidSleep(1580, bands)).toBe('none');
    expect(classifyMidSleep(1720, bands)).toBe('none');
  });
});

// ─── 4. classifyMidSleep / isMidSleepInBand ───────────────────────────────────

describe('classifyMidSleep with two separate bands', () => {
  const bands = getChronotypeBands(result(BASE), 45); // 1583–1673 and 1688–1778

  it('says which band a night falls in', () => {
    expect(classifyMidSleep(1600, bands)).toBe('work');
    expect(classifyMidSleep(1730, bands)).toBe('free');
  });

  it('says none for a night in the gap or outside both', () => {
    expect(classifyMidSleep(1680, bands)).toBe('none');
    expect(classifyMidSleep(1500, bands)).toBe('none');
    expect(classifyMidSleep(1900, bands)).toBe('none');
  });

  it('includes both edges of each band', () => {
    expect(classifyMidSleep(1583, bands)).toBe('work');
    expect(classifyMidSleep(1673, bands)).toBe('work');
    expect(classifyMidSleep(1688, bands)).toBe('free');
    expect(classifyMidSleep(1778, bands)).toBe('free');
    expect(classifyMidSleep(1674, bands)).toBe('none');
    expect(classifyMidSleep(1687, bands)).toBe('none');
  });

  it('says both when the bands overlap and the night is in the overlap', () => {
    const overlapping = getChronotypeBands(result(FREE_45_LATER), 45); // 1583–1673 and 1628–1718
    expect(classifyMidSleep(1650, overlapping)).toBe('both');
    expect(classifyMidSleep(1600, overlapping)).toBe('work');
    expect(classifyMidSleep(1700, overlapping)).toBe('free');
  });

  it('does not depend on which kind of day the night was', () => {
    // The same midpoint gets the same answer: no day type is needed.
    expect(classifyMidSleep(1730, bands)).toBe(classifyMidSleep(1730, bands));
    expect(classifyMidSleep(1730, bands)).toBe('free');
  });

  it('says none when there are no bands', () => {
    expect(classifyMidSleep(1650, null)).toBe('none');
  });

  it('works with only one band', () => {
    const workOnly = getChronotypeBands(result({ ...BASE, mctq_wd: 7 }), 45);
    expect(classifyMidSleep(1600, workOnly)).toBe('work');
    expect(classifyMidSleep(1730, workOnly)).toBe('none');
  });
});

describe('isMidSleepInBand', () => {
  const band = { centre: 1430, lo: 1400, hi: 1460 }; // 23:20-00:20

  it('compares on a 24-hour circle for a band that straddles midnight', () => {
    expect(isMidSleepInBand(1450, band)).toBe(true);   // 00:10
    expect(isMidSleepInBand(1410, band)).toBe(true);   // 23:30
    expect(isMidSleepInBand(1471, band)).toBe(false);  // 00:31
  });

  it('handles fractional midpoints', () => {
    expect(isMidSleepInBand(1460.4, band)).toBe(false);
    expect(isMidSleepInBand(1459.5, band)).toBe(true);
  });

  it('is false when there is no band or the midpoint is not a number', () => {
    expect(isMidSleepInBand(1430, null)).toBe(false);
    expect(isMidSleepInBand(NaN, band)).toBe(false);
    expect(isMidSleepInBand(undefined, band)).toBe(false);
  });
});

// ─── 5. formatBandClock ───────────────────────────────────────────────────────

describe('formatBandClock', () => {
  it('formats shifted minutes as a 24-hour clock time', () => {
    expect(formatBandClock(1628)).toBe('03:08');
    expect(formatBandClock(1440)).toBe('00:00');
    expect(formatBandClock(1410)).toBe('23:30');
    expect(formatBandClock(2160)).toBe('12:00');
  });
});

// ─── 6. Stored band width ─────────────────────────────────────────────────────

describe('band width storage', () => {
  it('defaults to 45 minutes when nothing is saved', async () => {
    expect(await loadBandWidth()).toBe(DEFAULT_BAND_WIDTH);
    expect(DEFAULT_BAND_WIDTH).toBe(45);
  });

  it('round-trips every offered width', async () => {
    for (const w of BAND_WIDTH_OPTIONS) {
      await saveBandWidth(w);
      expect(await loadBandWidth()).toBe(w);
    }
  });

  it('rejects a width that is not offered and keeps the previous one', async () => {
    await saveBandWidth(15);
    await expect(saveBandWidth(20)).rejects.toThrow('Invalid band width');
    expect(await loadBandWidth()).toBe(15);
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
