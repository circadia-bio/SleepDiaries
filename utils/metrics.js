/**
 * utils/metrics.js — Sleep metric computation
 *
 * computeMetrics() is used by the Final Report screen to derive aggregate
 * statistics from morning diary entries. Kept here (rather than inside the
 * screen component) so it can be reused and unit-tested in isolation.
 */

const timeToMinutes = (t) => (t ? t.hour * 60 + t.minute : null);
const durationToMinutes = (d) => (d ? d.hours * 60 + d.minutes : 0);
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);

/**
 * Compute aggregate sleep metrics from an array of morning diary entries.
 *
 * @param {Array} morningEntries - Entries with type === 'morning'
 * @returns {Object} Aggregate metric averages (nulls where data are absent)
 */
export const computeMetrics = (morningEntries) => {
  const sd = [], se = [], sol = [], w = [], q = [], r = [], nw = [], al = [], ew = [];

  for (const entry of morningEntries) {
    const a = entry.answers;
    if (!a) continue;

    const solM  = durationToMinutes(a.mq3);
    const wasoM = durationToMinutes(a.mq5);
    sol.push(solM);
    w.push(wasoM);

    const bt = timeToMinutes(a.mq1);
    const rt = timeToMinutes(a.mq7);
    if (bt !== null && rt !== null) {
      let tib = rt - bt;
      if (tib < 0) tib += 1440; // overnight wrap-around
      const tst = tib - solM - wasoM;
      sd.push(Math.max(0, tst));
      const e = pct(Math.max(0, tst), tib);
      if (e !== null) se.push(e);
    }

    if (a.mq11) q.push(a.mq11);
    if (a.mq12) r.push(a.mq12);

    if (a.mq4 === 'yes' && a.mq4b !== undefined) nw.push(a.mq4b);
    else if (a.mq4 === 'no') nw.push(0);

    if (a.mq9  !== undefined) al.push(a.mq9);
    if (a.mq8  !== undefined) ew.push(a.mq8 === 'yes' ? 1 : 0);
  }

  return {
    n: morningEntries.length,
    avgSleepDuration:    avg(sd),
    avgSleepEfficiency:  avg(se),
    avgSleepOnsetLatency: avg(sol),
    avgWASO:             avg(w),
    avgQuality:          avg(q),
    avgRestedness:       avg(r),
    avgNightWakings:     avg(nw),
    avgAlcohol:          avg(al),
    earlyWakingPct:      pct(ew.filter(Boolean).length, ew.length),
  };
};
