/**
 * utils/dateEntry.js — Entry date prompt logic
 *
 * Determines whether a participant should be asked which day their diary
 * entry belongs to before they start filling it in.
 *
 * The problem: participants with delayed sleep or irregular schedules may
 * complete entries in the early hours of the morning (e.g. 1 am or 6 am),
 * meaning the device clock date does not match the night they are reporting
 * on. A fixed cutoff would fail at extremes, so instead we show a prompt
 * that lets the participant choose explicitly.
 *
 * Trigger window: midnight → 14:00 (2 pm) local time.
 * Outside that window the device date is used silently — no prompt.
 *
 * For MORNING entries the options are:
 *   "This morning — [today]"         (just woke up from last night)
 *   "Yesterday morning — [yesterday]" (slept in past noon)
 *   Yesterday shown only if yesterday's morning entry is missing.
 *
 * For EVENING entries the options are:
 *   "Tonight — [today]"              (going to bed now)
 *   "Last night — [yesterday]"       (filling in after a very late night)
 *   Yesterday shown only if yesterday's evening entry is missing.
 *
 * Returns null when no prompt is needed (outside trigger window, or
 * yesterday's entry is already present). The caller navigates straight
 * to the questionnaire with today's date in that case.
 */

/** Hour at which the trigger window closes (exclusive). */
const TRIGGER_WINDOW_END_HOUR = 14;

/**
 * Returns a local 'YYYY-MM-DD' string for a given Date object.
 * Using toISOString() returns UTC and can give the wrong calendar date
 * for participants in non-UTC timezones.
 */
const toLocalDateStr = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/**
 * Returns a 'YYYY-MM-DD' string for the day before the given date string.
 */
const yesterdayOf = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`); // noon to avoid DST edge cases
  d.setDate(d.getDate() - 1);
  return toLocalDateStr(d);
};

/**
 * Main export. Call before navigating to the questionnaire screen.
 *
 * @param {'morning'|'evening'} entryType
 * @param {Array}               entries  — all stored diary entries
 * @returns {{ today: string, yesterday: string } | null}
 *   Returns both date strings when the prompt should be shown,
 *   or null when the prompt should be skipped and today's date used.
 */
export const getEntryDateOptions = (entryType, entries) => {
  const now  = new Date();
  const hour = now.getHours();

  // Outside the trigger window — use device date silently.
  if (hour >= TRIGGER_WINDOW_END_HOUR) return null;

  const today     = toLocalDateStr(now);
  const yesterday = yesterdayOf(today);

  // Is yesterday's entry of this type already present?
  const yesterdayAlreadyFiled = entries.some(
    (e) => e.date === yesterday && e.type === entryType,
  );

  // Nothing to offer — yesterday is already done.
  if (yesterdayAlreadyFiled) return null;

  return { today, yesterday };
};

/**
 * Given a date string and the current entries array, returns whether the
 * morning entry for that date is already present.
 * Used by home.jsx to compute the date-aware gate for the evening card.
 *
 * @param {string} dateStr  — 'YYYY-MM-DD'
 * @param {Array}  entries
 * @returns {boolean}
 */
export const isMorningDoneForDate = (dateStr, entries) =>
  entries.some((e) => e.date === dateStr && e.type === 'morning');
