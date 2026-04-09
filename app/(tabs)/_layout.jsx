/**
 * app/(tabs)/_layout.jsx — Tab bar layout
 *
 * Configures the three main tabs (Home, Entry, Settings) and renders a
 * custom tab bar using full-width image assets instead of the default
 * React Native tab bar.
 *
 * The tab bar image switches based on the active route, so each tab has
 * its own highlighted artwork (taskbar-1/2/3.png). Invisible TouchableOpacity
 * zones sit over each third of the image to handle tab presses.
 *
 * Taskbar images are icon-only and shared across all locales.
 * Canvas size: 1183 × 292 — ratio 4.051
 */
import { Tabs } from 'expo-router';
import { View, Image, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IMAGES from '../../assets/images';

// Images are 1183×292 — ratio 4.051
const IMAGE_RATIO = 1183 / 292;

function CustomTabBar({ state, navigation }) {
  const activeRoute = state.routes[state.index]?.name ?? 'home';
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  // On desktop web, cap to 390px phone frame; on native/PWA use real width
  const isStandalone = Platform.OS === 'web' &&
    typeof window !== 'undefined' && window.navigator.standalone === true;
  const W = (Platform.OS === 'web' && !isStandalone) ? Math.min(screenW, 390) : screenW;
  const TAB_IMAGE_HEIGHT = W / IMAGE_RATIO;

  const image = activeRoute === 'home'     ? IMAGES.taskbar1
              : activeRoute === 'entry'    ? IMAGES.taskbar2
              : IMAGES.taskbar3;

  return (
    <View style={styles.container}>
      <Image
        source={image}
        style={{ width: W, height: TAB_IMAGE_HEIGHT, marginTop: insets.bottom }}
        resizeMode="stretch"
      />
      <View style={[styles.tapRow, { height: TAB_IMAGE_HEIGHT }]}>
        {state.routes.map((route, index) => (
          <TouchableOpacity
            key={route.key}
            style={styles.tapZone}
            activeOpacity={0.7}
            onPress={() => {
              const isFocused = state.index === index;
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"     options={{ title: 'Home' }} />
      <Tabs.Screen name="entry"    options={{ title: 'Entry' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 0,
  },
  tapRow: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    flexDirection: 'row',
  },
  tapZone: { flex: 1 },
});
