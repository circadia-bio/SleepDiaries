/**
 * app/SleepMetricsScreen.jsx — Sleep metrics glossary screen
 * Lifted from ProfileModal; pushed via router.push('/SleepMetricsScreen').
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

const GLOSSARY_ITEMS = [
  { key: 'sleepDuration',     icon: 'time-outline',         color: '#4A7BB5' },
  { key: 'sleepEfficiency',   icon: 'speedometer-outline',  color: '#2E7D32' },
  { key: 'sleepOnsetLatency', icon: 'hourglass-outline',    color: '#4A7BB5' },
  { key: 'waso',              icon: 'moon-outline',          color: '#2A6CB5' },
  { key: 'nightWakings',      icon: 'alert-circle-outline', color: '#4A7BB5' },
  { key: 'sleepQuality',      icon: 'star-outline',         color: '#E07A20' },
  { key: 'restedness',        icon: 'sunny-outline',        color: '#E07A20' },
  { key: 'earlyWaking',       icon: 'alarm-outline',        color: '#C25E00' },
];

export default function SleepMetricsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: FONTS.heading }]}>
          {t('profile.sectionGlossary')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.glossaryCard}>
          {GLOSSARY_ITEMS.map((item, i, arr) => (
            <View key={item.key}>
              <View style={styles.glossaryRow}>
                <View style={[styles.glossaryIcon, { backgroundColor: item.color + '18' }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.glossaryText}>
                  <Text style={[styles.glossaryTitle, { color: item.color, fontFamily: FONTS.body }]}>
                    {t(`profile.glossary.${item.key}.title`)}
                  </Text>
                  <Text style={[styles.glossaryBody, { fontFamily: FONTS.bodyMedium }]}>
                    {t(`profile.glossary.${item.key}.body`)}
                  </Text>
                </View>
              </View>
              {i < arr.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#EEF5FF' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#B0CCEE' },
  headerTitle:   { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  backBtn:       { width: 44, alignItems: 'flex-start' },
  content:       { padding: 20, paddingBottom: 40 },
  glossaryCard:  { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#B0CCEE', overflow: 'hidden' },
  glossaryRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  glossaryIcon:  { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glossaryText:  { flex: 1, gap: 4 },
  glossaryTitle: { fontSize: SIZES.body },
  glossaryBody:  { fontSize: SIZES.bodySmall, color: '#64748B', lineHeight: 24 },
  divider:       { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
});
