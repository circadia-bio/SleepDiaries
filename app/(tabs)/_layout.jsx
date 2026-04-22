/**
 * app/(tabs)/_layout.jsx — Tab bar layout
 *
 * Custom tab bar rendered entirely in code using Ionicons.
 * No image assets — works identically across all locales.
 */
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, SIZES } from '../../theme/typography';
import t from '../../i18n';

const TABS = [
  { name: 'home',     icon: 'home',     iconOutline: 'home-outline',      label: () => t('tabs.home')     },
  { name: 'entry',    icon: 'clipboard', iconOutline: 'clipboard-outline', label: () => t('tabs.entry')    },
  { name: 'settings', icon: 'settings', iconOutline: 'settings-outline',  label: () => t('tabs.settings') },
];

const ACTIVE_COLOR   = '#E07A20';
const INACTIVE_COLOR = '#94A3B8';

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();
  const isStandalone = Platform.OS === 'web' &&
    typeof window !== 'undefined' && window.navigator.standalone === true;
  const W = (Platform.OS === 'web' && !isStandalone) ? undefined : screenW;

  return (
    <View style={[styles.container, { width: W, paddingBottom: Math.max(insets.bottom, 8) }]}>
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
            <Ionicons name={iconName} size={26} color={color} />
            <Text style={[styles.label, { color, fontFamily: FONTS.bodyMedium }]}>{tab.label()}</Text>
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
    backgroundColor: 'rgba(254,253,248,0.85)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 10,
    shadowColor: '#4A7BB5',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 16,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingBottom: 4,
  },
  label: {
    fontSize: 11,
  },
});
