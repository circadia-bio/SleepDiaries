import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const NOTIFICATIONS_ENABLED_KEY = 'notifications_enabled';
const MORNING_HOUR = 8;
const EVENING_HOUR = 21;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const requestNotificationPermission = async () => {
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
  await cancelReminders();
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // Morning reminder — every day at 08:00
  await Notifications.scheduleNotificationAsync({
    identifier: 'morning-reminder',
    content: {
      title: '🌅 Good morning!',
      body: "Don't forget to complete your morning sleep diary entry.",
      sound: true,
    },
    trigger: {
      type: 'daily',
      hour: MORNING_HOUR,
      minute: 0,
    },
  });

  // Evening reminder — every day at 21:00
  await Notifications.scheduleNotificationAsync({
    identifier: 'evening-reminder',
    content: {
      title: '🌙 Good evening!',
      body: 'Time to complete your evening sleep diary entry.',
      sound: true,
    },
    trigger: {
      type: 'daily',
      hour: EVENING_HOUR,
      minute: 0,
    },
  });

  return true;
};

export const cancelReminders = async () => {
  await Notifications.cancelScheduledNotificationAsync('morning-reminder');
  await Notifications.cancelScheduledNotificationAsync('evening-reminder');
};

export const saveNotificationsEnabled = async (enabled) => {
  await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(enabled));
  if (enabled) {
    await scheduleReminders();
  } else {
    await cancelReminders();
  }
};

export const loadNotificationsEnabled = async () => {
  const raw = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
  return raw !== null ? JSON.parse(raw) : true;
};

// Test notification — fires after 5 seconds
export const sendTestNotification = async () => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌙 Sleep Diaries',
      body: 'Notifications are working correctly!',
    },
    trigger: {
      type: 'timeInterval',
      seconds: 5,
      repeats: false,
    },
  });
};
