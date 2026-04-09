/**
 * app/final-report.jsx — Sleep metrics summary report
 *
 * Unlocks after MIN_ENTRIES_FOR_REPORT (14) morning entries have been saved.
 * Computes the following metrics from all morning entry answers:
 *
 *   • Total sleep time (TST)        — time in bed − SOL − WASO
 *   • Sleep efficiency              — TST ÷ time in bed × 100%
 *   • Sleep onset latency (SOL)     — time to fall asleep
 *   • Wake after sleep onset (WASO) — time awake during the night
 *   • Sleep quality & restedness    — average 1–5 ratings
 *   • Night wakings                 — average count per night
 *   • Early waking                  — % of nights woken before planned
 *   • Alcohol intake                — average drinks reported the evening before
 *
 * The report can be shared as plain text via the native share sheet.
 * MIN_ENTRIES_FOR_REPORT is exported so home.jsx can show the unlock hint.
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Share,
  useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadEntries, loadName } from '../storage/storage';
import t from '../i18n';

// ─── Minimum entries needed to unlock ─────────────────────────────────────────
export const MIN_ENTRIES_FOR_REPORT = 14;

// ─── Time helpers ─────────────────────────────────────────────────────────────
const timeToMinutes = (t) => (t ? t.hour * 60 + t.minute : null);
const durationToMinutes = (d) => (d ? d.hours * 60 + d.minutes : 0);
const pad = (n) => String(Math.round(n)).padStart(2, '0');

const formatMinutes = (mins) => {
  if (mins === null || isNaN(mins)) return '—';
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.round(Math.abs(mins) % 60);
  return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`;
};

const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);

// ─── Compute sleep metrics from morning entries ───────────────────────────────
const computeMetrics = (morningEntries) => {
  const sleepDurations    = [];
  const sleepEfficiency   = [];
  const sleepOnsetLatency = [];
  const waso              = [];
  const qualityRatings    = [];
  const restednessRatings = [];
  const nightWakingCount  = [];
  const alcoholDrinks     = [];
  const earlyWaking       = [];

  for (const entry of morningEntries) {
    const a = entry.answers;
    if (!a) continue;

    const sol      = durationToMinutes(a.mq3);
    const wasoMins = durationToMinutes(a.mq5);
    sleepOnsetLatency.push(sol);
    waso.push(wasoMins);

    const bedTime  = timeToMinutes(a.mq1);
    const riseTime = timeToMinutes(a.mq7);
    if (bedTime !== null && riseTime !== null) {
      let tib = riseTime - bedTime;
      if (tib < 0) tib += 24 * 60;
      const tst = tib - sol - wasoMins;
      sleepDurations.push(Math.max(0, tst));
      const eff = pct(Math.max(0, tst), tib);
      if (eff !== null) sleepEfficiency.push(eff);
    }

    if (a.mq11) qualityRatings.push(a.mq11);
    if (a.mq12) restednessRatings.push(a.mq12);

    if (a.mq4 === 'yes' && a.mq4b !== undefined) nightWakingCount.push(a.mq4b);
    else if (a.mq4 === 'no') nightWakingCount.push(0);

    if (a.mq9 !== undefined) alcoholDrinks.push(a.mq9);
    if (a.mq8 !== undefined) earlyWaking.push(a.mq8 === 'yes' ? 1 : 0);
  }

  return {
    n: morningEntries.length,
    avgSleepDuration:     avg(sleepDurations),
    avgSleepEfficiency:   avg(sleepEfficiency),
    avgSleepOnsetLatency: avg(sleepOnsetLatency),
    avgWASO:              avg(waso),
    avgQuality:           avg(qualityRatings),
    avgRestedness:        avg(restednessRatings),
    avgNightWakings:      avg(nightWakingCount),
    avgAlcohol:           avg(alcoholDrinks),
    earlyWakingPct:       pct(earlyWaking.filter(Boolean).length, earlyWaking.length),
  };
};

// ─── Metric card ──────────────────────────────────────────────────────────────
const MetricCard = ({ icon, label, value, subtext, color = '#4A7BB5' }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={styles.metricText}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtext ? <Text style={styles.metricSubtext}>{subtext}</Text> : null}
    </View>
  </View>
);

// ─── Star rating display ──────────────────────────────────────────────────────
const StarRow = ({ value, max = 5, color = '#E07A20' }) => (
  <View style={styles.starRow}>
    {Array.from({ length: max }).map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.round(value) ? 'star' : 'star-outline'}
        size={18}
        color={color}
      />
    ))}
    <Text style={[styles.starLabel, { color }]}>{value?.toFixed(1)} / {max}</Text>
  </View>
);

// ─── Section header ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

// ─── Main FinalReportScreen ───────────────────────────────────────────────────
export default function FinalReportScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const [metrics, setMetrics]     = useState(null);
  const [userName, setUserName]   = useState('');
  const [dateRange, setDateRange] = useState('');
  const [loading, setLoading]     = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        const [allEntries, name] = await Promise.all([loadEntries(), loadName()]);
        const morning = allEntries.filter((e) => e.type === 'morning');
        setUserName(name ?? '');
        if (morning.length > 0) {
          const dates = morning.map((e) => e.date).sort();
          setDateRange(`${dates[0]} → ${dates[dates.length - 1]}`);
          setMetrics(computeMetrics(morning));
        }
        setLoading(false);
      };
      load();
    }, [])
  );

  const handleShare = async () => {
    if (!metrics) return;
    const lines = [
      t('report.shareHeader'),
      `${t('report.shareParticipant')} ${userName}`,
      `${t('report.sharePeriod')} ${dateRange}`,
      `${t('report.shareEntries')} ${metrics.n === 1 ? t('report.morningEntries_one', { count: metrics.n }) : t('report.morningEntries_other', { count: metrics.n })}`,
      '',
      `${t('report.shareAvgDuration')} ${formatMinutes(metrics.avgSleepDuration)}`,
      `${t('report.shareAvgEfficiency')} ${metrics.avgSleepEfficiency !== null ? Math.round(metrics.avgSleepEfficiency) + '%' : '—'}`,
      `${t('report.shareAvgSOL')} ${formatMinutes(metrics.avgSleepOnsetLatency)}`,
      `${t('report.shareAvgWASO')} ${formatMinutes(metrics.avgWASO)}`,
      `${t('report.shareAvgWakings')} ${metrics.avgNightWakings !== null ? metrics.avgNightWakings.toFixed(1) : '—'}`,
      `${t('report.shareAvgQuality')} ${metrics.avgQuality !== null ? metrics.avgQuality.toFixed(1) + '/5' : '—'}`,
      `${t('report.shareAvgRestedness')} ${metrics.avgRestedness !== null ? metrics.avgRestedness.toFixed(1) + '/5' : '—'}`,
      `${t('report.shareEarlyWaking')} ${metrics.earlyWakingPct !== null ? metrics.earlyWakingPct + t('report.ofNights') : '—'}`,
    ];
    await Share.share({ message: lines.join('\n') });
  };

  const entriesLabel = metrics
    ? (metrics.n === 1
        ? t('report.morningEntries_one',   { count: metrics.n })
        : t('report.morningEntries_other', { count: metrics.n }))
    : '';

  return (
    <View style={[styles.root, { minHeight: height }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('report.title')}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn} disabled={!metrics}>
          <Ionicons name="share-outline" size={22} color={metrics ? '#4A7BB5' : '#ccc'} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centred}>
          <ActivityIndicator size="large" color="#4A7BB5" />
        </View>
      ) : !metrics ? (
        <View style={styles.centred}>
          <Ionicons name="moon-outline" size={48} color="#B0CCEE" />
          <Text style={styles.emptyTitle}>{t('report.notEnoughTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('report.notEnoughSubtitle', { count: MIN_ENTRIES_FOR_REPORT })}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Summary header */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryName}>{userName}</Text>
            <Text style={styles.summaryRange}>{dateRange}</Text>
            <Text style={styles.summaryEntries}>{entriesLabel}</Text>
          </View>

          {/* Sleep timing */}
          <Section title={t('report.sleepTiming')}>
            <MetricCard
              icon="time-outline"
              label={t('report.avgSleepDuration')}
              value={formatMinutes(metrics.avgSleepDuration)}
              subtext={t('report.avgSleepDurationSub')}
              color="#4A7BB5"
            />
            <MetricCard
              icon="speedometer-outline"
              label={t('report.sleepEfficiency')}
              value={metrics.avgSleepEfficiency !== null ? `${Math.round(metrics.avgSleepEfficiency)}%` : '—'}
              subtext={t('report.sleepEfficiencySub')}
              color={metrics.avgSleepEfficiency >= 85 ? '#2E7D32' : '#C25E00'}
            />
            <MetricCard
              icon="hourglass-outline"
              label={t('report.sleepOnsetLatency')}
              value={formatMinutes(metrics.avgSleepOnsetLatency)}
              subtext={t('report.sleepOnsetLatencySub')}
              color="#4A7BB5"
            />
            <MetricCard
              icon="moon-outline"
              label={t('report.waso')}
              value={formatMinutes(metrics.avgWASO)}
              subtext={t('report.wasoSub')}
              color="#4A7BB5"
            />
          </Section>

          {/* Sleep quality */}
          <Section title={t('report.sleepQuality')}>
            <View style={styles.qualityCard}>
              <Text style={styles.qualityLabel}>{t('report.nightQuality')}</Text>
              {metrics.avgQuality !== null
                ? <StarRow value={metrics.avgQuality} color="#E07A20" />
                : <Text style={styles.metricValue}>—</Text>}
            </View>
            <View style={[styles.qualityCard, { marginTop: 10 }]}>
              <Text style={styles.qualityLabel}>{t('report.morningRestedness')}</Text>
              {metrics.avgRestedness !== null
                ? <StarRow value={metrics.avgRestedness} color="#2A6CB5" />
                : <Text style={styles.metricValue}>—</Text>}
            </View>
          </Section>

          {/* Night disruptions */}
          <Section title={t('report.nightDisruptions')}>
            <MetricCard
              icon="alert-circle-outline"
              label={t('report.avgNightWakings')}
              value={metrics.avgNightWakings !== null ? `${metrics.avgNightWakings.toFixed(1)} ${t('report.times')}` : '—'}
              subtext={t('report.avgNightWakingsSub')}
              color="#4A7BB5"
            />
            <MetricCard
              icon="alarm-outline"
              label={t('report.earlyWaking')}
              value={metrics.earlyWakingPct !== null ? `${metrics.earlyWakingPct}${t('report.ofNights')}` : '—'}
              subtext={t('report.earlyWakingSub')}
              color="#4A7BB5"
            />
          </Section>

          {/* Lifestyle */}
          <Section title={t('report.lifestyle')}>
            <MetricCard
              icon="wine-outline"
              label={t('report.avgAlcohol')}
              value={metrics.avgAlcohol !== null ? `${metrics.avgAlcohol.toFixed(1)} ${t('report.drinksNight')}` : '—'}
              subtext={t('report.avgAlcoholSub')}
              color="#4A7BB5"
            />
          </Section>

          <Text style={styles.disclaimer}>{t('report.disclaimer')}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#EEF5FF' },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#B0CCEE',
    backgroundColor: '#EEF5FF',
  },
  backBtn:  { padding: 4 },
  shareBtn: { padding: 4 },
  title:    { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },

  centred: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 12, paddingTop: 80,
  },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#4A7BB5', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },

  scrollContent: { padding: 16, gap: 20, paddingBottom: 40 },

  summaryCard: {
    backgroundColor: '#4A7BB5', borderRadius: 16, padding: 20, alignItems: 'center', gap: 4,
  },
  summaryName:    { fontSize: 22, fontWeight: '800', color: '#fff' },
  summaryRange:   { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  summaryEntries: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  section:      { gap: 10 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#E07A20', textTransform: 'uppercase', letterSpacing: 0.8 },

  metricCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5,
    borderColor: '#B0CCEE', padding: 14,
  },
  metricIcon:    { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  metricText:    { flex: 1, gap: 2 },
  metricLabel:   { fontSize: 13, color: '#94A3B8' },
  metricValue:   { fontSize: 20, fontWeight: '800', color: '#1E3A5F' },
  metricSubtext: { fontSize: 11, color: '#B0CCEE' },

  qualityCard: {
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5,
    borderColor: '#B0CCEE', padding: 16, gap: 8,
  },
  qualityLabel: { fontSize: 13, color: '#94A3B8' },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starLabel:    { fontSize: 16, fontWeight: '700', marginLeft: 6 },

  disclaimer: {
    fontSize: 11, color: '#94A3B8', textAlign: 'center',
    lineHeight: 16, paddingHorizontal: 8, marginTop: 8,
  },
});
