import Ionicons from '@expo/vector-icons/Ionicons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Fonts } from '@/constants/theme';
import { listNewsletters, syncGmail, updateNewsletterSelection } from '@/data/backend';
import { setOnboardingStep } from '@/data/session';
import { usePalette } from '@/hooks/use-palette';

const MAX_NEWSLETTERS_PER_USER = 10;

type Newsletter = {
  id: string;
  name: string;
  sender: string;
  selected: boolean;
};

export default function NewsletterSelectScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = usePalette();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);

  const selectedCount = useMemo(
    () => newsletters.filter((newsletter) => newsletter.selected).length,
    [newsletters]
  );

  const loadNewsletters = async () => {
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
      setIsLoading(true);
      setStatusMessage(null);
      try {
        await syncGmail();
        await loadNewsletters();
      } catch (error) {
        setStatusMessage(error instanceof Error ? error.message : 'Unable to sync Gmail.');
        setIsLoading(false);
      }
    };
    void boot();
  }, []);

  const toggleNewsletter = async (id: string) => {
    if (updatingIds.includes(id)) {
      return;
    }
    const current = newsletters.find((item) => item.id === id);
    if (!current) {
      return;
    }
    if (!current.selected && selectedCount >= MAX_NEWSLETTERS_PER_USER) {
      setStatusMessage(`You can only select up to ${MAX_NEWSLETTERS_PER_USER} newsletters.`);
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

  const handleContinue = async () => {
    if (selectedCount === 0) {
      setStatusMessage('Pick at least one newsletter to continue.');
      return;
    }
    await setOnboardingStep('voice');
    router.push('/onboarding/voice');
  };

  const styles = useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    backgroundGlow: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.glow,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingBottom: 32,
    },
    hero: {
      marginBottom: 18,
    },
    kicker: {
      fontSize: 12,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      color: palette.secondaryText,
      fontFamily: Fonts.rounded,
      marginBottom: 8,
    },
    title: {
      fontSize: 26,
      color: palette.primaryText,
      fontFamily: Fonts.serif,
      marginBottom: 6,
    },
    subtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    selectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    selectionTitle: {
      fontSize: 15,
      fontFamily: Fonts.rounded,
      color: palette.primaryText,
    },
    metaPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.border,
    },
    metaText: {
      fontSize: 12,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    loadingCard: {
      backgroundColor: palette.card,
      borderRadius: 18,
      padding: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: palette.border,
      marginBottom: 18,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 13,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    list: {
      gap: 12,
      marginBottom: 18,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: palette.surface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: palette.border,
    },
    listItemSelected: {
      borderColor: palette.accent,
      shadowColor: palette.accentDark,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    listText: {
      flex: 1,
      marginRight: 12,
    },
    listTitle: {
      fontSize: 15,
      fontFamily: Fonts.rounded,
      color: palette.primaryText,
      marginBottom: 4,
    },
    listSubtitle: {
      fontSize: 12,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: palette.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
    },
    checkboxSelected: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
    },
    statusText: {
      fontSize: 13,
      color: palette.secondaryText,
      fontFamily: Fonts.sans,
      marginBottom: 12,
    },
    primaryButton: {
      backgroundColor: palette.accent,
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      opacity: 0.6,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontFamily: Fonts.rounded,
    },
  }), [palette]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <View style={styles.backgroundGlow} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.kicker}>Step 1</Text>
          <Text style={styles.title}>Choose newsletters</Text>
          <Text style={styles.subtitle}>
            Select the senders you want to hear in your daily briefing.
          </Text>
        </View>

        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Available sources</Text>
          <View style={styles.metaPill}>
            <Text style={styles.metaText}>{selectedCount}/{MAX_NEWSLETTERS_PER_USER} selected</Text>
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={palette.accent} />
            <Text style={styles.loadingText}>Scanning your inbox…</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {newsletters.map((newsletter) => {
              const isSelected = newsletter.selected;
              return (
                <TouchableOpacity
                  key={newsletter.id}
                  style={[styles.listItem, isSelected ? styles.listItemSelected : null]}
                  onPress={() => toggleNewsletter(newsletter.id)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                >
                  <View style={styles.listText}>
                    <Text style={styles.listTitle}>{newsletter.name}</Text>
                    <Text style={styles.listSubtitle}>{newsletter.sender}</Text>
                  </View>
                  <View
                    style={[styles.checkbox, isSelected ? styles.checkboxSelected : null]}
                  >
                    {isSelected ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {statusMessage ? <Text style={styles.statusText}>{statusMessage}</Text> : null}

        <TouchableOpacity
          style={[styles.primaryButton, selectedCount === 0 ? styles.primaryButtonDisabled : null]}
          onPress={handleContinue}
          disabled={selectedCount === 0}
          accessibilityRole="button"
        >
          <Text style={styles.primaryButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
