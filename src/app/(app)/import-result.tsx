import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import type { ImportError } from '@/lib/csvImport';
import { commitImport } from '@/lib/csvImport';

export default function ImportResultScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { mode, accounts, entries, skipped, errors: errorsParam } =
    useLocalSearchParams<{
      mode: string;
      accounts: string;
      entries: string;
      skipped: string;
      errors: string;
    }>();

  const isPreview = mode === 'preview';

  const [errorsExpanded, setErrorsExpanded] = useState(false);

  const accountsCreated = parseInt(accounts ?? '0', 10);
  const entriesCreated = parseInt(entries ?? '0', 10);
  const skippedRows = parseInt(skipped ?? '0', 10);
  let parsedErrors: ImportError[] = [];
  try {
    parsedErrors = errorsParam ? JSON.parse(decodeURIComponent(errorsParam)) : [];
  } catch {
    parsedErrors = [];
  }

  const success = accountsCreated > 0 || entriesCreated > 0;

  function handleConfirmImport() {
    commitImport((path: any) => router.replace(path));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.replace('/(app)')}
          hitSlop={8}
          style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="close" size={22} color={theme.fg} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.fg }]}>
          {isPreview ? 'Import Preview' : 'Import Result'}
        </Text>
        <View style={styles.topBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: isPreview
                ? `${theme.accent}18`
                : success
                  ? `${theme.success}18`
                  : `${theme.danger}18`,
            },
          ]}
        >
          <Ionicons
            name={isPreview ? 'cloud-upload-outline' : success ? 'checkmark-circle' : 'alert-circle'}
            size={52}
            color={isPreview ? theme.accent : success ? theme.success : theme.danger}
          />
        </View>

        <Text style={[styles.headline, { color: theme.fg }]}>
          {isPreview
            ? skippedRows > 0
              ? 'Review Before Importing'
              : 'Ready to Import'
            : success
              ? 'Import Complete'
              : 'Nothing Imported'}
        </Text>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <StatRow
            icon="business-outline"
            label={isPreview ? 'Accounts to create' : 'Accounts created'}
            value={String(accountsCreated)}
            theme={theme}
            color={theme.success}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <StatRow
            icon="calendar-outline"
            label={isPreview ? 'Entries to import' : 'Entries imported'}
            value={String(entriesCreated)}
            theme={theme}
            color={theme.success}
          />
          {skippedRows > 0 && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <StatRow
                icon="warning-outline"
                label="Rows skipped"
                value={String(skippedRows)}
                theme={theme}
                color={theme.danger}
              />
            </>
          )}
        </View>

        {/* Skipped row errors */}
        {parsedErrors.length > 0 && (
          <View style={[styles.errorsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Pressable
              onPress={() => setErrorsExpanded((v) => !v)}
              style={styles.errorsToggle}
            >
              <Text style={[styles.errorsToggleText, { color: theme.fg2 }]}>
                {errorsExpanded ? 'Hide' : 'Show'} skipped rows
              </Text>
              <Ionicons
                name={errorsExpanded ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.fg3}
              />
            </Pressable>

            {errorsExpanded && (
              <View style={[styles.errorsList, { borderTopWidth: 1, borderTopColor: theme.border }]}>
                {parsedErrors.map((e, i) => (
                  <View
                    key={i}
                    style={[
                      styles.errorRow,
                      i < parsedErrors.length - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.errorRowNum, { color: theme.fg3 }]}>
                      Row {e.row}
                    </Text>
                    <Text style={[styles.errorReason, { color: theme.fg2 }]}>
                      {e.reason}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {isPreview ? (
          <>
            <Pressable
              onPress={handleConfirmImport}
              style={({ pressed }) => [
                styles.ctaBtn,
                { backgroundColor: theme.fg },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.ctaBtnText, { color: theme.bg }]}>
                Import {accountsCreated} {accountsCreated === 1 ? 'Account' : 'Accounts'}
              </Text>
              <Ionicons name="cloud-upload-outline" size={16} color={theme.bg} />
            </Pressable>
            <Pressable
              onPress={() => router.replace('/(app)')}
              style={({ pressed }) => [
                styles.cancelBtn,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: theme.fg2 }]}>Cancel</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            onPress={() => router.replace('/(app)')}
            style={({ pressed }) => [
              styles.ctaBtn,
              { backgroundColor: theme.fg },
              pressed && { opacity: 0.85 },
            ]}
          >
            <Text style={[styles.ctaBtnText, { color: theme.bg }]}>View Accounts</Text>
            <Ionicons name="arrow-forward" size={16} color={theme.bg} />
          </Pressable>
        )}

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatRow({
  icon,
  label,
  value,
  theme,
  color,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  theme: any;
  color: string;
}) {
  return (
    <View style={statStyles.row}>
      <View style={statStyles.left}>
        <Ionicons name={icon} size={18} color={theme.fg3} />
        <Text style={[statStyles.label, { color: theme.fg2 }]}>{label}</Text>
      </View>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { fontSize: 15, fontFamily: 'Geist_500Medium' },
  value: { fontSize: 20, fontWeight: '700', fontFamily: 'Geist_700Bold', letterSpacing: -0.5 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  topBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.3,
  },

  content: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },

  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },

  headline: {
    fontSize: 26,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -0.8,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  statsCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  divider: { height: 1, marginHorizontal: Spacing.md },

  errorsCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  errorsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
  },
  errorsToggleText: {
    fontSize: 14,
    fontFamily: 'Geist_500Medium',
  },
  errorsList: {},
  errorRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    gap: 3,
  },
  errorRowNum: {
    fontSize: 11,
    fontFamily: 'Geist_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  errorReason: {
    fontSize: 13,
    fontFamily: 'Geist_400Regular',
    lineHeight: 18,
  },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: Spacing.sm,
  },
  ctaBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: 'Geist_500Medium',
  },
});
