/**
 * utils/referenceRanges.js — Age-banded reference ranges for the final report
 *
 * Single source of truth for the colour bands (green / amber / red) used by
 * the sleep metric cards, the scale bars, the share card and the threshold
 * reference screen. Edit the numbers here and everything follows.
 *
 * Age bands (the participant picks one, optionally, in onboarding or Profile;
 * when none is set the 'adult' band is used):
 *   under18 — teenagers (the paper's "teenager", 14–17)
 *   adult   — 18–64
 *   older   — 65 and over
 *
 * All durations are in minutes. Green = within the recommended / "good sleep
 * quality" range, amber = uncertain or "may be appropriate", red = rated poor
 * or not recommended.
 *
 * Sources
 *   Duration    National Sleep Foundation, Hirshkowitz et al. (2015), Sleep
 *               Health 1(1), 40–43. Recommended = green; "may be appropriate"
 *               = amber; anything else = red.
 *                 teenagers  8–10 h   (may be appropriate 7–8 h, 10–11 h)
 *                 adults     7–9 h    (may be appropriate 6–7 h, 9–10 h)
 *                 65 and over 7–8 h   (may be appropriate 5–7 h, 8–9 h)
 *               The teen range is for 14–17. Younger children need more sleep
 *               (school-aged 9–11 h), so add a band if the app is ever used
 *               with them rather than stretching this one.
 *   Latency,    National Sleep Foundation sleep quality consensus, Ohayon et
 *   WASO,       al. (2017), Sleep Health 3(1), 6–19 (RAND/UCLA method: each
 *   efficiency  value is rated appropriate, uncertain or inappropriate).
 *               We colour appropriate = green, uncertain = amber, poor = red.
 *                 Latency     good ≤30 min at every age (the panel rated both
 *                             0–15 and 16–30 min as good). Poor: >45 min for
 *                             everyone except adults 65+, for whom only >60 min
 *                             is poor (31–60 min is uncertain).
 *                 WASO        good ≤20 min at every age. Poor: ≥41 min for
 *                             adults, ≥51 min for teenagers. The panel gave no
 *                             "poor" cut-off for adults 65+, so for them
 *                             anything above 20 min is amber and never red.
 *                 Efficiency  good ≥85% at every age; poor ≤74% (≤64% for
 *                             young adults 18–25, which we do not model
 *                             separately). Not age-adjusted here.
 *   The paper's categories map onto our bands as: teenager → under18,
 *   adult (26–64) → adult (young adults 18–25 differ only in efficiency),
 *   older adult → older.
 */

import { COLORS } from '../theme/colors';

export const AGE_BANDS = ['under18', 'adult', 'older'];
export const DEFAULT_AGE_BAND = 'adult';

const GREEN = COLORS.status.good;
const AMBER = COLORS.status.warn;
const RED = COLORS.status.bad;
const NEUTRAL = COLORS.status.neutral;

const EFFICIENCY = { greenMin: 85, amberMin: 75 };

// latency / waso: greenMax and amberMax are the highest values (minutes) that
// are still green / amber. amberMax: null means "no red" (open-ended amber).
// barMax is the right-hand end of the scale bar in the report.
export const REFERENCE_RANGES = {
  under18: {
    duration:   { greenMin: 480, greenMax: 600, amberMin: 420, amberMax: 660 },
    latency:    { greenMax: 30, amberMax: 45, barMax: 90 },
    waso:       { greenMax: 20, amberMax: 50, barMax: 100 },
    efficiency: EFFICIENCY,
  },
  adult: {
    duration:   { greenMin: 420, greenMax: 540, amberMin: 360, amberMax: 600 },
    latency:    { greenMax: 30, amberMax: 45, barMax: 90 },
    waso:       { greenMax: 20, amberMax: 40, barMax: 80 },
    efficiency: EFFICIENCY,
  },
  older: {
    duration:   { greenMin: 420, greenMax: 480, amberMin: 300, amberMax: 540 },
    latency:    { greenMax: 30, amberMax: 60, barMax: 120 },
    waso:       { greenMax: 20, amberMax: null, barMax: 80 },
    efficiency: EFFICIENCY,
  },
};

export const isValidAgeBand = (band) => AGE_BANDS.includes(band);

export const normalizeAgeBand = (band) => (isValidAgeBand(band) ? band : DEFAULT_AGE_BAND);

/** Ranges for a band, falling back to the adult band for unset/unknown values. */
export const getReferenceRanges = (band) => {
  const key = normalizeAgeBand(band);
  return { band: key, ...REFERENCE_RANGES[key] };
};

