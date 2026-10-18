/**
 * components/AgeBandPicker.jsx — optional age group selector
 *
 * Three chips (under 18 / 18–64 / 65+). The age group is optional and only
 * chooses which reference ranges the final report uses, so tapping the
 * selected chip again clears it (value → null, i.e. the adult default).
 *
 * Props:
 *   value     'under18' | 'adult' | 'older' | null
 *   onChange  (band | null) => void
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AGE_BANDS } from '../utils/referenceRanges';
import { FONTS, SIZES } from '../theme/typography';
import { COLORS } from '../theme/colors';
import t from '../i18n';

export default function AgeBandPicker({ value, onChange }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel={t('ageBand.label')}>
      {AGE_BANDS.map((band) => {
        const selected = value === band;
        return (
          <TouchableOpacity
            key={band}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(selected ? null : band)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={t(`ageBand.${band}`)}
          >
            <Text
              style={[styles.chipText, selected && styles.chipTextSelected, { fontFamily: FONTS.bodyMedium }]}
              numberOfLines={2}
            >
              {t(`ageBand.${band}`)}
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
