/**
 * app/final-report.jsx — Sleep metrics summary report
 */
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadAllQuestionnaires } from '../storage/storage';
import { useEntries } from '../storage/EntriesContext';
import { QUESTIONNAIRES } from '../data/questionnaires';
import { FONTS, SIZES } from '../theme/typography';
import t, { locale } from '../i18n';

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

const MetricCard = ({ icon, label, value, subtext, color = '#4A7BB5', statusLabel }) => (
  <View
    style={styles.metricCard}
    accessible={true}
    accessibilityLabel={[label, value, statusLabel, subtext].filter(Boolean).join(', ')}
  >
    <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}><Ionicons name={icon} size={24} color={color} accessibilityElementsHidden={true} importantForAccessibility="no" /></View>
    <View style={styles.metricText}>
      <Text style={[styles.metricLabel, { fontFamily: FONTS.bodyMedium }]}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, { color, fontFamily: FONTS.heading }]}>{value}</Text>
        {statusLabel ? <Text style={[styles.metricStatusLabel, { color, fontFamily: FONTS.bodyMedium }]}>{statusLabel}</Text> : null}
      </View>
      {subtext ? <Text style={[styles.metricSubtext, { fontFamily: FONTS.bodyMedium }]}>{subtext}</Text> : null}
    </View>
  </View>
);

// ─── Questionnaire scale bar ─────────────────────────────────────────────────
// Renders a horizontal bar showing the score's position across interpretation
// bands. Works for any instrument by inferring bands from the interpret function
// at a set of evenly-spaced probe values.
const PROBE_COUNTS = 40;

const buildBands = (questionnaire) => {
  const score = questionnaire.score;
  const interpret = questionnaire.interpret;
  // For numeric scores: find min and max from items
  // We probe 0..maxScore to collect interpretation bands
  let maxScore = 0;
  try {
    // Build a full-answer object with maximum values
    const maxAnswers = {};
    for (const item of questionnaire.items) {
      if (item.options) {
        maxAnswers[item.id] = Math.max(...item.options.map((o) => o.value));
      } else if (item.type === 'number' || item.type === 'duration_min') {
        maxAnswers[item.id] = item.max ?? 10;
      } else if (item.type === 'scale_0_10') {
        maxAnswers[item.id] = 10;
      } else if (item.type === 'yes_no') {
        maxAnswers[item.id] = 'yes';
      }
    }
    const s = score(maxAnswers);
    if (typeof s === 'number') maxScore = s;
    else return null; // object score (MCTQ) — skip bar
  } catch (_) { return null; }
  if (maxScore <= 0) return null;

  const bands = [];
  let lastLabel = null;
  let bandStart = 0;
  for (let i = 0; i <= PROBE_COUNTS; i++) {
    const probeScore = (i / PROBE_COUNTS) * maxScore;
    const interp = interpret(probeScore);
    if (interp.label !== lastLabel) {
      if (lastLabel !== null) bands.push({ label: lastLabel, end: i / PROBE_COUNTS });
      lastLabel = interp.label;
      bandStart = i / PROBE_COUNTS;
    }
  }
  if (lastLabel) bands.push({ label: lastLabel, end: 1 });
  return { bands, maxScore };
};

const ScaleBar = ({ questionnaire, score: rawScore }) => {
  // buildBands probes 40 evenly-spaced values — memoize so it only runs when
  // the questionnaire definition changes (i.e. never during normal app use).
  const built = useMemo(() => buildBands(questionnaire), [questionnaire]);
  if (typeof rawScore !== 'number') return null;
  if (!built) return null;
  const { bands, maxScore } = built;
  const pctScore = rawScore / maxScore;

  return (
    <View style={styles.scaleBarContainer}>
      <View style={styles.scaleBarTrack}>
        {/* Colour bands */}
        {bands.map((band, i) => {
          const prevEnd = i === 0 ? 0 : bands[i - 1].end;
          const width = (band.end - prevEnd) * 100;
          const interp = questionnaire.interpret((prevEnd + band.end) / 2 * maxScore);
          return (
            <View
              key={band.label}
              style={[styles.scaleBarSegment, { width: `${width}%`, backgroundColor: interp.color + '55' }]}
            />
          );
        })}
        {/* Score marker */}
        <View style={[styles.scaleBarMarker, { left: `${Math.min(pctScore * 100, 97)}%` }]} />
      </View>
      <View style={styles.scaleBarEndLabels}>
        <Text style={[styles.scaleBarEndText, { fontFamily: FONTS.bodyMedium }]}>0</Text>
        <Text style={[styles.scaleBarEndText, { fontFamily: FONTS.bodyMedium }]}>{maxScore}</Text>
      </View>
    </View>
  );
};

