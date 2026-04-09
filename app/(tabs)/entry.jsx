/**
 * app/(tabs)/entry.jsx — Entry tab
 *
 * Shows a stats dashboard above the entry cards:
 *   - Current streak (full-width banner)
 *   - Row: Morning entries | Evening entries | Days in study
 * Then the morning and evening entry cards below.
 * Stats unlock after MIN_STATS_ENTRIES (14) morning entries.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, ImageBackground } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInsets } from '../../theme/useInsets';
import { loadTodayStatus, loadEntries } from '../../storage/storage';
import { FONTS } from '../../theme/typography';
import t from '../../i18n';
import IMAGES from '../../assets/images';

// ─── Stat helpers ─────────────────────────────────────────────────────────────

const computeStats = (entries) => {
  const morningEntries = entries.filter((e) => e.type === 'morning');
  const eveningEntries = entries.filter((e) => e.type === 'evening');

  const today = new Date().toISOString().split('T')[0];
  const dates = entries.map((e) => e.date).sort();
  const firstDate = dates[0];
  const daysInStudy = firstDate
    ? Math.floor((new Date(today) - new Date(firstDate)) / 86400000) + 1
    : 0;

  let streak = 0;
  const morningDates = new Set(morningEntries.map((e) => e.date));
  let d = new Date(today);
  while (morningDates.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return {
    morningCount: morningEntries.length,
    eveningCount: eveningEntries.length,
    daysInStudy,
    streak,
  };
};

// ─── Stat box component ───────────────────────────────────────────────────────
const MIN_STATS_ENTRIES = 14;

const StatBox = ({ icon, value, label, color = '#4A7BB5' }) => (
  <View style={styles.statBox}>
    <Ionicons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default function EntryTab() {
  const router = useRouter();
  const insets = useInsets();
  const [morningCompleted, setMorningCompleted] = useState(false);
  const [eveningCompleted, setEveningCompleted] = useState(false);
  const [stats, setStats] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [status, entries] = await Promise.all([loadTodayStatus(), loadEntries()]);
        setMorningCompleted(status.morningCompleted);
        setEveningCompleted(status.eveningCompleted);
        setStats(computeStats(entries));
      };
      load();
    }, [])
  );

  const eveningLocked = !morningCompleted;

  const morningImage = morningCompleted ? IMAGES.morningCompleted : IMAGES.morningPending;
  const eveningImage = eveningLocked
    ? IMAGES.eveningLocked
    : eveningCompleted ? IMAGES.eveningCompleted : IMAGES.eveningPending;

  const s = stats;
  const streakUnit = t('profile.statStreakUnit');

  return (
    <View style={styles.root}>
      <ImageBackground
        source={IMAGES.homepageBg}
        style={StyleSheet.absoluteFill}
        imageStyle={Platform.OS === 'web' ? { width: '100%', height: '100%' } : undefined}
        resizeMode="cover"
      />
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>

        {/* ── Streak banner ── */}
        <View style={styles.streakBanner}>
          <Text style={styles.streakFlame}>🔥</Text>
          <View>
            <Text style={styles.streakValue}>{s?.streak ?? '—'} {streakUnit}</Text>
            <Text style={styles.streakLabel}>{t('profile.statStreak')}</Text>
          </View>
        </View>

        {/* ── Row: counts ── */}
        <View style={styles.statRow}>
          <StatBox icon="sunny-outline"    value={s?.morningCount ?? '—'} label={t('profile.statMorning')} color="#E07A20" />
          <StatBox icon="moon-outline"     value={s?.eveningCount ?? '—'} label={t('profile.statEvening')} color="#2A6CB5" />
          <StatBox icon="calendar-outline" value={s?.daysInStudy  ?? '—'} label={t('entry.daysInStudy')}   color="#4A7BB5" />
        </View>

        {/* Sleep stats unlock hint */}
        {s && s.morningCount < MIN_STATS_ENTRIES && (
          <View style={styles.statsUnlockHint}>
            <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
            <Text style={styles.statsUnlockText}>
              {t('entry.statsUnlock', { count: MIN_STATS_ENTRIES - s.morningCount })}
            </Text>
          </View>
        )}

        {/* ── Entry cards ── */}
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })}
          activeOpacity={0.9}
        >
          <Image source={morningImage} style={styles.cardImage} resizeMode="stretch" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !eveningLocked && router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })}
          activeOpacity={eveningLocked ? 1 : 0.9}
          disabled={eveningLocked}
        >
          <Image source={eveningImage} style={styles.cardImage} resizeMode="stretch" />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#A8C8E8',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  streakFlame: { fontSize: 32 },
  streakValue: { fontSize: 22, fontWeight: '800', color: '#1A3A5C' },
  streakLabel: { fontSize: 12, color: '#94A3B8', marginTop: 1 },

  statRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#A8C8E8',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 5,
  },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#94A3B8', textAlign: 'center' },

  statsUnlockHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12, borderWidth: 1, borderColor: '#A8C8E8',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  statsUnlockText: { fontSize: 12, color: '#94A3B8', flex: 1 },
});
