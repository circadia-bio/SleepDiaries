/**
 * __tests__/i18nKeys.test.js
 *
 * Guards the translation files:
 *   1. Every static t('some.key') / tt('some.key') call in the source refers to
 *      a key that exists in the English strings. This catches typos and keys
 *      that were deleted while still in use (the screen would show the raw key).
 *   2. Swedish and Portuguese contain every English key. (swedish.test.js also
 *      checks Swedish placeholders; this adds Portuguese and covers new keys.)
 *
 * Keys built at runtime, such as t(`appText.entryDone${suffix}`), cannot be
 * checked statically and are skipped.
 */
import fs from 'fs';
import path from 'path';
import en from '../i18n/en';
import sv from '../i18n/sv';
import ptBR from '../i18n/pt-BR';

const ROOT = path.join(__dirname, '..');
const SOURCE_DIRS = ['app', 'components', 'utils', 'data', 'storage'];

const listSourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : listSourceFiles(full);
    return /\.(js|jsx)$/.test(entry.name) ? [full] : [];
  });

// t('a.b'), tt('a.b') with a plain string literal that has at least one dot.
const KEY_CALL = /\b(?:t|tt)\(\s*(['"`])([A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+)\1/g;

const resolve = (strings, key) =>
  key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), strings);

// t() accepts a base key for plural pairs (key_one / key_other).
const exists = (strings, key) =>
  typeof resolve(strings, key) === 'string' ||
  typeof resolve(strings, `${key}_one`) === 'string' ||
  typeof resolve(strings, `${key}_other`) === 'string';

const leaves = (node, prefix = '') => {
  if (typeof node === 'string') return [prefix];
  if (Array.isArray(node)) return node.flatMap((item, i) => leaves(item, `${prefix}[${i}]`));
  if (node && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => leaves(v, prefix ? `${prefix}.${k}` : k));
  }
  return [];
};

describe('translation keys used in the source', () => {
  const used = [];
  for (const dir of SOURCE_DIRS) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const file of listSourceFiles(abs)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(KEY_CALL)) {
        used.push({ file: path.relative(ROOT, file), key: match[2] });
      }
    }
  }

  it('finds translation calls to check', () => {
    expect(used.length).toBeGreaterThan(20);
  });

  it('all exist in the English strings', () => {
    const missing = used
      .filter(({ key }) => !exists(en, key))
      .map(({ file, key }) => `${file}: ${key}`);
    expect(missing).toEqual([]);
  });
});

describe('locale completeness', () => {
  const englishKeys = leaves(en);

  it.each([
    ['Swedish', sv],
    ['Portuguese (Brazil)', ptBR],
  ])('%s has every English key', (_name, strings) => {
    const present = new Set(leaves(strings));
    const missing = englishKeys.filter((key) => !present.has(key));
    expect(missing).toEqual([]);
  });
});
