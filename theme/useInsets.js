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
    // On installed PWA (standalone), use the real safe area inset from the device.
    // On desktop browser, use the fixed value to position content below the frame top.
    const isStandalone =
      typeof window !== 'undefined' && window.navigator.standalone === true;
    if (isStandalone) return insets;
    return { ...insets, top: WEB_TOP_INSET };
  }
  return insets;
}
