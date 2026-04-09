/**
 * components/BottomCards.jsx — Past Entries and Final Report shortcut cards
 *
 * Replaces the PNG image assets with React Native components, so labels
 * are translatable via i18n and no locale-specific image exports are needed.
 *
 * PastEntriesCard  — always active, blue
 * FinalReportCard  — blue when unlocked, greyed out when locked
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import t from '../i18n';

const BLUE          = '#7EB0DC';
const BLUE_BG       = '#EEF5FF';
const LOCKED_BG     = '#F0F0F0';
const LOCKED_ICON   = '#BBBBBB';
const LOCKED_TEXT   = '#BBBBBB';
const LOCKED_BORDER = '#DDDDDD';

export function PastEntriesCard() {
  return (
    <View style={[styles.card, { backgroundColor: BLUE_BG, borderColor: BLUE }]}>
      <Ionicons name="time-outline" size={42} color={BLUE} />
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
        size={42}
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
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
