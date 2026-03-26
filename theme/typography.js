// ─── App Typography ────────────────────────────────────────────────────────────
// Fonts are loaded once in app/_layout.jsx and available everywhere.
//
// Usage in any screen:
//   import { FONTS } from '../../theme/typography';
//   <Text style={{ fontFamily: FONTS.heading }}>Welcome</Text>
//   <Text style={{ fontFamily: FONTS.body }}>Body text</Text>
// ──────────────────────────────────────────────────────────────────────────────

export const FONTS = {
  heading:     'Livvic-Bold',      // Welcome text, screen titles (40px)
  body:        'Afacad-Bold',      // General bold UI text
  bodyMedium:  'Afacad-Medium',    // Medium weight
  bodyRegular: 'Afacad-Regular',   // Regular weight
};
