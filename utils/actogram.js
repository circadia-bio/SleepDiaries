/**
 * utils/actogram.js — Shared helpers for the actogram views
 *
 * Used by the weekly chart (components/ActogramChart.jsx) and the full-screen
 * horizontal view (components/ActogramFullView.jsx), so the two always read a
 * night the same way.
 *
 * Times are "shifted minutes": minutes since midnight, with anything before
 * noon counted as the next day, so a bedtime of 23:30 and a wake-up at 07:05
 * sit on one continuous scale (1410 and 1865).
 *
 * Diary answers used (morning entry): mq1 bedtime, mq2 time tried to sleep,
 * mq3 minutes to fall asleep ({ hours, minutes }), mq4 / mq4b night wakings
 * ('yes' and a count), mq6 final waking, mq7 out of bed.
 */

// ─── Time helpers ─────────────────────────────────────────────────────────────

// Shifts a clock time so hours before noon count as "the next day" — lets us
// compare/plot bedtime and wake time on one continuous scale across midnight.
export const shiftedMinutes = (time) => {
  if (!time) return null;
  const h = time.hour < 12 ? time.hour + 24 : time.hour;
  return h * 60 + time.minute;
};

export const floorTo = (mins, step) => Math.floor(mins / step) * step;
export const ceilTo  = (mins, step) => Math.ceil(mins / step) * step;
export const clamp   = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

export const formatClock = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

