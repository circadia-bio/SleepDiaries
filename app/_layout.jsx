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
import { View, Image, StyleSheet, Platform } from 'react-native';
import { Asset } from 'expo-asset';
import { loadName } from '../storage/storage';

// Detect if running as an installed PWA on iOS (standalone mode)
const isStandalone =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  window.navigator.standalone === true;

// All image assets are listed here so they can be preloaded in parallel
// before any screen renders, avoiding lazy-load flashes on first paint.
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
  // checked: true once font + name check + image preload are all complete
  const [checked, setChecked] = useState(false);
  // showSplash: true on PWA launch, fades out after 1.5s
  const [showSplash, setShowSplash] = useState(isStandalone);

  // Load all four custom font variants. Fonts must be loaded before
  // any Text component using fontFamily renders.
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

  // Hide the in-app splash after 1.5s
  useEffect(() => {
    if (!showSplash) return;
    const t = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(t);
  }, [showSplash]);

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
    return (
      <View style={styles.webWrapper}>
        {content}
        {showSplash && (
          <View style={styles.splash}>
            <Image
              source={require('../assets/images/splash-icon.png')}
              style={styles.splashIcon}
              resizeMode="contain"
            />
          </View>
        )}
      </View>
    );
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
  // In-app splash — overlays everything, shown on PWA launch
  splash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C8DFF5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  splashIcon: {
    width: '50%',
    height: '50%',
  },
});
