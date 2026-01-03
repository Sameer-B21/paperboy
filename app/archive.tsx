import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { listEpisodes } from '@/data/backend';
import { useRequireUser } from '@/hooks/use-require-user';

const palette = {
  background: '#F6F1E9',
  card: '#FBF8F2',
  surface: '#FDFBF7',
  primaryText: '#2E2A26',
  secondaryText: '#8F877C',
  accent: '#C78B5A',
  border: '#E7DED3',
  icon: '#6F675D',
  glow: '#F0E7DA',
};

export default function ArchiveScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasUser } = useRequireUser();
  const [episodes, setEpisodes] = useState<
    Array<{
      id: string;
      dateLabel: string;
      title: string;
      status: string;
      summary: string;
      createdAt: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadEpisodes = async () => {
    setIsLoading(true);
    try {
      const episodes = await listEpisodes();
      const digests = episodes.filter((episode) => episode.sourceMessageId?.startsWith('digest-'));
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
    if (!hasUser) {
      return;
    }
    void loadEpisodes();
  }, [hasUser]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.backgroundGlow} />
      <View style={[styles.headerRow, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to today"
            onPress={() => router.push('/today')}
          >
            <Ionicons name="chevron-back" size={25} color={palette.icon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Archive</Text>
          <View style={styles.headerSpacer} />
          {/* <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={20} color={palette.icon} />
          </TouchableOpacity> */}
        </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        

        {/* <View style={styles.heroCard}>
          <Text style={styles.dateText}>Past newsletters</Text>
          <Text style={styles.title}>Your daily briefing library</Text>
          <Text style={styles.summaryText}>
            Revisit earlier episodes in the same calm format you listen to each morning.
          </Text>
        </View> */}

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Saved briefs</Text>
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
                {/* <Text style={styles.episodeSummary}>{episode.summary}</Text> */}
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
  backgroundGlow: {
    position: 'absolute',
    top: -140,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: palette.glow,
    opacity: 0.7,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 22,
    paddingBottom: 80,
  },
  headerRow: {
    // flexDirection: 'row',
    // alignItems: 'center',
    // justifyContent: 'space-between',
    // marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: palette.card,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    // shadowColor: '#000000',
    // shadowOpacity: 0.06,
    // shadowRadius: 18,
    // shadowOffset: { width: 0, height: 12 },
  },
  headerTitle: {
    color: palette.primaryText,
    fontSize: 20,
    fontFamily: Fonts.serif,
    letterSpacing: 0.4,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    // backgroundColor: palette.surface,
    // borderWidth: 1,
    // borderColor: palette.border,
  },
  heroCard: {
    borderRadius: 22,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  dateText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.primaryText,
    fontSize: 22,
    fontFamily: Fonts.serif,
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
    fontFamily: Fonts.serif,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metaPill: {
    backgroundColor: palette.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  metaText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  summaryText: {
    color: palette.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
  },
  episodeCard: {
    backgroundColor: palette.surface,
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
    fontSize: 18,
    fontFamily: Fonts.serif,
    marginBottom: 10,
  },
  episodeSummary: {
    color: palette.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans,
  },
});
