import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { RangeKey } from '@/lib/networth';
import { useTheme } from '@/hooks/use-theme';
import { useIsDark } from '@/hooks/use-theme';

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '1M', label: '1M' },
  { key: '3M', label: '3M' },
  { key: '6M', label: '6M' },
  { key: '1Y', label: '1Y' },
  { key: 'All', label: 'All' },
];

interface Props {
  value: RangeKey;
  onChange: (range: RangeKey) => void;
}

export default function RangePicker({ value, onChange }: Props) {
  const theme = useTheme();
  const isDark = useIsDark();

  const activeBg = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
  const activeFg = isDark ? '#ffffff' : '#111111';
  const inactiveFg = isDark ? 'rgba(255,255,255,0.50)' : 'rgba(0,0,0,0.45)';

  return (
    <View style={styles.row}>
      {RANGES.map((r) => {
        const active = r.key === value;
        return (
          <Pressable
            key={r.key}
            onPress={() => onChange(r.key)}
            style={[
              styles.pill,
              active && { backgroundColor: activeBg },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: active ? activeFg : inactiveFg },
              ]}
            >
              {r.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'Geist_600SemiBold',
  },
});
