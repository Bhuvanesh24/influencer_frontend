import '@/global.css';

import { Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { colorScheme } from 'nativewind';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toastConfig } from '@/components/ui/toast-config';
import { useAuthStore } from '@/lib/auth/store';
import { queryClient } from '@/lib/query-client';
import { APP_COLOR_SCHEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Pin the whole app to the light theme before anything renders, so a device in dark mode never
// flips it. This sets NativeWind's scheme (no `dark` class is ever applied) and, through React
// Native's Appearance API, the native pieces too — keyboard, date picker, system dialogs.
// `userInterfaceStyle: "light"` in app.json does the same for the native shell.
colorScheme.set(APP_COLOR_SCHEME);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Manrope_600SemiBold,
    Manrope_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isReady = fontsLoaded && !isHydrating;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isReady]);

  // Keep the native splash screen up (not a blank frame) until fonts + persisted auth state
  // are both ready — src/app/index.tsx renders the in-app Splash screen (§6.1) after this.
  if (!isReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <BottomSheetModalProvider>
              <StatusBar style="dark" />
              <Stack screenOptions={{ headerShown: false }} />
              <Toast config={toastConfig} />
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
