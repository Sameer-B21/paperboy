import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { briefs } from '@/data/briefs';

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
          <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} accessibilityRole="button">
            <Ionicons name="bookmark-outline" size={22} color={palette.secondaryText} />
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
            <Text style={styles.metaText}>{briefs.length} saved</Text>
          </View>
        </View>
        

          
        {briefs && briefs.map((brief) => (
          <Link
            key={brief.id}
            href={{ pathname: '/briefs/[id]', params: { id: brief.id } }}
            asChild
          >
            <TouchableOpacity
              style={styles.briefCard}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <View style={styles.briefHeader}>
                <Text style={styles.briefDate}>{brief.dateLabel}</Text>
                <Ionicons name="chevron-forward" size={18} color={palette.secondaryText} />
              </View>
              <Text style={styles.briefTitle}>{brief.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{brief.duration}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{brief.intensity}</Text>
                </View>
                <View style={styles.metaPill}>
                  <Text style={styles.metaText}>{brief.voice}</Text>
                </View>
              </View>
              <Text style={styles.briefSummary}>{brief.summary}</Text>
            </TouchableOpacity>
          </Link>
        ))}
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
  briefCard: {
    backgroundColor: palette.card,
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: palette.border,
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  briefDate: {
    color: palette.secondaryText,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  briefTitle: {
    color: palette.primaryText,
    fontSize: 20,
    fontFamily: Fonts.sans,
    fontWeight: '600',
    marginBottom: 10,
  },
  briefSummary: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: Fonts.sans,
  },
});
