/**
 * components/NavButtons.jsx — Questionnaire Back and Next buttons
 *
 * Matches the Figma design exactly:
 *
 * Back  — outlined, cream background (#FEFDF8), themed border + text
 * Next  — filled, solid themed background, cream text (#FEFDF8)
 *
 * Morning theme: border/fill #F0A963, icon/text #DD7F5A
 * Evening theme: border/fill #509EE0, icon/text #4578A2
 *
 * Labels are translated via i18n (Back / Voltar, Next / Próximo).
 */
import React from 'react';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../theme/typography';
import t from '../i18n';

const CREAM = '#FEFDF8';

const THEMES = {
  morning: {
    border:   '#F0A963',
    iconBack: '#DD7F5A',
    textBack: '#DD7F5A',
    fillNext: '#FFB060',
    textNext: CREAM,
    iconNext: CREAM,
  },
  evening: {
    border:   '#509EE0',
    iconBack: '#4578A2',
    textBack: '#4578A2',
    fillNext: '#509EE0',
    textNext: CREAM,
    iconNext: CREAM,
  },
};

export function BackButton({ onPress, theme }) {
  const c = THEMES[theme] ?? THEMES.morning;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.btn, styles.backBtn]}
      accessibilityRole="button"
      accessibilityLabel={t('questionnaire.back')}
    >
      <Ionicons name="chevron-back" size={22} color={c.iconBack} accessibilityElementsHidden={true} importantForAccessibility="no" />
      <Text style={[styles.label, { color: c.textBack }]}>
        {t('questionnaire.back')}
      </Text>
    </TouchableOpacity>
  );
}

export function NextButton({ onPress, theme, disabled }) {
  const c = THEMES[theme] ?? THEMES.morning;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.8}
      disabled={disabled}
      style={[styles.btn, styles.nextBtn, { backgroundColor: c.fillNext }, disabled && styles.disabled]}
      accessibilityRole="button"
      accessibilityLabel={t('questionnaire.next')}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.label, { color: c.textNext }]}>
        {t('questionnaire.next')}
      </Text>
      <Ionicons name="chevron-forward" size={22} color={c.iconNext} accessibilityElementsHidden={true} importantForAccessibility="no" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 51,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    gap: 6,
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  nextBtn: {
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    fontFamily: FONTS.body,
    fontSize: 25,
    lineHeight: 33,
  },
  disabled: {
    opacity: 0.4,
  },
});
