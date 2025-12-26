import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import {
  fetchAuthUrl,
  listNewsletters,
  syncGmail,
  updateNewsletterSelection,
} from '@/data/backend';
import { getUserEmail, getUserId, setUserEmail, setUserId } from '@/data/session';

const palette = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#0F172A',
  secondaryText: '#94A3B8',
  accent: '#F6A34D',
  accentShadow: '#E18A28',
  border: '#E2E8F0',
  pill: '#EEF2F6',
  spotlight: '#FFE7C8',
  deep: '#0B1F3A',
  glow: '#FFD7A8',
};

type Newsletter = {
  id: string;
  name: string;
  sender: string;
  selected: boolean;
};

export default function SettingsScreen() {
  const params = useLocalSearchParams<{ userId?: string; email?: string; connected?: string }>();
  const [isConnected, setIsConnected] = useState(false);
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [userEmail, setUserEmailState] = useState<string>('');

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
      const storedUserId = await getUserId();
      const storedEmail = await getUserEmail();
      if (storedUserId) {
        setIsConnected(true);
      }
      if (storedEmail) {
        setUserEmailState(storedEmail);
      }
      await loadNewsletters();
    };
    void boot();
  }, []);

  useEffect(() => {
    const applyParams = async () => {
      if (params.userId) {
        await setUserId(params.userId);
        setIsConnected(true);
      }
      if (params.email) {
        await setUserEmail(params.email);
        setUserEmailState(params.email);
      }
      if (params.userId || params.email || params.connected) {
        await loadNewsletters();
      }
    };
    void applyParams();
  }, [params]);

  const toggleNewsletter = async (id: string) => {
    const current = newsletters.find((item) => item.id === id);
    if (!current) {
      return;
    }
    const nextSelected = !current.selected;
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
    }
  };

  const handleConnectPress = async () => {
    setStatusMessage(null);
    try {
      const url = await fetchAuthUrl();
      await Linking.openURL(url);
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
      setStatusMessage(`Sync queued ${result.queued} newsletters.`);
      await loadNewsletters();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to sync Gmail.');
    } finally {
      setIsSyncing(false);
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundOrbs} pointerEvents="none">
        <View style={styles.orbLarge} />
        <View style={styles.orbSmall} />
        <View style={styles.orbHighlight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>Settings</Text>
            <Text style={styles.title}>Newsletter connections</Text>
          </View>
          <View style={styles.iconBadge}>
            <Ionicons name="mail-open-outline" size={20} color={palette.accentShadow} />
          </View>
        </View>

        <View style={styles.connectionCard}>
          <View style={styles.connectionHeader}>
            <View>
              <Text style={styles.cardTitle}>Gmail inbox</Text>
              <Text style={styles.cardSubtitle}>
                Sync newsletters, auto-tag episodes, and keep your sources tidy.
              </Text>
            </View>
            <View style={styles.statusPill}>
              <View style={[styles.statusDot, isConnected ? styles.statusDotOn : null]} />
              <Text style={styles.statusLabel}>{isConnected ? 'Connected' : 'Not connected'}</Text>
            </View>
          </View>

          <View style={styles.connectionBody}>
            {isConnected ? (
              <View style={styles.accountRow}>
                <View style={styles.accountAvatar}>
                  <Text style={styles.accountInitials}>TL</Text>
                </View>
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
                  <Ionicons name="logo-google" size={18} color="#0B1F3A" />
                  <Text style={styles.connectButtonText}>Connect Gmail</Text>
                </TouchableOpacity>
                <Text style={styles.helperText}>
                  We only read newsletters and label them "Podcast Sources".
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select newsletters</Text>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{selectedCount} selected</Text>
          </View>
        </View>

        <View style={styles.listCard}>
          {isLoading ? (
            <Text style={styles.emptyText}>Loading newsletters…</Text>
          ) : newsletters.length === 0 ? (
            <Text style={styles.emptyText}>No newsletters yet. Run a sync to populate.</Text>
          ) : (
            newsletters.map((newsletter) => (
              <View key={newsletter.id} style={styles.listRow}>
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
                  trackColor={{ false: '#E2E8F0', true: palette.accent }}
                  thumbColor={newsletter.selected ? '#ffffff' : '#ffffff'}
                  ios_backgroundColor="#E2E8F0"
                />
              </View>
            ))
          )}
        </View>

        {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

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
          <View style={styles.ruleRow}>
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
    backgroundColor: palette.spotlight,
    top: -60,
    right: -90,
    opacity: 0.7,
  },
  orbSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#FDECCF',
    top: 120,
    left: -60,
    opacity: 0.5,
  },
  orbHighlight: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: palette.glow,
    bottom: -90,
    right: -60,
    opacity: 0.35,
  },
  scrollContent: {
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 90,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    fontFamily: Fonts.sans,
    fontWeight: '700',
    marginTop: 6,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#FFF4E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFE1C1',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    color: palette.primaryText,
    fontSize: 18,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  cardSubtitle: {
    color: '#475569',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.sans,
    marginTop: 6,
    maxWidth: 220,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: palette.pill,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5F5',
  },
  statusDotOn: {
    backgroundColor: '#34D399',
  },
  statusLabel: {
    color: '#475569',
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  connectionBody: {
    borderRadius: 14,
    backgroundColor: '#F8FAFF',
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
    shadowColor: palette.accentShadow,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  connectButtonText: {
    color: palette.deep,
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  helperText: {
    color: '#64748B',
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
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitials: {
    color: '#0F172A',
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
    color: '#64748B',
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  ghostButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#EEF4FF',
  },
  ghostButtonText: {
    color: '#2563EB',
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
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  metaPill: {
    backgroundColor: palette.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  metaText: {
    color: '#475569',
    fontSize: 12,
    fontFamily: Fonts.sans,
  },
  listCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    padding: 16,
    gap: 16,
  },
  emptyText: {
    color: '#64748B',
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
    borderBottomColor: '#F1F5F9',
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
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.sans,
    marginTop: 4,
  },
  cadencePill: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cadenceText: {
    color: '#475569',
    fontSize: 11,
    fontFamily: Fonts.sans,
    letterSpacing: 0.2,
  },
  rulesCard: {
    backgroundColor: palette.card,
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
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  ruleTitle: {
    color: palette.primaryText,
    fontSize: 15,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  ruleSubtitle: {
    color: '#64748B',
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
    backgroundColor: palette.spotlight,
  },
  rulePillText: {
    color: palette.deep,
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  rulePillMuted: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#E0F2FE',
  },
  rulePillTextMuted: {
    color: '#0284C7',
    fontSize: 12,
    fontFamily: Fonts.sans,
    fontWeight: '600',
  },
  statusMessage: {
    marginTop: 12,
    color: '#475569',
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
});
