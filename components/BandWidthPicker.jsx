/**
 * components/BandWidthPicker.jsx — chronotype band width selector
 *
 * Chips for the half-width of the shaded chronotype band on the final report's
 * actogram (±15 / ±30 / ±45 min). Unlike the age group there is no "none":
 * one width is always selected, so tapping the selected chip does nothing.
 *
 * Props:
 *   value     15 | 30 | 45
 *   onChange  (minutes) => void
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BAND_WIDTH_OPTIONS } from '../utils/chronotypeBand';
import { FONTS, SIZES } from '../theme/typography';
import { COLORS } from '../theme/colors';
import t from '../i18n';

export default function BandWidthPicker({ value, onChange }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t('settings.bandWidth')}>
      {BAND_WIDTH_OPTIONS.map((minutes) => {
        const selected = value === minutes;
        const label = t('settings.bandWidthOption', { minutes });
        return (
          <TouchableOpacity
            key={minutes}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => { if (!selected) onChange(minutes); }}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected, { fontFamily: FONTS.bodyMedium }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, width: '100%' },
  chip: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4A7BB5',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  chipSelected: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  chipText: { fontSize: SIZES.bodySmall, color: COLORS.navy, textAlign: 'center' },
  chipTextSelected: { color: '#FFFFFF' },
});
