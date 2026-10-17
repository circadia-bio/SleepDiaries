/**
 * Swedish cards use actual text instead of untranslatable text in PNGs.
 * Existing English/Portuguese artwork is preserved.
 */
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import t, { isSwedish } from '../i18n';
import IMAGES from '../assets/images';
import { FONTS } from '../theme/typography';

export default function EntryCardContent({ type, completed, locked = false }) {
  const morning = type === 'morning';
  const image = morning
    ? completed ? IMAGES.morningCompleted : IMAGES.morningPending
    : locked ? IMAGES.eveningLocked : completed ? IMAGES.eveningCompleted : IMAGES.eveningPending;
  if (!isSwedish) {
    return <Image source={image} style={styles.image} resizeMode="cover" accessibilityElementsHidden={true} importantForAccessibility="no" />;
  }
  const color = morning ? '#9A4B0A' : '#1D5689';
  const status = locked ? 'lockedEntry' : completed ? 'editEntry' : 'startEntry';
  return (
    <View style={[styles.card, { backgroundColor: morning ? '#FFF1D9' : '#E3F0FC' }]}>
      <Ionicons name={morning ? 'sunny-outline' : 'moon-outline'} size={34} color={color} />
      <View style={styles.copy}>
        <Text style={[styles.title, { color }]}>{t(`appText.${morning ? 'morningCard' : 'eveningCard'}`)}</Text>
        <Text style={[styles.status, { color }]}>{t(`appText.${status}`)}</Text>
      </View>
      <Ionicons name={locked ? 'lock-closed-outline' : completed ? 'checkmark-circle-outline' : 'chevron-forward'} size={24} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
  card: { width: '100%', minHeight: 112, flexShrink: 0, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  copy: { flex: 1, gap: 4 },
  title: { fontFamily: FONTS.heading, fontSize: 23 },
  status: { fontFamily: FONTS.bodyMedium, fontSize: 16 },
});
