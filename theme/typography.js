// ─── App Typography ────────────────────────────────────────────────────────────
// Fonts and sizes are defined here and imported across all screens.
// Change values here to update the whole app at once.
//
// Usage:
//   import { FONTS, SIZES } from '../../theme/typography';
//   <Text style={{ fontFamily: FONTS.heading, fontSize: SIZES.screenTitle }}>
// ──────────────────────────────────────────────────────────────────────────────

export const FONTS = {
  heading:     'Livvic-Bold',      // Screen titles, names, large values
  body:        'Afacad-Bold',      // Buttons, labels, emphasis
  bodyMedium:  'Afacad-Medium',    // Body text, hints, descriptions
  bodyRegular: 'Afacad-Regular',   // Secondary text
};

export const SIZES = {
  // Headings
  screenTitle:  28,   // e.g. "Settings", "Past Entries"
  sectionTitle: 22,   // e.g. welcome text, card titles
  cardTitle:    20,   // e.g. entry type, modal header

  // Body
  body:         18,   // Primary body text, row labels
  bodySmall:    16,   // Secondary body, subtitles, hints
  caption:      14,   // Supporting captions, chip labels, dates

  // UI chrome
  label:        15,   // Section headers (uppercased), tags
  badge:        13,   // Small badges, legal text
};
