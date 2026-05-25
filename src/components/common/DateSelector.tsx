import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/formatting';

const DAY_MS = 24 * 60 * 60 * 1000;

interface Props {
  label?: string;
  value: number; // unix ms (midnight local)
  onChange: (ts: number) => void;
}

export default function DateSelector({ label = 'Date', value, onChange }: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.fg2 }]}>{label}</Text>
      <View style={[styles.row, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
        <Pressable
          onPress={() => onChange(value - DAY_MS)}
          hitSlop={8}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="chevron-back" size={18} color={theme.fg2} />
        </Pressable>

        <Text style={[styles.dateText, { color: theme.fg }]}>{formatDate(value)}</Text>

        <Pressable
          onPress={() => onChange(Math.min(value + DAY_MS, Date.now() + DAY_MS * 365))}
          hitSlop={8}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.fg2} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
    letterSpacing: 0.1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontFamily: 'Geist_500Medium',
    letterSpacing: -0.2,
  },
});
