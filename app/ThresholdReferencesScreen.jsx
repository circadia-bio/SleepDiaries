/**
 * app/ThresholdReferencesScreen.jsx — Sleep metric threshold references
 * Accessible from Settings; pushed via router.push('/ThresholdReferencesScreen').
 *
 * Shows the colour-band ranges for the participant's age group (set in
 * Profile; adult by default) followed by the references behind them.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { loadAgeBand } from '../storage/storage';
import { getReferenceRanges, rangeRows } from '../utils/referenceRanges';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

const THRESHOLDS = (tt) => [
  { title: tt('settings.thresholdDuration'),   body: tt('settings.thresholdDurationRef') },
  { title: tt('settings.thresholdEfficiency'), body: tt('settings.thresholdEfficiencyRef') },
  { title: tt('settings.thresholdLatency'),    body: tt('settings.thresholdLatencyRef') },
  { title: tt('settings.thresholdWaso'),       body: tt('settings.thresholdWasoRef') },
  { title: tt('settings.thresholdAlcohol'),    body: tt('settings.thresholdAlcoholRef') },
];

export default function ThresholdReferencesScreen() {
  const router = useRouter();
  const [ageBand, setAgeBand] = useState(null);

  useFocusEffect(useCallback(() => {
    loadAgeBand().then(setAgeBand);
  }, []));

  const ranges = getReferenceRanges(ageBand);
  const rows = rangeRows(ranges, { hours: t('questionnaire.hrs'), minutes: t('questionnaire.min') });
  const rowTitles = {
    duration:   t('settings.thresholdDuration'),
    efficiency: t('settings.thresholdEfficiency'),
    latency:    t('settings.thresholdLatency'),
    waso:       t('settings.thresholdWaso'),
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: FONTS.heading }]}>
          {t('settings.sectionThresholds')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.note, { fontFamily: FONTS.bodyMedium }]}>
          {t('settings.thresholdsNote')}
        </Text>

        <View style={styles.card}>
          <Text style={[styles.rangesTitle, { fontFamily: FONTS.body }]}>
            {t('settings.rangesTitle', { band: t(`ageBand.${ranges.band}`) })}
          </Text>
          {rows.map((row) => (
            <View key={row.key}>
              <View style={styles.divider} />
              <View style={styles.creditRow}>
                <Text style={[styles.creditTitle, { fontFamily: FONTS.body }]}>{rowTitles[row.key]}</Text>
                <Text style={[styles.rangeLine, { fontFamily: FONTS.bodyMedium }]}>
                  {t('settings.rangeGood')}: {row.good}
                </Text>
                <Text style={[styles.rangeLine, { fontFamily: FONTS.bodyMedium }]}>
                  {t('settings.rangeBorderline')}: {row.borderline}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          {THRESHOLDS(t).map((item, i) => (
            <View key={item.title}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.creditRow}>
                <Text style={[styles.creditTitle, { fontFamily: FONTS.body }]}>{item.title}</Text>
                <Text style={[styles.creditBody, { fontFamily: FONTS.bodyMedium }]}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#EEF5FF' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 18, shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerTitle: { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  backBtn:     { width: 44, alignItems: 'flex-start' },
  content:     { padding: 20, gap: 12, paddingBottom: 40 },
  note:        { fontSize: SIZES.bodySmall, color: '#94A3B8', lineHeight: 24, textAlign: 'center' },
  card:        { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden', paddingHorizontal: 16, shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  rangesTitle: { fontSize: SIZES.bodySmall, color: '#E07A20', paddingTop: 14, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  divider:     { height: 1, backgroundColor: 'rgba(226,234,244,0.8)' },
  creditRow:   { paddingVertical: 14, gap: 4 },
  creditTitle: { fontSize: SIZES.bodySmall, color: '#1E3A5F' },
  creditBody:  { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
  rangeLine:   { fontSize: SIZES.bodySmall, color: '#5B7089', lineHeight: 22 },
});
