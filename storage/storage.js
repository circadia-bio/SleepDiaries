/**
 * storage/storage.js — AsyncStorage helpers
 *
 * All persistent data for the app is stored locally on the device using
 * @react-native-async-storage/async-storage. No data is ever sent to a server.
 *
 * Stored keys:
 *   user_name               — participant's name string
 *   research_code           — optional research code string
 *   entries                 — JSON array of diary entry objects
 *   seen_instructions       — 'true' once the instructions modal has been dismissed
 *   questionnaire_{id}      — one object per completed one-time questionnaire
 *
 * Diary entry object shape:
 *   {
 *     id:          '{date}-{type}',   e.g. '2024-01-15-morning'
 *     type:        'morning' | 'evening'
 *     date:        'YYYY-MM-DD'
 *     completedAt: ISO timestamp string
 *     answers:     { [questionId]: value, ... }
 *   }
 *
 * Questionnaire result object shape:
 *   {
 *     id:          questionnaire id string, e.g. 'ess'
 *     completedAt: ISO timestamp string
 *     answers:     { [itemId]: number, ... }
 *     score:       number
 *   }
 *
 * Also exports CSV and JSON export helpers used by the export screen.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  USER_NAME:            'user_name',
  RESEARCH_CODE:        'research_code',
  ENTRIES:              'entries',
  SEEN_INSTRUCTIONS:    'seen_instructions',
  MEDICATION_PRESETS:   'medication_presets',
};

const questionnaireKey = (id) => `questionnaire_${id}`;

// ─── Safe JSON helper ─────────────────────────────────────────────────────────

/**
 * Safely parse a JSON string. Returns `fallback` if the string is null/undefined
 * or if parsing throws (e.g. corrupted data). Logs a warning in development so
 * issues are visible without crashing the app.
 */
