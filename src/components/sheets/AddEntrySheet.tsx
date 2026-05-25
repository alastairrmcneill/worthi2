import React, {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
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
import type { Entry } from '@/types';

export interface AddEntrySheetHandle {
  presentForAccount: (accountId: string) => void;
  presentForEdit: (accountId: string, entry: Entry) => void;
  dismiss: () => void;
}

const SNAP_POINTS = ['70%'];

const AddEntrySheet = forwardRef<AddEntrySheetHandle, object>((_, ref) => {
  const theme = useTheme();
  const currency = useSettingsStore((s) => s.currency);
  const sheetRef = useRef<BottomSheetModal>(null);

  const accounts = useAccountStore((s) => s.accounts);
  const addEntry = useAccountStore((s) => s.addEntry);
  const updateEntry = useAccountStore((s) => s.updateEntry);

  const [accountId, setAccountId] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<Entry | null>(null);
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
  }

  useImperativeHandle(ref, () => ({
    presentForAccount: (id: string) => {
      resetForm();
      setAccountId(id);
      sheetRef.current?.present();
    },
    presentForEdit: (id: string, entry: Entry) => {
      setAccountId(id);
      setEditEntry(entry);
      setDate(entry.date);
      const acc = accounts.find((a) => a.id === id);
      if (acc) {
        const isLiability = acc.type === 'credit_card' || acc.type === 'loan';
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

  function handleSave() {
    if (!account || !accountId) return;

    const rawValue = parseFloat(entryValue) || 0;
    const isLiability = account.type === 'credit_card' || account.type === 'loan';
    const storedValue = isLiability ? -rawValue : rawValue;
    const finalValue = account.type === 'house' ? rawValue : storedValue;
    const finalDeposited =
      account.type === 'investment' ? (parseFloat(deposited) || 0) : null;
    const finalMortgage =
      account.type === 'house' ? (parseFloat(mortgageBalance) || 0) : null;

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

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sheetRef.current?.dismiss();
    resetForm();
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={SNAP_POINTS}
      backdropComponent={renderBackdrop}
      backgroundStyle={{ backgroundColor: theme.sheetBg }}
      handleIndicatorStyle={{ backgroundColor: theme.border }}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      enablePanDownToClose
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: theme.fg }]}>
          {isEditing ? 'Edit Entry' : 'Add Entry'}
        </Text>
        {account && typeConfig && (
          <View
            style={[
              styles.accountBadge,
              { backgroundColor: `${typeConfig.color}18`, borderColor: `${typeConfig.color}40` },
            ]}
          >
            <Text style={styles.accountGlyph}>{typeConfig.glyph}</Text>
            <Text style={[styles.accountName, { color: typeConfig.color }]}>
              {account.name}
            </Text>
          </View>
        )}

        <View style={styles.form}>
          <DateSelector value={date} onChange={setDate} />

          {account?.type === 'investment' && (
            <Field
              label="Running Total Deposited"
              value={deposited}
              onChangeText={setDeposited}
              prefix={currency.symbol}
              numeric
              placeholder="0"
              hint="Cumulative amount deposited to date"
            />
          )}

          <Field
            label={
              account?.type === 'credit_card' || account?.type === 'loan'
                ? 'Amount Owed'
                : account?.type === 'house'
                ? 'Property Value'
                : account?.type === 'investment'
                ? 'Current Value'
                : 'Current Balance'
            }
            value={entryValue}
            onChangeText={setEntryValue}
            prefix={currency.symbol}
            numeric
            placeholder="0"
            autoFocus
            hint={
              account?.type === 'credit_card' || account?.type === 'loan'
                ? 'Enter the amount you owe (positive)'
                : undefined
            }
          />

          {account?.type === 'house' && (
            <Field
              label="Current Mortgage Balance"
              value={mortgageBalance}
              onChangeText={setMortgageBalance}
              prefix={currency.symbol}
              numeric
              placeholder="0"
              optional
            />
          )}

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
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

AddEntrySheet.displayName = 'AddEntrySheet';
export default AddEntrySheet;

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },

  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  accountGlyph: { fontSize: 15 },
  accountName: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },

  form: { gap: Spacing.md },

  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
});
