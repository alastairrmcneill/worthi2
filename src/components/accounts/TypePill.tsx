import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ACCOUNT_TYPES, type AccountType } from '@/constants/accountTypes';

interface Props {
  type: AccountType;
  large?: boolean;
}

export default function TypePill({ type, large = false }: Props) {
  const { color, label } = ACCOUNT_TYPES[type];
  const bg = `${color}1F`;

  return (
    <View style={[styles.pill, large && styles.pillLarge, { backgroundColor: bg }]}>
      <View style={[styles.dot, large ? styles.dotLarge : styles.dotSmall, { backgroundColor: color }]} />
      <Text style={[styles.label, large && styles.labelLarge, { color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  pillLarge: {
    paddingVertical: 5,
    paddingHorizontal: 11,
  },
  dot: {
    borderRadius: 99,
  },
  dotSmall: { width: 6, height: 6 },
  dotLarge: { width: 7, height: 7 },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'Geist_600SemiBold',
  },
  labelLarge: { fontSize: 12 },
});
