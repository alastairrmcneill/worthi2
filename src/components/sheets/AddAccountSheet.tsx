import React, {
  useState,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, Pressable, StyleSheet, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useAccountStore } from '@/stores/accountStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { ACCOUNT_TYPES, TYPE_ORDER, type AccountType } from '@/constants/accountTypes';
import { Spacing } from '@/constants/theme';
import Field from '@/components/common/Field';
import DateSelector from '@/components/common/DateSelector';
import { todayMs } from '@/lib/interpolate';

export interface AddAccountSheetHandle {
  present: () => void;
  dismiss: () => void;
}

interface Props {
  onAccountSaved?: (accountId: string) => void;
}

type Step = 1 | 2 | 3;

function initForm() {
  return {
    step: 1 as Step,
    type: null as AccountType | null,
    name: '',
    purchasePrice: '',
    originalDeposit: '',
    isShared: false,
    ownershipPct: '50',
    date: todayMs(),
    entryValue: '',
    deposited: '',
    mortgageBalance: '',
  };
}

const SNAP_POINTS = ['88%'];

const AddAccountSheet = forwardRef<AddAccountSheetHandle, Props>(
  ({ onAccountSaved }, ref) => {
    const theme = useTheme();
    const currency = useSettingsStore((s) => s.currency);
    const sheetRef = useRef<BottomSheetModal>(null);
    const addAccount = useAccountStore((s) => s.addAccount);
    const addEntry = useAccountStore((s) => s.addEntry);

    const [form, setForm] = useState(initForm);

    const update = (patch: Partial<ReturnType<typeof initForm>>) =>
      setForm((f) => ({ ...f, ...patch }));

    useImperativeHandle(ref, () => ({
      present: () => {
        setForm(initForm());
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
      if (!form.type || !form.name.trim()) return;

      const rawValue = parseFloat(form.entryValue) || 0;
      const isLiability = form.type === 'credit_card' || form.type === 'loan';
      const storedValue = isLiability ? -rawValue : rawValue;

      const account = addAccount({
        name: form.name.trim(),
        type: form.type,
        isArchived: false,
        purchasePrice: form.type === 'house' ? (parseFloat(form.purchasePrice) || null) : null,
        originalDeposit:
          form.type === 'house' ? (parseFloat(form.originalDeposit) || null) : null,
        isShared: form.type === 'house' ? form.isShared : false,
        ownershipPct:
          form.type === 'house' && form.isShared
            ? Math.min(99, Math.max(1, parseFloat(form.ownershipPct) || 50))
            : 100,
      });

      addEntry({
        accountId: account.id,
        date: form.date,
        value: form.type === 'house' ? rawValue : storedValue,
        deposited: form.type === 'investment' ? (parseFloat(form.deposited) || 0) : null,
        mortgageBalance:
          form.type === 'house' ? (parseFloat(form.mortgageBalance) || 0) : null,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sheetRef.current?.dismiss();
      onAccountSaved?.(account.id);
    }

    const typeConfig = form.type ? ACCOUNT_TYPES[form.type] : null;

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
          {/* Header */}
          <View style={styles.header}>
            {form.step > 1 ? (
              <Pressable
                onPress={() => update({ step: (form.step - 1) as Step })}
                hitSlop={8}
                style={({ pressed }) => [styles.headerBtn, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="chevron-back" size={20} color={theme.fg2} />
              </Pressable>
            ) : (
              <View style={styles.headerBtn} />
            )}
            <Text style={[styles.headerTitle, { color: theme.fg }]}>
              {form.step === 1
                ? 'Add Account'
                : form.step === 2
                ? 'Account Details'
                : 'First Entry'}
            </Text>
            <View style={styles.headerBtn} />
          </View>

          {/* Step indicator */}
          <View style={styles.steps}>
            {([1, 2, 3] as Step[]).map((s) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor:
                      s <= form.step
                        ? typeConfig?.color ?? theme.fg
                        : theme.border,
                    width: s === form.step ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>

          {/* ── Step 1: Type picker ── */}
          {form.step === 1 && (
            <View style={styles.typeGrid}>
              {TYPE_ORDER.map((type) => {
                const cfg = ACCOUNT_TYPES[type];
                return (
                  <Pressable
                    key={type}
                    onPress={() => update({ type, step: 2 })}
                    style={({ pressed }) => [
                      styles.typeCard,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <View
                      style={[
                        styles.typeIconWrap,
                        { backgroundColor: `${cfg.color}20` },
                      ]}
                    >
                      <Text style={styles.typeGlyph}>{cfg.glyph}</Text>
                    </View>
                    <Text style={[styles.typeName, { color: theme.fg }]}>
                      {cfg.label}
                    </Text>
                    <Text
                      style={[styles.typeDesc, { color: theme.fg3 }]}
                      numberOfLines={2}
                    >
                      {cfg.description}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* ── Step 2: Account details ── */}
          {form.step === 2 && form.type && (
            <View style={styles.form}>
              {/* Type badge */}
              <View
                style={[
                  styles.selectedType,
                  { backgroundColor: `${typeConfig!.color}18`, borderColor: `${typeConfig!.color}40` },
                ]}
              >
                <Text style={styles.selectedTypeGlyph}>{typeConfig!.glyph}</Text>
                <Text style={[styles.selectedTypeLabel, { color: typeConfig!.color }]}>
                  {typeConfig!.label}
                </Text>
              </View>

              <Field
                label="Account Name"
                value={form.name}
                onChangeText={(v) => update({ name: v })}
                placeholder={`e.g. My ${typeConfig!.label}`}
                autoFocus
                returnKeyType="next"
              />

              {form.type === 'house' && (
                <>
                  <Field
                    label="Purchase Price"
                    value={form.purchasePrice}
                    onChangeText={(v) => update({ purchasePrice: v })}
                    prefix={currency.symbol}
                    numeric
                    optional
                    placeholder="0"
                  />
                  <Field
                    label="Original Deposit / Down Payment"
                    value={form.originalDeposit}
                    onChangeText={(v) => update({ originalDeposit: v })}
                    prefix={currency.symbol}
                    numeric
                    optional
                    placeholder="0"
                  />
                  <View
                    style={[
                      styles.toggleRow,
                      { backgroundColor: theme.surface2, borderColor: theme.border },
                    ]}
                  >
                    <View style={styles.toggleLeft}>
                      <Text style={[styles.toggleLabel, { color: theme.fg }]}>
                        Shared Asset
                      </Text>
                      <Text style={[styles.toggleHint, { color: theme.fg3 }]}>
                        Co-owned property
                      </Text>
                    </View>
                    <Switch
                      value={form.isShared}
                      onValueChange={(v) => update({ isShared: v })}
                      trackColor={{ true: typeConfig!.color }}
                    />
                  </View>
                  {form.isShared && (
                    <Field
                      label="Your Ownership %"
                      value={form.ownershipPct}
                      onChangeText={(v) => update({ ownershipPct: v })}
                      numeric
                      placeholder="50"
                      hint="Enter 1–99 (e.g. 50 for equal share)"
                    />
                  )}
                </>
              )}

              <Pressable
                onPress={() => {
                  if (form.name.trim()) update({ step: 3 });
                }}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: typeConfig!.color },
                  !form.name.trim() && styles.btnDisabled,
                  pressed && { opacity: 0.82 },
                ]}
              >
                <Text style={styles.primaryBtnText}>Next</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* ── Step 3: First entry ── */}
          {form.step === 3 && form.type && (
            <View style={styles.form}>
              <DateSelector
                label="Date"
                value={form.date}
                onChange={(d) => update({ date: d })}
              />

              {form.type === 'investment' && (
                <Field
                  label="Running Total Deposited"
                  value={form.deposited}
                  onChangeText={(v) => update({ deposited: v })}
                  prefix={currency.symbol}
                  numeric
                  placeholder="0"
                  hint="Cumulative amount you've put in"
                />
              )}

              <Field
                label={
                  form.type === 'credit_card' || form.type === 'loan'
                    ? 'Amount Owed'
                    : form.type === 'house'
                    ? 'Property Value'
                    : form.type === 'investment'
                    ? 'Current Value'
                    : 'Current Balance'
                }
                value={form.entryValue}
                onChangeText={(v) => update({ entryValue: v })}
                prefix={currency.symbol}
                numeric
                placeholder="0"
                autoFocus
                hint={
                  form.type === 'credit_card' || form.type === 'loan'
                    ? 'Enter the amount you owe (positive)'
                    : undefined
                }
              />

              {form.type === 'house' && (
                <Field
                  label="Current Mortgage Balance"
                  value={form.mortgageBalance}
                  onChangeText={(v) => update({ mortgageBalance: v })}
                  prefix={currency.symbol}
                  numeric
                  placeholder="0"
                  optional
                />
              )}

              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: typeConfig!.color },
                  pressed && { opacity: 0.82 },
                ]}
              >
                <Text style={styles.primaryBtnText}>Save Account</Text>
              </Pressable>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

AddAccountSheet.displayName = 'AddAccountSheet';
export default AddAccountSheet;

const styles = StyleSheet.create({
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xs },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.3,
  },

  steps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: Spacing.lg,
  },
  stepDot: {
    height: 8,
    borderRadius: 4,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '47.5%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeGlyph: { fontSize: 20 },
  typeName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.2,
  },
  typeDesc: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
    lineHeight: 16,
  },

  form: { gap: Spacing.md },

  selectedType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 4,
  },
  selectedTypeGlyph: { fontSize: 16 },
  selectedTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleLeft: { gap: 2 },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'Geist_500Medium',
  },
  toggleHint: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
  },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.45 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
});
