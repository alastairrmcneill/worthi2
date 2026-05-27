import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetModal,
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { formatDate } from '@/lib/formatting';
import { toDateMs } from '@/lib/interpolate';

export interface CalendarSheetHandle {
  present: (value: number, onChange: (ts: number) => void, maxDate?: Date) => void;
}

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACCENT = '#3B82F6';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CalendarSheet = forwardRef<CalendarSheetHandle, object>((_, ref) => {
  const theme = useTheme();
  const sheetRef = useRef<BottomSheetModal>(null);
  const onChangeRef = useRef<(ts: number) => void>(() => {});

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [maxDate, setMaxDate] = useState<Date>(new Date());

  useImperativeHandle(ref, () => ({
    present: (value, onChange, max) => {
      const d = new Date(value);
      d.setHours(0, 0, 0, 0);
      setSelectedDate(d);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      const mx = max ?? new Date();
      mx.setHours(23, 59, 59, 999);
      setMaxDate(mx);
      onChangeRef.current = onChange;
      sheetRef.current?.present();
    },
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
    ),
    []
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isNextMonthDisabled =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (isNextMonthDisabled) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function handleDayPress(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d > maxDate) return;
    setSelectedDate(d);
  }

  function handleSet() {
    onChangeRef.current(toDateMs(selectedDate));
    sheetRef.current?.dismiss();
  }

  // Build calendar grid cells (Mon-indexed)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayJs = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const offset = (firstDayJs + 6) % 7; // convert to Mon=0

  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={['62%']}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.sheetBg }}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
      enablePanDownToClose
      stackBehavior="push"
    >
      <BottomSheetView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.title, { color: theme.fg }]}>Date</Text>
            <Text style={[styles.selectedLabel, { color: theme.fg2 }]}>
              {formatDate(toDateMs(selectedDate))}
            </Text>
          </View>
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            hitSlop={12}
            style={[styles.closeBtn, { backgroundColor: theme.surface2 }]}
          >
            <Ionicons name="close" size={18} color={theme.fg2} />
          </Pressable>
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Month navigation */}
        <View style={styles.monthNav}>
          <Pressable onPress={prevMonth} hitSlop={16} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.fg} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: theme.fg }]}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <Pressable
            onPress={nextMonth}
            hitSlop={16}
            style={[styles.navBtn, isNextMonthDisabled && styles.navBtnDisabled]}
            disabled={isNextMonthDisabled}
          >
            <Ionicons
              name="chevron-forward"
              size={22}
              color={isNextMonthDisabled ? theme.fg3 : theme.fg}
            />
          </Pressable>
        </View>

        {/* Day of week headers */}
        <View style={styles.dayHeaders}>
          {DAY_HEADERS.map((d) => (
            <View key={d} style={styles.dayHeaderCell}>
              <Text style={[styles.dayHeaderText, { color: theme.fg3 }]}>{d}</Text>
            </View>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.row}>
              {row.map((day, ci) => {
                if (!day) return <View key={ci} style={styles.cell} />;

                const cellDate = new Date(viewYear, viewMonth, day);
                cellDate.setHours(0, 0, 0, 0);
                const isDisabled = cellDate > maxDate;
                const isSelected =
                  day === selectedDate.getDate() &&
                  viewMonth === selectedDate.getMonth() &&
                  viewYear === selectedDate.getFullYear();
                const isTodayCell =
                  day === today.getDate() &&
                  viewMonth === today.getMonth() &&
                  viewYear === today.getFullYear();

                return (
                  <Pressable
                    key={ci}
                    style={styles.cell}
                    onPress={() => !isDisabled && handleDayPress(day)}
                    disabled={isDisabled}
                  >
                    <View style={[styles.dayCircle, isSelected && { backgroundColor: ACCENT }]}>
                      <Text
                        style={[
                          styles.dayText,
                          { color: theme.fg },
                          isDisabled && { color: theme.fg3 },
                          isTodayCell && !isSelected && { color: ACCENT, fontFamily: 'Geist_600SemiBold' },
                          isSelected && { color: '#fff', fontFamily: 'Geist_600SemiBold' },
                        ]}
                      >
                        {day}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        {/* Set button */}
        <Pressable
          onPress={handleSet}
          style={({ pressed }) => [
            styles.setBtn,
            { backgroundColor: ACCENT },
            pressed && { opacity: 0.82 },
          ]}
        >
          <Text style={styles.setBtnText}>Set Date</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  );
});

CalendarSheet.displayName = 'CalendarSheet';
export default CalendarSheet;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 36,
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    gap: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Geist_700Bold',
    letterSpacing: -0.5,
  },
  selectedLabel: {
    fontSize: 15,
    fontFamily: 'Geist_400Regular',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: Spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    padding: 4,
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  monthLabel: {
    fontSize: 17,
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.3,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 12,
    fontFamily: 'Geist_500Medium',
    letterSpacing: 0.2,
  },
  grid: {
    gap: 2,
    marginBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 15,
    fontFamily: 'Geist_400Regular',
  },
  setBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  setBtnText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.2,
  },
});
