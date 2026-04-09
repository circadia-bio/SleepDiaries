/**
 * app/_layout.jsx — Root layout
 *
 * The entry point for all navigation. Responsibilities:
 *   1. Load custom fonts (Livvic, Afacad) via expo-font.
 *   2. Preload every image asset so screens render instantly with no flash.
 *   3. Check AsyncStorage for a saved user name — if found, skip the login
 *      screen and route directly to the home tab.
 *   4. On web desktop, wrap the entire app in a 390px-wide centred container
 *      so it renders as a phone-shaped frame rather than filling the browser.
 */
import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { View, StyleSheet, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { loadName } from '../storage/storage';

const isStandalone =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.navigator.standalone === true;

// Preloaded image assets. Excludes assets now rendered in code:
//   - taskbar images (tab bar uses Ionicons)
//   - past-entries, final-report, final-report-locked (BottomCards.jsx)
//   - back-day, back-night, next-day, next-night (NavButtons.jsx)
//   - instructions-1..6 (InstructionsModal.jsx is now fully coded)
const IMAGE_ASSETS = [
  require('../assets/images/homepage-bg.png'),
  require('../assets/images/login-bg.png'),
  require('../assets/images/questionnaire-bg.png'),
  require('../assets/images/morning_pending.png'),
  require('../assets/images/morning_completed.png'),
  require('../assets/images/evening_pending.png'),
  require('../assets/images/evening_completed.png'),
  require('../assets/images/evening_locked.png'),
  require('../assets/images/splash-end-morning.png'),
  require('../assets/images/splash-end-night.png'),
  require('../assets/images/logo.png'),
  require('../assets/splash-icon.png'),
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
      const [name] = await Promise.all([
        loadName(),
        Asset.loadAsync(IMAGE_ASSETS).catch(() => {}),
      ]);
      if (name) router.replace('/(tabs)/home');
      setChecked(true);
    };
    prepare();
  }, []);

  useEffect(() => {
    if (!isStandalone) return;
    const el = document.getElementById('pwa-splash');
    if (!el) return;
    const t = setTimeout(() => {
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 400);
    }, 300);
    return () => clearTimeout(t);
  }, []);

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

  if (Platform.OS === 'web') {
    const wrapperStyle = isStandalone ? styles.webWrapperMobile : styles.webWrapper;
    return <View style={wrapperStyle}>{content}</View>;
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
  webWrapperMobile: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
});