const safeParseJSON = (raw, fallback, context = '') => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[storage] JSON.parse failed${context ? ` (${context})` : ''}:`, e.message);
    return fallback;
  }
};

// ─── User name ────────────────────────────────────────────────────────────────
export const saveName = async (name) => {
  try {
    await AsyncStorage.setItem(KEYS.USER_NAME, name);
  } catch (e) {
    console.warn('[storage] saveName failed:', e.message);
    throw e;
  }
};

export const loadName = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.USER_NAME);
  } catch (e) {
    console.warn('[storage] loadName failed:', e.message);
    return null;
  }
};

// ─── Research code ────────────────────────────────────────────────────────────
export const saveResearchCode = async (code) => {
  try {
    await AsyncStorage.setItem(KEYS.RESEARCH_CODE, code);
  } catch (e) {
    console.warn('[storage] saveResearchCode failed:', e.message);
    throw e;
  }
};

export const loadResearchCode = async () => {
  try {
    return await AsyncStorage.getItem(KEYS.RESEARCH_CODE);
  } catch (e) {
    console.warn('[storage] loadResearchCode failed:', e.message);
    return null;
  }
};

// ─── Entries ──────────────────────────────────────────────────────────────────
export const loadEntries = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ENTRIES);
    return safeParseJSON(raw, [], 'entries');
  } catch (e) {
    console.warn('[storage] loadEntries failed:', e.message);
    return [];
  }
};

export const saveEntry = async (entryType, answers) => {
  try {
    const entries = await loadEntries();
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const id = `${dateStr}-${entryType}`;
    const filtered = entries.filter((e) => e.id !== id);
    const newEntry = {
      id,
      type: entryType,
      date: dateStr,
      completedAt: now.toISOString(),
      answers,
    };
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify([newEntry, ...filtered]));
    return newEntry;
  } catch (e) {
    console.warn('[storage] saveEntry failed:', e.message);
    throw e;
  }
};

export const isTodayComplete = async (entryType) => {
  const entries = await loadEntries();
  const today = new Date().toISOString().split('T')[0];
  return entries.some((e) => e.date === today && e.type === entryType);
};

export const loadTodayStatus = async () => {
  const entries = await loadEntries();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.date === today);
  return {
    morningCompleted: todayEntries.some((e) => e.type === 'morning'),
    eveningCompleted: todayEntries.some((e) => e.type === 'evening'),
  };
};

export const clearAll = async () => {
  try {
    // Also remove any stored questionnaire results
    const allKeys = await AsyncStorage.getAllKeys();
    const qKeys = allKeys.filter((k) => k.startsWith('questionnaire_'));
    await AsyncStorage.multiRemove([KEYS.USER_NAME, KEYS.RESEARCH_CODE, KEYS.ENTRIES, KEYS.SEEN_INSTRUCTIONS, KEYS.MEDICATION_PRESETS, ...qKeys]);
  } catch (e) {
    console.warn('[storage] clearAll failed:', e.message);
    throw e;
  }
};

// ─── One-time questionnaires ──────────────────────────────────────────────────

/**
 * Save a completed questionnaire result.
 * Overwrites any previous result for the same questionnaire id.
 */
export const saveQuestionnaire = async (id, answers, score) => {
  try {
    const result = {
      id,
      completedAt: new Date().toISOString(),
      answers,
      score,
    };
    await AsyncStorage.setItem(questionnaireKey(id), JSON.stringify(result));
    return result;
  } catch (e) {
    console.warn('[storage] saveQuestionnaire failed:', e.message);
    throw e;
  }
};

/**
 * Load a single questionnaire result, or null if not yet completed.
 */
export const loadQuestionnaire = async (id) => {
  try {
    const raw = await AsyncStorage.getItem(questionnaireKey(id));
    return safeParseJSON(raw, null, `questionnaire_${id}`);
  } catch (e) {
    console.warn('[storage] loadQuestionnaire failed:', e.message);
    return null;
  }
};

/**
 * Load all completed questionnaire results as an array.
 */
export const loadAllQuestionnaires = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const qKeys = allKeys.filter((k) => k.startsWith('questionnaire_'));
    if (qKeys.length === 0) return [];
    const pairs = await AsyncStorage.multiGet(qKeys);
    return pairs
      .map(([key, val]) => safeParseJSON(val, null, key))
      .filter(Boolean);
  } catch (e) {
    console.warn('[storage] loadAllQuestionnaires failed:', e.message);
    return [];
  }
};

// ─── Medication presets ──────────────────────────────────────────────────────

/**
 * Load the participant's saved medication presets.
 * Returns an array of { id, name, dose, times } objects.
 */
export const loadMedicationPresets = async () => {
  try {
    const raw = await AsyncStorage.getItem(KEYS.MEDICATION_PRESETS);
    return safeParseJSON(raw, [], 'medication_presets');
  } catch (e) {
    console.warn('[storage] loadMedicationPresets failed:', e.message);
    return [];
  }
};

/**
 * Save the participant's medication presets.
 */
export const saveMedicationPresets = async (presets) => {
  try {
    await AsyncStorage.setItem(KEYS.MEDICATION_PRESETS, JSON.stringify(presets));
  } catch (e) {
    console.warn('[storage] saveMedicationPresets failed:', e.message);
    throw e;
  }
};

// ─── Instructions ──────────────────────────────────────────────────────────────
export const hasSeenInstructions = async () => {
  const val = await AsyncStorage.getItem(KEYS.SEEN_INSTRUCTIONS);
  return val === 'true';
};

export const markInstructionsSeen = async () => {
  await AsyncStorage.setItem(KEYS.SEEN_INSTRUCTIONS, 'true');
};

// ─── Data export ──────────────────────────────────────────────────────────────
import { MORNING_QUESTIONS, EVENING_QUESTIONS } from '../data/questions';
import { QUESTIONNAIRES } from '../data/questionnaires';

const ALL_QUESTIONS = [...MORNING_QUESTIONS, ...EVENING_QUESTIONS];

const flattenAnswer = (question, value) => {
  if (value === null || value === undefined) return '';
  switch (question.type) {
    case 'time':
      return `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
    case 'duration':
      return `${value.hours}h ${value.minutes}m`;
    case 'yes_no':
      return value;
    case 'number':
      return String(value);
    case 'rating':
      return String(value);
    case 'medication':
      if (!value || value.length === 0) return '';
      return value.map((m) => `${m.name}${m.dose ? ` (${m.dose}mg)` : ''}`).join('; ');
    case 'text_input':
      return (value || '').replace(/,/g, ';').replace(/\n/g, ' ');
    default:
      return String(value);
  }
};

