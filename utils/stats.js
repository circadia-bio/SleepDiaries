/**
 * utils/stats.js — Shared diary stats helpers
 *
 * computeStats() is used by the Entry tab stats dashboard. Kept here (rather
 * than inside the screen component) so it can be reused and tested in isolation.
 */

/**
 * Compute summary stats from the full entries array.
 *
 * @param {Array} entries - All diary entries (morning + evening)
 * @returns {{ morningCount, eveningCount, daysInStudy, streak }}
 */
export const computeStats = (entries) => {
  const morningEntries = entries.filter((e) => e.type === 'morning');
  const eveningEntries = entries.filter((e) => e.type === 'evening');
  const today      = new Date().toISOString().split('T')[0];
  const dates      = entries.map((e) => e.date).sort();
  const firstDate  = dates[0];
  const daysInStudy = firstDate
    ? Math.floor((new Date(today) - new Date(firstDate)) / 86400000) + 1
    : 0;

  let streak = 0;
  const morningDates = new Set(morningEntries.map((e) => e.date));
  let d = new Date(today);
  while (morningDates.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return {
    morningCount: morningEntries.length,
    eveningCount: eveningEntries.length,
    daysInStudy,
    streak,
  };
};