// ─── Colours ──────────────────────────────────────────────────────────────────

export const durationColor = (mins, ranges) => {
  if (mins === null || mins === undefined) return NEUTRAL;
  const { greenMin, greenMax, amberMin, amberMax } = ranges.duration;
  if (mins >= greenMin && mins <= greenMax) return GREEN;
  if (mins >= amberMin && mins <= amberMax) return AMBER;
  return RED;
};

const minutesColor = (mins, { greenMax, amberMax }) => {
  if (mins === null || mins === undefined) return NEUTRAL;
  if (mins <= greenMax) return GREEN;
  if (amberMax === null || amberMax === undefined || mins <= amberMax) return AMBER;
  return RED;
};

export const latencyColor = (mins, ranges) => minutesColor(mins, ranges.latency);
export const wasoColor = (mins, ranges) => minutesColor(mins, ranges.waso);

// ─── Scale bars ───────────────────────────────────────────────────────────────
// Each builder returns the props for the BandBar component in final-report.jsx:
// { segments: [{ width (%), color }], marker (%), ticks: [{ pct, label }], endLabels }

const clampPct = (value, max) => (Math.min(Math.max(value, 0), max) / max) * 100;
const hoursLabel = (mins) => `${Number((mins / 60).toFixed(1))}h`;

export const durationBar = (value, ranges) => {
  const { greenMin, greenMax, amberMin, amberMax } = ranges.duration;
  const max = amberMax;
  const pct = (m) => (m / max) * 100;
  return {
    segments: [
      { width: pct(amberMin), color: RED },
      { width: pct(greenMin - amberMin), color: AMBER },
      { width: pct(greenMax - greenMin), color: GREEN },
      { width: pct(amberMax - greenMax), color: AMBER },
    ],
    marker: clampPct(value, max),
    ticks: [amberMin, greenMin, greenMax].map((m) => ({ pct: pct(m), label: hoursLabel(m) })),
    endLabels: ['0h', ''],
  };
};

// Latency and WASO share one shape: green, then amber, then (when the paper
// defines a "poor" level) red out to the end of the bar.
const minutesBar = (value, { greenMax, amberMax, barMax }) => {
  const pct = (m) => (m / barMax) * 100;
  const hasRed = amberMax !== null && amberMax !== undefined;
  const amberEnd = hasRed ? amberMax : barMax;
  const segments = [
    { width: pct(greenMax), color: GREEN },
    { width: pct(amberEnd - greenMax), color: AMBER },
  ];
  if (hasRed) segments.push({ width: 100 - pct(amberMax), color: RED });
  return {
    segments,
    marker: clampPct(value, barMax),
    ticks: (hasRed ? [greenMax, amberMax] : [greenMax]).map((m) => ({ pct: pct(m), label: `${m}m` })),
    endLabels: ['0m', ''],
  };
};

export const latencyBar = (value, ranges) => minutesBar(value, ranges.latency);
export const wasoBar = (value, ranges) => minutesBar(value, ranges.waso);

// ─── Text rows for the threshold reference screen ─────────────────────────────

/**
 * Rows describing the current ranges in words-free form (numbers + units).
 * `units` supplies the localised unit strings, e.g. { hours: 'h', minutes: 'min' }.
 */
export const rangeRows = (ranges, units) => {
  const h = (m) => Number((m / 60).toFixed(1));
  const d = ranges.duration;
  const hrs = ` ${units.hours}`;
  const min = ` ${units.minutes}`;

  const minutesRow = (key, r) => ({
    key,
    good: `≤${r.greenMax}${min}`,
    borderline:
      r.amberMax === null || r.amberMax === undefined
        ? `>${r.greenMax}${min}`
        : `${r.greenMax + 1}–${r.amberMax}${min}`,
  });

  return [
    {
      key: 'duration',
      good: `${h(d.greenMin)}–${h(d.greenMax)}${hrs}`,
      borderline: `${h(d.amberMin)}–${h(d.greenMin)}${hrs} / ${h(d.greenMax)}–${h(d.amberMax)}${hrs}`,
    },
    {
      key: 'efficiency',
      good: `≥${ranges.efficiency.greenMin}%`,
      borderline: `${ranges.efficiency.amberMin}–${ranges.efficiency.greenMin}%`,
    },
    minutesRow('latency', ranges.latency),
    minutesRow('waso', ranges.waso),
  ];
};
