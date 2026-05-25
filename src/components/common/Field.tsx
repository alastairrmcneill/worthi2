import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  prefix?: string;
  hint?: string;
  numeric?: boolean;
  optional?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  returnKeyType?: 'done' | 'next' | 'go' | 'send' | 'search';
  onSubmitEditing?: () => void;
  inSheet?: boolean;
}

export default function Field({
  label,
  value,
  onChangeText,
  prefix,
  hint,
  numeric = false,
  optional = false,
  placeholder,
  autoFocus,
  returnKeyType,
  onSubmitEditing,
  inSheet = true,
}: Props) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: theme.fg2 }]}>{label}</Text>
        {optional && <Text style={[styles.optional, { color: theme.fg3 }]}>optional</Text>}
      </View>
      <View style={[styles.inputWrap, { borderColor: theme.border, backgroundColor: theme.surface2 }]}>
        {prefix ? (
          <Text style={[styles.prefix, { color: theme.fg3 }]}>{prefix}</Text>
        ) : null}
        <BottomSheetTextInput
          style={[styles.input, { color: theme.fg }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.fg3}
          keyboardType={numeric ? 'decimal-pad' : 'default'}
          autoFocus={autoFocus}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoCorrect={false}
        />
      </View>
      {hint ? <Text style={[styles.hint, { color: theme.fg3 }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
    letterSpacing: 0.1,
  },
  optional: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 4,
  },
  prefix: {
    fontSize: 16,
    fontFamily: 'Geist_400Regular',
    paddingRight: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Geist_400Regular',
    padding: 0,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
    lineHeight: 16,
  },
});
