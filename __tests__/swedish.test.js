/** Swedish locale coverage and data-contract regression tests. */
import en from '../i18n/en';
import sv from '../i18n/sv';
import { MORNING_QUESTIONS, EVENING_QUESTIONS } from '../data/questions';
import { MORNING_QUESTIONS_SV, EVENING_QUESTIONS_SV } from '../data/questions.sv';

function leaves(value, prefix = '') {
  return Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof item === 'string' ? [[path, item]] : leaves(item, path);
  });
}
const placeholders = (s) => (s.match(/\{\{\w+\}\}/g) ?? []).sort();

function loadLocale(languageTag, languageCode) {
  let result;
  jest.isolateModules(() => {
    jest.doMock('expo-localization', () => ({
      getLocales: () => [{ languageTag, languageCode }],
    }));
    result = {
      ...require('../i18n'),
      questions: require('../data/useQuestions'),
      instruments: require('../data/questionnaires'),
    };
  });
  return result;
}

describe('Swedish translations', () => {
  it('covers every English UI string, including slide arrays and interpolation variables', () => {
    const source = Object.fromEntries(leaves(en));
    const translated = Object.fromEntries(leaves(sv));
    expect(Object.keys(translated).sort()).toEqual(Object.keys(source).sort());
    for (const [key, value] of Object.entries(source)) {
      expect(translated[key].trim()).not.toBe('');
      expect(placeholders(translated[key])).toEqual(placeholders(value));
    }
  });

  it.each([
    ['morning', MORNING_QUESTIONS, MORNING_QUESTIONS_SV],
    ['evening', EVENING_QUESTIONS, EVENING_QUESTIONS_SV],
  ])('covers all %s diary text without overriding stored IDs, controls or values', (_, source, translated) => {
    expect(translated.map((q) => q.id)).toEqual(source.map((q) => q.id));
    source.forEach((q, index) => {
      const localized = translated[index];
      expect(localized.text).toBeTruthy();
      expect(Object.keys(localized).every((key) => ['id', 'text', 'hint', 'unit', 'placeholder', 'options'].includes(key))).toBe(true);
      for (const field of ['hint', 'unit', 'placeholder']) {
        if (q[field] !== undefined) expect(localized[field]).toBeTruthy();
      }
      if (q.options) {
        expect(localized.options.map(({ value }) => value)).toEqual(q.options.map(({ value }) => value));
        expect(localized.options.every(({ label }) => label.length > 0)).toBe(true);
      }
    });
  });

  it.each(['sv', 'sv-SE', 'sv-FI'])('resolves %s, interpolates plurals and retains diary response contracts', (tag) => {
    const result = loadLocale(tag, 'sv');
    expect(result.locale).toBe(tag);
    expect(result.isSwedish).toBe(true);
    expect(result.t('tabs.settings')).toBe('Inställningar');
    expect(result.t('home.entriesNeeded', { count: 1 })).toBe('1 anteckning till behövs');
    expect(result.t('home.entriesNeeded', { count: 2 })).toBe('2 anteckningar till behövs');
    for (const [key, source] of [['MORNING_QUESTIONS', MORNING_QUESTIONS], ['EVENING_QUESTIONS', EVENING_QUESTIONS]]) {
      result.questions[key].forEach((q, index) => {
        const original = source[index];
        for (const field of ['id', 'number', 'type', 'defaultValue', 'conditionalOn', 'followUp', 'optional', 'min', 'max']) {
          expect(q[field]).toEqual(original[field]);
        }
        expect(q.text).not.toBe(original.text);
      });
    }
  });

  it('retains the source diary alcohol measure and response scale values', () => {
    const { questions } = loadLocale('sv-FI', 'sv');
    const alcohol = questions.MORNING_QUESTIONS.find((q) => q.id === 'mq9');
    expect(alcohol.hint.match(/\d+/g)).toEqual(['1', '355', '150', '45']);
    expect(alcohol.unit).toBe('glas');
    const quality = questions.MORNING_QUESTIONS.find((q) => q.id === 'mq11');
    expect(quality.options.map(({ value }) => value)).toEqual([1, 2, 3, 4, 5]);
  });

  it('keeps research instrument content and scoring functions identical in Swedish', () => {
    const english = loadLocale('en', 'en').instruments;
    const swedish = loadLocale('sv-SE', 'sv').instruments;
    const serialize = (value) => JSON.stringify(value, (_, item) => typeof item === 'function' ? item.toString() : item);
    expect(serialize(swedish)).toBe(serialize(english));
  });

  it('preserves English fallback for unsupported languages', () => {
    const result = loadLocale('zz-ZZ', 'zz');
    expect(result.locale).toBe('en');
    expect(result.t('tabs.settings')).toBe('Settings');
    expect(result.isSwedish).toBe(false);
  });
});