// ─── Single questionnaire result card ────────────────────────────────────────
const QuestionnaireReportCard = ({ result, questionnaire, locale }) => {
  const interpretation = questionnaire.interpret(result.score);
  const isMCTQ = typeof result.score === 'object';
  const scoreDisplay = isMCTQ
    ? (() => { const h = result.score.msf_sc; const hh = Math.floor(h); const mm = Math.round((h % 1) * 60); return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; })()
    : String(result.score);
  const completedDate = result.completedAt
    ? new Date(result.completedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={styles.qReportCard}>
      {/* Header row: title + BETA chip */}
      <View style={styles.qReportHeader}>
        <Text style={[styles.qReportTitle, { fontFamily: FONTS.body }]}>{questionnaire.title}</Text>
        {questionnaire.beta && (
          <View style={styles.qReportBetaChip}>
            <Text style={[styles.qReportBetaText, { fontFamily: FONTS.body }]}>BETA</Text>
          </View>
        )}
      </View>

      {/* Score + interpretation */}
      <View style={styles.qReportScoreRow}>
        <View style={[styles.qReportScoreBadge, { backgroundColor: interpretation.color + '18', borderColor: interpretation.color }]}>
          <Text style={[styles.qReportScoreValue, { color: interpretation.color, fontFamily: FONTS.heading }]}>{scoreDisplay}</Text>
        </View>
        <View style={styles.qReportInterpText}>
          <Text style={[styles.qReportInterpLabel, { color: interpretation.color, fontFamily: FONTS.body }]}>{interpretation.label}</Text>
          <Text style={[styles.qReportInterpDesc, { fontFamily: FONTS.bodyMedium }]}>{interpretation.description}</Text>
        </View>
      </View>

      {/* Scale bar */}
      {!isMCTQ && <ScaleBar questionnaire={questionnaire} score={result.score} />}

      {/* Completion date */}
      <Text style={[styles.qReportDate, { fontFamily: FONTS.bodyMedium }]}>Completed {completedDate}</Text>
    </View>
  );
};

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
  const { entries: allEntries, userName, refresh } = useEntries();
  const [loading,  setLoading]  = useState(true);
  const [qResults, setQResults] = useState([]);

  // Derive morning entries, metrics, and date range from context — recomputes
  // only when allEntries changes, not on every render.
  const morning = useMemo(
    () => allEntries.filter((e) => e.type === 'morning'),
    [allEntries],
  );
  const metrics = useMemo(
    () => (morning.length > 0 ? computeMetrics(morning) : null),
    [morning],
  );
  const dateRange = useMemo(() => {
    if (morning.length === 0) return '';
    const dates = morning.map((e) => e.date).sort();
    return `${dates[0]} → ${dates[dates.length - 1]}`;
  }, [morning]);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setLoading(true);
      const [, allQResults] = await Promise.all([refresh(), loadAllQuestionnaires()]);
      // Only show questionnaire results that have a matching definition
      setQResults(allQResults.filter((r) => QUESTIONNAIRES.find((q) => q.id === r.id)));
      setLoading(false);
    };
    load();
  }, [refresh]));

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
            <MetricCard icon="speedometer-outline" label={t('report.sleepEfficiency')} value={metrics.avgSleepEfficiency !== null ? `${Math.round(metrics.avgSleepEfficiency)}%` : '—'} subtext={t('report.sleepEfficiencySub')} color={metrics.avgSleepEfficiency >= 85 ? '#2E7D32' : '#C25E00'} statusLabel={metrics.avgSleepEfficiency !== null ? (metrics.avgSleepEfficiency >= 85 ? t('report.efficiencyGood') : t('report.efficiencyLow')) : null} />
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

          {qResults.length > 0 && (
            <Section title={t('report.sectionQuestionnaires')}>
              {qResults.map((result) => {
                const questionnaire = QUESTIONNAIRES.find((q) => q.id === result.id);
                if (!questionnaire) return null;
                return (
                  <QuestionnaireReportCard
                    key={result.id}
                    result={result}
                    questionnaire={questionnaire}
                    locale={locale}
                  />
                );
              })}
            </Section>
          )}
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
  metricCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', padding: 16 },
  metricIcon:        { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  metricText:        { flex: 1, gap: 3 },
  metricLabel:       { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  metricValueRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  metricValue:       { fontSize: SIZES.sectionTitle, color: '#1E3A5F' },
  metricStatusLabel: { fontSize: SIZES.caption, fontWeight: '600' },
  metricSubtext:     { fontSize: SIZES.caption, color: '#B0CCEE' },
  qualityCard:  { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', padding: 16, gap: 10 },
  qualityLabel: { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starLabel:    { fontSize: SIZES.body, marginLeft: 6 },
  disclaimer:   { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginTop: 8 },

  // Questionnaire report cards
  qReportCard:       { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', padding: 16, gap: 12 },
  qReportHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qReportTitle:      { fontSize: SIZES.body, color: '#1E3A5F', flex: 1 },
  qReportBetaChip:   { backgroundColor: '#F0E8FA', borderWidth: 1.5, borderColor: '#C4A8E0', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  qReportBetaText:   { fontSize: 11, color: '#6B3FA0', letterSpacing: 0.5 },
  qReportScoreRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  qReportScoreBadge: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  qReportScoreValue: { fontSize: SIZES.sectionTitle },
  qReportInterpText: { flex: 1, gap: 4 },
  qReportInterpLabel:{ fontSize: SIZES.body },
  qReportInterpDesc: { fontSize: SIZES.bodySmall, color: '#64748B', lineHeight: 22 },
  qReportDate:       { fontSize: SIZES.caption, color: '#94A3B8' },

  // Scale bar
  scaleBarContainer:  { gap: 4 },
  scaleBarTrack:      { height: 16, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative' },
  scaleBarSegment:    { height: '100%' },
  scaleBarMarker:     { position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 2, backgroundColor: '#1E3A5F' },
  scaleBarEndLabels:  { flexDirection: 'row', justifyContent: 'space-between' },
  scaleBarEndText:    { fontSize: 12, color: '#94A3B8' },
});
