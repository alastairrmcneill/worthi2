import React from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  name: React.ComponentProps<typeof Ionicons>['name'];
  size?: number;
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  dim?: boolean;
}

export default function IconButton({ name, size = 22, color, onPress, style, dim = false }: Props) {
  const theme = useTheme();
  const iconColor = color ?? theme.fg2;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        !dim && { backgroundColor: theme.surface2 },
        pressed && styles.pressed,
        style,
      ]}
      hitSlop={8}
    >
      <Ionicons name={name} size={size} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
