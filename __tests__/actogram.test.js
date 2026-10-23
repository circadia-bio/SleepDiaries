/**
 * __tests__/actogram.test.js
 *
 * Tests for utils/actogram.js, the helpers shared by the weekly actogram and
 * the full-screen horizontal view:
 *   1. Time helpers (shifted minutes, clock and duration text, date stepping)
 *   2. buildCalendar — drawable entries, ordering, gaps
 *   3. nightTimes — one night's times, defaults, wakings
 *   4. timeRange — the clock range both views draw
 *   5. fullViewRowHeight / fullViewMetrics — auto-scaling rows
 */
import {
  shiftedMinutes,
  floorTo,
  ceilTo,
  clamp,
  formatClock,
  formatDuration,
  nextDateStr,
  buildCalendar,
  nightTimes,
  timeRange,
  fullViewRowHeight,
  fullViewMetrics,
  FULL_VIEW_MIN_ROW,
  FULL_VIEW_MAX_ROW,
  FULL_VIEW_PAD,
  ACTOGRAM_COLORS,
} from '../utils/actogram';

const entry = (date, answers = {}, type = 'morning') => ({
  id: `${date}-${type}`,
  type,
  date,
  completedAt: `${date}T08:00:00.000Z`,
  answers: { mq1: { hour: 23, minute: 0 }, mq7: { hour: 7, minute: 0 }, ...answers },
});

// ─── 1. Time helpers ──────────────────────────────────────────────────────────

describe('shiftedMinutes', () => {
  it('counts hours before noon as the next day', () => {
    expect(shiftedMinutes({ hour: 23, minute: 30 })).toBe(1410);
    expect(shiftedMinutes({ hour: 7, minute: 5 })).toBe(1865);
    expect(shiftedMinutes({ hour: 0, minute: 0 })).toBe(1440);
  });

  it('keeps noon on the same day and shifts 11:59', () => {
    expect(shiftedMinutes({ hour: 12, minute: 0 })).toBe(720);
    expect(shiftedMinutes({ hour: 11, minute: 59 })).toBe(2159);
  });

  it('returns null when there is no time', () => {
    expect(shiftedMinutes(null)).toBeNull();
    expect(shiftedMinutes(undefined)).toBeNull();
  });
});

