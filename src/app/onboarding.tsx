import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);

  function skip() {
    setHasOnboarded(true);
    router.replace('/(app)');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.fg, fontFamily: 'Geist_700Bold' }]}>
          Worthi
        </Text>
        <Text style={[styles.sub, { color: theme.fg2, fontFamily: 'Geist_400Regular' }]}>
          Onboarding — Session 7
        </Text>
        <TouchableOpacity
          onPress={skip}
          style={[styles.button, { backgroundColor: theme.fg }]}
        >
          <Text style={[styles.buttonText, { color: theme.bg, fontFamily: 'Geist_600SemiBold' }]}>
            Get Started
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 40, letterSpacing: -1 },
  sub: { fontSize: 14, marginTop: 8, marginBottom: 40 },
  button: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14 },
  buttonText: { fontSize: 16 },
});
