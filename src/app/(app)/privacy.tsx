import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export default function PrivacyScreen() {
  const theme = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.topBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={22} color={theme.fg} />
        </Pressable>
        <Text style={[styles.topTitle, { color: theme.fg }]}>Privacy Policy</Text>
        <View style={styles.topBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.updated, { color: theme.fg3 }]}>Last updated: May 2025</Text>

        <Section title="Your Data Stays on Your Device" theme={theme}>
          All account data you enter — balances, entries, account names — is stored locally on your
          device only. Worthi does not upload, sync, or back up your financial data to any server.
          There is no account registration and no cloud sync. Deleting the app removes all data.
        </Section>

        <Section title="Anonymous Analytics" theme={theme}>
          Worthi uses Mixpanel to collect anonymous usage analytics. These events help us understand
          how the app is used so we can improve it. No name, email address, phone number, or any
          personally identifiable information is ever collected or sent. No financial values are
          included in analytics events.{'\n\n'}
          Analytics events are tagged with a flag indicating whether the session is a development
          or production build. Mixpanel assigns each installation an anonymous, randomly-generated
          identifier to distinguish devices — this identifier cannot be linked back to you.
        </Section>

        <Section title="No Advertising" theme={theme}>
          Worthi does not use advertising identifiers (IDFA, GAID), does not participate in
          cross-site or cross-app tracking, and does not sell or share any data with third parties
          for advertising purposes.
        </Section>

        <Section title="Third-Party Services" theme={theme}>
          The only third-party service used is Mixpanel for anonymous analytics. Mixpanel's own
          privacy policy applies to the data it receives. No other third-party SDKs or services
          have access to your data.
        </Section>

        <Section title="Contact" theme={theme}>
          Questions about this policy? Email us at alastair.r.mcneill@gmail.com
        </Section>

        <View style={{ height: Spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({
  title,
  children,
  theme,
}: {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.fg }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: theme.fg2 }]}>{children}</Text>
    </View>
  );
}

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

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  updated: {
    fontSize: 12,
    fontFamily: 'Geist_400Regular',
    marginBottom: Spacing.lg,
  },

  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    fontFamily: 'Geist_400Regular',
    lineHeight: 23,
  },
});
