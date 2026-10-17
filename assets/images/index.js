/**
 * assets/images/index.js — Image map
 *
 * React Native/Metro requires static require() paths at build time, so every
 * image the app uses is declared explicitly here.
 *
 * Only genuine images live here. All former UI artwork is now rendered in code:
 *   - Tab bar                  → Ionicons in app/(tabs)/_layout.jsx
 *   - Entry cards              → components/EntryCardContent.jsx
 *   - Entry-complete splash    → components/EntryCompleteSplash.jsx
 *   - Past Entries / Report    → components/BottomCards.jsx
 *   - Back / Next buttons      → components/NavButtons.jsx
 *   - Screen backgrounds       → components/ScreenBackground.jsx
 *
 * Usage:
 *   import IMAGES from '../../assets/images';
 *   <Image source={IMAGES.logo} />
 */

const logo = require('./logo.png');

const IMAGES = {
  logo,
};

export default IMAGES;
