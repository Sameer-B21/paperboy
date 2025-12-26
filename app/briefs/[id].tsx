import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { getBrief } from '@/data/backend';

const palette = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#0F172A',
  secondaryText: '#94A3B8',
  accent: '#F6A34D',
  accentShadow: '#E18A28',
  pill: '#EEF2F6',
};

export default function BriefDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [brief, setBrief] = useState<{
    id: string;
    subject: string;
    summary: string | null;
    script: string | null;
    status: string;
    audioUrl: string | null;
    createdAt: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }
    const loadBrief = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const detail = await getBrief(id);
        setBrief(detail);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load brief.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadBrief();
  }, [id]);

  const handlePlayPress = () => {
    setIsPlaying((prev) => !prev);
  };

  if (!brief) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFoundContainer}>
          <Text style={styles.notFoundTitle}>{isLoading ? 'Loading brief...' : 'Brief not found'}</Text>
          <Text style={styles.notFoundText}>
            {errorMessage ?? 'Pick another date from the explore list.'}
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={palette.primaryText} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const progressWidth = brief.status === 'completed' ? '100%' : '45%';
  const dateLabel = new Date(brief.createdAt).toLocaleDateString(undefined, {
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
          <Text style={styles.greeting}>Company Logo</Text>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={22} color={palette.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.dateText}>{dateLabel}</Text>
          <Text style={styles.title}>{brief.subject}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{brief.status}</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Auto</Text>
            </View>
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>Warm voice</Text>
            </View>
          </View>

          <View style={styles.playSection}>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.skipButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Skip back 10 seconds"
              >
                <Ionicons name="play-back" size={18} color={palette.primaryText} />
                <Text style={styles.skipLabel}>10s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.playButton}
                activeOpacity={0.9}
                accessibilityRole="button"
                onPress={handlePlayPress}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#ffffff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.skipButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Skip forward 10 seconds"
              >
                <Ionicons name="play-forward" size={18} color={palette.primaryText} />
                <Text style={styles.skipLabel}>10s</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.playHint}>
              {isPlaying ? 'Playing...' : 'Press play to ease into the day'}
            </Text>
          </View>

          <View style={styles.progressBlock}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {width: `${parseFloat(progressWidth)}%` || 0 }]} />
            </View>
            <Text style={styles.progressLabel}>{brief.progressLabel}</Text>
          </View>
        </View>

        <View style={styles.summaryCard} accessibilityRole="summary">
          <Text style={styles.summaryTitle}>Script</Text>
          <Text style={styles.summaryText}>{brief.script ?? brief.summary ?? 'Processing...'}</Text>
        </View>
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
    borderRadius: 20,
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 16,
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '80%',
    marginTop: 4,
  },
  skipButton: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: palette.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  skipLabel: {
    color: palette.primaryText,
    fontSize: 11,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
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
  summaryCard: {
    marginTop: 20,
    padding: 22,
    backgroundColor: palette.card,
    borderRadius: 18,
    gap: 12,
    shadowColor: '#0F172A',
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  summaryTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  summaryText: {
    color: '#475569',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: Fonts.sans,
  },
  notFoundContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    gap: 12,
  },
  notFoundTitle: {
    color: palette.primaryText,
    fontSize: 22,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  notFoundText: {
    color: palette.secondaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#EFF4FB',
  },
  backButtonText: {
    color: palette.primaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
});
