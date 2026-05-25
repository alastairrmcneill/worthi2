import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ACCOUNT_TYPES, type AccountType } from '@/constants/accountTypes';

interface Props {
  type: AccountType;
  size?: number;
  ring?: boolean;
}

export default function AccountDot({ type, size = 10, ring = false }: Props) {
  const { color } = ACCOUNT_TYPES[type];
  return (
    <View
      style={[
        styles.dot,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          ...(ring && {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.4,
            shadowRadius: 4,
          }),
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: {},
});