describe('rounding helpers', () => {
  it('floors and ceilings to a step', () => {
    expect(floorTo(1350, 120)).toBe(1320);
    expect(ceilTo(1895, 120)).toBe(1920);
    expect(floorTo(1320, 120)).toBe(1320);
    expect(ceilTo(1920, 120)).toBe(1920);
  });

  it('clamps', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('formatClock and formatDuration', () => {
  it('formats shifted minutes as a 24-hour time', () => {
    expect(formatClock(1650)).toBe('03:30');
    expect(formatClock(1440)).toBe('00:00');
    expect(formatClock(1410)).toBe('23:30');
  });

  it('formats a duration as hours and minutes', () => {
    expect(formatDuration(415)).toBe('6h 55m');
    expect(formatDuration(60)).toBe('1h 00m');
    expect(formatDuration(45)).toBe('45m');
  });

  it('shows a dash for a missing duration', () => {
    expect(formatDuration(null)).toBe('\u2014');
    expect(formatDuration(undefined)).toBe('\u2014');
    expect(formatDuration(NaN)).toBe('\u2014');
  });
});

describe('nextDateStr', () => {
  it('steps one day, across month, year and leap-day boundaries', () => {
    expect(nextDateStr('2026-10-18')).toBe('2026-10-19');
    expect(nextDateStr('2026-09-30')).toBe('2026-10-01');
    expect(nextDateStr('2026-12-31')).toBe('2027-01-01');
    expect(nextDateStr('2028-02-28')).toBe('2028-02-29');
  });
});

// ─── 2. buildCalendar ─────────────────────────────────────────────────────────

describe('buildCalendar', () => {
  it('returns nothing for no entries', () => {
    expect(buildCalendar([])).toEqual({ realEntries: [], calendarDays: [] });
    expect(buildCalendar(undefined)).toEqual({ realEntries: [], calendarDays: [] });
  });

  it('ignores evening entries and entries without a bedtime or out-of-bed time', () => {
    const { realEntries } = buildCalendar([
      entry('2026-10-01'),
      entry('2026-10-02', {}, 'evening'),
      { ...entry('2026-10-03'), answers: { mq7: { hour: 7, minute: 0 } } },
      { ...entry('2026-10-04'), answers: { mq1: { hour: 23, minute: 0 } } },
    ]);
    expect(realEntries.map((e) => e.date)).toEqual(['2026-10-01']);
  });

  it('orders oldest first and fills missed days, across a month boundary', () => {
    const { calendarDays } = buildCalendar([
      entry('2026-10-03'),
      entry('2026-09-30'),
      entry('2026-10-01'),
    ]);
    expect(calendarDays.map((d) => d.date)).toEqual(['2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03']);
    expect(calendarDays[2].entry).toBeNull();
    expect(calendarDays[0].entry.date).toBe('2026-09-30');
    expect(calendarDays[3].entry.date).toBe('2026-10-03');
  });

  it('does not reorder the array it is given', () => {
    const later = entry('2026-10-03');
    const earlier = entry('2026-10-01');
    const input = [later, earlier];
    buildCalendar(input);
    expect(input[0]).toBe(later);
  });

  it('gives a single entry a single day', () => {
    expect(buildCalendar([entry('2026-10-01')]).calendarDays).toHaveLength(1);
  });
});

// ─── 3. nightTimes ────────────────────────────────────────────────────────────

describe('nightTimes', () => {
  it('reads every time of a fully answered night', () => {
    const night = nightTimes(entry('2026-10-01', {
      mq2: { hour: 23, minute: 15 },
      mq3: { hours: 0, minutes: 20 },
      mq4: 'yes', mq4b: 2,
      mq6: { hour: 6, minute: 50 },
      mq7: { hour: 7, minute: 5 },
    }));
    expect(night).toEqual({
      bed: 1380, tried: 1395, sol: 20, onset: 1415,
      finalWake: 1850, outOfBed: 1865, wakings: 2, mid: 1632.5,
    });
  });

  it('falls back to bedtime and out-of-bed time for unanswered items', () => {
    expect(nightTimes(entry('2026-10-01'))).toEqual({
      bed: 1380, tried: 1380, sol: 0, onset: 1380,
      finalWake: 1860, outOfBed: 1860, wakings: 0, mid: 1620,
    });
  });

  it('counts wakings only when the participant said they woke', () => {
    expect(nightTimes(entry('2026-10-01', { mq4: 'no', mq4b: 3 })).wakings).toBe(0);
    expect(nightTimes(entry('2026-10-01', { mq4: 'yes' })).wakings).toBe(0);
    expect(nightTimes(entry('2026-10-01', { mq4: 'yes', mq4b: 3 })).wakings).toBe(3);
  });

  it('returns null without a bedtime or out-of-bed time', () => {
    expect(nightTimes({ answers: { mq7: { hour: 7, minute: 0 } } })).toBeNull();
    expect(nightTimes({ answers: { mq1: { hour: 23, minute: 0 } } })).toBeNull();
    expect(nightTimes({ answers: {} })).toBeNull();
    expect(nightTimes({})).toBeNull();
    expect(nightTimes(undefined)).toBeNull();
  });
});

// ─── 4. timeRange ─────────────────────────────────────────────────────────────

describe('timeRange', () => {
  it('falls back to 20:00-12:00 with no entries', () => {
    expect(timeRange([])).toEqual({ rangeStart: 1200, rangeEnd: 2160 });
    expect(timeRange(undefined)).toEqual({ rangeStart: 1200, rangeEnd: 2160 });
  });

  it('pads half an hour either side and rounds out to a 2-hour grid', () => {
    expect(timeRange([entry('2026-10-01')])).toEqual({ rangeStart: 1320, rangeEnd: 1920 });
  });

  it('spans the earliest bedtime and the latest out-of-bed time', () => {
    const range = timeRange([
      entry('2026-10-01'),
      entry('2026-10-02', { mq1: { hour: 22, minute: 30 }, mq7: { hour: 8, minute: 45 } }),
    ]);
    expect(range).toEqual({ rangeStart: 1320, rangeEnd: 2040 });
  });

  it('widens to cover the bands when they sit outside the diary times', () => {
    const entries = [entry('2026-10-01')];
    expect(timeRange(entries, { lo: 1583, hi: 2000 })).toEqual({ rangeStart: 1320, rangeEnd: 2040 });
    expect(timeRange(entries, { lo: 1200, hi: 1600 })).toEqual({ rangeStart: 1080, rangeEnd: 1920 });
  });

  it('leaves the range alone when the bands are inside it', () => {
    expect(timeRange([entry('2026-10-01')], { lo: 1500, hi: 1700 })).toEqual({ rangeStart: 1320, rangeEnd: 1920 });
  });
});

// ─── 5. Full view sizing ──────────────────────────────────────────────────────

describe('fullViewRowHeight', () => {
  it('fits a month on a standard phone', () => {
    expect(fullViewRowHeight(544, 31, 1)).toEqual({ rowHeight: 17, minRowHeight: 14, contentHeight: 533, fits: true });
  });

  it('fits a month on a large phone with taller rows', () => {
    expect(fullViewRowHeight(632, 31, 1)).toEqual({ rowHeight: 20, minRowHeight: 14, contentHeight: 626, fits: true });
  });

  it('scrolls a month on a small phone, at the minimum row height', () => {
    const fit = fullViewRowHeight(367, 31, 1);
    expect(fit.rowHeight).toBe(14);
    expect(fit.contentHeight).toBe(440);
    expect(fit.fits).toBe(false);
  });

  it('scales rows up for the 14-day minimum, up to the maximum', () => {
    const tall = fullViewRowHeight(544, 14, 1);
    expect(tall.rowHeight).toBe(FULL_VIEW_MAX_ROW);
    expect(tall.contentHeight).toBe(14 * 36 + FULL_VIEW_PAD);
    expect(tall.fits).toBe(true);

    const compact = fullViewRowHeight(367, 14, 1);
    expect(compact.rowHeight).toBe(25);
    expect(compact.fits).toBe(true);
  });

  it('scrolls a long study at the minimum row height', () => {
    const fit = fullViewRowHeight(544, 60, 1);
    expect(fit.rowHeight).toBe(14);
    expect(fit.fits).toBe(false);
  });

  it('fits exactly when the rows need all of the space', () => {
    expect(fullViewRowHeight(206, 10, 1)).toEqual({ rowHeight: 20, minRowHeight: 14, contentHeight: 206, fits: true });
  });

  it('raises the minimum row height with the system font size', () => {
    const fit = fullViewRowHeight(544, 31, 1.3);
    expect(fit.minRowHeight).toBe(18);
    expect(fit.rowHeight).toBe(18);
    expect(fit.fits).toBe(false);
  });

  it('caps the font scale at 1.4 and ignores values below 1', () => {
    expect(fullViewRowHeight(544, 31, 2).minRowHeight).toBe(20);
    expect(fullViewRowHeight(544, 31, 0.5).minRowHeight).toBe(FULL_VIEW_MIN_ROW);
    expect(fullViewRowHeight(544, 31, NaN).minRowHeight).toBe(FULL_VIEW_MIN_ROW);
    expect(fullViewRowHeight(544, 31).minRowHeight).toBe(FULL_VIEW_MIN_ROW);
  });

  it('keeps rows between the minimum and the maximum', () => {
    [200, 367, 544, 632, 900].forEach((height) => {
      [14, 21, 31, 45, 90].forEach((days) => {
        const { rowHeight, minRowHeight } = fullViewRowHeight(height, days, 1);
        expect(rowHeight).toBeGreaterThanOrEqual(minRowHeight);
        expect(rowHeight).toBeLessThanOrEqual(FULL_VIEW_MAX_ROW);
      });
    });
  });

  it('does not claim to fit before the area is measured', () => {
    expect(fullViewRowHeight(0, 31, 1)).toEqual({ rowHeight: 14, minRowHeight: 14, contentHeight: 440, fits: false });
    expect(fullViewRowHeight(-5, 31, 1).fits).toBe(false);
    expect(fullViewRowHeight(544, 0, 1).fits).toBe(false);
  });
});

describe('fullViewMetrics', () => {
  it('sizes a mid-height row', () => {
    expect(fullViewMetrics(17, 1)).toEqual({
      barHeight: 9, labelSize: 11, labelWidth: 84, dotRadius: 2, markerRadius: 3,
    });
  });

  it('sizes the tallest row', () => {
    expect(fullViewMetrics(36, 1)).toEqual({
      barHeight: 18, labelSize: 13, labelWidth: 84, dotRadius: 2.5, markerRadius: 3.5,
    });
  });

  it('keeps bars and labels readable on the shortest row', () => {
    const m = fullViewMetrics(14, 1);
    expect(m.barHeight).toBe(8);
    expect(m.labelSize).toBe(10);
  });

  it('caps the bar thickness', () => {
    expect(fullViewMetrics(60, 1).barHeight).toBe(18);
  });

  it('scales labels and the label column with the font size', () => {
    const m = fullViewMetrics(17, 1.4);
    expect(m.labelSize).toBe(15);
    expect(m.labelWidth).toBe(118);
  });
});

describe('ACTOGRAM_COLORS', () => {
  it('holds valid hex colours', () => {
    Object.values(ACTOGRAM_COLORS).forEach((c) => {
      expect(c).toMatch(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/);
    });
  });
});
