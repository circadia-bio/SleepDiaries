/**
 * app/questionnaire.jsx — Step-by-step questionnaire screen
 *
 * Drives both the morning (13 questions) and evening (5 questions) entries.
 * The entry type is passed as a route param: { entryType: 'morning' | 'evening' }.
 *
 * Key behaviours:
 *   - buildFlow() computes the visible question sequence at runtime, inserting
 *     conditional follow-up questions based on previous answers.
 *   - Each question type renders a dedicated input component (TimeInput,
 *     DurationInput, YesNoInput, RatingInput, NumberInput, MedicationInput,
 *     TextInputField).
 *   - canProceed() blocks the Next button until required questions are answered.
 *   - On final question, saves the entry and shows a themed completion splash
 *     screen, then auto-navigates home after 2.5 seconds.
 *   - Amber theme for morning entries, blue for evening entries.
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Pressable, StyleSheet,
  ScrollView, TextInput, KeyboardAvoidingView,
  Platform, Image, Alert,
} from 'react-native';
import ScreenBackground from '../components/ScreenBackground';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MORNING_QUESTIONS, EVENING_QUESTIONS } from '../data/useQuestions';
import { saveEntry, loadMedicationPresets } from '../storage/storage';
import t from '../i18n';
import { BackButton, NextButton } from '../components/NavButtons';
import IMAGES from '../assets/images';

const THEME = {
  morning: {
    primary:      '#E07A20',
    primaryLight: '#F5C96A',
    progressBg:   '#F5DEB3',
    background:   'transparent',
    cardBg:       '#FFF8EE',
    progressFill: '#E07A20',
    progressTrackBg: '#FFFFFF',
    progressTrackBorder: '#F5C96A',
  },
  evening: {
    primary:      '#2A6CB5',
    primaryLight: '#7EB0E0',
    progressBg:   '#C8DFF5',
    background:   'transparent',
    cardBg:       '#EEF5FF',
    progressFill: '#4A9FE0',
    progressTrackBg: '#FFFFFF',
    progressTrackBorder: '#A8D0F0',
  },
};

const pad = (n) => String(n).padStart(2, '0');
const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

const buildInitialAnswers = (questions) => {
  const answers = {};
  for (const q of questions) {
    switch (q.type) {
      case 'time':       answers[q.id] = q.defaultValue ?? { hour: 12, minute: 0 }; break;
      case 'duration':   answers[q.id] = q.defaultValue ?? { hours: 0, minutes: 0 }; break;
      case 'number':     answers[q.id] = q.defaultValue ?? 0; break;
      case 'medication': answers[q.id] = []; break;
      case 'text_input': answers[q.id] = ''; break;
      default:           answers[q.id] = null;
    }
  }
  return answers;
};

const buildFlow = (questions, answers) => {
  const flow = [];
  for (const q of questions) {
    if (q.conditionalOn) continue;
    flow.push(q);
    if (q.followUp) {
      const followUp = questions.find((x) => x.id === q.followUp);
      if (followUp && answers[q.id] === 'yes') flow.push(followUp);
    }
  }
  return flow;
};

const TimeInput = ({ value, onChange, theme }) => {
  const { hour, minute } = value;
  const c = THEME[theme];
  const intervalRef = useRef(null);
  const valueRef    = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  const adjust = useCallback((field, delta) => {
    const p = valueRef.current;
    if (field === 'hour')   onChange({ ...p, hour:   (p.hour   + delta + 24) % 24 });
    if (field === 'minute') onChange({ ...p, minute: (p.minute + delta + 60) % 60 });
  }, [onChange]);

  const startLongPress = useCallback((field, delta) => {
    adjust(field, delta);
    intervalRef.current = setInterval(() => adjust(field, delta), 300);
  }, [adjust]);

  const stopLongPress = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopLongPress(), []);

  return (
    <View style={styles.stepperWrapper}>
      <View style={styles.timeRow}>
        {/* Hour stepper */}
        <View style={styles.stepperCol}>
          <Pressable style={[styles.stepBtn, { backgroundColor: c.primaryLight }]}
            onPress={() => adjust('hour', 1)}
            onLongPress={() => startLongPress('hour', 1)}
            onPressOut={stopLongPress}
            delayLongPress={300}>
            <Ionicons name="caret-up" size={20} color={c.primary} />
          </Pressable>
          <Text style={[styles.stepValue, { color: c.primary }]}>{pad(hour)}</Text>
          <Pressable style={[styles.stepBtn, { backgroundColor: c.primaryLight }]}
            onPress={() => adjust('hour', -1)}
            onLongPress={() => startLongPress('hour', -1)}
            onPressOut={stopLongPress}
            delayLongPress={300}>
            <Ionicons name="caret-down" size={20} color={c.primary} />
          </Pressable>
        </View>
        <Text style={[styles.timeSep, { color: c.primary }]}>:</Text>
        {/* Minute stepper */}
        <View style={styles.stepperCol}>
          <Pressable style={[styles.stepBtn, { backgroundColor: c.primaryLight }]}
            onPress={() => adjust('minute', 5)}
            onLongPress={() => startLongPress('minute', 1)}
            onPressOut={stopLongPress}
            delayLongPress={300}>
            <Ionicons name="caret-up" size={20} color={c.primary} />
          </Pressable>
          <Text style={[styles.stepValue, { color: c.primary }]}>{pad(minute)}</Text>
          <Pressable style={[styles.stepBtn, { backgroundColor: c.primaryLight }]}
            onPress={() => adjust('minute', -5)}
            onLongPress={() => startLongPress('minute', -1)}
            onPressOut={stopLongPress}
            delayLongPress={300}>
            <Ionicons name="caret-down" size={20} color={c.primary} />
          </Pressable>
        </View>
      </View>
      <Text style={[styles.stepHint, { color: c.primary }]}>hold for ±1 min</Text>
    </View>
  );
};

