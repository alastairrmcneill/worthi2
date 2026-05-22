import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/use-theme';

export default function SettingsScreen() {
  const theme = useTheme();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.fg, fontFamily: 'Geist_600SemiBold' }]}>
          Settings
        </Text>
        <Text style={[styles.sub, { color: theme.fg2, fontFamily: 'Geist_400Regular' }]}>
          Session 7
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, letterSpacing: -0.5 },
  sub: { fontSize: 14, marginTop: 8 },
});
