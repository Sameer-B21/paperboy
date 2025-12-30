import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoLinking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import {
  fetchAuthUrl,
  generateDailyEpisode,
  listNewsletters,
  syncGmail,
  updateNewsletterSelection,
} from '@/data/backend';
import { getUserEmail, getUserId, setUserEmail, setUserId } from '@/data/session';

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

type Newsletter = {
  id: string;
  name: string;
  sender: string;
  selected: boolean;
};

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ userId?: string; email?: string; connected?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isConnected, setIsConnected] = useState(false);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [userEmail, setUserEmailState] = useState<string>('');
  const [hasDiscovered, setHasDiscovered] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [hasAppliedParams, setHasAppliedParams] = useState(false);

  const selectedCount = useMemo(
    () => newsletters.filter((newsletter) => newsletter.selected).length,
    [newsletters]
  );

  const loadNewsletters = async () => {
    const storedUserId = await getUserId();
    if (!storedUserId) {
      return;
    }
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const data = await listNewsletters();
      setNewsletters(data);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to load newsletters.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const boot = async () => {
      setIsInitialLoading(true);
      const storedUserId = await getUserId();
      const storedEmail = await getUserEmail();
      if (storedUserId) {
        setIsConnected(true);
      }
      if (storedEmail) {
        setUserEmailState(storedEmail);
      }
      await loadNewsletters();
      setHasDiscovered(true);
      setIsInitialLoading(false);
    };
    void boot();
  }, []);

  useEffect(() => {
    const applyParams = async () => {
      setHasAppliedParams(false);
      if (params.userId) {
        await setUserId(params.userId);
        setIsConnected(true);
      }
      if (params.email) {
        await setUserEmail(params.email);
        setUserEmailState(params.email);
      }
      if (params.userId || params.email || params.connected) {
        setIsInitialLoading(true);
        setHasDiscovered(false);
        await loadNewsletters();
        setIsInitialLoading(false);
      }
      setHasAppliedParams(true);
    };
    void applyParams();
  }, [params]);

  useEffect(() => {
    if (!isConnected || hasDiscovered) {
      return;
    }
    setHasDiscovered(true);
  }, [isConnected, hasDiscovered]);

  const toggleNewsletter = async (id: string) => {
    if (updatingIds.includes(id)) {
      return;
    }
    const current = newsletters.find((item) => item.id === id);
    if (!current) {
      return;
    }
    const nextSelected = !current.selected;
    setUpdatingIds((prev) => [...prev, id]);
    setNewsletters((prev) =>
      prev.map((newsletter) =>
        newsletter.id === id ? { ...newsletter, selected: nextSelected } : newsletter
      )
    );
    try {
      await updateNewsletterSelection(id, nextSelected);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to update selection.');
      setNewsletters((prev) =>
        prev.map((newsletter) =>
          newsletter.id === id ? { ...newsletter, selected: current.selected } : newsletter
        )
      );
    } finally {
      setUpdatingIds((prev) => prev.filter((entry) => entry !== id));
    }
  };

  const handleConnectPress = async () => {
    setStatusMessage(null);
    try {
      const redirectUrl = ExpoLinking.createURL('/settings');
      const url = await fetchAuthUrl(redirectUrl);
      await ExpoLinking.openURL(url);
      setStatusMessage('Complete Gmail auth, then set EXPO_PUBLIC_USER_ID and refresh.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to start Gmail auth.');
    }
  };

  const handleSyncPress = async () => {
    setIsSyncing(true);
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const result = await syncGmail();
      setStatusMessage(`Discovered ${result.discovered} newsletters.`);
      await loadNewsletters();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to sync Gmail.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  const handleGenerateEpisode = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    try {
      await generateDailyEpisode();
      setStatusMessage('Daily brief queued. Check Today in a moment.');
      router.push('/today');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to generate daily brief.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shouldShowLoadingOverlay =
    (isInitialLoading ||
      (!!(params.userId || params.email || params.connected) && !hasAppliedParams)) &&
    newsletters.length === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.backgroundOrbs} pointerEvents="none">
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
        <View style={styles.orbHighlight} />
      </View>
      {shouldShowLoadingOverlay ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.loadingText}>Loading your newsletters…</Text>
        </View>
      ) : null}
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
          <Text style={styles.headerTitle}>Settings</Text>
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
        {/* <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Settings</Text>
            <Text style={styles.title}>Newsletter connections</Text>
          </View>
        </View> */}

        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View style={styles.connectionHeaderTop}>
              <Text style={styles.cardTitle}>Gmail inbox</Text>
              <View style={styles.statusPill}>
                <View style={[styles.statusDot, isConnected ? styles.statusDotOn : null]} />
                <Text style={styles.statusLabel}>
                  {isConnected ? 'Connected' : 'Not connected'}
                </Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>
              Sync newsletters, auto-tag episodes, and keep your sources tidy.
            </Text>
          </View>

          <View style={styles.connectionBody}>
            {isConnected ? (
              <View style={styles.accountRow}>
                {/* <View style={styles.accountAvatar}>
                  <Text style={styles.accountInitials}>TL</Text>
                </View> */}
                <View style={styles.accountMeta}>
                  <Text style={styles.accountName}>Gmail connected</Text>
                  <Text style={styles.accountEmail}>
                    {userEmail || 'Signed in'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.ghostButton}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  onPress={handleSyncPress}
                  disabled={isSyncing}
                >
                  <Text style={styles.ghostButtonText}>{isSyncing ? 'Syncing...' : 'Sync now'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <TouchableOpacity
                  style={styles.connectButton}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  onPress={handleConnectPress}
                >
                  <Ionicons name="logo-google" size={18} color="#ffffff" />
                  <Text style={styles.connectButtonText}>Connect Gmail</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  We only read newsletters and label them "Podcast Sources".
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Step 2 · Discover newsletters</Text>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{newsletters.length} found</Text>
          </View>
        </View>

        <View style={styles.rulesCard}>
          <View style={styles.ruleRow}>
            <View>
              <Text style={styles.ruleTitle}>Scan inbox</Text>
              <Text style={styles.ruleSubtitle}>
                We scan the last 30 days and list newsletter senders as inactive.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.ghostButton}
              activeOpacity={0.85}
              accessibilityRole="button"
              onPress={handleSyncPress}
              disabled={isSyncing || !isConnected}
            >
              <Text style={styles.ghostButtonText}>
                {isSyncing ? 'Scanning...' : 'Find newsletters'}
              </Text>
            </TouchableOpacity>
          </View>
        </View> */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select newsletters</Text>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{selectedCount} selected</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {isLoading && newsletters.length === 0 ? (
            <Text style={styles.emptyText}>Loading newsletters…</Text>
          ) : newsletters.length === 0 ? (
            <Text style={styles.emptyText}>No newsletters yet. Run a sync to populate.</Text>
          ) : (
            newsletters.map((newsletter, index) => (
              <View
                key={newsletter.id}
                style={[
                  styles.listRow,
                  index === newsletters.length - 1 ? styles.listRowLast : null,
                ]}
              >
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{newsletter.name}</Text>
                  <Text style={styles.listDescription}>{newsletter.sender}</Text>
                  <View style={styles.cadencePill}>
                    <Text style={styles.cadenceText}>Auto-import enabled</Text>
                  </View>
                </View>
                <Switch
                  value={newsletter.selected}
                  onValueChange={() => toggleNewsletter(newsletter.id)}
                  trackColor={{ false: palette.border, true: palette.accent }}
                  thumbColor={newsletter.selected ? '#ffffff' : '#ffffff'}
                  ios_backgroundColor={palette.border}
                  disabled={updatingIds.includes(newsletter.id) || !isConnected}
                />
              </View>
            ))
          )}
        </View>

        {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Generate new brief</Text>
        </View>

        <View style={styles.connectionCard}>
          <Text style={styles.cardTitle}>One briefing, every day</Text>
          <Text style={styles.cardSubtitle}>
            Click generate to create a new daily digest episode for today from your selected newsletters.
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            activeOpacity={0.85}
            accessibilityRole="button"
            onPress={handleGenerateEpisode}
            disabled={isGenerating || selectedCount === 0}
          >
            <Ionicons name="play-circle" size={18} color="#ffffff" />
            <Text style={styles.connectButtonText}>
              {isGenerating ? 'Generating...' : 'Generate new daily digest'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Import rules</Text>
        </View>

        <View style={styles.rulesCard}>
          <View style={styles.ruleRow}>
            <View>
              <Text style={styles.ruleTitle}>Lookback window</Text>
              <Text style={styles.ruleSubtitle}>Capture newsletters from the last 30 days.</Text>
            </View>
            <View style={styles.rulePill}>
              <Text style={styles.rulePillText}>30 days</Text>
            </View>
          </View>
          <View style={[styles.ruleRow, styles.ruleRowLast]}>
            <View>
              <Text style={styles.ruleTitle}>Auto-categorize</Text>
              <Text style={styles.ruleSubtitle}>Tag each brief by topic once imported.</Text>
            </View>
            <View style={styles.rulePillMuted}>
              <Text style={styles.rulePillTextMuted}>Enabled</Text>
            </View>
          </View>
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
  backgroundOrbs: {
    ...StyleSheet.absoluteFillObject,
  },
  orbLarge: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: palette.glow,
    top: -60,
    right: -90,
    opacity: 0.7,
  },
  orbSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#EFE3D3',
    top: 120,
    left: -60,
    opacity: 0.5,
  },
  orbHighlight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#EADCCA',
    bottom: -90,
    right: -60,
    opacity: 0.35,
  },
  scrollContent: {
    // paddingTop: -22,
    paddingHorizontal: 22,
    paddingBottom: 90,
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
  kicker: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: palette.primaryText,
    fontSize: 28,
    fontFamily: Fonts.serif,
    marginTop: 6,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.border,
  },
  connectionCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 20,
  },
  connectionHeader: {
    gap: 10,
    marginBottom: 16,
  },
  connectionHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.serif,
    flex: 1,
  },
  cardSubtitle: {
    color: palette.secondaryText,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans,
    marginTop: 6,
    maxWidth: '100%',
    marginBottom: 16,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9B9A6',
  },
  statusDotOn: {
    backgroundColor: '#7BB28E',
  },
  statusLabel: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  connectionBody: {
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: palette.accent,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: palette.accentDark,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  helperText: {
    color: palette.secondaryText,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    marginTop: 10,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitials: {
    color: palette.primaryText,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  accountMeta: {
    flex: 1,
  },
  accountName: {
    color: palette.primaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  accountEmail: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  ghostButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.surface,
    borderWidth: 1,
    borderColor: palette.border,
  },
  ghostButtonText: {
    color: palette.accentDark,
    fontSize: 13,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.serif,
  },
  metaPill: {
    backgroundColor: palette.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  metaText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  listCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 16,
  },
  emptyText: {
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  listRowLast: {
    borderBottomWidth: 0,
  },
  listInfo: {
    flex: 1,
  },
  listTitle: {
    color: palette.primaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  listDescription: {
    color: palette.secondaryText,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    marginTop: 4,
  },
  cadencePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: palette.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: palette.border,
  },
  cadenceText: {
    color: palette.secondaryText,
    fontSize: 11,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  rulesCard: {
    backgroundColor: palette.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 14,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingBottom: 12,
  },
  ruleRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  ruleTitle: {
    color: palette.primaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  ruleSubtitle: {
    color: palette.secondaryText,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    marginTop: 4,
    maxWidth: 220,
  },
  rulePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.glow,
  },
  rulePillText: {
    color: palette.primaryText,
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  rulePillMuted: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E9DED1',
  },
  rulePillTextMuted: {
    color: palette.icon,
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  statusMessage: {
    marginTop: 12,
    color: palette.secondaryText,
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(246, 241, 233, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 20,
  },
  loadingText: {
    fontSize: 15,
    color: palette.primaryText,
    fontFamily: Fonts.sans,
  },
});
