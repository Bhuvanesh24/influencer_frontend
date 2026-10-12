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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { toastConfig } from '@/components/ui/toast-config';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useAuthStore } from '@/lib/auth/store';
import { queryClient } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync().catch(() => {});

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
              <ThemedStatusBar />
              <Stack screenOptions={{ headerShown: false }} />
              <Toast config={toastConfig} />
            </BottomSheetModalProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

/**
 * Light icons on our dark background, dark icons on light — flips automatically with theme.
 * Driven by `useAppTheme` (not `style="auto"`) so it stays correct once a manual theme override
 * ships in the Settings sprint, rather than only tracking the OS-level scheme.
 */
function ThemedStatusBar() {
  const { colorScheme } = useAppTheme();
  return <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />;
}
