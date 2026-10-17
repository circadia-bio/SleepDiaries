/**
 * utils/referenceRanges.js — Age-banded reference ranges for the final report
 *
 * Single source of truth for the colour bands (green / amber / red) used by
 * the sleep metric cards, the scale bars, the share card and the threshold
 * reference screen. Edit the numbers here and everything follows.
 *
 * Age bands (the participant picks one, optionally, in onboarding or Profile;
 * when none is set the 'adult' band is used):
 *   under18 — teenagers and younger
 *   adult   — 18–64
 *   older   — 65 and over
 *
 * All durations are in minutes. Each metric has a green band and a wider amber
 * band; anything outside the amber band is shown red.
 *
 * Sources
 *   Duration    National Sleep Foundation, Hirshkowitz et al. (2015), Sleep
 *               Health 1(1), 40–43. Recommended range = green; "may be
 *               appropriate" range = amber.
 *                 teenagers 8–10 h (amber 7–11), adults 7–9 h (amber 6–10),
 *                 older adults 7–8 h (amber 5–9).
 *               NB: the teen range is for ~13–17. Children aged 6–12 need
 *               9–12 h (AASM/SRS consensus), so if the app is ever used with
 *               younger children, add a band rather than stretching this one.
 *   Latency /   National Sleep Foundation sleep quality recommendations,
 *   WASO        Ohayon et al. (2017), Sleep Health 3(1), 6–19. "Appropriate":
 *                 latency ≤30 min (≤60 min for 65+), WASO ≤20 min (≤30 min for 65+)
 *               and the same for children and teenagers as for adults.
 *               How this app maps those onto colours:
 *                 latency  red beyond the NSF limit; green is the app's own
 *                          stricter half (≤15 min, ≤30 min for 65+).
 *                 WASO     green up to the NSF limit; amber extends 10 min
 *                          further (15 min for 65+) before turning red.
 *               TODO(review): the 65+ amber ceiling for WASO (45 min) and the
 *               65+ latency green cut-off (30 min) follow the same proportions
 *               as the adult band; they are not taken from a published table.
 *   Efficiency  ≥85% green, 75–85% amber, in every age band (Morin, 1993; the
 *               NSF report also uses 85%). Not age-adjusted.
 */

export const AGE_BANDS = ['under18', 'adult', 'older'];
export const DEFAULT_AGE_BAND = 'adult';

const GREEN = '#2E7D32';
const AMBER = '#F59E0B';
const RED = '#DC2626';
const NEUTRAL = '#4A7BB5';

const EFFICIENCY = { greenMin: 85, amberMin: 75 };

export const REFERENCE_RANGES = {
  under18: {
    duration:   { greenMin: 480, greenMax: 600, amberMin: 420, amberMax: 660 },
    latency:    { greenMax: 15, amberMax: 30 },
    waso:       { greenMax: 20, amberMax: 30 },
    efficiency: EFFICIENCY,
  },
  adult: {
    duration:   { greenMin: 420, greenMax: 540, amberMin: 360, amberMax: 600 },
    latency:    { greenMax: 15, amberMax: 30 },
    waso:       { greenMax: 20, amberMax: 30 },
    efficiency: EFFICIENCY,
  },
  older: {
    duration:   { greenMin: 420, greenMax: 480, amberMin: 300, amberMax: 540 },
    latency:    { greenMax: 30, amberMax: 60 },
    waso:       { greenMax: 30, amberMax: 45 },
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

export const latencyColor = (mins, ranges) => {
  if (mins === null || mins === undefined) return NEUTRAL;
  if (mins <= ranges.latency.greenMax) return GREEN;
  if (mins <= ranges.latency.amberMax) return AMBER;
  return RED;
};

export const wasoColor = (mins, ranges) => {
  if (mins === null || mins === undefined) return NEUTRAL;
  if (mins <= ranges.waso.greenMax) return GREEN;
  if (mins <= ranges.waso.amberMax) return AMBER;
  return RED;
};

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

// Latency and WASO share one shape: green, then amber, then red out to twice the amber limit.
const minutesBar = (value, { greenMax, amberMax }) => {
  const max = amberMax * 2;
  const pct = (m) => (m / max) * 100;
  return {
    segments: [
      { width: pct(greenMax), color: GREEN },
      { width: pct(amberMax - greenMax), color: AMBER },
      { width: 100 - pct(amberMax), color: RED },
    ],
    marker: clampPct(value, max),
    ticks: [greenMax, amberMax].map((m) => ({ pct: pct(m), label: `${m}m` })),
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
    {
      key: 'latency',
      good: `≤${ranges.latency.greenMax}${min}`,
      borderline: `${ranges.latency.greenMax}–${ranges.latency.amberMax}${min}`,
    },
    {
      key: 'waso',
      good: `≤${ranges.waso.greenMax}${min}`,
      borderline: `${ranges.waso.greenMax}–${ranges.waso.amberMax}${min}`,
    },
  ];
};
