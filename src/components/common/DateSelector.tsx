import React, { useRef, useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, Keyboard } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/lib/formatting';
import { toDateMs } from '@/lib/interpolate';
import CalendarSheet, { type CalendarSheetHandle } from './CalendarSheet';

interface Props {
  label?: string;
  value: number; // unix ms (midnight local)
  onChange: (ts: number) => void;
}

export default function DateSelector({ label = 'Date', value, onChange }: Props) {
  const theme = useTheme();
  const calendarRef = useRef<CalendarSheetHandle>(null);
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  function handlePress() {
    Keyboard.dismiss();
    if (Platform.OS === 'ios') {
      calendarRef.current?.present(value, onChange, new Date());
    } else {
      setShowAndroidPicker(true);
    }
  }

  function handleAndroidChange(_: DateTimePickerEvent, date?: Date) {
    setShowAndroidPicker(false);
    if (date) onChange(toDateMs(date));
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.fg2 }]}>{label}</Text>

      <Pressable
        onPress={handlePress}
        style={({ pressed }) => [
          styles.row,
          { borderColor: theme.border, backgroundColor: theme.surface2 },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={[styles.dateText, { color: theme.fg }]}>{formatDate(value)}</Text>
        <Ionicons name="chevron-down" size={16} color={theme.fg3} />
      </Pressable>

      {Platform.OS === 'android' && showAndroidPicker && (
        <DateTimePicker
          value={new Date(value)}
          mode="date"
          display="default"
          maximumDate={new Date()}
          onChange={handleAndroidChange}
        />
      )}

      {Platform.OS === 'ios' && <CalendarSheet ref={calendarRef} />}
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
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Geist_500Medium',
    letterSpacing: -0.2,
  },
});
