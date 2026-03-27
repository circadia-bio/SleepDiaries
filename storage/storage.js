/**
 * storage/storage.js — AsyncStorage helpers
 *
 * All persistent data for the app is stored locally on the device using
 * @react-native-async-storage/async-storage. No data is ever sent to a server.
 *
 * Stored keys:
 *   user_name         — participant’s name string
 *   entries           — JSON array of entry objects
 *   seen_instructions — 'true' once the instructions modal has been dismissed
 *
 * Entry object shape:
 *   {
 *     id:          '{date}-{type}',   e.g. '2024-01-15-morning'
 *     type:        'morning' | 'evening'
 *     date:        'YYYY-MM-DD'
 *     completedAt: ISO timestamp string
 *     answers:     { [questionId]: value, ... }
 *   }
 *
 * Also exports CSV and JSON export helpers used by the export screen.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  USER_NAME:            'user_name',
  ENTRIES:              'entries',
  SEEN_INSTRUCTIONS:    'seen_instructions',
};

// ─── User name ────────────────────────────────────────────────────────────────
export const saveName = async (name) => {
  await AsyncStorage.setItem(KEYS.USER_NAME, name);
};

export const loadName = async () => {
  return await AsyncStorage.getItem(KEYS.USER_NAME);
};

// ─── Entries ──────────────────────────────────────────────────────────────────
export const loadEntries = async () => {
  const raw = await AsyncStorage.getItem(KEYS.ENTRIES);
  return raw ? JSON.parse(raw) : [];
};

export const saveEntry = async (entryType, answers) => {
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
  await AsyncStorage.multiRemove([KEYS.USER_NAME, KEYS.ENTRIES, KEYS.SEEN_INSTRUCTIONS]);
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
  const entries = await loadEntries();
  if (entries.length === 0) return null;

  // ── Build headers ──
  const morningHeaders = MORNING_QUESTIONS.map((q) => `morning_q${q.number}_${q.id}`);
  const eveningHeaders = EVENING_QUESTIONS.map((q) => `evening_q${q.number}_${q.id}`);
  const headers = ['participant', 'date', 'entry_type', 'completed_at', ...morningHeaders, ...eveningHeaders];

  // ── Build rows ──
  const rows = entries.map((entry) => {
    const isMorning = entry.type === 'morning';
    const questions = isMorning ? MORNING_QUESTIONS : EVENING_QUESTIONS;

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
      entry.date,
      entry.type,
      entry.completedAt,
      ...morningCols,
      ...eveningCols,
    ].map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

// Build a JSON export string
export const exportToJSON = async (userName) => {
  const entries = await loadEntries();
  if (entries.length === 0) return null;
  return JSON.stringify({ participant: userName, exportedAt: new Date().toISOString(), entries }, null, 2);
};
