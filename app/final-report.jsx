/**
 * app/final-report.jsx — Sleep metrics summary report
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadEntries, loadName } from '../storage/storage';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

export const MIN_ENTRIES_FOR_REPORT = 14;

const timeToMinutes = (t) => (t ? t.hour * 60 + t.minute : null);
const durationToMinutes = (d) => (d ? d.hours * 60 + d.minutes : 0);
const pad = (n) => String(Math.round(n)).padStart(2, '0');
const formatMinutes = (mins) => { if (mins === null || isNaN(mins)) return '—'; const h = Math.floor(Math.abs(mins) / 60); const m = Math.round(Math.abs(mins) % 60); return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`; };
const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);

const computeMetrics = (morningEntries) => {
  const sd = [], se = [], sol = [], w = [], q = [], r = [], nw = [], al = [], ew = [];
  for (const entry of morningEntries) {
    const a = entry.answers; if (!a) continue;
    const solM = durationToMinutes(a.mq3), wasoM = durationToMinutes(a.mq5);
    sol.push(solM); w.push(wasoM);
    const bt = timeToMinutes(a.mq1), rt = timeToMinutes(a.mq7);
    if (bt !== null && rt !== null) { let tib = rt - bt; if (tib < 0) tib += 1440; const tst = tib - solM - wasoM; sd.push(Math.max(0, tst)); const e = pct(Math.max(0, tst), tib); if (e !== null) se.push(e); }
    if (a.mq11) q.push(a.mq11); if (a.mq12) r.push(a.mq12);
    if (a.mq4 === 'yes' && a.mq4b !== undefined) nw.push(a.mq4b); else if (a.mq4 === 'no') nw.push(0);
    if (a.mq9 !== undefined) al.push(a.mq9); if (a.mq8 !== undefined) ew.push(a.mq8 === 'yes' ? 1 : 0);
  }
  return { n: morningEntries.length, avgSleepDuration: avg(sd), avgSleepEfficiency: avg(se), avgSleepOnsetLatency: avg(sol), avgWASO: avg(w), avgQuality: avg(q), avgRestedness: avg(r), avgNightWakings: avg(nw), avgAlcohol: avg(al), earlyWakingPct: pct(ew.filter(Boolean).length, ew.length) };
};

const MetricCard = ({ icon, label, value, subtext, color = '#4A7BB5' }) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}><Ionicons name={icon} size={24} color={color} /></View>
    <View style={styles.metricText}>
      <Text style={[styles.metricLabel, { fontFamily: FONTS.bodyMedium }]}>{label}</Text>
      <Text style={[styles.metricValue, { color, fontFamily: FONTS.heading }]}>{value}</Text>
      {subtext ? <Text style={[styles.metricSubtext, { fontFamily: FONTS.bodyMedium }]}>{subtext}</Text> : null}
    </View>
  </View>
);

const StarRow = ({ value, max = 5, color = '#E07A20' }) => (
  <View style={styles.starRow}>
    {Array.from({ length: max }).map((_, i) => <Ionicons key={i} name={i < Math.round(value) ? 'star' : 'star-outline'} size={20} color={color} />)}
    <Text style={[styles.starLabel, { color, fontFamily: FONTS.body }]}>{value?.toFixed(1)} / {max}</Text>
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { fontFamily: FONTS.body }]}>{title}</Text>
    {children}
  </View>
);

export default function FinalReportScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const [metrics, setMetrics] = useState(null);
  const [userName, setUserName] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setLoading(true);
      const [allEntries, name] = await Promise.all([loadEntries(), loadName()]);
      const morning = allEntries.filter((e) => e.type === 'morning');
      setUserName(name ?? '');
      if (morning.length > 0) { const dates = morning.map((e) => e.date).sort(); setDateRange(`${dates[0]} → ${dates[dates.length - 1]}`); setMetrics(computeMetrics(morning)); }
      setLoading(false);
    };
    load();
  }, []));

  const handleShare = async () => {
    if (!metrics) return;
    const mn = (k, c) => metrics.n === 1 ? t(`report.morningEntries_one`, { count: c }) : t(`report.morningEntries_other`, { count: c });
    await Share.share({ message: [
      t('report.shareHeader'), `${t('report.shareParticipant')} ${userName}`, `${t('report.sharePeriod')} ${dateRange}`,
      `${t('report.shareEntries')} ${mn('', metrics.n)}`, '',
      `${t('report.shareAvgDuration')} ${formatMinutes(metrics.avgSleepDuration)}`,
      `${t('report.shareAvgEfficiency')} ${metrics.avgSleepEfficiency !== null ? Math.round(metrics.avgSleepEfficiency) + '%' : '—'}`,
      `${t('report.shareAvgSOL')} ${formatMinutes(metrics.avgSleepOnsetLatency)}`,
      `${t('report.shareAvgWASO')} ${formatMinutes(metrics.avgWASO)}`,
      `${t('report.shareAvgWakings')} ${metrics.avgNightWakings !== null ? metrics.avgNightWakings.toFixed(1) : '—'}`,
      `${t('report.shareAvgQuality')} ${metrics.avgQuality !== null ? metrics.avgQuality.toFixed(1) + '/5' : '—'}`,
      `${t('report.shareAvgRestedness')} ${metrics.avgRestedness !== null ? metrics.avgRestedness.toFixed(1) + '/5' : '—'}`,
      `${t('report.shareEarlyWaking')} ${metrics.earlyWakingPct !== null ? metrics.earlyWakingPct + t('report.ofNights') : '—'}`,
    ].join('\n') });
  };

  const entriesLabel = metrics ? (metrics.n === 1 ? t('report.morningEntries_one', { count: metrics.n }) : t('report.morningEntries_other', { count: metrics.n })) : '';

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1E3A5F" /></TouchableOpacity>
        <Text style={[styles.title, { fontFamily: FONTS.heading }]}>{t('report.title')}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn} disabled={!metrics}><Ionicons name="share-outline" size={24} color={metrics ? '#4A7BB5' : '#ccc'} /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centred}><ActivityIndicator size="large" color="#4A7BB5" /></View>
      ) : !metrics ? (
        <View style={styles.centred}>
          <Ionicons name="moon-outline" size={52} color="#B0CCEE" />
          <Text style={[styles.emptyTitle, { fontFamily: FONTS.heading }]}>{t('report.notEnoughTitle')}</Text>
          <Text style={[styles.emptySubtitle, { fontFamily: FONTS.body }]}>{t('report.notEnoughSubtitle', { count: MIN_ENTRIES_FOR_REPORT })}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryName, { fontFamily: FONTS.heading }]}>{userName}</Text>
            <Text style={[styles.summaryRange, { fontFamily: FONTS.bodyMedium }]}>{dateRange}</Text>
            <Text style={[styles.summaryEntries, { fontFamily: FONTS.bodyMedium }]}>{entriesLabel}</Text>
          </View>

          <Section title={t('report.sleepTiming')}>
            <MetricCard icon="time-outline"        label={t('report.avgSleepDuration')}   value={formatMinutes(metrics.avgSleepDuration)}    subtext={t('report.avgSleepDurationSub')}  color="#4A7BB5" />
            <MetricCard icon="speedometer-outline" label={t('report.sleepEfficiency')}     value={metrics.avgSleepEfficiency !== null ? `${Math.round(metrics.avgSleepEfficiency)}%` : '—'} subtext={t('report.sleepEfficiencySub')} color={metrics.avgSleepEfficiency >= 85 ? '#2E7D32' : '#C25E00'} />
            <MetricCard icon="hourglass-outline"   label={t('report.sleepOnsetLatency')}  value={formatMinutes(metrics.avgSleepOnsetLatency)} subtext={t('report.sleepOnsetLatencySub')} color="#4A7BB5" />
            <MetricCard icon="moon-outline"        label={t('report.waso')}               value={formatMinutes(metrics.avgWASO)}              subtext={t('report.wasoSub')}              color="#4A7BB5" />
          </Section>

          <Section title={t('report.sleepQuality')}>
            <View style={styles.qualityCard}>
              <Text style={[styles.qualityLabel, { fontFamily: FONTS.bodyMedium }]}>{t('report.nightQuality')}</Text>
              {metrics.avgQuality !== null ? <StarRow value={metrics.avgQuality} color="#E07A20" /> : <Text style={styles.metricValue}>—</Text>}
            </View>
            <View style={[styles.qualityCard, { marginTop: 10 }]}>
              <Text style={[styles.qualityLabel, { fontFamily: FONTS.bodyMedium }]}>{t('report.morningRestedness')}</Text>
              {metrics.avgRestedness !== null ? <StarRow value={metrics.avgRestedness} color="#2A6CB5" /> : <Text style={styles.metricValue}>—</Text>}
            </View>
          </Section>

          <Section title={t('report.nightDisruptions')}>
            <MetricCard icon="alert-circle-outline" label={t('report.avgNightWakings')} value={metrics.avgNightWakings !== null ? `${metrics.avgNightWakings.toFixed(1)} ${t('report.times')}` : '—'} subtext={t('report.avgNightWakingsSub')} color="#4A7BB5" />
            <MetricCard icon="alarm-outline"        label={t('report.earlyWaking')}     value={metrics.earlyWakingPct !== null ? `${metrics.earlyWakingPct}${t('report.ofNights')}` : '—'}          subtext={t('report.earlyWakingSub')}     color="#4A7BB5" />
          </Section>

          <Section title={t('report.lifestyle')}>
            <MetricCard icon="wine-outline" label={t('report.avgAlcohol')} value={metrics.avgAlcohol !== null ? `${metrics.avgAlcohol.toFixed(1)} ${t('report.drinksNight')}` : '—'} subtext={t('report.avgAlcoholSub')} color="#4A7BB5" />
          </Section>

          <Text style={[styles.disclaimer, { fontFamily: FONTS.bodyMedium }]}>{t('report.disclaimer')}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#EEF5FF' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#B0CCEE', backgroundColor: '#EEF5FF' },
  backBtn:  { padding: 4 }, shareBtn: { padding: 4 },
  title:    { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  centred:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12, paddingTop: 80 },
  emptyTitle:    { fontSize: SIZES.cardTitle, color: '#4A7BB5', textAlign: 'center' },
  emptySubtitle: { fontSize: SIZES.body, color: '#94A3B8', textAlign: 'center', lineHeight: 26 },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 40 },
  summaryCard:    { backgroundColor: '#4A7BB5', borderRadius: 16, padding: 20, alignItems: 'center', gap: 4 },
  summaryName:    { fontSize: SIZES.sectionTitle, color: '#fff' },
  summaryRange:   { fontSize: SIZES.bodySmall, color: 'rgba(255,255,255,0.85)' },
  summaryEntries: { fontSize: SIZES.bodySmall, color: 'rgba(255,255,255,0.75)' },
  section:        { gap: 10 },
  sectionTitle:   { fontSize: SIZES.label, color: '#E07A20', textTransform: 'uppercase', letterSpacing: 0.8 },
  metricCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', padding: 16 },
  metricIcon:    { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricText:    { flex: 1, gap: 3 },
  metricLabel:   { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  metricValue:   { fontSize: SIZES.sectionTitle, color: '#1E3A5F' },
  metricSubtext: { fontSize: SIZES.caption, color: '#B0CCEE' },
  qualityCard:  { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', padding: 16, gap: 10 },
  qualityLabel: { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starLabel:    { fontSize: SIZES.body, marginLeft: 6 },
  disclaimer:   { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginTop: 8 },
});
