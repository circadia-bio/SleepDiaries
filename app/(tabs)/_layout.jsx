/**
 * app/(tabs)/_layout.jsx — Tab bar layout
 *
 * Custom tab bar rendered entirely in code using Ionicons.
 * No image assets — works identically across all locales.
 */
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'home',     icon: 'home',     iconOutline: 'home-outline'      },
  { name: 'entry',    icon: 'clipboard', iconOutline: 'clipboard-outline' },
  { name: 'settings', icon: 'settings', iconOutline: 'settings-outline'  },
];

const ACTIVE_COLOR   = '#E07A20';
const INACTIVE_COLOR = '#737373';
const BAR_BG         = '#FAFAF7';

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const isStandalone = Platform.OS === 'web' &&
    typeof window !== 'undefined' && window.navigator.standalone === true;
  // On web (non-standalone) the tab bar lives inside the maxWidth container,
  // so left:0/right:0 in the stylesheet already gives the correct width.
  // Only pass an explicit width on native and standalone PWA.
  const W = (Platform.OS === 'web' && !isStandalone) ? undefined : screenW;

  return (
    <View style={[styles.container, { width: W, paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name) ?? TABS[0];
        const isFocused = state.index === index;
        const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;
        const iconName = isFocused ? tab.icon : tab.iconOutline;

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
          >
            <Ionicons name={iconName} size={28} color={color} />
          </TouchableOpacity>
        );
      })}
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
    flexDirection: 'row',
    backgroundColor: BAR_BG,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#E2EAF4',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingBottom: 6,
  },
});
