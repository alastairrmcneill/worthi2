import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts as useGeistFonts,
} from '@expo-google-fonts/geist';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  useFonts as useGeistMonoFonts,
} from '@expo-google-fonts/geist-mono';
import * as SplashScreen from 'expo-splash-screen';
import { useTheme, useIsDark } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAccountStore } from '@/stores/accountStore';
import { initAnalytics } from '@/lib/analytics';

SplashScreen.preventAutoHideAsync();

function NavigationGuard() {
  const hasOnboarded = useSettingsStore((s) => s.hasOnboarded);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const inApp = segments[0] === '(app)';
    if (!hasOnboarded && inApp) {
      router.replace('/onboarding');
    } else if (hasOnboarded && segments[0] === 'onboarding') {
      router.replace('/(app)');
    }
  }, [hasOnboarded, segments]);

  return null;
}

export default function RootLayout() {
  const [geistLoaded] = useGeistFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  const [geistMonoLoaded] = useGeistMonoFonts({
    GeistMono_400Regular,
    GeistMono_500Medium,
  });

  const fontsLoaded = geistLoaded && geistMonoLoaded;
  const theme = useTheme();
  const isDark = useIsDark();
  const initialize = useAccountStore((s) => s.initialize);

  useEffect(() => {
    initialize();
    initAnalytics();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.bg }}>
      <BottomSheetModalProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationGuard />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(app)" />
      </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
