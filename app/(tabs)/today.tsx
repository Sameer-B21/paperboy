import Ionicons from '@expo/vector-icons/Ionicons';

import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Fonts } from '@/constants/theme';

const palette = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#0F172A',
  secondaryText: '#94A3B8',
  accent: '#F6A34D',
  accentShadow: '#E18A28',
  pill: '#EEF2F6',
};

export default function TodayScreen() {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.greeting}>Today&apos;s briefing</Text>
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} accessibilityRole="button">
            <Ionicons name="settings-outline" size={22} color={palette.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.dateText}>{todayLabel}</Text>
          <Text style={styles.title}>Your Morning Brief</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>7 min</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Medium</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Calm voice</Text>
            </View>
          </View>

          <View style={styles.playSection}>
            <TouchableOpacity style={styles.playButton} activeOpacity={0.9} accessibilityRole="button">
              <Ionicons name="play" size={28} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.playHint}>Press play to ease into the day</Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '32%' }]} />
            </View>
            <Text style={styles.progressLabel}>Light briefing · no rush</Text>
          </View>
          </View>

<TouchableOpacity style={styles.pastEpisodes} activeOpacity={0.6} accessibilityRole="link">
  <Text style={styles.pastEpisodesText}>Past episodes →</Text>
</TouchableOpacity>
</ScrollView>
</SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  scrollContent: {
    paddingTop: 26,
    paddingHorizontal: 22,
    paddingBottom: 30,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 26,
  },
  greeting: {
    color: palette.secondaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#EFF4FB',
  },
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 16,
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  dateText: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
    letterSpacing: 0.3,
  },
  title: {
    color: palette.primaryText,
    fontSize: 26,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  metaPill: {
    backgroundColor: palette.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  metaText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: Fonts.sans,
    letterSpacing: 0.1,
  },
  playSection: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  playButton: {
    width: 82,
    height: 82,
    borderRadius: 41,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    shadowColor: palette.accentShadow,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  playHint: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  progressBlock: {
    gap: 8,
    paddingTop: 6,
  },
  progressBar: {
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  progressLabel: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  pastEpisodes: {
    marginTop: 18,
    alignSelf: 'flex-start',
  },
  pastEpisodesText: {
    color: '#64748B',
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
});
