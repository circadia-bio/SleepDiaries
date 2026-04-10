/**
 * app/QuestionnaireModal.jsx — One-time research questionnaire modal
 *
 * Presents a single questionnaire (e.g. ESS) in the same step-by-step style
 * as the daily diary. Opened from the Profile modal.
 *
 * Props:
 *   visible         {boolean}
 *   questionnaire   {object}  — a questionnaire definition from data/questionnaires.js
 *   onClose         {function}
 *   onComplete      {function(result)} — called after saving, with the result object
 *
 * Theme: purple/violet to visually distinguish from morning (amber) and evening (blue).
 */
import React, { useState, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveQuestionnaire } from '../storage/storage';
import { FONTS, SIZES } from '../theme/typography';

// ─── Theme ────────────────────────────────────────────────────────────────────
const C = {
  primary:      '#6B3FA0',
  primaryLight: '#C4A8E0',
  cardBg:       '#F5EEFF',
  progressFill: '#7B52B0',
  progressBg:   '#E8D8F8',
  bg:           '#F0E8FA',
};

// ─── Scale 0–3 input (used by ESS and similar instruments) ───────────────────
const Scale03Input = ({ value, onChange, options }) => (
  <View style={styles.scaleCol}>
    {options.map((opt) => {
      const selected = value === opt.value;
      return (
        <TouchableOpacity
          key={opt.value}
          style={[
            styles.scaleBtn,
            selected
              ? { backgroundColor: C.primary, borderColor: C.primary }
              : { backgroundColor: '#fff', borderColor: C.primary },
          ]}
          onPress={() => onChange(opt.value)}
          activeOpacity={0.8}
        >
          <Text style={[styles.scaleBtnValue, { color: selected ? '#fff' : C.primary }]}>
            {opt.value}
          </Text>
          <Text style={[styles.scaleBtnLabel, { color: selected ? '#fff' : C.primary }]}>
            {opt.label}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

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
          <Text style={styles.resultTitle}>All done!</Text>
          <Text style={styles.pendingDesc}>
            Your responses have been saved. Your {questionnaire.shortTitle} results will be available once you have completed 14 days of sleep diary entries.
          </Text>
        </View>
        <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
          <Text style={styles.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const interpretation = questionnaire.interpret(score);
  return (
    <View style={styles.resultContainer}>
      <View style={styles.resultCard}>
        <Text style={styles.resultTitle}>{questionnaire.shortTitle} complete</Text>
        <View style={[styles.scoreBadge, { backgroundColor: interpretation.color + '18', borderColor: interpretation.color }]}>
          <Text style={[styles.scoreNumber, { color: interpretation.color }]}>{score}</Text>
          <Text style={[styles.scoreMax, { color: interpretation.color }]}>/ {questionnaire.items.length * 3}</Text>
        </View>
        <Text style={[styles.interpretLabel, { color: interpretation.color }]}>{interpretation.label}</Text>
        <Text style={styles.interpretDesc}>{interpretation.description}</Text>
        <Text style={styles.referenceText}>{questionnaire.reference}</Text>
      </View>
      <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
export default function QuestionnaireModal({ visible, questionnaire, onClose, onComplete, resultsUnlocked = true }) {
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;

  const [answers, setAnswers]           = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [result, setResult]             = useState(null);

  const items = questionnaire?.items ?? [];
  const total = items.length;
  const item  = items[currentIndex];

  // Reset state whenever the modal opens
  const handleShow = useCallback(() => {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
  }, []);

  const currentValue = answers[item?.id] ?? null;
  const canProceed   = currentValue !== null && currentValue !== undefined;

  const handleNext = async () => {
    if (!canProceed) return;
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      const score   = questionnaire.score(answers);
      const saved   = await saveQuestionnaire(questionnaire.id, answers, score);
      setResult(saved);
      onComplete?.(saved);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
    else onClose();
  };

  if (!questionnaire) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      onShow={handleShow}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{questionnaire.shortTitle}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        {result ? (
          <ResultScreen questionnaire={questionnaire} score={result.score} resultsUnlocked={resultsUnlocked} onClose={onClose} />
        ) : (
          <>
            {/* ── Progress ── */}
            <ProgressBar current={currentIndex + 1} total={total} />

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Instructions shown only on first item */}
              {currentIndex === 0 && (
                <View style={styles.instructionsBox}>
                  <Text style={styles.instructionsText}>{questionnaire.instructions}</Text>
                </View>
              )}

              <Text style={styles.itemNumber}>Item {item.number} of {total}</Text>
              <Text style={styles.itemText}>{item.text}</Text>

              <View style={styles.inputArea}>
                {item.type === 'scale_0_3' && (
                  <Scale03Input
                    value={currentValue}
                    onChange={(v) => setAnswers((prev) => ({ ...prev, [item.id]: v }))}
                    options={item.options}
                  />
                )}
              </View>
            </ScrollView>

            {/* ── Nav buttons ── */}
            <View style={[styles.navRow, { paddingBottom: insets.bottom + 12 }]}>
              <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
                <Ionicons name="chevron-back" size={22} color={C.primary} />
                <Text style={styles.backBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, !canProceed && styles.nextBtnDisabled]}
                onPress={handleNext}
                disabled={!canProceed}
              >
                <Text style={styles.nextBtnText}>
                  {currentIndex < total - 1 ? 'Next' : 'Finish'}
                </Text>
                <Ionicons name="chevron-forward" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
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

  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  progressIcon: {
    width: 42, height: 42, borderRadius: 21, borderWidth: 2, borderColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  progressTrack: {
    flex: 1, height: 28, borderRadius: 14, borderWidth: 1.5,
    borderColor: C.primaryLight, backgroundColor: '#fff', overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 14, backgroundColor: C.progressFill },
  progressLabel: { fontSize: 16, fontFamily: FONTS.heading, color: C.primary, minWidth: 40, textAlign: 'right' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },

  instructionsBox: {
    backgroundColor: '#EDE0FA', borderRadius: 12, borderWidth: 1.5,
    borderColor: C.primaryLight, padding: 16, marginTop: 16, marginBottom: 8,
  },
  instructionsText: { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, color: '#3B1F6A', lineHeight: 24 },

  itemNumber: { fontSize: SIZES.label, fontFamily: FONTS.body, color: C.primaryLight, textTransform: 'uppercase', marginTop: 20, marginBottom: 6 },
  itemText:   { fontSize: 22, fontFamily: FONTS.heading, color: C.primary, lineHeight: 30, marginBottom: 28 },

  inputArea: { alignItems: 'stretch' },

  scaleCol: { gap: 12 },
  scaleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 18, paddingVertical: 14,
    borderRadius: 12, borderWidth: 2,
  },
  scaleBtnValue: { fontSize: 22, fontFamily: FONTS.heading, minWidth: 28, textAlign: 'center' },
  scaleBtnLabel: { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, flex: 1 },

  navRow: { flexDirection: 'row', paddingHorizontal: 24, paddingTop: 12, gap: 12 },
  backBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.primary, borderRadius: 14, paddingVertical: 14, gap: 4,
  },
  backBtnText: { fontSize: SIZES.body, fontFamily: FONTS.body, color: C.primary },
  nextBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, gap: 4,
  },
  nextBtnDisabled: { opacity: 0.35 },
  nextBtnText: { fontSize: SIZES.body, fontFamily: FONTS.body, color: '#fff' },

  // Result screen
  resultContainer: { flex: 1, padding: 24, justifyContent: 'center', gap: 20 },
  resultCard: {
    backgroundColor: '#fff', borderRadius: 18, borderWidth: 1.5,
    borderColor: C.primaryLight, padding: 28, alignItems: 'center', gap: 12,
  },
  resultTitle:     { fontSize: SIZES.sectionTitle, fontFamily: FONTS.heading, color: '#1E3A5F' },
  scoreBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4,
    borderWidth: 2, borderRadius: 16, paddingHorizontal: 24, paddingVertical: 10,
    marginVertical: 4,
  },
  scoreNumber:     { fontSize: 52, fontFamily: FONTS.heading },
  scoreMax:        { fontSize: 22, fontFamily: FONTS.bodyMedium },
  interpretLabel:  { fontSize: SIZES.sectionTitle, fontFamily: FONTS.heading },
  interpretDesc:   { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  referenceText:   { fontSize: 13, fontFamily: FONTS.bodyMedium, color: '#94A3B8', textAlign: 'center', lineHeight: 20, marginTop: 4 },
  pendingDesc:     { fontSize: SIZES.bodySmall, fontFamily: FONTS.bodyMedium, color: '#64748B', textAlign: 'center', lineHeight: 24 },
  doneBtn: {
    backgroundColor: C.primary, borderRadius: 14, paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: { fontSize: SIZES.body, fontFamily: FONTS.body, color: '#fff' },
});
