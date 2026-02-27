import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { registerBackgroundFetch } from '../tasks/backgroundFetch';

export default function RootLayout() {
  useEffect(() => {
    registerBackgroundFetch().catch(() => {
      // Background fetch registration can fail on simulators — that's fine
    });
  }, []);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </>
  );
}
