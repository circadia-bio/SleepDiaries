/**
 * app/EntryDatePrompt.jsx — "Which day is this entry for?" screen
 *
 * Shown before the questionnaire when the participant opens an entry
 * between midnight and 14:00 and yesterday's entry of the same type
 * is still missing. Lets them explicitly choose today or yesterday so
 * the entry is attributed to the correct night regardless of clock time.
 *
 * Route params:
 *   entryType  — 'morning' | 'evening'
 *   today      — 'YYYY-MM-DD'  (device date)
 *   yesterday  — 'YYYY-MM-DD'  (previous calendar day)
 *
 * On selection navigates to /questionnaire with { entryType, dateStr }.
 * Back button returns to home.
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../components/ScreenBackground';
import { useInsets } from '../theme/useInsets';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

/** Format 'YYYY-MM-DD' as a localised day string, e.g. 'Fri 23 May'. */
const formatDate = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short',
  });
};

export default function EntryDatePromptScreen() {
  const router  = useRouter();
  const insets  = useInsets();
  const { entryType = 'morning', today, yesterday } = useLocalSearchParams();

  const isMorning = entryType === 'morning';
  const primary   = isMorning ? '#E07A20' : '#2A6CB5';
  const textSel   = isMorning ? '#7A3800' : '#0C3A70';
  const subSel    = isMorning ? '#A05010' : '#185FA5';

  const [selected, setSelected] = useState(today);

  const handleContinue = () => {
    router.replace({
      pathname: '/questionnaire',
      params:   { entryType, dateStr: selected },
    });
  };

  const Option = ({ dateStr, label, sublabel }) => {
    const isSelected = selected === dateStr;
    return (
      <TouchableOpacity
        style={[
          styles.option,
          isSelected && { backgroundColor: 'rgba(255,255,255,0.92)' },
        ]}
        onPress={() => setSelected(dateStr)}
        activeOpacity={0.8}
      >
        <View style={styles.optionText}>
          <Text style={[
            styles.optionLabel,
            { fontFamily: FONTS.heading },
            { color: isSelected ? textSel : '#1E3A5F' },
          ]}>
            {label}
          </Text>
          <Text style={[
            styles.optionSub,
            { fontFamily: FONTS.body },
            { color: isSelected ? subSel : '#94A3B8' },
          ]}>
            {sublabel}
          </Text>
        </View>
        {isSelected
          ? <Ionicons name="checkmark-circle" size={24} color={primary} />
          : <Ionicons name="ellipse-outline"  size={24} color="rgba(148,163,184,0.6)" />
        }
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <ScreenBackground variant={isMorning ? 'home' : 'questionnaire'} />
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={primary} />
          <Text style={[styles.backText, { color: primary, fontFamily: FONTS.body }]}>
            {t('questionnaire.back')}
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Ionicons
            name={isMorning ? 'sunny-outline' : 'moon-outline'}
            size={36}
            color={primary}
          />
          <Text style={[styles.title, { color: primary, fontFamily: FONTS.heading }]}>
            {isMorning ? t('datePrompt.titleMorning') : t('datePrompt.titleEvening')}
          </Text>
          <Text style={[styles.subtitle, { fontFamily: FONTS.body }]}>
            {t('datePrompt.subtitle')}
          </Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          <Option
            dateStr={today}
            label={isMorning ? t('datePrompt.todayMorning') : t('datePrompt.todayEvening')}
            sublabel={formatDate(today)}
          />
          <Option
            dateStr={yesterday}
            label={isMorning ? t('datePrompt.yesterdayMorning') : t('datePrompt.yesterdayEvening')}
            sublabel={formatDate(yesterday)}
          />
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={[styles.continueBtnText, { color: primary, fontFamily: FONTS.heading }]}>
            {t('datePrompt.continue')}
          </Text>
        </TouchableOpacity>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, gap: 24 },

  backBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  backText: { fontSize: SIZES.body },

  header:   { alignItems: 'center', gap: 10, paddingTop: 8 },
  title:    { fontSize: 26, textAlign: 'center', lineHeight: 32 },
  subtitle: { fontSize: SIZES.body, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },

  options: { gap: 12 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 18, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  optionText:  { gap: 3 },
  optionLabel: { fontSize: SIZES.cardTitle },
  optionSub:   { fontSize: SIZES.bodySmall },

  continueBtn: {
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderRadius: 30, paddingVertical: 19, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#3A7AAA', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    marginTop: 'auto',
  },
  continueBtnText: { fontSize: SIZES.cardTitle, letterSpacing: 0.3 },
});
