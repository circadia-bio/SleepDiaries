/**
 * i18n/index.js — Locale detection and t() helper
 *
 * Detects the device locale at startup and selects the matching translation
 * object. Falls back to English for any unsupported locale.
 *
 * Usage anywhere in the app:
 *
 *   import { t, locale } from '../i18n';
 *
 *   // Simple key
 *   t('login.cta')                        // "Let's go" / "Vamos lá"
 *
 *   // Interpolation
 *   t('home.entriesNeeded', { count: 3 }) // "3 more entries needed"
 *
 *   // Pluralisation — keys suffixed _one / _other
 *   t('home.entriesNeeded', { count: 1 }) // "1 more entry needed"
 *   t('home.entriesNeeded', { count: 3 }) // "3 more entries needed"
 *
 * Supported locales: en (default), pt-BR
 */

import { getLocales } from 'expo-localization';
import en   from './en';
import ptBR from './pt-BR';

const TRANSLATIONS = {
  en,
  'pt-BR': ptBR,
  pt:      ptBR,  // also map bare 'pt' → pt-BR
};

/**
 * Resolve which translation bundle to use.
 * expo-localization returns an ordered list; we use the first match.
 */
function resolveTranslations() {
  try {
    const locales = getLocales();
    for (const { languageTag, languageCode } of locales) {
      if (TRANSLATIONS[languageTag])  return { bundle: TRANSLATIONS[languageTag], locale: languageTag };
      if (TRANSLATIONS[languageCode]) return { bundle: TRANSLATIONS[languageCode], locale: languageCode };
    }
  } catch (_) {
    // getLocales() can throw in some environments (e.g. Jest without setup)
  }
  return { bundle: en, locale: 'en' };
}

const { bundle: strings, locale } = resolveTranslations();

/**
 * Retrieve a translated string by dot-separated key.
 * Supports {{variable}} interpolation and automatic _one / _other pluralisation
 * when a `count` option is provided.
 */
function t(key, options = {}) {
  // Walk the dot-separated path
  const parts  = key.split('.');
  let value    = strings;
  for (const part of parts) {
    if (value == null || typeof value !== 'object') { value = null; break; }
    value = value[part];
  }

  // Pluralisation: if value is undefined, try _one / _other variants
  if ((value === null || value === undefined) && options.count !== undefined) {
    const pluralKey = options.count === 1 ? `${key}_one` : `${key}_other`;
    return t(pluralKey, options);
  }

  // Keys suffixed _one / _other are accessed directly via the count path above;
  // but callers can also use them directly — just return the string.
  if (typeof value !== 'string') {
    // Return the key itself so missing strings are visible in dev
    return key;
  }

  // Interpolate {{variables}}
  return value.replace(/\{\{(\w+)\}\}/g, (_, varName) =>
    options[varName] !== undefined ? String(options[varName]) : `{{${varName}}}`
  );
}

export { t, locale, strings };
export default t;
