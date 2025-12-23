import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';

const segments = [
  'Markets in two minutes',
  'AI + startups to watch today',
  'Health, climate, and culture updates',
  'One bold idea to share',
];

export default function TodayScreen() {
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: 'transparent', dark: 'transparent' }}
      headerHeight={0}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          YOUR DAILY BRIEF
        </ThemedText>
        <ThemedText style={styles.subtitle}>{todayLabel}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.playerCard}>
        <View style={styles.coverFrame}>
          <Image
            source={require('@/assets/images/react-logo.png')}
            style={styles.coverArt}
            contentFit="cover"
          />
          <ThemedText style={styles.coverBadge}>Morning mix</ThemedText>
        </View>

        <ThemedText style={styles.eyebrow}>Podcast • Newsletter Podcaster</ThemedText>
        <ThemedText style={styles.episodeTitle}>Today&apos;s Top Stories</ThemedText>
        <ThemedText style={styles.episodeDescription}>
          A calm, 12-minute briefing with business moves, culture, and tech you can listen to on the
          go.
        </ThemedText>
        <View style={styles.progressRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '58%' }]} />
          </View>
          <View style={styles.progressLabels}>
            <ThemedText style={styles.timeText}>06:42</ThemedText>
            <ThemedText style={styles.timeText}>12:00</ThemedText>
          </View>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
            <Ionicons name="play-skip-back" size={22} color="#ffffff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.9}>
            <Ionicons name="pause" size={28} color="#0a091f" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.8}>
            <Ionicons name="play-skip-forward" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </ThemedView>

      <ThemedView style={styles.queueCard}>
        <ThemedText style={styles.queueTitle}>Up next</ThemedText>
        {segments.map((item) => (
          <View key={item} style={styles.queueItem}>
            <View style={styles.bullet} />
            <View style={styles.queueTextGroup}>
              <ThemedText style={styles.queueLabel}>{item}</ThemedText>
              <ThemedText style={styles.queueMeta}>~3 min</ThemedText>
            </View>
          </View>
        ))}
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#c8c5ff',
    bottom: -60,
    left: -20,
    position: 'absolute',
  },
  titleContainer: {
    gap: 4,
    marginBottom: 16,
  },
  subtitle: {
    opacity: 0.8,
    fontFamily: Fonts.sans,
  },
  playerCard: {
    borderRadius: 24,
    padding: 20,
    gap: 12,
    shadowColor: '#0a091f',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    marginVertical: 8,
    shadowOffset: { width: 0, height: 10 },
    backgroundColor: '#f7f6ff',
  },
  coverFrame: {
    backgroundColor: '#0a091f',
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
    height: '40%',
    position: 'relative',
  },
  coverArt: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
    borderRadius: 16,
  },
  coverBadge: {
    position: 'absolute',
    bottom: 18,
    right: 18,
    backgroundColor: '#f9d749',
    color: '#0a091f',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  eyebrow: {
    fontSize: 14,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    opacity: 0.6,
    color: '#1b133a',
  },
  episodeTitle: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.rounded,
    color: '#1b133a',
  },
  episodeDescription: {
    lineHeight: 22,
    opacity: 0.8,
    color: '#1b133a',
    marginBottom: 0,
  },
  progressRow: {
    gap: 6,
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e4e2f7',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6f67ff',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    fontVariant: ['tabular-nums'],
    fontSize: 13,
    opacity: 0.8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1b133a',
  },
  primaryButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9d749',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 4,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e6e2ff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    flex: 1,
  },
  chipText: {
    fontWeight: '700',
    color: '#1b133a',
  },
  queueCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: '#0a091f',
    gap: 10,
  },
  queueTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f9d749',
    fontFamily: Fonts.rounded,
  },
  queueItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f9d749',
  },
  queueTextGroup: {
    flex: 1,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#2f2b47',
    paddingBottom: 10,
  },
  queueLabel: {
    color: '#f7f6ff',
    fontWeight: '600',
  },
  queueMeta: {
    color: '#b3b0d9',
    marginTop: 4,
  },
});
