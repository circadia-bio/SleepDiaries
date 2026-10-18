/**
 * components/DataSafetyBanner.jsx — Install / back-up reminder
 *
 * A small dismissible card on the Home tab. Which reminder appears, if any, is
 * decided by pickReminder() in utils/dataSafety.js. "Not now" hides it for a
 * while (7 days for backups, 30 for the install hint).
 *
 * Props:
 *   entryCount  total entries saved so far
 *   onBackup    () => void   open the export screen
 *   onInstall   () => void   open the instructions (which include install steps)
 */
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { loadLastExportAt, loadDismissals, dismissReminder } from '../storage/storage';
import { pickReminder, isStandalonePwa, isTouchDevice } from '../utils/dataSafety';
import { FONTS, SIZES } from '../theme/typography';
import { COLORS } from '../theme/colors';
import t from '../i18n';

export default function DataSafetyBanner({ entryCount, onBackup, onInstall }) {
  const [kind, setKind] = useState(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      const [lastExportAt, dismissals] = await Promise.all([loadLastExportAt(), loadDismissals()]);
      const next = pickReminder({
        isWeb: Platform.OS === 'web',
        standalone: isStandalonePwa(),
        touch: isTouchDevice(),
        entryCount,
        lastExportAt,
        dismissals,
        now: Date.now(),
      });
      if (active) setKind(next);
    })();
    return () => { active = false; };
  }, [entryCount]));

  if (!kind) return null;

  const isInstall = kind === 'install';
  const handleDismiss = async () => {
    setKind(null);
    await dismissReminder(kind);
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name={isInstall ? 'phone-portrait-outline' : 'cloud-upload-outline'} size={28} color={COLORS.blue} />
        </View>
        <View style={styles.textWrap}>
          <Text style={[styles.title, { fontFamily: FONTS.heading }]}>
            {t(isInstall ? 'dataSafety.installTitle' : 'dataSafety.backupTitle')}
          </Text>
          <Text style={[styles.body, { fontFamily: FONTS.bodyMedium }]}>
            {t(isInstall ? 'dataSafety.installBody' : 'dataSafety.backupBody')}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.primaryBtn} onPress={isInstall ? onInstall : onBackup} accessibilityRole="button">
          <Text style={[styles.primaryText, { fontFamily: FONTS.body }]}>
            {t(isInstall ? 'dataSafety.installAction' : 'dataSafety.backupAction')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dismissBtn} onPress={handleDismiss} accessibilityRole="button">
          <Text style={[styles.dismissText, { fontFamily: FONTS.bodyMedium }]}>{t('dataSafety.dismiss')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: COLORS.blue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 3,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.blue + '20', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: SIZES.body, color: COLORS.navy },
  body: { fontSize: SIZES.bodySmall, color: COLORS.textMuted, lineHeight: 22 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10 },
  primaryBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12, backgroundColor: COLORS.blue },
  primaryText: { fontSize: SIZES.bodySmall, color: '#FFFFFF' },
  dismissBtn: { paddingVertical: 10, paddingHorizontal: 12 },
  dismissText: { fontSize: SIZES.bodySmall, color: COLORS.textMuted },
});
