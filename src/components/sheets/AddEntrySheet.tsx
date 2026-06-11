import React, {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { track } from '@/lib/analytics';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/hooks/use-theme';
import { useAccountStore } from '@/stores/accountStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ACCOUNT_TYPES } from '@/constants/accountTypes';
import { Spacing } from '@/constants/theme';
import Field from '@/components/common/Field';
import DateSelector from '@/components/common/DateSelector';
import { todayMs } from '@/lib/interpolate';
import { formatDate } from '@/lib/formatting';
import { getLastEntryForAccount } from '@/db/queries';
import type { Entry } from '@/types';

export interface AddEntrySheetHandle {
  presentForAccount: (accountId: string) => void;
  presentForEdit: (accountId: string, entry: Entry) => void;
  dismiss: () => void;
}

const SNAP_POINTS = ['85%'];

const AddEntrySheet = forwardRef<AddEntrySheetHandle, object>((_, ref) => {
  const theme = useTheme();
  const currency = useSettingsStore((s) => s.currency);
  const sheetRef = useRef<BottomSheetModal>(null);

  const accounts = useAccountStore((s) => s.accounts);
  const addEntry = useAccountStore((s) => s.addEntry);
  const updateEntry = useAccountStore((s) => s.updateEntry);
  const deleteEntry = useAccountStore((s) => s.deleteEntry);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
  const [lastEntry, setLastEntry] = useState<Entry | null>(null);
  const [date, setDate] = useState(todayMs());
  const [entryValue, setEntryValue] = useState('');
  const [deposited, setDeposited] = useState('');
  const [mortgageBalance, setMortgageBalance] = useState('');

  const account = accounts.find((a) => a.id === accountId) ?? null;
  const typeConfig = account ? ACCOUNT_TYPES[account.type] : null;
  const isEditing = editEntry !== null;

  function resetForm() {
    setDate(todayMs());
    setEntryValue('');
    setDeposited('');
    setMortgageBalance('');
    setEditEntry(null);
    setAccountId(null);
    setLastEntry(null);
  }

  useImperativeHandle(ref, () => ({
    presentForAccount: (id: string) => {
      resetForm();
      setAccountId(id);
      setLastEntry(getLastEntryForAccount(id));
      sheetRef.current?.present();
    },
    presentForEdit: (id: string, entry: Entry) => {
      setAccountId(id);
      setEditEntry(entry);
      setLastEntry(null);
      setDate(entry.date);
      const acc = accounts.find((a) => a.id === id);
      if (acc) {
        setEntryValue(String(Math.abs(entry.value)));
        setDeposited(entry.deposited != null ? String(entry.deposited) : '');
        setMortgageBalance(
          entry.mortgageBalance != null ? String(entry.mortgageBalance) : ''
        );
      }
      sheetRef.current?.present();
    },
    dismiss: () => sheetRef.current?.dismiss(),
  }));

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  function fmtPlaceholder(n: number): string {
    return n.toFixed(2).replace(/\.?0+$/, '');
  }

  function resolveField(typed: string, fallback: number | null): number {
    return typed !== '' ? (parseFloat(typed) || 0) : (fallback ?? 0);
  }

  const phValue =
    !isEditing && lastEntry ? fmtPlaceholder(Math.abs(lastEntry.value)) : '0';
  const phDeposited =
    !isEditing && lastEntry?.deposited != null
      ? fmtPlaceholder(lastEntry.deposited)
      : '0';
  const phMortgage =
    !isEditing && lastEntry?.mortgageBalance != null
      ? fmtPlaceholder(lastEntry.mortgageBalance)
      : undefined;

  function handleSave() {
    if (!account || !accountId) return;

    const isLiability = account.type === 'credit_card' || account.type === 'loan';
    const rawValue = resolveField(
      entryValue,
      lastEntry ? Math.abs(lastEntry.value) : null
    );
    const storedValue = isLiability ? -rawValue : rawValue;
    const finalValue = account.type === 'property' ? rawValue : storedValue;
    const finalDeposited =
      account.type === 'investment'
        ? resolveField(deposited, lastEntry?.deposited ?? null)
        : null;
    const finalMortgage =
      account.type === 'property'
        ? resolveField(mortgageBalance, lastEntry?.mortgageBalance ?? null)
        : null;

    if (isEditing && editEntry) {
      updateEntry(editEntry.id, {
        date,
        value: finalValue,
        deposited: finalDeposited,
        mortgageBalance: finalMortgage,
      });
    } else {
      addEntry({
        accountId,
        date,
        value: finalValue,
        deposited: finalDeposited,
        mortgageBalance: finalMortgage,
      });
    }

    track(isEditing ? 'entry_edited' : 'entry_added', {
      account_type: account.type,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sheetRef.current?.dismiss();
    resetForm();
  }

  function handleDelete() {
    if (!editEntry || !account) return;
    Alert.alert(
      'Delete Entry',
      `Delete entry from ${formatDate(editEntry.date)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            track('entry_deleted', { account_type: account.type });
            deleteEntry(editEntry.id);
            sheetRef.current?.dismiss();
            resetForm();
          },
        },
      ]
    );
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.sheetBg }}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      enablePanDownToClose
    >
      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.fg }]}>
          {isEditing ? 'Edit Entry' : 'Add Entry'}
        </Text>
<View style={styles.form}>
          <DateSelector value={date} onChange={setDate} />

          {account?.type === 'investment' && (
            <Field
              label="Running Total Deposited"
              value={deposited}
              onChangeText={setDeposited}
              prefix={currency.symbol}
              numeric
              placeholder={phDeposited}
              hint="Cumulative amount deposited to date"
              autoFocus
            />
          )}

          <Field
            label={
              account?.type === 'credit_card' || account?.type === 'loan'
                ? 'Amount Owed'
                : account?.type === 'property'
                ? 'Property Value'
                : account?.type === 'investment'
                ? 'Current Value'
                : 'Current Balance'
            }
            value={entryValue}
            onChangeText={setEntryValue}
            prefix={currency.symbol}
            numeric
            placeholder={phValue}
            autoFocus={account?.type !== 'investment'}
            hint={
              account?.type === 'credit_card' || account?.type === 'loan'
                ? 'Enter the amount you owe (positive)'
                : undefined
            }
          />

          {account?.type === 'property' && (
            <Field
              label="Current Mortgage Balance"
              value={mortgageBalance}
              onChangeText={setMortgageBalance}
              prefix={currency.symbol}
              numeric
              placeholder={phMortgage}
              optional
            />
          )}
        </View>
      </BottomSheetScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleSave}
          style={({ pressed }) => [
            styles.saveBtn,
            { backgroundColor: typeConfig?.color ?? theme.fg },
            pressed && { opacity: 0.82 },
          ]}
        >
          <Text style={styles.saveBtnText}>
            {isEditing ? 'Update Entry' : 'Add Entry'}
          </Text>
        </Pressable>

        {isEditing && (
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => [styles.deleteBtn, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.deleteBtnText, { color: theme.danger }]}>Delete entry</Text>
          </Pressable>
        )}
      </View>
    </BottomSheetModal>
  );
});

AddEntrySheet.displayName = 'AddEntrySheet';
export default AddEntrySheet;

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs, paddingBottom: Spacing.md },

  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  form: { gap: Spacing.md },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },

  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteBtnText: {
    fontSize: 15,
    fontFamily: 'Geist_500Medium',
  },
});
