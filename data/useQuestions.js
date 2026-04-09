/**
 * data/useQuestions.js — Locale-aware question arrays
 *
 * Returns the correct MORNING_QUESTIONS and EVENING_QUESTIONS arrays for the
 * current locale, merging translated fields (text, options, placeholder, unit)
 * over the base English definitions.
 *
 * Usage:
 *   import { useQuestions } from '../data/useQuestions';
 *   const { MORNING_QUESTIONS, EVENING_QUESTIONS } = useQuestions();
 */

import { locale } from '../i18n';
import {
  MORNING_QUESTIONS as MORNING_EN,
  EVENING_QUESTIONS as EVENING_EN,
} from './questions';
import {
  MORNING_QUESTIONS_PT_BR,
  EVENING_QUESTIONS_PT_BR,
} from './questions.pt-BR';

const isPtBR = locale === 'pt-BR' || locale === 'pt';

function mergeTranslations(baseQuestions, overrides) {
  if (!overrides || overrides.length === 0) return baseQuestions;
  const overrideMap = Object.fromEntries(overrides.map((o) => [o.id, o]));
  return baseQuestions.map((q) => {
    const override = overrideMap[q.id];
    if (!override) return q;
    return {
      ...q,
      ...(override.text    !== undefined && { text:    override.text }),
      ...(override.unit    !== undefined && { unit:    override.unit }),
      ...(override.placeholder !== undefined && { placeholder: override.placeholder }),
      ...(override.options !== undefined && { options: override.options }),
    };
  });
}

const MORNING_QUESTIONS = isPtBR
  ? mergeTranslations(MORNING_EN, MORNING_QUESTIONS_PT_BR)
  : MORNING_EN;

const EVENING_QUESTIONS = isPtBR
  ? mergeTranslations(EVENING_EN, EVENING_QUESTIONS_PT_BR)
  : EVENING_EN;

export function useQuestions() {
  return { MORNING_QUESTIONS, EVENING_QUESTIONS };
}

// Also export directly for screens that don't need the hook pattern
export { MORNING_QUESTIONS, EVENING_QUESTIONS };
