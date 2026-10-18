/**
 * theme/colors.js — Central colour palette
 *
 * One place to change the look of the app.
 *
 *   COLORS  shared palette, status colours (green / amber / red) and text colours
 *   THEME   the morning (amber) and evening (blue) looks used by the daily
 *           questionnaire, the entry cards and the entry-complete screen
 *
 * Fonts live in theme/typography.js.
 *
 * Accessibility: `textMuted` is #64748B (about 4.8:1 on white). It replaces the
 * earlier #94A3B8 (about 2.6:1), which was too faint for hints and captions.
 * The card title and pill colours in THEME also aim for WCAG AA contrast on their
 * gradients, so check contrast if you change them.
 *
 * Some older screens still use hex values inline. They can move to these tokens
 * gradually; new code should import from here.
 */

export const COLORS = {
  // Brand palette (shared with slumbR and ScoreMe)
  navy:       '#1E3A5F',
  blue:       '#4A7BB5',
  orange:     '#E07A20',
  lightBlue:  '#C8DFF5',
  background: '#EEF5FF',
  cream:      '#FFFDF7',

  // Text
  textMuted:  '#64748B',

  // Report status colours (green / amber / red) and the "no data" colour
  status: {
    good:    '#2E7D32',
    warn:    '#F59E0B',
    bad:     '#DC2626',
    neutral: '#4A7BB5',
  },
};

export const THEME = {
  morning: {
    // Daily questionnaire
    primary:             '#E07A20',
    primaryLight:        '#F5C96A',
    progressBg:          '#F5DEB3',
    background:          'transparent',
    cardBg:              '#FFF8EE',
    progressFill:        '#E07A20',
    progressTrackBg:     '#FFFFFF',
    progressTrackBorder: '#F5C96A',
    // Entry card (components/EntryCardContent.jsx)
    entryFrom:           '#F2AF6C',
    entryTo:             '#F7C77F',
    entryTitle:          '#A94100',
    entryPill:           'rgba(255,255,255,0.38)',
    entryPillText:       '#8F3600',
    // Entry-complete screen (components/EntryCompleteSplash.jsx)
    splashTitle:         '#C4623F',
    splashBadge:         '#F0A862',
    splashCheck:         '#5FA3DB',
    splashButton:        '#B9D3EC',
  },
  evening: {
    // Daily questionnaire
    primary:             '#2A6CB5',
    primaryLight:        '#7EB0E0',
    progressBg:          '#C8DFF5',
    background:          'transparent',
    cardBg:              '#EEF5FF',
    progressFill:        '#4A9FE0',
    progressTrackBg:     '#FFFFFF',
    progressTrackBorder: '#A8D0F0',
    // Entry card
    entryFrom:           '#7EB0DE',
    entryTo:             '#B2CFEC',
    entryTitle:          '#24496B',
    entryPill:           '#A9D2F7',
    entryPillText:       '#24496B',
    entryLockedText:     '#3D3C7A',
    // Entry-complete screen
    splashTitle:         '#3F82C0',
    splashBadge:         '#A2C6E8',
    splashCheck:         '#DD7F5A',
    splashButton:        '#F0A862',
  },
};
