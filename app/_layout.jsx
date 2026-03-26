import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useFonts } from 'expo-font';
import { loadName } from '../storage/storage';

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
    const checkName = async () => {
      const name = await loadName();
      if (name) router.replace('/(tabs)/home');
      setChecked(true);
    };
    checkName();
  }, []);

  // Don't block on fonts — if they fail or take too long, render anyway
  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="questionnaire"  options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="past-entries"   options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="export"         options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="final-report"   options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
