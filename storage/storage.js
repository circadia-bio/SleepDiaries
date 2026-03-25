import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Keys ─────────────────────────────────────────────────────────────────────
const KEYS = {
  USER_NAME: 'user_name',
  ENTRIES:   'entries',
};

// ─── User name ────────────────────────────────────────────────────────────────
export const saveName = async (name) => {
  await AsyncStorage.setItem(KEYS.USER_NAME, name);
};

export const loadName = async () => {
  return await AsyncStorage.getItem(KEYS.USER_NAME);
};

// ─── Entries ──────────────────────────────────────────────────────────────────

// Load all entries (returns array, newest first)
export const loadEntries = async () => {
  const raw = await AsyncStorage.getItem(KEYS.ENTRIES);
  return raw ? JSON.parse(raw) : [];
};

// Save a completed entry
export const saveEntry = async (entryType, answers) => {
  const entries = await loadEntries();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // e.g. "2024-01-15"

  // Replace if same type + date already exists, otherwise prepend
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

// Check if a specific entry type has been completed today
export const isTodayComplete = async (entryType) => {
  const entries = await loadEntries();
  const today = new Date().toISOString().split('T')[0];
  return entries.some((e) => e.date === today && e.type === entryType);
};

// Load today's completion state for both entries
export const loadTodayStatus = async () => {
  const entries = await loadEntries();
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.date === today);
  return {
    morningCompleted: todayEntries.some((e) => e.type === 'morning'),
    eveningCompleted: todayEntries.some((e) => e.type === 'evening'),
  };
};

// Clear all data (for logout / delete account)
export const clearAll = async () => {
  await AsyncStorage.multiRemove([KEYS.USER_NAME, KEYS.ENTRIES]);
};
