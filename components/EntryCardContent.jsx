/**
 * components/EntryCardContent.jsx
 *
 * Morning / evening entry cards on the Entry tab, rendered in code for every
 * language. Replaces the per-locale PNGs: all text comes from i18n `appText.*`,
 * so a new language only needs strings, not new artwork.
 *
 * Props:
 *   type      'morning' | 'evening'
 *   completed entry done for today
 *   locked    evening card only: morning entry not done yet
 *
 * The gradient is drawn with react-native-svg (already a dependency), the same
 * approach as ScreenBackground. Text colours are slightly darker than the old
 * artwork to meet contrast guidelines for participants with low vision.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import t from '../i18n';
import { FONTS, SIZES } from '../theme/typography';
import { THEME } from '../theme/colors';

export default function EntryCardContent({ type, completed = false, locked = false }) {
  const morning = type === 'morning';
  const th = morning ? THEME.morning : THEME.evening;
  const p = {
    from: th.entryFrom,
    to: th.entryTo,
    title: th.entryTitle,
    pill: th.entryPill,
    pillText: th.entryPillText,
    lockedText: th.entryLockedText,
  };
  const suffix = morning ? 'Morning' : 'Evening';
  const gradId = `entryCardGrad_${type}`;

  const title = t(`appText.${morning ? 'morningCard' : 'eveningCard'}`);
  const status = locked ? 'locked' : completed ? 'done' : 'pending';
  const subtitle =
    status === 'locked' ? t('appText.entryLocked')
    : status === 'done' ? t(`appText.entryDone${suffix}`)
    : t(`appText.entryPending${suffix}`);

  return (
    <View
      style={styles.card}
      accessibilityElementsHidden={true}
      importantForAccessibility="no-hide-descendants"
    >
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={p.from} />
            <Stop offset="1" stopColor={p.to} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>

      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: p.title }]}>{title}</Text>
        {morning
          ? <MaterialCommunityIcons name="weather-sunset-up" size={34} color={p.title} />
          : <Ionicons name="moon" size={30} color={p.title} />}
      </View>

      {status === 'locked' ? (
        <Text style={[styles.lockedText, { color: p.lockedText }]}>{subtitle}</Text>
      ) : (
        <View style={[styles.pill, { backgroundColor: p.pill }]}>
          {status === 'pending' && <Ionicons name="alert-circle-outline" size={24} color={p.pillText} />}
          <Text style={[styles.pillText, { color: p.pillText }]}>{subtitle}</Text>
          {status === 'done' && <Ionicons name="checkmark" size={26} color={p.pillText} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minHeight: 118,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, maxWidth: '100%' },
  title: { fontFamily: FONTS.heading, fontSize: SIZES.screenTitle, flexShrink: 1, textAlign: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxWidth: '100%',
  },
  pillText: { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, flexShrink: 1, textAlign: 'center' },
  lockedText: { fontFamily: FONTS.body, fontSize: SIZES.bodySmall, textAlign: 'center', paddingHorizontal: 8 },
});
