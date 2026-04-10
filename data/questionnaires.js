/**
 * data/questionnaires.js — One-time research questionnaire definitions
 *
 * Each questionnaire object has the shape:
 *   {
 *     id:           string          — storage key suffix (e.g. 'ess')
 *     title:        string          — display title
 *     shortTitle:   string          — compact label for chips / badges
 *     instructions: string          — shown before the first item
 *     reference:    string          — citation string
 *     items: [
 *       {
 *         id:      string           — unique within the questionnaire
 *         number:  number           — display number
 *         text:    string           — question stem
 *         type:    'scale_0_3'      — input type (extensible)
 *         options: [{ value, label }]
 *       }
 *     ],
 *     score: (answers) => number    — computes total score from answers object
 *     interpret: (score) => {
 *       label: string,              — short interpretation label
 *       color: string,              — hex colour for the badge
 *       description: string,        — longer explanation shown to participant
 *     }
 *   }
 *
 * Adding a new questionnaire:
 *   1. Define it below following the same structure.
 *   2. Add it to the QUESTIONNAIRES array at the bottom.
 *   3. Add i18n strings to i18n/en.js under `questionnaires.<id>.*` if needed.
 */

// ─── Epworth Sleepiness Scale ─────────────────────────────────────────────────

const SCALE_0_3 = [
  { value: 0, label: 'Would never doze' },
  { value: 1, label: 'Slight chance of dozing' },
  { value: 2, label: 'Moderate chance of dozing' },
  { value: 3, label: 'High chance of dozing' },
];

export const ESS = {
  id:         'ess',
  title:      'Epworth Sleepiness Scale',
  shortTitle: 'ESS',
  instructions:
    'How likely are you to doze off or fall asleep in the following situations, ' +
    'in contrast to feeling just tired? This refers to your usual way of life in ' +
    'recent times. Even if you have not done some of these things recently, try to ' +
    'work out how they would have affected you.',
  reference:
    'Johns, M. W. (1991). A new method for measuring daytime sleepiness: ' +
    'The Epworth Sleepiness Scale. Sleep, 14(6), 540–545.',
  items: [
    { id: 'ess1', number: 1, text: 'Sitting and reading',                                           type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess2', number: 2, text: 'Watching TV',                                                   type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess3', number: 3, text: 'Sitting inactive in a public place (e.g. a theatre or meeting)', type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess4', number: 4, text: 'As a passenger in a car for an hour without a break',           type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess5', number: 5, text: 'Lying down to rest in the afternoon when circumstances permit', type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess6', number: 6, text: 'Sitting and talking to someone',                                type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess7', number: 7, text: 'Sitting quietly after a lunch without alcohol',                 type: 'scale_0_3', options: SCALE_0_3 },
    { id: 'ess8', number: 8, text: 'In a car, while stopped for a few minutes in traffic',          type: 'scale_0_3', options: SCALE_0_3 },
  ],
  score: (answers) =>
    [1, 2, 3, 4, 5, 6, 7, 8]
      .reduce((sum, n) => sum + (answers[`ess${n}`] ?? 0), 0),
  interpret: (score) => {
    if (score <= 7)  return { label: 'Normal',           color: '#2E7D32', description: 'Your daytime sleepiness is within the normal range.' };
    if (score <= 9)  return { label: 'Borderline',       color: '#F59E0B', description: 'Your score is at the average borderline. Consider monitoring your sleep.' };
    if (score <= 15) return { label: 'Excessive',        color: '#EA580C', description: 'You may be experiencing excessive daytime sleepiness. Consider discussing this with a clinician.' };
    return            { label: 'Severe',                 color: '#DC2626', description: 'Your score indicates severe excessive daytime sleepiness. We recommend seeking medical advice.' };
  },
};

// ─── Registry ──────────────────────────────────────────────────────────────────

export const QUESTIONNAIRES = [ESS];

export const getQuestionnaire = (id) => QUESTIONNAIRES.find((q) => q.id === id) ?? null;
