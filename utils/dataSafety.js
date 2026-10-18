/**
 * utils/dataSafety.js — Keeping participants' data safe
 *
 * All entries live on the device (AsyncStorage; localStorage on the web), so
 * there is no server copy. Two things can lose them:
 *   - Browsers may evict storage for sites that aren't installed to the home
 *     screen, or when the user clears browsing data.
 *   - Changing or resetting a phone.
 *
 * This module contains:
 *   - requestPersistentStorage()  asks the browser not to evict our data (web)
 *   - isStandalonePwa()           true when running as an installed PWA
 *   - isTouchDevice()             true on phones/tablets (web)
 *   - pickReminder()              the rules for which reminder, if any, to show
 *
 * Reminders (shown by components/DataSafetyBanner.jsx on the Home tab):
 *   'install'  web, touch device, not installed, after the first entry
 *   'backup'   after 7+ entries when there has been no export for 14+ days
 * Each can be dismissed ("Not now") and then stays quiet for a while.
 */
import { Platform } from 'react-native';

export const BACKUP_MIN_ENTRIES = 7;
export const BACKUP_INTERVAL_DAYS = 14;
export const BACKUP_DISMISS_DAYS = 7;
export const INSTALL_DISMISS_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

const onWeb = () => Platform.OS === 'web' && typeof window !== 'undefined';

export const isStandalonePwa = () =>
  onWeb() &&
  (
    window.navigator.standalone === true ||
    (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
  );

export const isTouchDevice = () => onWeb() && (window.navigator.maxTouchPoints || 0) > 0;

/**
 * Ask the browser to keep this site's storage. Resolves true when storage is
 * (now) persistent; false when unsupported, refused, or not on the web.
 */
export const requestPersistentStorage = async () => {
  if (!onWeb()) return false;
  try {
    const storage = window.navigator.storage;
    if (!storage || typeof storage.persist !== 'function') return false;
    if (typeof storage.persisted === 'function' && (await storage.persisted())) return true;
    return await storage.persist();
  } catch (e) {
    return false;
  }
};

const dismissedRecently = (timestamp, now, days) =>
  typeof timestamp === 'number' && now - timestamp < days * DAY_MS;

/**
 * Decide which reminder to show.
 *
 * @param {object}  p
 * @param {boolean} p.isWeb        running on the web
 * @param {boolean} p.standalone   running as an installed PWA
 * @param {boolean} p.touch        touch device (phone/tablet)
 * @param {number}  p.entryCount   total diary entries saved so far
 * @param {number|null} p.lastExportAt  ms timestamp of the last export
 * @param {{install?: number, backup?: number}} p.dismissals  ms timestamps
 * @param {number}  p.now          current time in ms
 * @returns {'install' | 'backup' | null}
 */
export const pickReminder = ({
  isWeb = false,
  standalone = false,
  touch = false,
  entryCount = 0,
  lastExportAt = null,
  dismissals = {},
  now = Date.now(),
} = {}) => {
  if (
    isWeb && !standalone && touch && entryCount >= 1 &&
    !dismissedRecently(dismissals.install, now, INSTALL_DISMISS_DAYS)
  ) {
    return 'install';
  }

  const backupDue =
    entryCount >= BACKUP_MIN_ENTRIES &&
    (lastExportAt === null || lastExportAt === undefined || now - lastExportAt >= BACKUP_INTERVAL_DAYS * DAY_MS);

  if (backupDue && !dismissedRecently(dismissals.backup, now, BACKUP_DISMISS_DAYS)) {
    return 'backup';
  }

  return null;
};
