import Ionicons from '@expo/vector-icons/Ionicons';
import * as ExpoLinking from 'expo-linking';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/constants/theme';
import { fetchAuthUrl, listNewsletters, syncGmail, updateNewsletterSelection } from '@/data/backend';
import { PaperLoader } from '@/components/PaperLoader';
import { getAuthToken } from '@/data/session';
import { usePalette } from '@/hooks/use-palette';

const MAX_NEWSLETTERS_PER_USER = 10;

type Newsletter = {
  id: string;
  name: string;
  sender: string;
  selected: boolean;
};

export default function NewslettersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();

  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const selectedCount = useMemo(
    () => newsletters.filter((n) => n.selected).length,
    [newsletters]
  );

  const load = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const storedToken = await getAuthToken();
      if (storedToken) setIsConnected(true);
      const data = await listNewsletters();
      setNewsletters(data);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to load newsletters.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const toggleNewsletter = async (id: string) => {
    if (updatingIds.includes(id)) return;
    const current = newsletters.find((n) => n.id === id);
    if (!current) return;
    if (!current.selected && selectedCount >= MAX_NEWSLETTERS_PER_USER) {
      setStatusMessage(`You can only select up to ${MAX_NEWSLETTERS_PER_USER} newsletters.`);
      return;
    }
    const nextSelected = !current.selected;
    setUpdatingIds((prev) => [...prev, id]);
    setNewsletters((prev) =>
      prev.map((n) => (n.id === id ? { ...n, selected: nextSelected } : n))
    );
    try {
      await updateNewsletterSelection(id, nextSelected);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to update selection.');
      setNewsletters((prev) =>
        prev.map((n) => (n.id === id ? { ...n, selected: current.selected } : n))
      );
    } finally {
      setUpdatingIds((prev) => prev.filter((entry) => entry !== id));
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const result = await syncGmail();
      setStatusMessage(`Discovered ${result.discovered} newsletters.`);
      await load();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to sync Gmail.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = async () => {
    setStatusMessage(null);
    try {
      const redirectUrl = ExpoLinking.createURL('/settings');
      const url = await fetchAuthUrl(redirectUrl);
      await ExpoLinking.openURL(url);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Unable to start Gmail auth.');
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingBottom: 16,
      backgroundColor: palette.card,
      marginBottom: 8,
    },
    backButton: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: palette.primaryText,
      fontSize: 20,
      fontFamily: Fonts.serif,
      letterSpacing: 0.4,
    },
    headerSpacer: {
      width: 36,
    },
    scrollContent: {
      paddingHorizontal: 22,
      paddingBottom: 48,
      paddingTop: 16,
    },
    syncButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: palette.border,
      backgroundColor: palette.card,
      marginBottom: 16,
    },
    syncButtonText: {
      color: palette.accentDark,
      fontSize: 14,
      fontFamily: Fonts.sans,
      fontWeight: '600',
    },
    connectButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: palette.accent,
      marginBottom: 16,
    },
    connectButtonText: {
      color: '#fff',
      fontSize: 14,
      fontFamily: Fonts.sans,
      fontWeight: '600',
    },
    statusMessage: {
      color: palette.secondaryText,
      fontSize: 13,
      fontFamily: Fonts.sans,
      marginBottom: 16,
      textAlign: 'center',
    },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
      marginHorizontal: 4,
    },
    sectionLabel: {
      color: palette.secondaryText,
      fontSize: 11,
      fontFamily: Fonts.sans,
      fontWeight: '600',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    countLabel: {
      color: palette.secondaryText,
      fontSize: 12,
      fontFamily: Fonts.sans,
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 20,
    },
    emptyCard: {
      backgroundColor: palette.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      padding: 20,
    },
    emptyText: {
      color: palette.secondaryText,
      fontSize: 14,
      fontFamily: Fonts.sans,
      lineHeight: 20,
    },
    listCard: {
      backgroundColor: palette.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 14,
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
    listSender: {
      color: palette.secondaryText,
      fontSize: 12,
      fontFamily: Fonts.sans,
      marginTop: 2,
    },
  }), [palette]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={25} color={palette.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Sources</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gmail connection row */}
        {isConnected ? (
          <TouchableOpacity
            style={styles.syncButton}
            activeOpacity={0.85}
            onPress={handleSync}
            disabled={isSyncing}
          >
            <Ionicons name="refresh-outline" size={16} color={palette.accentDark} />
            <Text style={styles.syncButtonText}>{isSyncing ? 'Scanning inbox...' : 'Scan for new newsletters'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.connectButton} activeOpacity={0.85} onPress={handleConnect}>
            <Ionicons name="logo-google" size={16} color="#fff" />
            <Text style={styles.connectButtonText}>Connect Gmail</Text>
          </TouchableOpacity>
        )}

        {statusMessage ? <Text style={styles.statusMessage}>{statusMessage}</Text> : null}

        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Newsletters</Text>
          <Text style={styles.countLabel}>{selectedCount}/{MAX_NEWSLETTERS_PER_USER} selected</Text>
        </View>

        {isLoading ? (
          <View style={{ height: 160 }}>
            <PaperLoader />
          </View>
        ) : newsletters.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No newsletters found. Tap "Scan" to discover newsletters from your inbox.</Text>
          </View>
        ) : (
          <View style={styles.listCard}>
            {newsletters.map((newsletter, index) => (
              <View
                key={newsletter.id}
                style={[
                  styles.listRow,
                  index === newsletters.length - 1 ? styles.listRowLast : null,
                ]}
              >
                <View style={styles.listInfo}>
                  <Text style={styles.listTitle}>{newsletter.name}</Text>
                  <Text style={styles.listSender}>{newsletter.sender}</Text>
                </View>
                <Switch
                  value={newsletter.selected}
                  onValueChange={() => toggleNewsletter(newsletter.id)}
                  trackColor={{ false: palette.border, true: palette.accent }}
                  thumbColor="#ffffff"
                  ios_backgroundColor={palette.border}
                  disabled={updatingIds.includes(newsletter.id) || !isConnected}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
