import { Tabs } from 'expo-router';
import { View, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W } = Dimensions.get('window');

// Images are 1183x292 — ratio 4.051
const IMAGE_RATIO = 1183 / 292;
const TAB_IMAGE_HEIGHT = W / IMAGE_RATIO;

const TASKBAR_IMAGES = {
  home:     require('../../assets/images/taskbar-1.png'),
  entry:    require('../../assets/images/taskbar-2.png'),
  settings: require('../../assets/images/taskbar-3.png'),
};

function CustomTabBar({ state, navigation }) {
  const activeRoute = state.routes[state.index]?.name ?? 'home';
  const image = TASKBAR_IMAGES[activeRoute] ?? TASKBAR_IMAGES.home;

  return (
    <View style={styles.container}>
      <Image
        source={image}
        style={{ width: W, height: TAB_IMAGE_HEIGHT }}
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
