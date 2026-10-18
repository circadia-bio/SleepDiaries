/**
 * __tests__/referenceRanges.test.js
 *
 * Tests for utils/referenceRanges.js (age-banded reference ranges) and the
 * optional age band stored by storage/storage.js.
 *
 * Two sources are pinned here:
 *   - Duration: NSF recommendations (Hirshkowitz et al., 2015). The adult
 *     duration band must keep reproducing the thresholds the report used before
 *     age bands existed.
 *   - Latency and WASO: NSF sleep quality consensus (Ohayon et al., 2017, Sleep
 *     Health 3(1), 6–19): good = green, uncertain = amber, poor = red.
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

// The duration thresholds that were hard-coded in final-report.jsx before age bands.
const legacyDuration = (m) => (m === null ? NEUTRAL : m >= 420 && m <= 540 ? GREEN : m >= 360 && m <= 600 ? AMBER : RED);

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

  it.each(AGE_BANDS)('%s: latency and WASO limits are ordered and fit on their bars', (band) => {
    for (const metric of ['latency', 'waso']) {
      const { greenMax, amberMax, barMax } = REFERENCE_RANGES[band][metric];
      expect(greenMax).toBeLessThan(barMax);
      if (amberMax !== null) {
        expect(greenMax).toBeLessThan(amberMax);
        expect(amberMax).toBeLessThan(barMax);
      }
    }
  });

  it('efficiency is not age-adjusted (85% green, 75% amber everywhere)', () => {
    for (const band of AGE_BANDS) {
      expect(REFERENCE_RANGES[band].efficiency).toEqual({ greenMin: 85, amberMin: 75 });
    }
  });
});

// ─── Duration: adult band unchanged ──────────────────────────────────────────

describe('adult duration band is unchanged from the pre-age-band thresholds', () => {
  it('colours match at and around every boundary', () => {
    for (const m of [null, 0, 300, 359, 360, 361, 419, 420, 480, 540, 541, 599, 600, 601, 720]) {
      expect(durationColor(m, adult)).toBe(legacyDuration(m));
    }
  });

  it('bar has the same segments and ticks as before', () => {
    const bar = durationBar(450, adult);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([60, 10, 20, 10]);
    expect(bar.segments.map((s) => s.color)).toEqual([RED, AMBER, GREEN, AMBER]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[60, '6h'], [70, '7h'], [90, '9h']]);
    expect(bar.endLabels).toEqual(['0h', '']);
    expect(bar.marker).toBeCloseTo((450 / 600) * 100);
  });
});

// ─── Latency and WASO follow the NSF consensus (Ohayon et al., 2017) ─────────

describe('sleep latency follows the NSF consensus', () => {
  it('adults: good up to 30 min, uncertain 31–45, poor above 45', () => {
    for (const m of [0, 15, 16, 30]) expect(latencyColor(m, adult)).toBe(GREEN);
    for (const m of [31, 45]) expect(latencyColor(m, adult)).toBe(AMBER);
    for (const m of [46, 60, 120]) expect(latencyColor(m, adult)).toBe(RED);
  });

  it('teenagers share the adult latency ranges', () => {
    expect(under18.latency).toEqual(adult.latency);
  });

  it('adults 65+: good up to 30 min, uncertain 31–60, poor above 60', () => {
    for (const m of [0, 30]) expect(latencyColor(m, older)).toBe(GREEN);
    for (const m of [31, 45, 46, 60]) expect(latencyColor(m, older)).toBe(AMBER);
    for (const m of [61, 120]) expect(latencyColor(m, older)).toBe(RED);
  });

  it('is neutral when there is no data', () => {
    expect(latencyColor(null, adult)).toBe(NEUTRAL);
    expect(latencyColor(undefined, older)).toBe(NEUTRAL);
  });
});

describe('wake after sleep onset follows the NSF consensus', () => {
  it('adults: good up to 20 min, uncertain 21–40, poor from 41', () => {
    for (const m of [0, 10, 20]) expect(wasoColor(m, adult)).toBe(GREEN);
    for (const m of [21, 40]) expect(wasoColor(m, adult)).toBe(AMBER);
    for (const m of [41, 90]) expect(wasoColor(m, adult)).toBe(RED);
  });

  it('teenagers: good up to 20 min, uncertain 21–50, poor from 51', () => {
    for (const m of [0, 20]) expect(wasoColor(m, under18)).toBe(GREEN);
    for (const m of [21, 41, 50]) expect(wasoColor(m, under18)).toBe(AMBER);
    for (const m of [51, 90]) expect(wasoColor(m, under18)).toBe(RED);
  });

  it('adults 65+: good up to 20 min, then amber with no red (the paper gives no poor level)', () => {
    for (const m of [0, 20]) expect(wasoColor(m, older)).toBe(GREEN);
    for (const m of [21, 45, 60, 300]) expect(wasoColor(m, older)).toBe(AMBER);
  });

  it('is neutral when there is no data', () => {
    expect(wasoColor(null, adult)).toBe(NEUTRAL);
  });
});

// ─── Other age differences ───────────────────────────────────────────────────

describe('duration differs by age', () => {
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
});

describe('the same value reads differently by age', () => {
  it('50 min of latency is poor for adults but uncertain for 65+', () => {
    expect(latencyColor(50, adult)).toBe(RED);
    expect(latencyColor(50, older)).toBe(AMBER);
  });

  it('45 min of WASO is poor for adults, uncertain for teenagers and 65+', () => {
    expect(wasoColor(45, adult)).toBe(RED);
    expect(wasoColor(45, under18)).toBe(AMBER);
    expect(wasoColor(45, older)).toBe(AMBER);
  });
});

// ─── Bars ────────────────────────────────────────────────────────────────────

describe('latency and WASO bars', () => {
  it('adult latency bar: green to 30, amber to 45, red beyond', () => {
    const bar = latencyBar(20, adult);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([33, 17, 50]);
    expect(bar.segments.map((s) => s.color)).toEqual([GREEN, AMBER, RED]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[33, '30m'], [50, '45m']]);
    expect(bar.marker).toBeCloseTo((20 / 90) * 100);
  });

  it('adult WASO bar: green to 20, amber to 40, red beyond', () => {
    const bar = wasoBar(25, adult);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([25, 25, 50]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[25, '20m'], [50, '40m']]);
  });

  it('teenage WASO bar puts red at 50 min', () => {
    const bar = wasoBar(25, under18);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([20, 30, 50]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[20, '20m'], [50, '50m']]);
  });

  it('65+ WASO bar has no red segment', () => {
    const bar = wasoBar(30, older);
    expect(bar.segments.map((s) => s.color)).toEqual([GREEN, AMBER]);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([25, 75]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[25, '20m']]);
  });

  it('65+ latency bar: red only beyond 60', () => {
    const bar = latencyBar(40, older);
    expect(bar.segments.map((s) => Math.round(s.width))).toEqual([25, 25, 50]);
    expect(bar.ticks.map((t) => [Math.round(t.pct), t.label])).toEqual([[25, '30m'], [50, '60m']]);
  });
});

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
  const byKey = (ranges, u = units) => Object.fromEntries(rangeRows(ranges, u).map((r) => [r.key, r]));

  it('describes the adult ranges', () => {
    const rows = byKey(adult);
    expect(rows.duration.good).toBe('7–9 hrs');
    expect(rows.duration.borderline).toBe('6–7 hrs / 9–10 hrs');
    expect(rows.efficiency.good).toBe('≥85%');
    expect(rows.efficiency.borderline).toBe('75–85%');
    expect(rows.latency.good).toBe('≤30 min');
    expect(rows.latency.borderline).toBe('31–45 min');
    expect(rows.waso.good).toBe('≤20 min');
    expect(rows.waso.borderline).toBe('21–40 min');
  });

  it('describes the 65+ ranges, including the open-ended WASO band', () => {
    const rows = byKey(older);
    expect(rows.duration.good).toBe('7–8 hrs');
    expect(rows.duration.borderline).toBe('5–7 hrs / 8–9 hrs');
    expect(rows.latency.good).toBe('≤30 min');
    expect(rows.latency.borderline).toBe('31–60 min');
    expect(rows.waso.good).toBe('≤20 min');
    expect(rows.waso.borderline).toBe('>20 min');
  });

  it('describes the under-18 ranges', () => {
    const rows = byKey(under18);
    expect(rows.duration.good).toBe('8–10 hrs');
    expect(rows.duration.borderline).toBe('7–8 hrs / 10–11 hrs');
    expect(rows.latency.borderline).toBe('31–45 min');
    expect(rows.waso.borderline).toBe('21–50 min');
  });

  it('uses the localised unit strings it is given', () => {
    const rows = byKey(adult, { hours: 'tim', minutes: 'min' });
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
