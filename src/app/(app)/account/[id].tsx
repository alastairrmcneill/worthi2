import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function AccountDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.fg, fontFamily: 'Geist_600SemiBold' }]}>
          Account Detail
        </Text>
        <Text style={[styles.sub, { color: theme.fg2, fontFamily: 'Geist_400Regular' }]}>
          {id} — Session 5
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
