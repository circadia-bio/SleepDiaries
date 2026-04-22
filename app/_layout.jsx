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
import { EntriesProvider } from '../storage/EntriesContext';

const isStandalone =
  Platform.OS === 'web' &&
  typeof window !== 'undefined' &&
  (
    window.navigator.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches
  );

// Preloaded image assets. Excludes assets now rendered in code:
//   - taskbar images (tab bar uses Ionicons)
//   - past-entries, final-report, final-report-locked (BottomCards.jsx)
//   - back-day, back-night, next-day, next-night (NavButtons.jsx)
//   - instructions-1..6 (InstructionsModal.jsx is now fully coded)
//   - homepage-bg, login-bg, questionnaire-bg (ScreenBackground.jsx, react-native-svg — no preload needed)
const IMAGE_ASSETS = [
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
    const dismiss = () => {
      if (!el.parentNode) return; // already removed
      el.style.transition = 'opacity 0.4s ease';
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 400);
    };
    // Normal dismiss: 300ms after React mounts
    const t = setTimeout(dismiss, 300);
    // Fallback: force-remove after 8s in case something stalls
    const fallback = setTimeout(dismiss, 8000);
    return () => { clearTimeout(t); clearTimeout(fallback); };
  }, []);

  if (!checked) return null;

  const content = (
    <EntriesProvider>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="questionnaire"  options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="past-entries"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="export"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="final-report"              options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="SleepMetricsScreen"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="QuestionnairesScreen"        options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="QuestionnaireCreditsScreen" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="ThresholdReferencesScreen"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="MedicationsScreen"           options={{ animation: 'slide_from_right' }} />
    </Stack>
    </EntriesProvider>
  );

  if (Platform.OS === 'web') {
    // Standalone PWA (installed to home screen): fixed full-screen shell to
    // prevent scroll/bounce bleed outside the app.
    if (isStandalone) return <View style={styles.webWrapperMobile}>{content}</View>;

    // Browser: centre the content column at a max-width that keeps the SVG
    // backgrounds at a sensible scale (~1.2× their design size at 480px vs
    // the original 393px viewBox). The outer View fills the browser with the
    // app's neutral background colour so the sides don't look bare.
    return (
      <View style={styles.webOuter}>
        <View style={styles.webInner}>{content}</View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: '#EEF5FF',
    alignItems: 'center',
  },
  webInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
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
