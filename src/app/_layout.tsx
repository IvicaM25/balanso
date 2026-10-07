import { Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold, useFonts } from '@expo-google-fonts/manrope';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider, useStore } from '@/state/store';
import { ToastProvider } from '@/ui/toast';

SplashScreen.preventAutoHideAsync();

function Root() {
  const { ready, colors, dark } = useStore();
  const [fontsLoaded] = useFonts({ Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold });
  useEffect(() => {
    if (ready && fontsLoaded) SplashScreen.hideAsync();
  }, [ready, fontsLoaded]);
  if (!ready || !fontsLoaded) return null;
  return (
    <ToastProvider>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      </Stack>
    </ToastProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Root />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
