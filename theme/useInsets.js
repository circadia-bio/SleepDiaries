import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// On iOS/Android, returns real safe area insets (notch, home bar, etc.)
// On web, returns a fixed top inset that mimics the iOS status bar height
// so content sits at the same position as on device.
const WEB_TOP_INSET = 59;

export function useInsets() {
  const insets = useSafeAreaInsets();
  if (Platform.OS === 'web') {
    return { ...insets, top: WEB_TOP_INSET };
  }
  return insets;
}
