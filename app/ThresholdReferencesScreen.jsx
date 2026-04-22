/**
 * app/ThresholdReferencesScreen.jsx — Sleep metric threshold references
 * Accessible from Settings; pushed via router.push('/ThresholdReferencesScreen').
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#B0CCEE' },
  headerTitle: { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  backBtn:     { width: 44, alignItems: 'flex-start' },
  content:     { padding: 20, gap: 12, paddingBottom: 40 },
  note:        { fontSize: SIZES.bodySmall, color: '#94A3B8', lineHeight: 24 },
  card:        { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', overflow: 'hidden', paddingHorizontal: 16 },
  divider:     { height: 1, backgroundColor: '#E2EAF4' },
  creditRow:   { paddingVertical: 14, gap: 4 },
  creditTitle: { fontSize: SIZES.bodySmall, color: '#1E3A5F' },
  creditBody:  { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
});