const DurationInput = ({ value, onChange, theme }) => {
  const { hours, minutes } = value;
  const c = THEME[theme];
  const Stepper = ({ field, display, unit }) => (
    <View style={styles.stepperCol}>
      <TouchableOpacity style={[styles.stepBtn, { backgroundColor: c.primaryLight }]}
        onPress={() => onChange({ ...value, [field]: clamp(value[field] + (field === 'hours' ? 1 : 5), 0, field === 'hours' ? 23 : 55) })}>
        <Ionicons name="caret-up" size={20} color={c.primary} />
      </TouchableOpacity>
      <Text style={[styles.stepValue, { color: c.primary }]}>{display}</Text>
      <TouchableOpacity style={[styles.stepBtn, { backgroundColor: c.primaryLight }]}
        onPress={() => onChange({ ...value, [field]: clamp(value[field] - (field === 'hours' ? 1 : 5), 0, field === 'hours' ? 23 : 55) })}>
        <Ionicons name="caret-down" size={20} color={c.primary} />
      </TouchableOpacity>
      <Text style={[styles.stepUnit, { color: c.primary }]}>{unit}</Text>
    </View>
  );
  return (
    <View style={styles.durationRow}>
      <Stepper field="hours"   display={String(hours)}   unit={t('questionnaire.hrs')} />
      <View style={styles.durationGap} />
      <Stepper field="minutes" display={pad(minutes)} unit={t('questionnaire.min')} />
    </View>
  );
};

