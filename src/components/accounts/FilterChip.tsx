import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { ACCOUNT_TYPES, type AccountType } from '@/constants/accountTypes';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  type: AccountType | 'all';
  label: string;
  active: boolean;
  onPress: () => void;
}

export default function FilterChip({ type, label, active, onPress }: Props) {
  const theme = useTheme();
  const typeConfig = type !== 'all' ? ACCOUNT_TYPES[type] : null;
  const color = typeConfig?.color;

  const activeBg = color ? `${color}26` : theme.fg;
  const activeText = color ? color : theme.bg;
  const inactiveBg = theme.surface;
  const inactiveText = theme.fg2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: active ? activeBg : inactiveBg, borderColor: theme.border },
        pressed && styles.pressed,
      ]}
    >
      {color && (
        <View style={[styles.dot, { backgroundColor: color }]} />
      )}
      <Text style={[styles.label, { color: active ? activeText : inactiveText }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: 0.1,
  },
  pressed: { opacity: 0.7 },
});
