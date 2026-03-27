/**
 * theme/useInsets.js — Cross-platform safe area insets hook
 *
 * On iOS and Android, useSafeAreaInsets() returns real device insets
 * (notch height, home indicator, etc.) which React Native uses to push
 * content away from hardware edges.
 *
 * On web, those insets are always 0, which makes content sit too high
 * compared to the iOS version. This hook substitutes a fixed top value
 * (WEB_TOP_INSET) that matches the visual position of the iOS status bar,
 * so screens look consistent across platforms without any per-screen logic.
 *
 * Usage: replace useSafeAreaInsets() with useInsets() in any screen.
 */
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Tuned to match the iPhone 15 Pro notch height (~59pt).
// Adjust if targeting devices with a significantly different status bar height.
const WEB_TOP_INSET = 59;

export function useInsets() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    const isStandalone =
      typeof window !== 'undefined' && window.navigator.standalone === true;
    // On PWA: ignore all safe area insets so content bleeds edge to edge
    if (isStandalone) return { top: 0, bottom: 0, left: 0, right: 0 };
    // On desktop browser: use fixed top inset for the phone frame
    return { ...insets, top: WEB_TOP_INSET };
  }
  return insets;
}