export const formatDuration = (mins) => {
  if (mins === null || mins === undefined || isNaN(mins)) return '\u2014';
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.round(Math.abs(mins) % 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
};

// 'YYYY-MM-DD' + 1 day, as a 'YYYY-MM-DD' string — avoids timezone drift by
// anchoring at noon before doing the date arithmetic.
export const nextDateStr = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

// ─── Calendar and nights ──────────────────────────────────────────────────────

/**
 * The morning entries that can be drawn (they need a bedtime and an
 * out-of-bed time), oldest first, and the full contiguous calendar range from
 * the first entry's date to the last, so a missed diary entry shows up as an
 * empty slot rather than silently compressing the timeline.
 *
 *   realEntries   the drawable entries
 *   calendarDays  [{ date, entry }], entry is null for a day with nothing logged
 */
export const buildCalendar = (entries) => {
  const realEntries = (entries ?? [])
    .filter((e) => e.type === 'morning' && e.answers?.mq1 && e.answers?.mq7)
    .sort((a, b) => a.date.localeCompare(b.date));

  const calendarDays = [];
  if (realEntries.length > 0) {
    const byDate = new Map(realEntries.map((e) => [e.date, e]));
    let cursor = realEntries[0].date;
    const last = realEntries[realEntries.length - 1].date;
    while (cursor <= last) {
      calendarDays.push({ date: cursor, entry: byDate.get(cursor) ?? null });
      cursor = nextDateStr(cursor);
    }
  }
  return { realEntries, calendarDays };
};

/**
 * One night's times in shifted minutes, or null when the entry has no
 * bedtime or out-of-bed time.
 *
 *   bed        in bed (mq1)
 *   tried      tried to sleep (mq2), or bed when not answered
 *   sol        minutes to fall asleep (mq3), 0 when not answered
 *   onset      tried + sol
 *   finalWake  final waking (mq6), or outOfBed when not answered
 *   outOfBed   out of bed (mq7)
 *   wakings    number of night wakings (mq4 / mq4b)
 *   mid        midpoint of the asleep segment, (onset + finalWake) / 2
 */
export const nightTimes = (entry) => {
  const a = entry?.answers;
  if (!a) return null;
  const bed = shiftedMinutes(a.mq1);
  const outOfBed = shiftedMinutes(a.mq7);
  if (bed === null || outOfBed === null) return null;

  const tried = shiftedMinutes(a.mq2) ?? bed;
  const sol = a.mq3 ? a.mq3.hours * 60 + a.mq3.minutes : 0;
  const onset = tried + sol;
  const finalWake = shiftedMinutes(a.mq6) ?? outOfBed;
  const wakings = a.mq4 === 'yes' ? (a.mq4b ?? 0) : 0;
  return { bed, tried, sol, onset, finalWake, outOfBed, wakings, mid: (onset + finalWake) / 2 };
};

/**
 * The clock range both views draw, on a 2-hour grid: from half an hour before
 * the earliest bedtime to half an hour after the latest out-of-bed time. When
 * usual-sleep bands are passed the range also covers them. With no entries it
 * falls back to 20:00 to 12:00 the next day.
 */
export const timeRange = (realEntries, bands = null) => {
  if (!realEntries || realEntries.length === 0) return { rangeStart: 20 * 60, rangeEnd: 36 * 60 };
  let min = Infinity;
  let max = -Infinity;
  for (const e of realEntries) {
    const bed = shiftedMinutes(e.answers.mq1);
    const out = shiftedMinutes(e.answers.mq7);
    if (bed !== null) min = Math.min(min, bed);
    if (out !== null) max = Math.max(max, out);
  }
  // Keep the whole of the bands on the axis even when the diary times sit outside them.
  if (bands) {
    min = Math.min(min, bands.lo);
    max = Math.max(max, bands.hi);
  }
  return {
    rangeStart: floorTo(min - 30, 120),
    rangeEnd:   ceilTo(max + 30, 120),
  };
};

// ─── Full view sizing ─────────────────────────────────────────────────────────

/** Row heights for the full view, in px, at the default font size. */
export const FULL_VIEW_MIN_ROW = 14;
/**
 * The report unlocks after 14 morning entries, so the full view has at least
 * 14 rows. Rows grow to fill the screen up to this height, and stop there
 * rather than turning a fortnight into fat bars on a tall screen.
 */
export const FULL_VIEW_MAX_ROW = 36;
/** Space above the first row and below the last, inside the plot. */
export const FULL_VIEW_PAD = 6;

const MAX_FONT_SCALE = 1.4;

const safeFontScale = (fontScale) =>
  clamp(Number.isFinite(fontScale) ? fontScale : 1, 1, MAX_FONT_SCALE);

/**
 * Row height for the full view: as tall as the space allows so every day fits
 * on screen, kept between a minimum and a maximum.
 *
 * The minimum grows with the system font size (up to 1.4x), so labels never
 * get squeezed; when the minimum would not fit, the view scrolls instead.
 *
 *   availableHeight  px for the rows (the measured plot area, below the time axis)
 *   days             number of rows, including days with no entry
 *   fontScale        PixelRatio.getFontScale()
 *
 * Returns { rowHeight, minRowHeight, contentHeight, fits }. `fits` is false
 * when the rows need more than availableHeight (scroll), and also while the
 * area has not been measured yet.
 */
export const fullViewRowHeight = (availableHeight, days, fontScale = 1) => {
  const minRowHeight = Math.round(FULL_VIEW_MIN_ROW * safeFontScale(fontScale));
  const maxRowHeight = Math.max(minRowHeight, FULL_VIEW_MAX_ROW);

  if (!(availableHeight > 0) || !(days > 0)) {
    return {
      rowHeight: minRowHeight,
      minRowHeight,
      contentHeight: Math.max(0, days) * minRowHeight + FULL_VIEW_PAD,
      fits: false,
    };
  }

  const raw = Math.floor((availableHeight - FULL_VIEW_PAD) / days);
  const rowHeight = clamp(raw, minRowHeight, maxRowHeight);
  const contentHeight = days * rowHeight + FULL_VIEW_PAD;
  return { rowHeight, minRowHeight, contentHeight, fits: contentHeight <= availableHeight };
};

/**
 * Everything in a row that scales with its height, so a fortnight on a tall
 * screen and a month on a short one both stay in proportion.
 */
export const fullViewMetrics = (rowHeight, fontScale = 1) => {
  const scale = safeFontScale(fontScale);
  const baseLabel = rowHeight >= 28 ? 13 : rowHeight >= 20 ? 12 : rowHeight >= 16 ? 11 : 10;
  return {
    barHeight:    clamp(Math.round(rowHeight * 0.5), 8, 18),
    labelSize:    Math.round(baseLabel * scale),
    labelWidth:   Math.round(84 * scale),
    dotRadius:    rowHeight >= 22 ? 2.5 : 2,
    markerRadius: rowHeight >= 22 ? 3.5 : 3,
  };
};

// ─── Colours ──────────────────────────────────────────────────────────────────

/**
 * Colours for the full view and the legend, matching the weekly chart: the
 * same green / amber / red semantics as the report's metric bars, softened to
 * ~20%, with the usual workday band in navy and the free-day band in orange.
 */
export const ACTOGRAM_COLORS = {
  asleep:       '#2E7D3233', // green @ 20%
  awake:        '#F59E0B33', // amber @ 20%
  waking:       '#DC2626',   // solid — a marker, not a band
  midpoint:     '#1E3A5F',   // navy — sleep midpoint line and markers
  work:         '#1E3A5F',   // usual workday sleep band, and markers inside it
  workFill:     '#1E3A5F17', // navy @ ~9%
  workEdge:     '#1E3A5F66', // navy @ 40%
  workRow:      '#1E3A5F12', // navy @ ~7% — highlight behind a night in the band
  free:         '#E07A20',   // usual free-day sleep band, and markers inside it
  freeFill:     '#E07A2021', // orange @ ~13%
  freeEdge:     '#E07A20B3', // orange @ 70% — drawn dashed
  freeRow:      '#E07A201A', // orange @ 10%
  freeText:     '#B45309',   // darker orange for small "F" tags (contrast on white)
  grid:         '#E2EAF4',
  empty:        '#D8E2EC',   // placeholder for a day with no entry
  axisText:     '#64748B',
  headerText:   '#1E3A5F',
};