// Build a flat CSV string from all entries
export const exportToCSV = async (userName) => {
  const researchCode = await loadResearchCode();
  const entries = await loadEntries();
  const qResults = await loadAllQuestionnaires();

  if (entries.length === 0 && qResults.length === 0) return null;

  // ── Diary section ──
  const morningHeaders = MORNING_QUESTIONS.map((q) => `morning_q${q.number}_${q.id}`);
  const eveningHeaders = EVENING_QUESTIONS.map((q) => `evening_q${q.number}_${q.id}`);
  const diaryHeaders = ['participant', 'research_code', 'date', 'entry_type', 'completed_at', ...morningHeaders, ...eveningHeaders];

  const diaryRows = entries.map((entry) => {
    const isMorning = entry.type === 'morning';

    const morningCols = MORNING_QUESTIONS.map((q) => {
      if (!isMorning) return '';
      return flattenAnswer(q, entry.answers?.[q.id]);
    });

    const eveningCols = EVENING_QUESTIONS.map((q) => {
      if (isMorning) return '';
      return flattenAnswer(q, entry.answers?.[q.id]);
    });

    return [
      userName ?? 'participant',
      researchCode ?? '',
      entry.date,
      entry.type,
      entry.completedAt,
      ...morningCols,
      ...eveningCols,
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  const diaryCsv = entries.length > 0
    ? [diaryHeaders.join(','), ...diaryRows].join('\n')
    : null;

  // ── Questionnaires section ──
  const qCsvParts = QUESTIONNAIRES.map((q) => {
    const result = qResults.find((r) => r.id === q.id);
    if (!result) return null;
    const itemHeaders = q.items.map((item) => `${q.id}_item${item.number}_${item.id}`);
    const headers = ['participant', 'research_code', 'questionnaire', 'completed_at', 'score', ...itemHeaders];
    const row = [
      userName ?? 'participant',
      researchCode ?? '',
      q.id,
      result.completedAt,
      result.score,
      ...q.items.map((item) => result.answers?.[item.id] ?? ''),
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
    return [headers.join(','), row].join('\n');
  }).filter(Boolean);

  const sections = [diaryCsv, ...qCsvParts].filter(Boolean);
  return sections.length > 0 ? sections.join('\n\n') : null;
};

// ─── Data import ────────────────────────────────────────────────────────────

/**
 * Validate that a parsed object looks like a Sleep Diaries JSON export.
 * Returns an array of valid diary entries, or throws if the file is unrecognised.
 */
const validateImport = (parsed) => {
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file format.');
  const entries = Array.isArray(parsed) ? parsed : parsed.entries;
  if (!Array.isArray(entries)) throw new Error('No entries array found in file.');
  const valid = entries.filter(
    (e) => e && e.id && e.type && e.date && e.answers
  );
  if (valid.length === 0) throw new Error('No valid entries found in file.');
  return valid;
};

/**
 * Import entries from a parsed JSON object.
 * mode: 'merge'   — keep existing entries, add new ones (existing ids win)
 * mode: 'replace' — discard all existing entries and replace with imported ones
 *
 * Also imports questionnaire results if present in the JSON, using the same
 * merge/replace logic.
 */
export const importFromJSON = async (parsed, mode = 'merge') => {
  const incoming = validateImport(parsed);

  // ── Import questionnaire results if present ──
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questionnaires)) {
    for (const result of parsed.questionnaires) {
      if (!result || !result.id || !result.answers || result.score === undefined) continue;
      if (mode === 'replace') {
        await AsyncStorage.setItem(questionnaireKey(result.id), JSON.stringify(result));
      } else {
        // Merge: only import if not already present
        const existing = await loadQuestionnaire(result.id);
        if (!existing) {
          await AsyncStorage.setItem(questionnaireKey(result.id), JSON.stringify(result));
        }
      }
    }
  }

  if (mode === 'replace') {
    await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(incoming));
    return { imported: incoming.length, skipped: 0 };
  }
  // Merge: existing entries take priority (same id = keep existing)
  const existing = await loadEntries();
  const existingIds = new Set(existing.map((e) => e.id));
  const toAdd = incoming.filter((e) => !existingIds.has(e.id));
  const merged = [...existing, ...toAdd]
    .sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(KEYS.ENTRIES, JSON.stringify(merged));
  return { imported: toAdd.length, skipped: incoming.length - toAdd.length };
};

// Build a JSON export string
export const exportToJSON = async (userName) => {
  const entries = await loadEntries();
  const qResults = await loadAllQuestionnaires();
  if (entries.length === 0 && qResults.length === 0) return null;
  const researchCode = await loadResearchCode();
  return JSON.stringify({
    participant: userName,
    researchCode: researchCode ?? null,
    exportedAt: new Date().toISOString(),
    entries,
    questionnaires: qResults,
  }, null, 2);
};
