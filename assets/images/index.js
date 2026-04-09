/**
 * assets/images/index.js — Locale-aware image map
 *
 * React Native/Metro requires static require() paths at build time —
 * dynamic paths constructed at runtime cannot be resolved. All locale
 * variants are therefore declared explicitly here, and the correct set
 * is selected once at module load time based on the detected locale.
 *
 * EN  → assets/images/          (original files, default fallback)
 * PT-BR → assets/images/pt-BR/  (same filenames, same canvas size)
 *
 * Taskbar images are icon-only (no text) and are therefore shared
 * across all locales — no pt-BR variants needed.
 *
 * Usage:
 *   import IMAGES from '../../assets/images';
 *   <Image source={IMAGES.morningPending} />
 */

import { locale } from '../../i18n';

const isPtBR = locale === 'pt-BR' || locale === 'pt';

// ─── Entry cards (locale-specific) ───────────────────────────────────────────
const morningPending = isPtBR
  ? require('./pt-BR/morning_pending.png')
  : require('./morning_pending.png');

const morningCompleted = isPtBR
  ? require('./pt-BR/morning_completed.png')
  : require('./morning_completed.png');

const eveningPending = isPtBR
  ? require('./pt-BR/evening_pending.png')
  : require('./evening_pending.png');

const eveningCompleted = isPtBR
  ? require('./pt-BR/evening_completed.png')
  : require('./evening_completed.png');

const eveningLocked = isPtBR
  ? require('./pt-BR/evening_locked.png')
  : require('./evening_locked.png');

// ─── Taskbar — icon-only, shared across all locales ──────────────────────────
const taskbar1 = require('./taskbar-1.png');
const taskbar2 = require('./taskbar-2.png');
const taskbar3 = require('./taskbar-3.png');

// ─── Non-translated images ────────────────────────────────────────────────────
const finalReport       = require('./final-report.png');
const finalReportLocked = require('./final-report-locked.png');
const pastEntries       = require('./past-entries.png');
const homepageBg        = require('./homepage-bg.png');
const loginBg           = require('./login-bg.png');
const questionnaireBg   = require('./questionnaire-bg.png');
const splashEndMorning  = require('./splash-end-morning.png');
const splashEndNight    = require('./splash-end-night.png');
const logo              = require('./logo.png');

const IMAGES = {
  morningPending,
  morningCompleted,
  eveningPending,
  eveningCompleted,
  eveningLocked,
  taskbar1,
  taskbar2,
  taskbar3,
  finalReport,
  finalReportLocked,
  pastEntries,
  homepageBg,
  loginBg,
  questionnaireBg,
  splashEndMorning,
  splashEndNight,
  logo,
};

export default IMAGES;
