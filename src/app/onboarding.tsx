import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  FlatList,
  type ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { useSettingsStore } from '@/stores/settingsStore';
import { ACCOUNT_TYPES, TYPE_ORDER } from '@/constants/accountTypes';
import { Spacing } from '@/constants/theme';
import AddAccountSheet, {
  type AddAccountSheetHandle,
} from '@/components/sheets/AddAccountSheet';

const { width: SCREEN_W } = Dimensions.get('window');

interface Slide {
  id: string;
  headline: string;
  sub: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    headline: 'Know your number.',
    sub: 'See your total net worth at a glance — updated every time you log a value.',
  },
  {
    id: '2',
    headline: 'Every account,\none place.',
    sub: 'Track current accounts, investments, property, pensions, and debts together.',
  },
  {
    id: '3',
    headline: "Let's get started.",
    sub: 'Add your first account to see your net worth take shape.',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setHasOnboarded = useSettingsStore((s) => s.setHasOnboarded);
  const addAccountRef = useRef<AddAccountSheetHandle>(null);
  const listRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function goToHome() {
    setHasOnboarded(true);
    router.replace('/(app)');
  }

  function handleAccountSaved() {
    goToHome();
  }

  function nextSlide() {
    if (activeIndex < SLIDES.length - 1) {
      const next = activeIndex + 1;
      listRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveIndex(next);
    }
  }

  function renderSlide({ item, index }: ListRenderItemInfo<Slide>) {
    const isLast = index === SLIDES.length - 1;

    return (
      <View style={[styles.slide, { width: SCREEN_W }]}>
        {/* Illustration area */}
        {index === 1 && (
          <View style={styles.typeGrid}>
            {TYPE_ORDER.map((type) => {
              const cfg = ACCOUNT_TYPES[type];
              return (
                <View
                  key={type}
                  style={[
                    styles.typeChip,
                    { backgroundColor: `${cfg.color}18`, borderColor: `${cfg.color}30` },
                  ]}
                >
                  <Text style={styles.typeChipGlyph}>{cfg.glyph}</Text>
                  <Text style={[styles.typeChipLabel, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {index === 0 && (
          <View style={styles.heroNumber}>
            <Text style={[styles.heroValue, { color: theme.fg }]}>£124,800</Text>
            <Text style={[styles.heroLabel, { color: theme.fg3 }]}>Net Worth</Text>
          </View>
        )}

        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: theme.fg }]}>{item.headline}</Text>
          <Text style={[styles.sub, { color: theme.fg2 }]}>{item.sub}</Text>
        </View>

        <View style={styles.actions}>
          {isLast ? (
            <>
              <Pressable
                onPress={() => addAccountRef.current?.present()}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  { backgroundColor: theme.fg },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.primaryBtnText, { color: theme.bg }]}>
                  Add First Account
                </Text>
              </Pressable>
              <Pressable
                onPress={goToHome}
                style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.6 }]}
              >
                <Text style={[styles.ghostBtnText, { color: theme.fg3 }]}>
                  Skip for now
                </Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              onPress={nextSlide}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: theme.fg },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.primaryBtnText, { color: theme.bg }]}>Continue</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Skip button */}
      <View style={styles.topBar}>
        <Pressable
          onPress={goToHome}
          style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]}
        >
          <Text style={[styles.skipText, { color: theme.fg3 }]}>Skip</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({
          length: SCREEN_W,
          offset: SCREEN_W * index,
          index,
        })}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i === activeIndex ? theme.fg : theme.border,
                width: i === activeIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>

      <AddAccountSheet ref={addAccountRef} onAccountSaved={handleAccountSaved} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  skipBtn: { padding: 8 },
  skipText: {
    fontSize: 15,
    fontFamily: 'Geist_500Medium',
  },

  slide: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.xl,
  },

  heroNumber: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  heroValue: {
    fontSize: 52,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -2,
  },
  heroLabel: {
    fontSize: 14,
    fontFamily: 'Geist_500Medium',
    marginTop: 4,
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  typeChipGlyph: { fontSize: 16 },
  typeChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },

  textBlock: { gap: 12 },
  headline: {
    fontSize: 34,
    fontWeight: '700',
    fontFamily: 'Geist_700Bold',
    letterSpacing: -1,
    lineHeight: 40,
  },
  sub: {
    fontSize: 16,
    fontFamily: 'Geist_400Regular',
    lineHeight: 24,
  },

  actions: { gap: 12 },
  primaryBtn: {
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Geist_600SemiBold',
  },
  ghostBtn: { alignItems: 'center', paddingVertical: 8 },
  ghostBtnText: {
    fontSize: 14,
    fontFamily: 'Geist_500Medium',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
