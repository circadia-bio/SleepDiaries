import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { loadName } from '../storage/storage';

export default function RootLayout() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const checkName = async () => {
      const name = await loadName();
      if (name) {
        router.replace('/(tabs)/home');
      }
      setChecked(true);
    };
    checkName();
  }, []);

  if (!checked) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="questionnaire"
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="past-entries"
        options={{ animation: 'slide_from_right' }}
      />
    </Stack>
  );
}
