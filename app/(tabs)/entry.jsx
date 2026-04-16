/**
 * app/(tabs)/entry.jsx — Entry tab
 */
import React, { useCallback, useMemo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInsets } from '../../theme/useInsets';
import { useEntries } from '../../storage/EntriesContext';
import { MIN_ENTRIES_FOR_REPORT } from '../../utils/constants';
import { computeStats } from '../../utils/stats';
import { FONTS, SIZES } from '../../theme/typography';
import t from '../../i18n';
import IMAGES from '../../assets/images';
import ScreenBackground from '../../components/ScreenBackground';


const StatBox = ({ icon, value, label, color = '#4A7BB5' }) => (
  <View
    style={styles.statBox}
    accessible={true}
    accessibilityLabel={`${value} ${label}`}
  >
    <Ionicons name={icon} size={24} color={color} accessibilityElementsHidden={true} importantForAccessibility="no" />
    <Text style={[styles.statValue, { color, fontFamily: FONTS.heading }]}>{value}</Text>
    <Text style={[styles.statLabel, { fontFamily: FONTS.bodyMedium }]}>{label}</Text>
  </View>
);

export default function EntryTab() {
  const router = useRouter();
  const insets = useInsets();
  const { entries, todayStatus, refresh } = useEntries();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const morningCompleted = todayStatus.morningCompleted;
  const eveningCompleted = todayStatus.eveningCompleted;
  const stats            = useMemo(() => computeStats(entries), [entries]);
  const eveningLocked    = !morningCompleted;
  const morningImage = morningCompleted ? IMAGES.morningCompleted : IMAGES.morningPending;
  const eveningImage = eveningLocked ? IMAGES.eveningLocked : eveningCompleted ? IMAGES.eveningCompleted : IMAGES.eveningPending;
  const s = stats ?? {};

  return (
    <View style={styles.root}>
      <ScreenBackground variant="home" />
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>

        <View
          style={styles.streakBanner}
          accessible={true}
          accessibilityLabel={`${t('profile.statStreak')}: ${s?.streak ?? 0} ${t('profile.statStreakUnit')}`}
        >
          <Text style={styles.streakFlame} accessibilityElementsHidden={true} importantForAccessibility="no">🔥</Text>
          <View>
            <Text style={[styles.streakValue, { fontFamily: FONTS.heading }]}>{s?.streak ?? '—'} {t('profile.statStreakUnit')}</Text>
            <Text style={[styles.streakLabel, { fontFamily: FONTS.bodyMedium }]}>{t('profile.statStreak')}</Text>
          </View>
        </View>

        <View style={styles.statRow}>
          <StatBox icon="sunny-outline"    value={s?.morningCount ?? '—'} label={t('profile.statMorning')} color="#E07A20" />
          <StatBox icon="moon-outline"     value={s?.eveningCount ?? '—'} label={t('profile.statEvening')} color="#2A6CB5" />
          <StatBox icon="calendar-outline" value={s?.daysInStudy  ?? '—'} label={t('entry.daysInStudy')}   color="#4A7BB5" />
        </View>

        {s && s.morningCount < MIN_ENTRIES_FOR_REPORT && (
          <View style={styles.statsUnlockHint}>
            <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
            <Text style={[styles.statsUnlockText, { fontFamily: FONTS.bodyMedium }]}>
              {t('entry.statsUnlock', { count: MIN_ENTRIES_FOR_REPORT - s.morningCount })}
            </Text>
          </View>
        )}

        <TouchableOpacity
          onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={morningCompleted ? t('entry.a11y.morningCompleted') : t('entry.a11y.morningStart')}
        >
          <Image source={morningImage} style={styles.cardImage} resizeMode="stretch" accessibilityElementsHidden={true} importantForAccessibility="no" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => !eveningLocked && router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })}
          activeOpacity={eveningLocked ? 1 : 0.9}
          disabled={eveningLocked}
          accessibilityRole="button"
          accessibilityLabel={eveningLocked ? t('entry.a11y.eveningLocked') : eveningCompleted ? t('entry.a11y.eveningCompleted') : t('entry.a11y.eveningStart')}
          accessibilityState={{ disabled: eveningLocked }}
        >
          <Image source={eveningImage} style={styles.cardImage} resizeMode="stretch" accessibilityElementsHidden={true} importantForAccessibility="no" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, gap: 10, paddingBottom: 120, justifyContent: 'flex-end' },
  cardImage: { width: '100%', height: 110, borderRadius: 14 },
  streakBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 16,
    borderWidth: 1.5, borderColor: '#A8C8E8', paddingHorizontal: 20, paddingVertical: 16,
  },
  streakFlame: { fontSize: 36 },
  streakValue: { fontSize: SIZES.sectionTitle, color: '#1A3A5C' },
  streakLabel: { fontSize: SIZES.bodySmall, color: '#94A3B8', marginTop: 2 },
  statRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#A8C8E8', alignItems: 'center', paddingVertical: 14, gap: 6,
  },
  statValue: { fontSize: SIZES.body },
  statLabel: { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center' },
  statsUnlockHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 12,
    borderWidth: 1, borderColor: '#A8C8E8', paddingHorizontal: 14, paddingVertical: 12,
  },
  statsUnlockText: { fontSize: SIZES.bodySmall, color: '#94A3B8', flex: 1 },
});
