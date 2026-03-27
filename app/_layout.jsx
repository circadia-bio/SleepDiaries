import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, StyleSheet, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { loadName } from '../storage/storage';

const IMAGE_ASSETS = [
  require('../assets/images/homepage-bg.png'),
  require('../assets/images/login-bg.png'),
  require('../assets/images/questionnaire-bg.png'),
  require('../assets/images/morning_pending.png'),
  require('../assets/images/morning_completed.png'),
  require('../assets/images/evening_pending.png'),
  require('../assets/images/evening_completed.png'),
  require('../assets/images/evening_locked.png'),
  require('../assets/images/taskbar-1.png'),
  require('../assets/images/taskbar-2.png'),
  require('../assets/images/taskbar-3.png'),
  require('../assets/images/past-entries.png'),
  require('../assets/images/final-report.png'),
  require('../assets/images/final-report-locked.png'),
  require('../assets/images/splash-end-morning.png'),
  require('../assets/images/splash-end-night.png'),
  require('../assets/images/instructions-1.png'),
  require('../assets/images/instructions-2.png'),
  require('../assets/images/instructions-3.png'),
  require('../assets/images/instructions-4.png'),
  require('../assets/images/instructions-5.png'),
  require('../assets/images/instructions-6.png'),
  require('../assets/images/back-day.png'),
  require('../assets/images/back-night.png'),
  require('../assets/images/next-day.png'),
  require('../assets/images/next-night.png'),
  require('../assets/images/logo.png'),
];

export default function RootLayout() {
  const router  = useRouter();
  const [checked, setChecked] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Livvic-Bold':    require('../assets/fonts/Livvic-Bold.ttf'),
    'Afacad-Bold':    require('../assets/fonts/Afacad-Bold.ttf'),
    'Afacad-Medium':  require('../assets/fonts/Afacad-Medium.ttf'),
    'Afacad-Regular': require('../assets/fonts/Afacad-Regular.ttf'),
  });

  useEffect(() => {
    const prepare = async () => {
      // Preload all images and check name in parallel
      const [name] = await Promise.all([
        loadName(),
        Asset.loadAsync(IMAGE_ASSETS).catch(() => {}), // never block on image errors
      ]);
      if (name) router.replace('/(tabs)/home');
      setChecked(true);
    };
    prepare();
  }, []);

  // Don't block on fonts — if they fail or take too long, render anyway
  if (!checked) return null;

  const content = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="questionnaire"  options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="past-entries"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="export"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="final-report"   options={{ animation: 'slide_from_right' }} />
    </Stack>
  );

  // On web desktop, constrain to phone width
  if (Platform.OS === 'web') {
    return <View style={styles.webWrapper}>{content}</View>;
  }

  return content;
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    overflow: 'hidden',
  },
});
