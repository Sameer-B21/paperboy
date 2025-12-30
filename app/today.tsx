import Ionicons from '@expo/vector-icons/Ionicons';
import { type AVPlaybackStatus } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import {
  configureAudioMode,
  ensureSharedSound,
  getSavedPlaybackPosition,
  getSharedStatus,
  setPlaybackStatusHandler,
} from '@/data/audioPlayer';
import { generateDailyEpisode, getLatestDailyEpisode } from '@/data/backend';
import { getTtsVoice } from '@/data/session';

const palette = {
  background: '#F6F1E9',
  card: '#FBF8F2',
  surface: '#FDFBF7',
  primaryText: '#2E2A26',
  secondaryText: '#8F877C',
  accent: '#C78B5A',
  accentDark: '#B57846',
  border: '#E7DED3',
  icon: '#6F675D',
  glow: '#F0E7DA',
};

const brandName = 'Paperboy';
const voiceLabelByValue: Record<string, string> = {
  alloy: 'Alloy',
  nova: 'Nova',
  echo: 'Echo',
  fable: 'Fable',
  onyx: 'Onyx',
  shimmer: 'Shimmer',
  ash: 'Ash',
  sage: 'Sage',
  coral: 'Coral',
};

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackStatus, setPlaybackStatus] = useState<
    'idle' | 'ingesting' | 'generating' | 'polling' | 'ready' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [podcastScript, setPodcastScript] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [episodeTitle, setEpisodeTitle] = useState<string>('Your Morning Brief');
  const [loadingMessage, setLoadingMessage] = useState<string>("Finding today's brief");
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [isDurationReady, setIsDurationReady] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [isScriptVisible, setIsScriptVisible] = useState(false);
  const [episodeVoice, setEpisodeVoice] = useState<string>('alloy');
  const seekInFlightRef = useRef(false);
  const hasFinishedRef = useRef(false);
  const replayGuardRef = useRef(false);


  const isBusy = playbackStatus === 'ingesting' || playbackStatus === 'generating' || playbackStatus === 'polling';
  const statusText = useMemo(() => {
    if (playbackError) {
      return playbackError;
    }
    if (errorMessage) {
      return errorMessage;
    }
    switch (playbackStatus) {
      case 'ingesting':
        return 'Syncing your inbox...';
      case 'generating':
        return 'Building your daily script...';
      case 'polling':
        return 'Finalizing the audio transcript...';
      case 'ready':
        return 'Your briefing is ready to play.';
      default:
        return "Your Paperboy hasn't arrived yet. Check back soon.";
    }
  }, [errorMessage, playbackError, playbackStatus]);

  const handlePlayPress = async () => {
    if (isBusy) {
      return;
    }
    setPlaybackError(null);

    if (!audioUrl) {
      setPlaybackError('Audio not ready yet.');
      return;
    }

    try {
      const sound = await ensureSharedSound(audioUrl);
      const status = await sound.getStatusAsync();

      if (!status.isLoaded) {
        return;
      }
      if (status.isPlaying) {
        setHasFinished(false);
        await sound.pauseAsync();
        return;
      }
      const duration = playbackDuration ?? 0;
      const ended =
      hasFinishedRef.current ||
      status.didJustFinish ||
      (duration > 0 && status.positionMillis >= duration);

      // If ended, replay from the start
      if (ended) {
        hasFinishedRef.current = false;
        setHasFinished(false);
        setPlaybackPosition(0);
        replayGuardRef.current = true;
        await sound.replayAsync(); // sets position to 0 and plays
        const replayStatus = await sound.getStatusAsync();
        handlePlaybackStatus(replayStatus);
        setIsPlaying(true);
        return;
      }
      await sound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      setPlaybackError(error instanceof Error ? error.message : 'Unable to play audio.');
    }
  };

  const voiceLabel = useMemo(() => {
    return voiceLabelByValue[episodeVoice] ?? 'Alloy';
  }, [episodeVoice]);

  const loadDailyEpisode = async (): Promise<string | null> => {
    setErrorMessage(null);
    setPlaybackStatus('ingesting');
    setIsInitialLoading(true);
    setIsDurationReady(false);
    setLoadingMessage("Checking today's brief...");

    try {
      const storedVoice = await getTtsVoice();
      const resolvedVoice = storedVoice ?? 'alloy';
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(7, 0, 0, 0);
      if (now < dayStart) {
        dayStart.setDate(dayStart.getDate() - 1);
      }

      const digest = await getLatestDailyEpisode();
      const isTodayBrief = digest?.createdAt
        ? new Date(digest.createdAt) >= dayStart
        : false;

      if (digest && digest.audioUrl && isTodayBrief) {
        const durationMillis = digest.audioDurationSeconds
          ? digest.audioDurationSeconds * 1000
          : 0;
        setPodcastScript(digest.script);
        setAudioUrl(digest.audioUrl);
        setEpisodeTitle(digest.subject);
        setEpisodeVoice(digest.voice ?? resolvedVoice);
        setPlaybackPosition(0);
        setPlaybackDuration(durationMillis);
        setIsDurationReady(durationMillis > 0);
        setHasFinished(false);
        setPlaybackStatus('ready');
        return digest.audioUrl;
      }

      setPlaybackStatus('generating');
      setLoadingMessage('Creating your brief...');
      const generated = await generateDailyEpisode(resolvedVoice);
      if (!generated || !generated.audioUrl) {
        setPlaybackStatus('idle');
        setPodcastScript(null);
        setAudioUrl(null);
        setEpisodeTitle('Your Morning Brief');
        setErrorMessage('No daily brief yet. Check back after 7am.');
        return null;
      }

      const durationMillis = generated.audioDurationSeconds
        ? generated.audioDurationSeconds * 1000
        : 0;
      setPodcastScript(generated.script);
      setAudioUrl(generated.audioUrl);
      setEpisodeTitle(generated.subject);
      setEpisodeVoice(generated.voice ?? resolvedVoice);
      setPlaybackPosition(0);
      setPlaybackDuration(durationMillis);
      setIsDurationReady(durationMillis > 0);
      setHasFinished(false);
      setPlaybackStatus('ready');
      return generated.audioUrl;
    } catch (error) {
      setPlaybackStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong.');
      setIsDurationReady(true);
      return null;
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    void loadDailyEpisode();
  }, []);

  const handlePlaybackStatus = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }
    const nextDuration = playbackDuration ?? 0;
    if (replayGuardRef.current && nextDuration > 0) {
      if (status.isPlaying && status.positionMillis < 1000) {
        replayGuardRef.current = false;
        hasFinishedRef.current = false;
        setHasFinished(false);
      } else if (status.positionMillis >= nextDuration - 250) {
        return;
      }
    }
    setIsPlaying(status.isPlaying);
    setPlaybackPosition((previous) => {
      if (
        !status.isPlaying &&
        status.positionMillis === 0 &&
        previous > 0 &&
        !seekInFlightRef.current &&
        !status.didJustFinish &&
        !hasFinishedRef.current
      ) {
        return previous;
      }
      return status.positionMillis;
    });
    if (nextDuration > 0) {
      if (status.isPlaying && status.positionMillis < nextDuration) {
        setHasFinished(false);
      }
      const ended =
      !replayGuardRef.current &&
      (hasFinishedRef.current ||
        status.didJustFinish ||
        (nextDuration > 0 && status.positionMillis >= nextDuration));

      if ((status.didJustFinish || ended) 
        // && !seekInFlightRef.current
      ) {
        hasFinishedRef.current = true;
        setHasFinished(true);
        setIsPlaying(false);

        // show the UI as "at the end" (full bar + duration time)
        setPlaybackPosition(nextDuration);

        return;
      }
      if (status.isPlaying && status.positionMillis < nextDuration - 500) {
        hasFinishedRef.current = false;
        setHasFinished(false);
      }
    }
  }, [playbackDuration, hasFinished]);

  useEffect(() => {
    void configureAudioMode();
  }, []);

  useEffect(() => {
    setPlaybackStatusHandler(handlePlaybackStatus);
    return () => {
      setPlaybackStatusHandler(null);
    };
  }, [handlePlaybackStatus]);

  useEffect(() => {
    if (!audioUrl) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const sound = await ensureSharedSound(audioUrl);
        const status = await sound.getStatusAsync();
        if (cancelled) {
          return;
        }
        handlePlaybackStatus(status);
        const saved = await getSavedPlaybackPosition(audioUrl);
        if (
          saved &&
          status.isLoaded &&
          !status.isPlaying &&
          status.positionMillis < saved.positionMillis - 1000
        ) {
          await sound.setPositionAsync(saved.positionMillis);
          const refreshed = await sound.getStatusAsync();
          handlePlaybackStatus(refreshed);
        }
      } catch {
        // Ignore preload failures; duration may appear once playback starts.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [audioUrl, handlePlaybackStatus]);

  const seekBy = async (offsetMillis: number) => {
    // Remove or ensure 'duration' is declared and assigned before use
    if (!audioUrl) {
      return;
    }
    if (seekInFlightRef.current) {
      return;
    }
    seekInFlightRef.current = true;
    try {
      const sound = await ensureSharedSound(audioUrl);
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        return;
      }
      const duration = playbackDuration;
      if (!duration || duration <= 0) {
        return;
      }
      if (hasFinished) {
        setHasFinished(false);
        hasFinishedRef.current = false;
      }
      const currentPosition = status.positionMillis ?? 0;
      const nextPosition =
        offsetMillis < 0 && currentPosition + offsetMillis < 0
          ? 10
          : Math.max(0, Math.min(currentPosition + offsetMillis, duration));
      await sound.setPositionAsync(nextPosition);
    } catch {
      // Ignore transient seek conflicts from rapid taps.
    } finally {
      seekInFlightRef.current = false;
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const hasEpisode = Boolean(audioUrl);
  const showEmpty = !isInitialLoading && !hasEpisode;
  const statusHeadline = hasEpisode ? 'Your paper is here!' : "Paperboy hasn't arrived yet";

  const showLoadingScreen = isInitialLoading || (hasEpisode && !isDurationReady);

  if (showLoadingScreen) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundBloom} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.icon} />
          <Text style={styles.loadingText}>
            {isInitialLoading ? loadingMessage : 'Loading your briefing duration...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.backgroundGlow} />
      <View style={styles.backgroundBloom} />
      <View style={[styles.headerRow, { paddingTop: insets.top + 16 }]}>
          <View style={styles.brandRow}>
            {/* <View style={styles.logoWrap}> */}
              <Image source={require('../assets/images/paperboy-logo.png')} style={styles.logoImage} />
            {/* </View> */}
            <Text style={styles.brandText}>{brandName}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.iconButton, isPlaying && styles.iconButtonDisabled]}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Past newsletters"
              onPress={async () => {
                const status = await getSharedStatus();
                if (status?.isLoaded && status.isPlaying) {
                  Alert.alert('Playback in progress', 'Pause the brief before opening the archive.');
                  return;
                }
                router.push('/archive');
              }}
            >
              <Ionicons name="file-tray-outline" size={25} color={palette.icon} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              onPress={() => router.push('/settings')}
            >
              <Ionicons name="options-outline" size={25} color={palette.icon} />
            </TouchableOpacity>
          </View>
        </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        

        <View style={styles.deliveryCard}>
          {hasEpisode ? (
            <Text style={styles.deliveryEyebrow}>DELIVERED THIS MORNING</Text>
          ) : (
            <Text style={styles.deliveryEyebrow}>NO DELIVERY YET</Text>
          )}
          <Text style={styles.deliveryDate}>{todayLabel}</Text>
          <View style={styles.divider} />

          <View style={styles.statusBadge}>
            <View style={styles.badgeIcon}>
              {isInitialLoading ? (
                <ActivityIndicator size="small" color={palette.icon} />
              ) : (
                <Ionicons name={hasEpisode ? 'newspaper-outline' : 'bicycle-outline'} size={26} color={palette.icon} />
              )}
            </View>
            <Text style={styles.badgeTitle}>{statusHeadline}</Text>
            {/*<Text style={[styles.badgeSubtitle, errorMessage ? styles.errorText : null]}>
              {hasEpisode
                ? statusText
                : isInitialLoading
                  && 'Checking for your brief...'
                  // : "Paperboy hasn't arrived yet.\nCheck back soon."
                  }
            </Text>*/}
        </View>

        {hasEpisode ? (
          <View style={styles.playRow}>
            <View style={styles.seekRow}>
              <TouchableOpacity
                style={styles.seekButton}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Skip back 10 seconds"
                onPress={() => seekBy(-10000)}
                disabled={isBusy}
              >
                <Ionicons name="play-back" size={20} color={palette.primaryText} />
                <Text style={styles.seekLabel}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.playButton, isBusy && styles.playButtonDisabled]}
                activeOpacity={0.9}
                accessibilityRole="button"
                accessibilityLabel="Play daily briefing"
                onPress={handlePlayPress}
                disabled={isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons
                    name={isPlaying ? 'pause' : hasFinished ? 'refresh' : 'play'}
                    size={20}
                    color="#ffffff"
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.seekButton,
                  hasFinished && styles.seekButtonDisabled,
                ]}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Skip forward 10 seconds"
                onPress={() => seekBy(10000)}
                disabled={isBusy || hasFinished}
              >
                <Ionicons name="play-forward" size={20} color={palette.primaryText} />
                <Text style={styles.seekLabel}>10s</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.playLabel}>
              {isPlaying ? 'Pause the brief' : hasFinished ? 'Replay the brief' : 'Listen now'}
            </Text>
          </View>
        ) : null}

        {hasEpisode ? (
          <View style={styles.progressSection}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width:
                      playbackDuration > 0
                        ? `${Math.min(100, (playbackPosition / playbackDuration) * 100)}%`
                        : '0%',
                  },
                ]}
              />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(playbackPosition)}</Text>
              <Text style={styles.timeText}>
                {playbackDuration
                ? formatTime(Math.max(0, playbackDuration - playbackPosition))
                : '--:--'}
              </Text>
            </View>
          </View>
        ) : null}
        </View>
        {hasEpisode &&
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>
              {playbackDuration ? formatTime(playbackDuration) : '--:--'}
            </Text>
            <Text style={styles.statLabel}>DURATION</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{voiceLabel}</Text>
            <Text style={styles.statLabel}>VOICE</Text>
          </View>
        </View>}

        {podcastScript ? (
          <View style={styles.summaryCard} accessibilityRole="summary">
            <View style={styles.summaryHeaderRow}>
              <Text style={styles.summaryTitle}>Script</Text>
              <TouchableOpacity
                style={styles.summaryToggleButton}
                accessibilityRole="button"
                accessibilityLabel={isScriptVisible ? 'Hide script' : 'Show script'}
                onPress={() => setIsScriptVisible((visible) => !visible)}
              >
                <Text style={styles.summaryToggleText}>
                  {isScriptVisible ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
            {isScriptVisible ? (
              <Text style={styles.summaryText}>
                {podcastScript}
              </Text>
            ) : null}
            {episodeTitle ? <Text style={styles.summaryMeta}>{episodeTitle}</Text> : null}
          </View>
        ) : null}
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
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: palette.glow,
    opacity: 0.7,
  },
  backgroundBloom: {
    position: 'absolute',
    top: 140,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#EFE3D3',
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  loadingText: {
    color: palette.secondaryText,
    fontSize: 16,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  scrollContent: {
    paddingTop: 16,
    // paddingHorizontal: 22,
    paddingBottom: 80,
    justifyContent: 'center', // Center items vertically
    alignItems: 'center', // Center items horizontally
    flexGrow: 1,
  },
  headerRow: {
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  // logoWrap: {
  //   width: 42,
  //   height: 42,
  //   // borderRadius: 12,
  //   // backgroundColor: palette.surface,
  //   // borderWidth: 1,
  //   // borderColor: palette.border,
  //   // alignItems: 'center',
  //   // justifyContent: 'center',
  // },
  logoImage: {
    width: 42,
    height: 42,
    borderRadius: 12,
    resizeMode: 'contain',
  },
  brandText: {
    color: palette.primaryText,
    fontSize: 20,
    fontFamily: Fonts.serif,
    letterSpacing: 0.4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
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
  iconButtonDisabled: {
    opacity: 0.5,
  },
  deliveryCard: {
    backgroundColor: palette.card,
    borderRadius: 22,
    paddingVertical: 28,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderColor: palette.border,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 3,
    width: '80%',
  },
  deliveryEyebrow: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  deliveryDate: {
    marginTop: 10,
    color: palette.primaryText,
    fontSize: 26,
    fontFamily: Fonts.serif,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  divider: {
    height: 1,
    backgroundColor: palette.border,
    marginVertical: 18,
    marginHorizontal: 40,
  },
  statusBadge: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  badgeIcon: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.sans,
  },
  badgeSubtitle: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
    textAlign: 'center',
  },
  errorText: {
    color: '#C0392B',
  },
  playRow: {
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },
  seekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  seekButton: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  seekButtonDisabled: {
    opacity: 0.45,
  },
  seekLabel: {
    marginTop: 2,
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.accent,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  playButtonDisabled: {
    backgroundColor: '#D8C6B5',
    shadowOpacity: 0,
  },
  playLabel: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    letterSpacing: 0.3,
  },
  progressSection: {
    marginTop: 18,
    width: '100%',
    paddingHorizontal: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.border,
    // borderWidth: 1,
    // borderColor: palette.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: palette.accent,
  },
  timeRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  statsRow: {
    marginTop: 26,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  statBlock: {
    alignItems: 'center',
  },
  statValue: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.serif,
  },
  statLabel: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 1.6,
    marginTop: 6,
  },
  statDivider: {
    width: 1,
    height: 38,
    backgroundColor: palette.border,
  },
  summaryCard: {
    marginTop: 28,
    padding: 20,
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    width: '80%',
  },
  summaryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  summaryTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.serif,
  },
  summaryToggleButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
  },
  summaryToggleText: {
    color: palette.accentDark,
    fontSize: 12,
    fontFamily: Fonts.sans,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  summaryText: {
    color: palette.secondaryText,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
  },
  summaryMeta: {
    marginTop: 12,
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
});
