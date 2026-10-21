/**
 * utils/chronotypeBand.js — Chronotype band for the sleep-pattern actogram
 *
 * Builds the shaded band drawn behind the actogram (components/ActogramChart.jsx)
 * from the participant's Munich Chronotype Questionnaire result, and decides
 * whether a night's sleep midpoint falls inside it.
 *
 * The MCTQ is an optional questionnaire in this app, so most participants
 * will not have one at first. Without a usable result getChronotypeBand()
 * returns null and the chart is drawn exactly as before.
 *
 * The band is centred on MSFsc (mid-sleep on free days, corrected for sleep
 * debt), the chronotype the MCTQ scores. It extends `halfWidth` minutes either
 * side, so a 30-minute half-width gives a one-hour band. The half-width is the
 * participant's choice (Settings → Report); the MCTQ literature defines no
 * tolerance, so it is a presentation setting, not a clinical cut-off.
 *
 * All times are in the actogram's "shifted minutes": minutes since midnight,
 * with anything before noon counted as the next day, so a bedtime of 23:30 and
 * a wake-up at 07:00 sit on one continuous scale (1410 and 1860).
 *
 *   band = { centre, lo, hi, halfWidth }   // shifted minutes
 */

/** Half-widths the participant can choose from, in minutes. */
export const BAND_WIDTH_OPTIONS = [15, 30, 45];
export const DEFAULT_BAND_WIDTH = 30;

const DAY = 1440;
const NOON = 720;

export const isValidBandWidth = (value) => BAND_WIDTH_OPTIONS.includes(value);

/** Minutes since midnight → shifted minutes (hours before noon count as the next day). */
const toShifted = (minutes) => (minutes < NOON ? minutes + DAY : minutes);

/**
 * Build the band from a stored MCTQ result ({ answers, score: { msf_sc, sjl } }).
 *
 * Returns null when:
 *   - there is no result (the MCTQ has not been completed), or its score is not
 *     an object holding a finite msf_sc
 *   - the participant reported working or committing every day (mctq_wd = 7).
 *     The MCTQ then has no free days, and the free-day answers the score falls
 *     back on are defaults, not the participant's own, so MSFsc means nothing.
 *
 * An unknown halfWidth falls back to DEFAULT_BAND_WIDTH.
 */
export const getChronotypeBand = (mctqResult, halfWidth = DEFAULT_BAND_WIDTH) => {
  const msf = mctqResult?.score?.msf_sc;
  if (typeof msf !== 'number' || !Number.isFinite(msf)) return null;

  const workDays = mctqResult?.answers?.mctq_wd;
  if (typeof workDays === 'number' && workDays >= 7) return null;

  const half = isValidBandWidth(halfWidth) ? halfWidth : DEFAULT_BAND_WIDTH;
  const centre = toShifted(Math.round(msf * 60));
  return { centre, lo: centre - half, hi: centre + half, halfWidth: half };
};

/**
 * True when a sleep midpoint (shifted minutes) lies within the band, edges
 * included. Compared on a 24-hour circle, so a band that straddles midnight
 * behaves the same as one that does not.
 */
export const isMidSleepInBand = (midpoint, band) => {
  if (!band || typeof midpoint !== 'number' || !Number.isFinite(midpoint)) return false;
  const diff = ((((midpoint - band.centre + DAY / 2) % DAY) + DAY) % DAY) - DAY / 2;
  return Math.abs(diff) <= band.halfWidth;
};

/** Shifted (or plain) minutes → 'HH:MM' on a 24-hour clock. */
export const formatBandClock = (minutes) => {
  const m = ((Math.round(minutes) % DAY) + DAY) % DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
