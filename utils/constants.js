/**
 * utils/constants.js — Shared app-wide constants
 *
 * Single source of truth for thresholds and magic numbers used across
 * multiple screens. Update here and every consumer automatically picks
 * up the change.
 */

/**
 * Minimum number of morning diary entries required to:
 *  - unlock the Final Report screen
 *  - reveal one-time questionnaire results in the Profile modal
 *  - show the sleep stats dashboard on the Entry tab
 *
 * Used by: home.jsx, entry.jsx, final-report.jsx, ProfileModal.jsx
 */
export const MIN_ENTRIES_FOR_REPORT = 14;