const YesNoInput = ({ value, onChange, theme }) => {
  const c = THEME[theme];
  return (
    <View style={styles.yesNoRow}>
      {['yes', 'no'].map((opt) => {
        const selected = value === opt;
        return (
          <TouchableOpacity key={opt}
            style={[styles.yesNoBtn, selected ? { backgroundColor: c.primary, borderColor: c.primary } : {}]}
            onPress={() => onChange(opt)} activeOpacity={0.8}>
            <Text style={[styles.yesNoText, { color: selected ? '#fff' : c.primary }]}>
              {opt === 'yes' ? t('questionnaire.yes') : t('questionnaire.no')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const RatingInput = ({ value, onChange, options, theme }) => {
  const c = THEME[theme];
  return (
    <View style={styles.ratingCol}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <TouchableOpacity key={opt.value}
            style={[styles.ratingBtn, selected ? { backgroundColor: c.primary, borderColor: c.primary } : {}]}
            onPress={() => onChange(opt.value)} activeOpacity={0.8}>
            <Text style={[styles.ratingText, { color: selected ? '#fff' : c.primary }]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const NumberInput = ({ value, onChange, min = 0, max = 99, unit = '', theme }) => {
  const c = THEME[theme];
  return (
    <View style={styles.numberRow}>
      <TouchableOpacity style={styles.numBtn} onPress={() => onChange(clamp(value - 1, min, max))}>
        <Ionicons name="remove" size={24} color={c.primary} />
      </TouchableOpacity>
      <Text style={[styles.numValue, { color: c.primary }]}>{value}</Text>
      <TouchableOpacity style={styles.numBtn} onPress={() => onChange(clamp(value + 1, min, max))}>
        <Ionicons name="add" size={24} color={c.primary} />
      </TouchableOpacity>
      {unit ? <Text style={[styles.numUnit, { color: c.primary }]}>{unit}</Text> : null}
    </View>
  );
};

const MedTimeInput = ({ value = '', onChange, color, borderColor }) => {
  const parse = (v) => {
    const [h, m] = (v || '').split(':').map(Number);
    return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
  };
  const { h, m } = parse(value);
  const fmt = (n) => String(n).padStart(2, '0');
  const update = (newH, newM) => onChange(`${fmt(newH)}:${fmt(newM)}`);
  const MedStepper = ({ val, max, onVal }) => (
    <View style={styles.medStepper}>
      <TouchableOpacity onPress={() => onVal(val <= 0 ? max : val - 1)}
        style={[styles.medStepBtn, { borderColor }]}>
        <Ionicons name="remove" size={14} color={color} />
      </TouchableOpacity>
      <Text style={[styles.medStepVal, { color }]}>{fmt(val)}</Text>
      <TouchableOpacity onPress={() => onVal(val >= max ? 0 : val + 1)}
        style={[styles.medStepBtn, { borderColor }]}>
        <Ionicons name="add" size={14} color={color} />
      </TouchableOpacity>
    </View>
  );
  return (
    <View style={styles.medTimeRow}>
      <MedStepper val={h} max={23} onVal={(v) => update(v, m)} />
      <Text style={[styles.medTimeSep, { color }]}>:</Text>
      <MedStepper val={m} max={59} onVal={(v) => update(h, v)} />
    </View>
  );
};

const MedicationInput = ({ value = [], onChange, theme }) => {
  const c = THEME[theme];
  const [expanded, setExpanded] = useState({});
  const addMed = () => {
    const newMed = { id: Date.now(), name: '', dose: '', times: [''] };
    onChange([...value, newMed]);
    setExpanded((e) => ({ ...e, [newMed.id]: true }));
  };
  const removeMed  = (id) => onChange(value.filter((m) => m.id !== id));
  const updateMed  = (id, field, val) => onChange(value.map((m) => (m.id === id ? { ...m, [field]: val } : m)));
  const addTime    = (id) => onChange(value.map((m) => (m.id === id ? { ...m, times: [...m.times, ''] } : m)));
  const removeTime = (id, idx) => onChange(value.map((m) => m.id === id ? { ...m, times: m.times.filter((_, i) => i !== idx) } : m));
  const updateTime = (id, idx, val) => onChange(value.map((m) => m.id === id ? { ...m, times: m.times.map((tm, i) => (i === idx ? val : tm)) } : m));
  return (
    <View style={styles.medContainer}>
      {value.map((med) => (
        <View key={med.id} style={[styles.medCard, { backgroundColor: c.cardBg, borderColor: c.primaryLight }]}>
          {/* Card header: actions row */}
          <View style={styles.medHeader}>
            <TouchableOpacity onPress={() => setExpanded((e) => ({ ...e, [med.id]: !e[med.id] }))}
              style={[styles.medExpandBtn, { borderColor: c.primaryLight }]}>
              <Ionicons name={expanded[med.id] ? 'chevron-up' : 'chevron-down'} size={16} color={c.primary} />
              <Text style={[styles.medExpandLabel, { color: c.primary }]}>
                {expanded[med.id] ? t('questionnaire.collapse') : t('questionnaire.doseAndTime')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeMed(med.id)} style={styles.medIconBtn}>
              <Ionicons name="trash-outline" size={20} color={c.primary} />
            </TouchableOpacity>
          </View>
          {/* Name field — always visible, clearly labelled */}
          <View style={styles.medNameRow}>
            <Text style={[styles.medLabel, { color: c.primary }]}>{t('questionnaire.medName')}</Text>
            <TextInput
              style={[styles.medNameInput, { borderColor: c.primaryLight, color: c.primary, backgroundColor: 'rgba(255,255,255,0.6)' }]}
              value={med.name}
              onChangeText={(txt) => updateMed(med.id, 'name', txt)}
              placeholder={t('questionnaire.medNamePlaceholder')}
              placeholderTextColor="#aaa"
            />
          </View>
          {/* Expandable: dose + times */}
          {expanded[med.id] && (
            <View style={styles.medDetail}>
              <View style={styles.medRow}>
                <Text style={[styles.medLabel, { color: c.primary }]}>{t('questionnaire.dose')}</Text>
                <TouchableOpacity
                  style={[styles.medStepBtn, { borderColor: c.primaryLight }]}
                  onPress={() => updateMed(med.id, 'dose', String(Math.max(0, (parseFloat(med.dose) || 0) - 5)))}>
                  <Ionicons name="remove" size={14} color={c.primary} />
                </TouchableOpacity>
                <TextInput style={[styles.medDoseInput, { borderColor: c.primaryLight, color: c.primary }]}
                  value={med.dose} onChangeText={(txt) => updateMed(med.id, 'dose', txt)}
                  placeholder="0" keyboardType="numeric" placeholderTextColor="#aaa" />
                <TouchableOpacity
                  style={[styles.medStepBtn, { borderColor: c.primaryLight }]}
                  onPress={() => updateMed(med.id, 'dose', String((parseFloat(med.dose) || 0) + 5))}>
                  <Ionicons name="add" size={14} color={c.primary} />
                </TouchableOpacity>
                <Text style={[styles.medLabel, { color: c.primary }]}>{t('questionnaire.mgUnit')}</Text>
              </View>
              {med.times.map((tm, i) => (
                <View key={i} style={styles.medRow}>
                  <Text style={[styles.medLabel, { color: c.primary }]}>{t('questionnaire.time')}</Text>
                  <MedTimeInput value={tm} onChange={(v) => updateTime(med.id, i, v)}
                    color={c.primary} borderColor={c.primaryLight} />
                  {med.times.length > 1 && (
                    <TouchableOpacity onPress={() => removeTime(med.id, i)} style={styles.medIconBtn}>
                      <Ionicons name="close-circle-outline" size={20} color={c.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              <TouchableOpacity style={[styles.addTimeBtn, { borderColor: c.primary }]} onPress={() => addTime(med.id)}>
                <Ionicons name="add-circle-outline" size={18} color={c.primary} />
                <Text style={[styles.addTimeBtnText, { color: c.primary }]}>{t('questionnaire.addNewTime')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      <TouchableOpacity style={[styles.addMedBtn, { backgroundColor: c.primary }]} onPress={addMed}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addMedBtnText}>{t('questionnaire.addMedicine')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const TextInputField = ({ value, onChange, placeholder, theme }) => {
  const c = THEME[theme];
  return (
    <TextInput style={[styles.freeText, { borderColor: c.primaryLight, color: c.primary }]}
      value={value} onChangeText={onChange} placeholder={placeholder}
      placeholderTextColor="#aaa" multiline numberOfLines={4} textAlignVertical="top" />
  );
};

const ProgressBar = ({ current, total, theme }) => {
  const c = THEME[theme];
  const progress = current / total;
  return (
    <View style={styles.progressRow}>
      <View style={[styles.progressIcon]}>
        <Ionicons name="person-outline" size={20} color={c.primary} />
      </View>
      <View style={[styles.progressTrack, { backgroundColor: c.primary + '15', borderColor: 'rgba(0,0,0,0.08)' }]}>
        <View style={[styles.progressFill, {
          width: `${progress * 100}%`,
          backgroundColor: c.progressFill,
        }]} />
      </View>
      <Text style={[styles.progressLabel, { color: c.primary }]}>
        {current}/{total}
      </Text>
    </View>
  );
};

export default function QuestionnaireScreen() {
  const router    = useRouter();
  const rawInsets = useSafeAreaInsets();
  const insets    = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const { entryType = 'morning' } = useLocalSearchParams();
  const allQuestions = entryType === 'morning' ? MORNING_QUESTIONS : EVENING_QUESTIONS;
  const theme = entryType === 'morning' ? 'morning' : 'evening';

  const [answers, setAnswers]           = useState(() => buildInitialAnswers(allQuestions));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone]                 = useState(false);
  const [saving, setSaving]             = useState(false);

  // Prepopulate medication questions from saved presets
  useEffect(() => {
    loadMedicationPresets().then((presets) => {
      if (presets.length === 0) return;
      const medKey = entryType === 'morning' ? 'mq10b' : 'eq4b';
      setAnswers((prev) => ({
        ...prev,
        [medKey]: presets.map((p) => ({ ...p, id: Date.now() + Math.random() })),
      }));
    });
  }, []);

  const flow     = buildFlow(allQuestions, answers);
  const total    = flow.length;
  const question = flow[currentIndex];

  const setAnswer = useCallback((id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const currentValue = answers[question?.id] ?? null;

  const canProceed = () => {
    if (!question) return false;
    if (question.optional) return true;
    const val = answers[question.id];
    if (question.type === 'yes_no') return val === 'yes' || val === 'no';
    if (question.type === 'rating') return val !== null && val !== undefined;
    return true;
  };

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => router.replace('/(tabs)/home'), 2500);
    return () => clearTimeout(timer);
  }, [done]);

  const handleNext = async () => {
    if (!canProceed() || saving) return;
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setSaving(true);
      try {
        await saveEntry(entryType, answers);
        setDone(true);
      } catch (e) {
        setSaving(false);
        Alert.alert(
          t('questionnaire.saveErrorTitle') || 'Could not save entry',
          t('questionnaire.saveErrorBody') || 'Something went wrong saving your entry. Please try again.',
          [{ text: t('common.ok') || 'OK' }],
        );
      }
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
    else router.back();
  };

  if (done) {
    const isMorning = entryType === 'morning';
    return (
      <TouchableOpacity
        style={styles.splashContainer}
        activeOpacity={1}
        onPress={() => router.replace('/(tabs)/home')}
      >
        <Image
          source={isMorning ? IMAGES.splashEndMorning : IMAGES.splashEndNight}
          style={styles.splashImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  if (!question) return null;

  const c = THEME[theme];

  return (
    <View style={styles.root}>
      <ScreenBackground variant="questionnaire" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* ── Progress bar ── */}
        <View style={{ paddingTop: insets.top + 8 }}>
          <ProgressBar current={currentIndex + 1} total={total} theme={theme} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.questionText, { color: c.primary }, question.hint && { marginBottom: 8 }]}>
            {question.number}. {question.text}
          </Text>
          {question.hint && (
            <Text style={[styles.questionHint, { color: c.primary }]}>{question.hint}</Text>
          )}
          <View style={styles.inputArea}>
            {question.type === 'time'       && <TimeInput       value={currentValue} onChange={(v) => setAnswer(question.id, v)} theme={theme} />}
            {question.type === 'duration'   && <DurationInput   value={currentValue} onChange={(v) => setAnswer(question.id, v)} theme={theme} />}
            {question.type === 'yes_no'     && <YesNoInput      value={currentValue} onChange={(v) => setAnswer(question.id, v)} theme={theme} />}
            {question.type === 'rating'     && <RatingInput     value={currentValue} onChange={(v) => setAnswer(question.id, v)} options={question.options} theme={theme} />}
            {question.type === 'number'     && <NumberInput     value={currentValue} onChange={(v) => setAnswer(question.id, v)} min={question.min} max={question.max} unit={question.unit} theme={theme} />}
            {question.type === 'medication' && <MedicationInput value={currentValue} onChange={(v) => setAnswer(question.id, v)} theme={theme} />}
            {question.type === 'text_input' && <TextInputField  value={currentValue} onChange={(v) => setAnswer(question.id, v)} placeholder={question.placeholder} theme={theme} />}
          </View>
        </ScrollView>

        {/* ── Nav buttons ── */}
        <View style={[styles.navRow, { paddingBottom: insets.bottom + 12 }]}>
          <BackButton onPress={handleBack} theme={theme} />
          <NextButton onPress={handleNext} theme={theme} disabled={!canProceed()} />
        </View>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  questionText:  { fontSize: 26, fontWeight: '800', marginTop: 24, marginBottom: 40, lineHeight: 34 },
  questionHint:  { fontSize: 13, fontWeight: '500', fontStyle: 'italic', opacity: 0.55, marginBottom: 32 },
  inputArea:     { alignItems: 'center' },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  progressIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  progressTrack: {
    flex: 1,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  progressFill: {
    height: '100%',
    borderRadius: 14,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'right',
  },

  stepperWrapper: { alignItems: 'center', gap: 10 },
  stepHint:      { fontSize: 12, opacity: 0.5, fontWeight: '500' },
  timeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperCol:    { alignItems: 'center', gap: 12 },
  stepBtn:       { width: 52, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepValue:     { fontSize: 40, fontWeight: '800', minWidth: 52, textAlign: 'center' },
  stepUnit:      { fontSize: 13, fontWeight: '600', marginTop: 4 },
  timeSep:       { fontSize: 40, fontWeight: '800', marginTop: -12 },
  durationRow:   { flexDirection: 'row', alignItems: 'center' },
  durationGap:   { width: 32 },
  yesNoRow:      { flexDirection: 'row', gap: 20, marginTop: 8 },
  yesNoBtn:      { width: 130, height: 56, borderRadius: 28, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  yesNoText:     { fontSize: 20, fontWeight: '700' },
  ratingCol:     { width: '100%', gap: 12 },
  ratingBtn:     { width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.72)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  ratingText:    { fontSize: 16, fontWeight: '600' },
  numberRow:     { flexDirection: 'row', alignItems: 'center', gap: 20 },
  numBtn:        { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.72)', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  numValue:      { fontSize: 48, fontWeight: '800', minWidth: 60, textAlign: 'center' },
  numUnit:       { fontSize: 16, fontWeight: '600', marginLeft: 4 },
  medContainer:  { width: '100%', gap: 12 },
  medCard:       { borderRadius: 14, borderWidth: 1, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.72)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  medHeader:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, justifyContent: 'space-between' },
  medExpandBtn:  { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 0, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  medExpandLabel:{ fontSize: 12, fontWeight: '600' },
  medNameRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  medNameInput:  { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15, fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.8)' },
  medIconBtn:    { padding: 4 },
  medDetail:     { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.07)', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  medRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medLabel:      { fontSize: 14, fontWeight: '600', minWidth: 40 },
  medDoseInput:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, minWidth: 60, textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.8)' },
  medTimeRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  medTimeSep:    { fontSize: 18, fontWeight: '800', marginHorizontal: 2 },
  medStepper:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  medStepBtn:    { width: 28, height: 28, borderRadius: 14, borderWidth: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)' },
  medStepVal:    { fontSize: 16, fontWeight: '700', minWidth: 26, textAlign: 'center' },
  addTimeBtn:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 6, alignSelf: 'flex-start', marginTop: 4, backgroundColor: 'rgba(255,255,255,0.5)' },
  addTimeBtnText:{ fontSize: 14, fontWeight: '600' },
  addMedBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8 },
  addMedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  freeText:      { width: '100%', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 120, backgroundColor: 'rgba(255,255,255,0.72)' },

  navRow: {
    flexDirection: 'row',
    paddingHorizontal: 36,
    paddingTop: 12,
    gap: 12,
  },

  splashContainer: { flex: 1, backgroundColor: '#C8DFF5' },
  splashImage:     { width: '100%', height: '100%' },
});
