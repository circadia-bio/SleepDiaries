/**
 * storage/notifications.js — Push notification scheduling
 *
 * Schedules two daily reminders via expo-notifications:
 *   - Morning: 8:00 AM — prompt to complete the morning diary entry
 *   - Evening: 9:00 PM — prompt to complete the evening diary entry
 *
 * Notifications are not available on web; all functions are no-ops when
 * Platform.OS === 'web' so the same code works across all platforms.
 *
 * The enabled/disabled preference is persisted in AsyncStorage separately
 * from the rest of the app data so it survives entry history being cleared.
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const MORNING_HOUR = 8;
const EVENING_HOUR = 21;

// Notifications are not supported on web
const isWeb = Platform.OS === 'web';

let Notifications = null;
if (!isWeb) {
  Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const requestNotificationPermission = async () => {
  if (isWeb) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('sleep-diaries', {
      name: 'Sleep Diaries Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const scheduleReminders = async () => {
  if (isWeb) return false;
  await cancelReminders();
  const granted = await requestNotificationPermission();
  if (!granted) return false;
  await Notifications.scheduleNotificationAsync({
    identifier: 'morning-reminder',
    content: { title: '🌅 Good morning!', body: "Don't forget to complete your morning sleep diary entry.", sound: true },
    trigger: { type: 'daily', hour: MORNING_HOUR, minute: 0 },
  });
  await Notifications.scheduleNotificationAsync({
    identifier: 'evening-reminder',
    content: { title: '🌙 Good evening!', body: 'Time to complete your evening sleep diary entry.', sound: true },
    trigger: { type: 'daily', hour: EVENING_HOUR, minute: 0 },
  });
  return true;
};

export const cancelReminders = async () => {
  if (isWeb) return;
  await Notifications.cancelScheduledNotificationAsync('morning-reminder');
  await Notifications.cancelScheduledNotificationAsync('evening-reminder');
};

export const saveNotificationsEnabled = async (enabled) => {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(enabled));
  if (!isWeb) {
    if (enabled) await scheduleReminders();
    else await cancelReminders();
  }
};

export const loadNotificationsEnabled = async () => {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return raw !== null ? JSON.parse(raw) : true;
};

export const sendTestNotification = async () => {
  if (isWeb) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: '🌙 Sleep Diaries', body: 'Notifications are working correctly!' },
    trigger: { type: 'timeInterval', seconds: 5, repeats: false },
  });
};
