/**
 * app/QuestionnaireModal.jsx — One-time research questionnaire modal
 *
 * Presents a single questionnaire (e.g. ESS, ISI, MEQ) in the same step-by-step
 * style as the daily diary. Opened from the Profile modal.
 *
 * Props:
 *   visible         {boolean}
 *   questionnaire   {object}  — a questionnaire definition from data/questionnaires.js
 *   onClose         {function}
 *   onComplete      {function(result)} — called after saving, with the result object
 *   resultsUnlocked {boolean} — if false, shows a holding screen instead of the score
 *
 * Supported input types:
 *   scale_0_3      single_choice    yes_no
 *   scale_0_4      frequency_3      frequency_4
 *   scale_0_10     scale_1_10
 *   time           duration_min     number
 *
 * Theme: purple/violet to distinguish from morning (amber) and evening (blue).
 */
import React, { useState, useCallback, useEffect } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveQuestionnaire } from '../storage/storage';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  primary:      '#6B3FA0',
  primaryLight: '#C4A8E0',
  progressFill: '#7B52B0',
  bg:           '#F0E8FA',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0');
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);

// ─── Input components ─────────────────────────────────────────────────────────

/** Vertical stacked options (scale_0_3, scale_0_4, scale_1_10, single_choice, frequency_3, frequency_4) */
const OptionListInput = ({ value, onChange, options }) => (
  <View style={styles.scaleCol}>
    {options.map((opt) => {
      const selected = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[styles.scaleBtn, selected
            ? { backgroundColor: C.primary, borderColor: C.primary }
            : { backgroundColor: '#fff', borderColor: C.primary }]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
        >
          {'value' in opt && typeof opt.value === 'number' && opt.value <= 10 && (
            <Text style={[styles.scaleBtnValue, { color: selected ? '#fff' : C.primary }]}>
              {opt.value}
            </Text>
          )}
          <Text style={[styles.scaleBtnLabel, { color: selected ? '#fff' : C.primary }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

/** 0–10 large numeric slider-style picker (DBAS-16) */
const Scale010Input = ({ value, onChange }) => {
  const current = value ?? 5;
  return (
    <View style={styles.scale010Container}>
      <View style={styles.scale010Row}>
        {Array.from({ length: 11 }, (_, i) => {
          const selected = current === i;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.scale010Btn, selected && { backgroundColor: C.primary }]}
              onPress={() => onChange(i)}
              activeOpacity={0.7}
            >
              <Text style={[styles.scale010BtnText, { color: selected ? '#fff' : C.primary }]}>
                {i}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.scale010Labels}>
        <Text style={styles.scale010Anchor}>Strongly disagree</Text>
        <Text style={styles.scale010Anchor}>Strongly agree</Text>
      </View>
    </View>
  );
};

/** Yes / No */
const YesNoInput = ({ value, onChange }) => (
  <View style={styles.yesNoRow}>
    {['yes', 'no'].map((opt) => {
      const selected = value === opt;
      return (
        <TouchableOpacity
          key={opt}
          style={[styles.yesNoBtn, selected
            ? { backgroundColor: C.primary, borderColor: C.primary }
            : { backgroundColor: '#fff', borderColor: C.primary }]}
          onPress={() => onChange(opt)}
          activeOpacity={0.8}
        >
          <Text style={[styles.yesNoText, { color: selected ? '#fff' : C.primary }]}>
            {opt === 'yes' ? 'Yes' : 'No'}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

/** HH:MM time stepper */
const TimeInput = ({ value, onChange }) => {
  const { hour, minute } = value ?? { hour: 23, minute: 0 };
  const adjust = (field, delta) => {
    if (field === 'hour')   onChange({ hour: (hour   + delta + 24) % 24, minute });
    if (field === 'minute') onChange({ hour, minute: (minute + delta + 60) % 60 });
  };
  const Stepper = ({ field, display }) => (
    <View style={styles.stepperCol}>
      <TouchableOpacity style={[styles.stepBtn, { backgroundColor: C.primaryLight }]} onPress={() => adjust(field, 1)}>
        <Ionicons name="caret-up" size={20} color={C.primary} />
      </TouchableOpacity>
      <Text style={[styles.stepValue, { color: C.primary }]}>{display}</Text>
      <TouchableOpacity style={[styles.stepBtn, { backgroundColor: C.primaryLight }]} onPress={() => adjust(field, -1)}>
        <Ionicons name="caret-down" size={20} color={C.primary} />
      </TouchableOpacity>
    </View>
  );
  return (
    <View style={styles.timeRow}>
      <Stepper field="hour"   display={pad(hour)} />
      <Text style={[styles.timeSep, { color: C.primary }]}>:</Text>
      <Stepper field="minute" display={pad(minute)} />
    </View>
  );
};

/** Integer minutes stepper */
const DurationMinInput = ({ value, onChange, min = 0, max = 180, unit = 'min' }) => {
  const v = value ?? 0;
  return (
    <View style={styles.numberRow}>
      <TouchableOpacity style={[styles.numBtn, { borderColor: C.primary }]} onPress={() => onChange(clamp(v - 1, min, max))}>
        <Ionicons name="remove" size={24} color={C.primary} />
      </TouchableOpacity>
      <Text style={[styles.numValue, { color: C.primary }]}>{v}</Text>
      <TouchableOpacity style={[styles.numBtn, { borderColor: C.primary }]} onPress={() => onChange(clamp(v + 1, min, max))}>
        <Ionicons name="add" size={24} color={C.primary} />
      </TouchableOpacity>
      <Text style={[styles.numUnit, { color: C.primary }]}>{unit}</Text>
    </View>
  );
};

/** Generic integer stepper */
const NumberInput = ({ value, onChange, min = 0, max = 99, unit = '' }) => {
  const v = value ?? min;
  return (
    <View style={styles.numberRow}>
      <TouchableOpacity style={[styles.numBtn, { borderColor: C.primary }]} onPress={() => onChange(clamp(v - 1, min, max))}>
        <Ionicons name="remove" size={24} color={C.primary} />
      </TouchableOpacity>
      <Text style={[styles.numValue, { color: C.primary }]}>{v}</Text>
      <TouchableOpacity style={[styles.numBtn, { borderColor: C.primary }]} onPress={() => onChange(clamp(v + 1, min, max))}>
        <Ionicons name="add" size={24} color={C.primary} />
      </TouchableOpacity>
      {!!unit && <Text style={[styles.numUnit, { color: C.primary }]}>{unit}</Text>}
    </View>
  );
};

// ─── Progress bar ─────────────────────────────────────────────────────────────
const ProgressBar = ({ current, total }) => (
  <View style={styles.progressRow}>
    <View style={styles.progressIcon}>
      <Ionicons name="clipboard-outline" size={20} color={C.primary} />
    </View>
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${(current / total) * 100}%` }]} />
    </View>
    <Text style={styles.progressLabel}>{current}/{total}</Text>
  </View>
);

// ─── Score result screen ──────────────────────────────────────────────────────
const ResultScreen = ({ questionnaire, score, resultsUnlocked, onClose }) => {
  if (!resultsUnlocked) {
    return (
      <View style={styles.resultContainer}>
        <View style={styles.resultCard}>
          <Ionicons name="time-outline" size={48} color="#94A3B8" />
          <Text style={styles.resultTitle}>{t('questionnaireModal.allDone')}</Text>
          <Text style={styles.pendingDesc}>
            {t('questionnaireModal.pendingDesc', { shortTitle: questionnaire.shortTitle })}
          </Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
          <Text style={styles.doneBtnText}>{t('questionnaireModal.done')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const interpretation = questionnaire.interpret(score);

  // Format score for display — handle object scores (e.g. MCTQ)
  let scoreDisplay = '';
  let scoreMax = '';
  if (typeof score === 'object' && score !== null) {
    if (score.msf_sc !== undefined) {
      const h = Math.floor(score.msf_sc);
      const m = Math.round((score.msf_sc % 1) * 60);
      scoreDisplay = `${pad(h)}:${pad(m)}`;
      scoreMax = 'MSFsc';
    }
  } else {
    scoreDisplay = String(score);
    const maxScore = questionnaire.items.reduce((mx, item) => {
      if (!item.options) return mx;
      const itemMax = Math.max(...item.options.map((o) => o.value));
      return mx + itemMax;
    }, null);
    scoreMax = maxScore !== null ? `/ ${maxScore}` : '';
  }

  return (
    <View style={styles.resultContainer}>
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>{questionnaire.shortTitle} complete</Text>
        <View style={[styles.scoreBadge, { backgroundColor: interpretation.color + '18', borderColor: interpretation.color }]}>
          <Text style={[styles.scoreNumber, { color: interpretation.color }]}>{scoreDisplay}</Text>
          {!!scoreMax && <Text style={[styles.scoreMax, { color: interpretation.color }]}>{scoreMax}</Text>}
        </View>
        <Text style={[styles.interpretLabel, { color: interpretation.color }]}>{interpretation.label}</Text>
        <Text style={styles.interpretDesc}>{interpretation.description}</Text>
        <Text style={styles.referenceText}>{questionnaire.reference}</Text>
      </View>
      <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
      <Text style={styles.doneBtnText}>{t('questionnaireModal.done')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Helpers for default answer values ────────────────────────────────────────
const buildInitialAnswers = (items) => {
  const a = {};
  for (const item of items) {
    switch (item.type) {
      case 'time':         a[item.id] = item.defaultValue ?? { hour: 23, minute: 0 }; break;
      case 'duration_min': a[item.id] = item.defaultValue ?? 0; break;
      case 'number':       a[item.id] = item.defaultValue ?? (item.min ?? 0); break;
      case 'scale_0_10':   a[item.id] = item.defaultValue ?? 5; break;
      default:             a[item.id] = null; break;
    }
  }
  return a;
};

const isAnswered = (item, value) => {
  switch (item.type) {
    case 'time':         return value !== null && value !== undefined;
    case 'duration_min': return value !== null && value !== undefined;
    case 'number':       return value !== null && value !== undefined;
    case 'scale_0_10':   return value !== null && value !== undefined;
    case 'yes_no':       return value === 'yes' || value === 'no';
    default:             return value !== null && value !== undefined;
  }
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function QuestionnaireModal({ visible, questionnaire, onClose, onComplete, resultsUnlocked = true }) {
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;

  const [answers, setAnswers]           = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult]             = useState(null);

  const handleShow = useCallback(() => {
    setAnswers(buildInitialAnswers(questionnaire?.items ?? []));
    setCurrentIndex(0);
    setResult(null);
  }, [questionnaire]);

  useEffect(() => {
    if (visible) handleShow();
  }, [visible, handleShow]);

  const items = questionnaire?.items ?? [];
  const total = items.length;
  const item  = items[currentIndex];

  const currentValue = answers[item?.id];
  const canProceed   = item ? isAnswered(item, currentValue) : false;

  const handleNext = async () => {
    if (!canProceed) return;
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const score  = questionnaire.score(answers);
      const saved  = await saveQuestionnaire(questionnaire.id, answers, score);
      setResult(saved);
      onComplete?.(saved);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    else onClose();
  };

  const setAnswer = (id, val) => setAnswers((prev) => ({ ...prev, [id]: val }));

  if (!questionnaire) return null;

  const inner = (
    <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{questionnaire.shortTitle}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        {questionnaire.beta && (
          <View style={styles.betaBanner}>
            <Ionicons name="flask-outline" size={15} color="#6B3FA0" />
            <Text style={[styles.betaBannerText, { fontFamily: FONTS.bodyMedium }]}>
              {t('questionnaireModal.betaBanner')}
            </Text>
          </View>
        )}

        {result ? (
          <ResultScreen
            questionnaire={questionnaire}
            score={result.score}
            resultsUnlocked={resultsUnlocked}
            onClose={onClose}
          />
        ) : (
          <>
            <ProgressBar current={currentIndex + 1} total={total} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

              {currentIndex === 0 && (
                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsText}>{questionnaire.instructions}</Text>
                </View>
              )}

              <Text style={styles.itemNumber}>{t('questionnaireModal.itemOf', { current: item.number, total })}</Text>
              <Text style={styles.itemText}>{item.text}</Text>
              {item.hint && (
                <View style={styles.hintBox}>
                  <Ionicons name="information-circle-outline" size={16} color={C.primary} />
                  <Text style={[styles.hintText, { fontFamily: FONTS.bodyMedium }]}>{item.hint}</Text>
                </View>
              )}

              <View style={styles.inputArea}>
                {(item.type === 'scale_0_3' || item.type === 'scale_0_4' || item.type === 'scale_1_10' ||
                  item.type === 'single_choice' || item.type === 'frequency_3' || item.type === 'frequency_4') && (
                  <OptionListInput
                    value={currentValue}
                    onChange={(v) => setAnswer(item.id, v)}
                    options={item.options}
                  />
                )}
                {item.type === 'scale_0_10' && (
                  <Scale010Input value={currentValue} onChange={(v) => setAnswer(item.id, v)} />
                )}
                {item.type === 'yes_no' && (
                  <YesNoInput value={currentValue} onChange={(v) => setAnswer(item.id, v)} />
                )}
                {item.type === 'time' && (
                  <TimeInput value={currentValue} onChange={(v) => setAnswer(item.id, v)} />
                )}
                {item.type === 'duration_min' && (
                  <DurationMinInput value={currentValue} onChange={(v) => setAnswer(item.id, v)} min={item.min} max={item.max} unit={item.unit} />
                )}
                {item.type === 'number' && (
                  <NumberInput value={currentValue} onChange={(v) => setAnswer(item.id, v)} min={item.min} max={item.max} unit={item.unit} />
                )}
              </View>
            </ScrollView>

            {/* ── Nav buttons ── */}
            <View style={[styles.navRow, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Ionicons name="chevron-back" size={22} color={C.primary} />
                <Text style={styles.backBtnText}>{t('questionnaireModal.back')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
                onPress={handleNext}
                disabled={!canProceed}
              >
                <Text style={styles.nextBtnText}>
                  {currentIndex < total - 1 ? t('questionnaireModal.next') : t('questionnaireModal.finish')}
                </Text>
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </>        
        )}
      </View>
  );

  if (Platform.OS === 'web') {
    if (!visible) return null;
    return <View style={styles.webOverlay}>{inner}</View>;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      {inner}
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 18,
    borderBottomWidth: 1, borderBottomColor: C.primaryLight,
  },
  headerTitle: { fontSize: SIZES.cardTitle, fontFamily: FONTS.heading, color: '#1E3A5F' },
  closeBtn:    { padding: 4 },

  betaBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0E8FA', borderBottomWidth: 1, borderBottomColor: '#C4A8E0',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  betaBannerText: { fontSize: SIZES.caption, color: '#6B3FA0', flex: 1, lineHeight: 20 },

  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  progressIcon: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)',
  },
  progressTrack: {
    flex: 1, height: 28, borderRadius: 14, borderWidth: 1.5,
    borderColor: C.primaryLight, backgroundColor: '#fff', overflow: 'hidden',
  },
  progressFill:  { height: '100%', borderRadius: 14, backgroundColor: C.progressFill },
  progressLabel: { fontSize: 16, fontFamily: FONTS.heading, color: C.primary, minWidth: 40, textAlign: 'right' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40 },

  instructionsBox: {
    backgroundColor: '#EDE0FA', borderRadius: 12, borderWidth: 1.5,
    borderColor: C.primaryLight, padding: 16, marginTop: 16, marginBottom: 8,
  },
  instructionsText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, color: '#3B1F6A', lineHeight: 24 },

  itemNumber: { fontSize: SIZES.label, fontFamily: FONTS.body, color: C.primaryLight, textTransform: 'uppercase', marginTop: 20, marginBottom: 6 },
  itemText:   { fontSize: 20, fontFamily: FONTS.heading, color: C.primary, lineHeight: 28, marginBottom: 12 },
  hintBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#EDE0FA', borderRadius: 10, padding: 12, marginBottom: 16 },
  hintText:   { flex: 1, fontSize: SIZES.bodySmall, color: C.primary, lineHeight: 22 },
  inputArea:  { alignItems: 'stretch' },

  // Option list (scale_0_3, scale_0_4, scale_1_10, single_choice, frequency_*)
  scaleCol: { gap: 10 },
  scaleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
    borderRadius: 12, borderWidth: 2,
  },
  scaleBtnValue: { fontSize: 20, fontFamily: FONTS.heading, minWidth: 26, textAlign: 'center' },
  scaleBtnLabel: { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, flex: 1 },

  // Scale 0–10
  scale010Container: { width: '100%', gap: 10 },
  scale010Row:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  scale010Btn: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff',
  },
  scale010BtnText:  { fontSize: 17, fontFamily: FONTS.heading },
  scale010Labels:   { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  scale010Anchor:   { fontSize: 13, fontFamily: FONTS.bodyMedium, color: '#94A3B8' },

  // Yes / No
  yesNoRow: { flexDirection: 'row', gap: 20, marginTop: 8, justifyContent: 'center' },
  yesNoBtn: { width: 130, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  yesNoText: { fontSize: 20, fontFamily: FONTS.body },

  // Time stepper
  timeRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  stepperCol: { alignItems: 'center', gap: 12 },
  stepBtn:    { width: 52, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepValue:  { fontSize: 40, fontFamily: FONTS.heading, minWidth: 52, textAlign: 'center' },
  timeSep:    { fontSize: 40, fontFamily: FONTS.heading, marginTop: -12 },

  // Number / duration steppers
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 20, justifyContent: 'center' },
  numBtn:    { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  numValue:  { fontSize: 48, fontFamily: FONTS.heading, minWidth: 60, textAlign: 'center' },
  numUnit:   { fontSize: 16, fontFamily: FONTS.bodyMedium, marginLeft: 4 },

  // Nav buttons
  navRow: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 12, gap: 12 },
  backBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.primary, borderRadius: 14, paddingVertical: 14, gap: 4,
  },
  backBtnText:     { fontSize: SIZES.body, fontFamily: FONTS.body, color: C.primary },
  nextBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, gap: 4,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText:     { fontSize: SIZES.body, fontFamily: FONTS.body, color: '#fff' },

  // Result screen
  resultContainer: { flex: 1, padding: 24, justifyContent: 'center', gap: 20 },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5,
    borderColor: C.primaryLight, padding: 28, alignItems: 'center', gap: 12,
  },
  resultTitle:    { fontSize: SIZES.sectionTitle, fontFamily: FONTS.heading, color: '#1E3A5F' },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    borderWidth: 2, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10, marginVertical: 4,
  },
  scoreNumber:    { fontSize: 52, fontFamily: FONTS.heading },
  scoreMax:       { fontSize: 22, fontFamily: FONTS.bodyMedium },
  interpretLabel: { fontSize: SIZES.sectionTitle, fontFamily: FONTS.heading },
  interpretDesc:  { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  referenceText:  { fontSize: 13, fontFamily: FONTS.bodyMedium, color: '#94A3B8', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  pendingDesc:    { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  doneBtn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16, alignItems: 'center',
  },
  doneBtnText:    { fontSize: SIZES.body, fontFamily: FONTS.body, color: '#fff' },
  webOverlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 },
});
