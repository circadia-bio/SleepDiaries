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

// ─── Stat helpers ─────────────────────────────────────────────────────────────

const timeToMinutes = (t) => (t ? t.hour * 60 + t.minute : null);
const durationToMinutes = (d) => (d ? d.hours * 60 + d.minutes : 0);

const formatMinutes = (mins) => {
  if (mins === null || isNaN(mins) || mins <= 0) return '—';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const computeStats = (entries) => {
  const morningEntries = entries.filter((e) => e.type === 'morning');
  const eveningEntries = entries.filter((e) => e.type === 'evening');

  // Days in study — from first entry date to today
  const today = new Date().toISOString().split('T')[0];
  const dates = entries.map((e) => e.date).sort();
  const firstDate = dates[0];
  const daysInStudy = firstDate
    ? Math.floor((new Date(today) - new Date(firstDate)) / 86400000) + 1
    : 0;

  // Current streak — consecutive days with a morning entry up to today
  let streak = 0;
  const morningDates = new Set(morningEntries.map((e) => e.date));
  let d = new Date(today);
  while (morningDates.has(d.toISOString().split('T')[0])) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  // Avg sleep time, efficiency
  let totalSleep = [], totalEff = [], totalQuality = [];
  for (const e of morningEntries) {
    const a = e.answers;
    if (!a) continue;
    const sol  = durationToMinutes(a.mq3);
    const waso = durationToMinutes(a.mq5);
    const bed  = timeToMinutes(a.mq1);
    const rise = timeToMinutes(a.mq7);
    if (bed !== null && rise !== null) {
      let tib = rise - bed;
      if (tib < 0) tib += 1440;
      const tst = Math.max(0, tib - sol - waso);
      totalSleep.push(tst);
      if (tib > 0) totalEff.push((tst / tib) * 100);
    }
    if (a.mq11) totalQuality.push(a.mq11);
  }

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  return {
    morningCount: morningEntries.length,
    eveningCount: eveningEntries.length,
    daysInStudy,
    streak,
    avgSleep:     avg(totalSleep),
    avgEff:       avg(totalEff),
    avgQuality:   avg(totalQuality),
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

const CARD_IMAGES = {
  morningPending:   require('../../assets/images/morning_pending.png'),
  morningCompleted: require('../../assets/images/morning_completed.png'),
  eveningLocked:    require('../../assets/images/evening_locked.png'),
  eveningPending:   require('../../assets/images/evening_pending.png'),
  eveningCompleted: require('../../assets/images/evening_completed.png'),
};

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

  const morningImage = morningCompleted ? CARD_IMAGES.morningCompleted : CARD_IMAGES.morningPending;
  const eveningImage = eveningLocked
    ? CARD_IMAGES.eveningLocked
    : eveningCompleted ? CARD_IMAGES.eveningCompleted : CARD_IMAGES.eveningPending;

  const s = stats;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../assets/images/homepage-bg.png')}
        style={StyleSheet.absoluteFill}
        imageStyle={Platform.OS === 'web' ? { width: '100%', height: '100%' } : undefined}
        resizeMode="cover"
      />
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>

        {/* ── Streak banner ── */}
        <View style={styles.streakBanner}>
          <Text style={styles.streakFlame}>🔥</Text>
          <View>
            <Text style={styles.streakValue}>{s?.streak ?? '—'} day{s?.streak !== 1 ? 's' : ''}</Text>
            <Text style={styles.streakLabel}>Current streak</Text>
          </View>
        </View>

        {/* ── Row 1: counts ── */}
        {/* Counts always visible */}
        <View style={styles.statRow}>
          <StatBox icon="sunny-outline"    value={s?.morningCount ?? '—'} label="Morning entries" color="#E07A20" />
          <StatBox icon="moon-outline"     value={s?.eveningCount ?? '—'} label="Evening entries" color="#2A6CB5" />
          <StatBox icon="calendar-outline" value={s?.daysInStudy  ?? '—'} label="Days in study"   color="#4A7BB5" />
        </View>

        {/* Sleep stats unlock hint — shown until MIN_STATS_ENTRIES reached */}
        {s && s.morningCount < MIN_STATS_ENTRIES && (
          <View style={styles.statsUnlockHint}>
            <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" />
            <Text style={styles.statsUnlockText}>
              Sleep stats unlock after {MIN_STATS_ENTRIES} morning entries — {MIN_STATS_ENTRIES - s.morningCount} to go
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

  // Streak banner
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

  // Stat rows
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
