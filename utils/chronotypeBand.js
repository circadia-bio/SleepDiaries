/**
 * utils/chronotypeBand.js — Usual-sleep bands for the sleep-pattern actogram
 *
 * Builds the two shaded bands drawn behind the actogram
 * (components/ActogramChart.jsx) from the participant's Munich Chronotype
 * Questionnaire answers, and says where a night's sleep midpoint falls.
 *
 * Two bands, both across every row:
 *   work  centred on MSW, the uncorrected mid-sleep on workdays
 *   free  centred on MSF, the uncorrected mid-sleep on free days
 * Both are uncorrected on purpose. The diary measures an actual midpoint, and
 * MSFsc (the sleep-debt-corrected chronotype the MCTQ scores) would sit later
 * than a typical free-day midpoint for anyone who oversleeps on free days.
 *
 * Every night is tested against both bands, so no night has to be classed as a
 * workday or a free day. A night can fall in the work band, the free band,
 * both, or neither.
 *
 * Each band extends `halfWidth` minutes either side of its centre. The width
 * is the participant's choice (Settings → Report). The MCTQ literature defines
 * no tolerance around mid-sleep, so it is a presentation setting, not a
 * clinical cut-off.
 *
 * The MCTQ is optional in this app. Without usable answers
 * getChronotypeBands() returns null and the chart is drawn exactly as before.
 *
 * All times are in the actogram's "shifted minutes": minutes since midnight,
 * with anything before noon counted as the next day, so a bedtime of 23:30 and
 * a wake-up at 07:00 sit on one continuous scale (1410 and 1860).
 *
 *   band  = { centre, lo, hi }                              // shifted minutes
 *   bands = { halfWidth, work, free, merged, single, lo, hi }
 */
import { mctqSleepTimes } from '../data/questionnaires';

/** Half-widths the participant can choose from, in minutes. */
export const BAND_WIDTH_OPTIONS = [15, 30, 45];
export const DEFAULT_BAND_WIDTH = 45;

const DAY = 1440;
const NOON = 720;

export const isValidBandWidth = (value) => BAND_WIDTH_OPTIONS.includes(value);

/** Minutes since midnight → shifted minutes (hours before noon count as the next day). */
const toShifted = (minutes) => (minutes < NOON ? minutes + DAY : minutes);

const isTime = (t) => !!t && Number.isFinite(t.hour) && Number.isFinite(t.minute);

/**
 * Build the bands from a stored MCTQ result ({ answers }).
 *
 * Returns null when no band can be drawn: no result, no answers, or neither
 * band has the answers it needs. Otherwise returns:
 *
 *   halfWidth  the half-width actually used (an unknown value becomes the default)
 *   work       workday band, or null
 *   free       free-day band, or null
 *   merged     true when the two centres are closer than one half-width apart.
 *              The bands would then overlap by more than half their width, so
 *              "in the workday band" and "in the free-day band" stop telling
 *              the nights apart, and the chart draws them as one
 *   single     the one band to draw when merged (the union of both), or the
 *              only band there is when just one exists; otherwise null
 *   lo, hi     overall extent of what is drawn, used to size the time axis
 *
 * The work band needs at least one workday (mctq_wd > 0) and its two times;
 * the free band needs at least one free day (mctq_wd < 7) and its two times.
 * With 7 work days there are no free days, so the free-day answers behind MSF
 * would be defaults rather than the participant's own, and that band is left out.
 */
export const getChronotypeBands = (mctqResult, halfWidth = DEFAULT_BAND_WIDTH) => {
  const answers = mctqResult?.answers;
  if (!answers || typeof answers !== 'object') return null;

  const wd = Number.isFinite(answers.mctq_wd) ? answers.mctq_wd : 5;
  const hasWork = wd > 0 && isTime(answers.mctq_bt_w) && isTime(answers.mctq_wt_w);
  const hasFree = wd < 7 && isTime(answers.mctq_bt_f) && isTime(answers.mctq_wt_f);
  if (!hasWork && !hasFree) return null;

  const half = isValidBandWidth(halfWidth) ? halfWidth : DEFAULT_BAND_WIDTH;
  const { msw, msf } = mctqSleepTimes(answers);
  const make = (hours) => {
    const centre = toShifted(Math.round(hours * 60));
    return { centre, lo: centre - half, hi: centre + half };
  };

  const work = hasWork ? make(msw) : null;
  const free = hasFree ? make(msf) : null;
  if ((work && !Number.isFinite(work.centre)) || (free && !Number.isFinite(free.centre))) return null;

  const merged = !!work && !!free && Math.abs(work.centre - free.centre) < half;
  const lo = Math.min(...[work, free].filter(Boolean).map((b) => b.lo));
  const hi = Math.max(...[work, free].filter(Boolean).map((b) => b.hi));

  let single = null;
  if (merged) single = { centre: (lo + hi) / 2, lo, hi };
  else if (work && !free) single = work;
  else if (free && !work) single = free;

  return { halfWidth: half, work, free, merged, single, lo, hi };
};

/**
 * True when a sleep midpoint (shifted minutes) lies within a band, edges
 * included. Compared on a 24-hour circle around the band's centre, so a band
 * that straddles midnight behaves the same as one that does not.
 */
export const isMidSleepInBand = (midpoint, band) => {
  if (!band || typeof midpoint !== 'number' || !Number.isFinite(midpoint)) return false;
  const half = (band.hi - band.lo) / 2;
  const diff = ((((midpoint - band.centre + DAY / 2) % DAY) + DAY) % DAY) - DAY / 2;
  return Math.abs(diff) <= half;
};

/**
 * Where a night's sleep midpoint falls:
 *   'work'  in the workday band only
 *   'free'  in the free-day band only
 *   'both'  in both bands (they overlap, and the midpoint is in the overlap)
 *   'in'    in the single merged band (used instead of the above when merged)
 *   'none'  in no band
 */
export const classifyMidSleep = (midpoint, bands) => {
  if (!bands) return 'none';
  if (bands.merged) return isMidSleepInBand(midpoint, bands.single) ? 'in' : 'none';
  const inWork = isMidSleepInBand(midpoint, bands.work);
  const inFree = isMidSleepInBand(midpoint, bands.free);
  if (inWork && inFree) return 'both';
  if (inWork) return 'work';
  if (inFree) return 'free';
  return 'none';
};

/** Shifted (or plain) minutes → 'HH:MM' on a 24-hour clock. */
export const formatBandClock = (minutes) => {
  const m = ((Math.round(minutes) % DAY) + DAY) % DAY;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
