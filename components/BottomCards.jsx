/**
 * components/BottomCards.jsx — Past Entries and Final Report shortcut cards
 *
 * Replaces the PNG image assets with React Native components, so labels
 * are translatable via i18n and no locale-specific image exports are needed.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme/typography';
import t from '../i18n';

const BLUE          = '#7EB0DC';
const BLUE_BG       = '#FAFCFF';
const LOCKED_BG     = '#F2F2F2';
const LOCKED_ICON   = '#C0C0C0';
const LOCKED_TEXT   = '#C0C0C0';
const LOCKED_BORDER = '#E0E0E0';

export function PastEntriesCard() {
  return (
    <View style={[styles.card, { backgroundColor: BLUE_BG, borderColor: BLUE }]}>
      <Ionicons name="time-outline" size={64} color={BLUE} />
      <Text style={[styles.label, { color: BLUE }]}>{t('pastEntries.title')}</Text>
    </View>
  );
}

export function FinalReportCard({ unlocked }) {
  return (
    <View style={[
      styles.card,
      unlocked
        ? { backgroundColor: BLUE_BG,   borderColor: BLUE }
        : { backgroundColor: LOCKED_BG, borderColor: LOCKED_BORDER },
    ]}>
      <Ionicons
        name="clipboard-outline"
        size={64}
        color={unlocked ? BLUE : LOCKED_ICON}
      />
      <Text style={[styles.label, { color: unlocked ? BLUE : LOCKED_TEXT }]}>
        {t('report.title')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 130,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});
