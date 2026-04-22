/**
 * components/BottomCards.jsx — Past Entries and Final Report shortcut cards
 *
 * Replaces the PNG image assets with React Native components, so labels
 * are translatable via i18n and no locale-specific image exports are needed.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

const BLUE        = '#4A7BB5';
const LOCKED_ICON = '#C0C0C0';
const LOCKED_TEXT = '#C0C0C0';

export function PastEntriesCard() {
  return (
    <View style={[styles.card, styles.cardActive]}>
      <View style={[styles.iconWrap, { backgroundColor: BLUE + '20' }]}>
        <Ionicons name="time-outline" size={48} color={BLUE} />
      </View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: BLUE, fontFamily: FONTS.body }]}>{t('pastEntries.title')}</Text>
        <Ionicons name="chevron-forward" size={16} color={BLUE + '88'} />
      </View>
    </View>
  );
}

export function FinalReportCard({ unlocked }) {
  const color = unlocked ? BLUE : LOCKED_ICON;
  return (
    <View style={[styles.card, unlocked ? styles.cardActive : styles.cardLocked]}>
      <View style={[styles.iconWrap, { backgroundColor: color + '20' }]}>
        <Ionicons name="clipboard-outline" size={48} color={color} />
      </View>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: unlocked ? BLUE : LOCKED_TEXT, fontFamily: FONTS.body }]}>
          {t('report.title')}
        </Text>
        {unlocked && <Ionicons name="chevron-forward" size={16} color={BLUE + '88'} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 160,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  cardActive: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4A7BB5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  cardLocked: {
    backgroundColor: 'rgba(240,240,240,0.6)',
    borderColor: 'rgba(200,200,200,0.4)',
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: SIZES.bodySmall,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
  },
});
