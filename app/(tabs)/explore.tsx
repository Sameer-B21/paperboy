import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { listEpisodes } from '@/data/backend';

const palette = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#0F172A',
  secondaryText: '#94A3B8',
  accent: '#F6A34D',
  accentShadow: '#E18A28',
  pill: '#EEF2F6',
  border: '#E2E8F0',
};

export default function ExploreScreen() {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<
    Array<{
      id: string;
      dateLabel: string;
      title: string;
      status: string;
      summary: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEpisodes = async () => {
    setIsLoading(true);
    try {
      const episodes = await listEpisodes();
      const digests = episodes.filter((episode) =>
        episode.sourceMessageId?.startsWith('digest-')
      );
      const todayKey = new Date().toDateString();
      const mapped = digests.map((episode) => ({
        id: episode.id,
        dateLabel: new Date(episode.createdAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        }),
        title: episode.subject,
        status: episode.status,
        summary:
          episode.status === 'completed'
            ? 'Ready to play. Tap to read the script.'
            : 'Processing. Check back soon.',
        createdAt: episode.createdAt,
      }));
      const pastOnly = mapped.filter(
        (episode) => new Date(episode.createdAt).toDateString() !== todayKey
      );
      setEpisodes(pastOnly);
    } catch {
      setEpisodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadEpisodes();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Company Logo</Text>
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={palette.secondaryText} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.dateText}>Archive</Text>
          <Text style={styles.title}>Daily briefing library</Text>
          <Text style={styles.summaryText}>
            Revisit earlier episodes in the same calm format you listen to each morning. Tap any
            date to open the full brief.
          </Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Past daily briefs</Text>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{episodes.length} saved</Text>
          </View>
        </View>
        

        {isLoading ? (
          <Text style={styles.summaryText}>Loading briefs...</Text>
        ) : (
          episodes.map((episode) => (
          <Link
            key={episode.id}
            href={{ pathname: '/episodes/[id]', params: { id: episode.id } }}
            asChild
          >
            <TouchableOpacity
              style={styles.episodeCard}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <View style={styles.episodeHeader}>
                <Text style={styles.episodeDate}>{episode.dateLabel}</Text>
                <Ionicons name="chevron-forward" size={18} color={palette.secondaryText} />
              </View>
              <Text style={styles.episodeTitle}>{episode.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{episode.status}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>Auto</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>Warm voice</Text>
                </View>
              </View>
              <Text style={styles.episodeSummary}>{episode.summary}</Text>
            </TouchableOpacity>
          </Link>
          ))
        )}
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
    paddingBottom: 70,
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
  headerTitle: {
    color: palette.primaryText,
    fontSize: 20,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    marginTop: 6,
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
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 14,
    marginBottom: 25,
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
    fontSize: 24,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
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
  summaryText: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
  },
  episodeCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  episodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  episodeDate: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  episodeTitle: {
    color: palette.primaryText,
    fontSize: 20,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    marginBottom: 10,
  },
  episodeSummary: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
  },
});
