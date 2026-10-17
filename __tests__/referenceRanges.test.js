/**
 * __tests__/referenceRanges.test.js
 *
 * Tests for utils/referenceRanges.js (age-banded reference ranges) and the
 * optional age band stored by storage/storage.js.
 *
 * The most important block is the "adult band is unchanged" regression: before
 * age bands existed the report used hard-coded thresholds, and the adult band
 * must reproduce them exactly so existing participants see no difference.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AGE_BANDS,
  DEFAULT_AGE_BAND,
  REFERENCE_RANGES,
  isValidAgeBand,
  normalizeAgeBand,
  getReferenceRanges,
  durationColor,
  latencyColor,
  wasoColor,
  durationBar,
  latencyBar,
  wasoBar,
  rangeRows,
} from '../utils/referenceRanges';
import { saveAgeBand, loadAgeBand, clearAll } from '../storage/storage';

const GREEN = '#2E7D32';
const AMBER = '#F59E0B';
const RED = '#DC2626';
const NEUTRAL = '#4A7BB5';

const adult = getReferenceRanges('adult');
const under18 = getReferenceRanges('under18');
const older = getReferenceRanges('older');

// The thresholds that were hard-coded in final-report.jsx before age bands.
const legacyDuration = (m) => (m === null ? NEUTRAL : m >= 420 && m <= 540 ? GREEN : m >= 360 && m <= 600 ? AMBER : RED);
const legacyLatency = (m) => (m === null ? NEUTRAL : m <= 15 ? GREEN : m <= 30 ? AMBER : RED);
const legacyWaso = (m) => (m === null ? NEUTRAL : m <= 20 ? GREEN : m <= 30 ? AMBER : RED);

// ─── Band selection ──────────────────────────────────────────────────────────

describe('age band selection', () => {
  it('defines three bands with adult as the default', () => {
    expect(AGE_BANDS).toEqual(['under18', 'adult', 'older']);
    expect(DEFAULT_AGE_BAND).toBe('adult');
  });

  it('validates band names', () => {
    expect(isValidAgeBand('older')).toBe(true);
    expect(isValidAgeBand('teen')).toBe(false);
    expect(isValidAgeBand(null)).toBe(false);
    expect(isValidAgeBand(undefined)).toBe(false);
  });

  it('falls back to the adult band for unset or unknown values', () => {
    expect(normalizeAgeBand(null)).toBe('adult');
    expect(normalizeAgeBand(undefined)).toBe('adult');
    expect(normalizeAgeBand('bogus')).toBe('adult');
    expect(getReferenceRanges(null).band).toBe('adult');
    expect(getReferenceRanges('bogus').duration).toEqual(REFERENCE_RANGES.adult.duration);
  });

  it('returns the ranges for a valid band', () => {
    expect(getReferenceRanges('older').band).toBe('older');
    expect(getReferenceRanges('under18').duration.greenMin).toBe(480);
  });
});

// ─── Range sanity ────────────────────────────────────────────────────────────

describe('range definitions', () => {
  it.each(AGE_BANDS)('%s: duration bands are ordered amberMin < greenMin < greenMax < amberMax', (band) => {
    const { amberMin, greenMin, greenMax, amberMax } = REFERENCE_RANGES[band].duration;
    expect(amberMin).toBeLessThan(greenMin);
    expect(greenMin).toBeLessThan(greenMax);
    expect(greenMax).toBeLessThan(amberMax);
  });

  it.each(AGE_BANDS)('%s: latency and WASO amber limits sit above the green limits', (band) => {
    const r = REFERENCE_RANGES[band];
    expect(r.latency.greenMax).toBeLessThan(r.latency.amberMax);
    expect(r.waso.greenMax).toBeLessThan(r.waso.amberMax);
  });

  it('efficiency is not age-adjusted (85% green, 75% amber everywhere)', () => {
    for (const band of AGE_BANDS) {
      expect(REFERENCE_RANGES[band].efficiency).toEqual({ greenMin: 85, amberMin: 75 });
    }
  });
});

// ─── Adult band reproduces the previous hard-coded behaviour ─────────────────

describe('adult band is unchanged from the pre-age-band thresholds', () => {
  it('duration colours match at and around every boundary', () => {
    for (const m of [null, 0, 300, 359, 360, 361, 419, 420, 480, 540, 541, 599, 600, 601, 720]) {
      expect(durationColor(m, adult)).toBe(legacyDuration(m));
    }
  });

  it('latency colours match at and around every boundary', () => {
    for (const m of [null, 0, 5, 15, 16, 29, 30, 31, 60, 120]) {
      expect(latencyColor(m, adult)).toBe(legacyLatency(m));
    }
  });

  it('WASO colours match at and around every boundary', () => {
    for (const m of [null, 0, 10, 20, 21, 29, 30, 31, 60, 120]) {
      expect(wasoColor(m, adult)).toBe(legacyWaso(m));
    }
  });

  it('duration bar has the same segments and ticks as before', () => {
    const bar = durationBar(450, adult);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([60, 10, 20, 10]);
    expect(bar.segments.map((s) => s.color)).toEqual([RED, AMBER, GREEN, AMBER]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[60, '6h'], [70, '7h'], [90, '9h']]);
    expect(bar.endLabels).toEqual(['0h', '']);
    expect(bar.marker).toBeCloseTo((450 / 600) * 100);
  });

  it('latency bar has the same segments and ticks as before', () => {
    const bar = latencyBar(20, adult);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([25, 25, 50]);
    expect(bar.segments.map((s) => s.color)).toEqual([GREEN, AMBER, RED]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[25, '15m'], [50, '30m']]);
    expect(bar.marker).toBeCloseTo((20 / 60) * 100);
  });

  it('WASO bar has the same segments and ticks as before', () => {
    const bar = wasoBar(25, adult);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([33, 17, 50]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[33, '20m'], [50, '30m']]);
  });
});

// ─── Age bands behave differently where they should ──────────────────────────

describe('age-specific behaviour', () => {
  it('teenagers need more sleep: 6h40 is red, 9h30 is green', () => {
    expect(durationColor(400, under18)).toBe(RED);
    expect(durationColor(400, adult)).toBe(AMBER);
    expect(durationColor(570, under18)).toBe(GREEN);
    expect(durationColor(570, adult)).toBe(AMBER);
  });

  it('adults 65+ have a narrower recommended range: 8h20 is amber, not green', () => {
    expect(durationColor(500, adult)).toBe(GREEN);
    expect(durationColor(500, older)).toBe(AMBER);
    expect(durationColor(330, older)).toBe(AMBER); // 5h30 is borderline for 65+
    expect(durationColor(330, adult)).toBe(RED);
  });

  it('latency and WASO are more lenient for 65+', () => {
    expect(latencyColor(25, adult)).toBe(AMBER);
    expect(latencyColor(25, older)).toBe(GREEN);
    expect(latencyColor(50, older)).toBe(AMBER);
    expect(latencyColor(65, older)).toBe(RED);
    expect(wasoColor(25, adult)).toBe(AMBER);
    expect(wasoColor(25, older)).toBe(GREEN);
    expect(wasoColor(50, older)).toBe(RED);
  });

  it('teenagers share the adult latency and WASO ranges', () => {
    expect(under18.latency).toEqual(adult.latency);
    expect(under18.waso).toEqual(adult.waso);
  });
});

// ─── Bar geometry holds for every band ───────────────────────────────────────

describe.each(AGE_BANDS)('bars for the %s band', (band) => {
  const ranges = getReferenceRanges(band);

  it('segments add up to 100% and ticks stay inside the bar', () => {
    for (const bar of [durationBar(420, ranges), latencyBar(20, ranges), wasoBar(20, ranges)]) {
      const total = bar.segments.reduce((sum, s) => sum + s.width, 0);
      expect(total).toBeCloseTo(100, 5);
      for (const tick of bar.ticks) {
        expect(tick.pct).toBeGreaterThan(0);
        expect(tick.pct).toBeLessThan(100);
      }
    }
  });

  it('clamps the marker between 0 and 100', () => {
    expect(durationBar(-50, ranges).marker).toBe(0);
    expect(durationBar(5000, ranges).marker).toBe(100);
    expect(latencyBar(5000, ranges).marker).toBe(100);
    expect(wasoBar(-1, ranges).marker).toBe(0);
  });
});

// ─── Threshold screen rows ───────────────────────────────────────────────────

describe('rangeRows', () => {
  const units = { hours: 'hrs', minutes: 'min' };

  it('describes the adult ranges', () => {
    const rows = Object.fromEntries(rangeRows(adult, units).map((r) => [r.key, r]));
    expect(rows.duration.good).toBe('7–9 hrs');
    expect(rows.duration.borderline).toBe('6–7 hrs / 9–10 hrs');
    expect(rows.efficiency.good).toBe('≥85%');
    expect(rows.efficiency.borderline).toBe('75–85%');
    expect(rows.latency.good).toBe('≤15 min');
    expect(rows.latency.borderline).toBe('15–30 min');
    expect(rows.waso.good).toBe('≤20 min');
    expect(rows.waso.borderline).toBe('20–30 min');
  });

  it('describes the 65+ and under-18 ranges', () => {
    const olderRows = Object.fromEntries(rangeRows(older, units).map((r) => [r.key, r]));
    expect(olderRows.duration.good).toBe('7–8 hrs');
    expect(olderRows.duration.borderline).toBe('5–7 hrs / 8–9 hrs');
    expect(olderRows.latency.good).toBe('≤30 min');
    const teenRows = Object.fromEntries(rangeRows(under18, units).map((r) => [r.key, r]));
    expect(teenRows.duration.good).toBe('8–10 hrs');
    expect(teenRows.duration.borderline).toBe('7–8 hrs / 10–11 hrs');
  });

  it('uses the localised unit strings it is given', () => {
    const rows = Object.fromEntries(rangeRows(adult, { hours: 'tim', minutes: 'min' }).map((r) => [r.key, r]));
    expect(rows.duration.good).toBe('7–9 tim');
  });
});

// ─── Stored age band ─────────────────────────────────────────────────────────

describe('stored age band', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('is null until the participant chooses one', async () => {
    expect(await loadAgeBand()).toBeNull();
  });

  it.each(AGE_BANDS)('round-trips %s', async (band) => {
    await saveAgeBand(band);
    expect(await loadAgeBand()).toBe(band);
  });

  it('clears when saved as null (the picker deselects by tapping again)', async () => {
    await saveAgeBand('older');
    await saveAgeBand(null);
    expect(await loadAgeBand()).toBeNull();
  });

  it('ignores invalid values rather than storing them', async () => {
    await saveAgeBand('older');
    await saveAgeBand('bogus');
    expect(await loadAgeBand()).toBeNull();
  });

  it('treats a corrupted stored value as not set', async () => {
    await AsyncStorage.setItem('age_band', 'not-a-band');
    expect(await loadAgeBand()).toBeNull();
  });

  it('is removed by clearAll (log out / delete account)', async () => {
    await saveAgeBand('under18');
    await clearAll();
    expect(await loadAgeBand()).toBeNull();
  });
});
