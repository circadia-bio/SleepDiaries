import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, KeyboardAvoidingView,
  Platform, Alert, ImageBackground, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MORNING_QUESTIONS, EVENING_QUESTIONS } from '../data/questions';
import { saveEntry } from '../storage/storage';

const BUTTON_IMAGES = {
  backDay:   require('../assets/images/back-day.png'),
  nextDay:   require('../assets/images/next-day.png'),
  backNight: require('../assets/images/back-night.png'),
  nextNight: require('../assets/images/next-night.png'),
};

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
  const adjust = (field, delta) => {
    if (field === 'hour')   onChange({ ...value, hour:   (hour   + delta + 24) % 24 });
    if (field === 'minute') onChange({ ...value, minute: (minute + delta + 60) % 60 });
  };
  const Stepper = ({ field, display }) => (
    <View style={styles.stepperCol}>
      <TouchableOpacity style={[styles.stepBtn, { backgroundColor: c.primaryLight }]} onPress={() => adjust(field, 1)}>
        <Ionicons name="caret-up" size={20} color={c.primary} />
      </TouchableOpacity>
      <Text style={[styles.stepValue, { color: c.primary }]}>{display}</Text>
      <TouchableOpacity style={[styles.stepBtn, { backgroundColor: c.primaryLight }]} onPress={() => adjust(field, -1)}>
        <Ionicons name="caret-down" size={20} color={c.primary} />
      </TouchableOpacity>
    </View>
  );
  return (
    <View style={styles.timeRow}>
      <Stepper field="hour"   display={pad(hour)} />
      <Text style={[styles.timeSep, { color: c.primary }]}>:</Text>
      <Stepper field="minute" display={pad(minute)} />
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
      <Stepper field="hours"   display={String(hours)}   unit="hrs" />
      <View style={styles.durationGap} />
      <Stepper field="minutes" display={pad(minutes)} unit="min" />
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
            style={[styles.yesNoBtn, selected ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: '#fff', borderColor: c.primary }]}
            onPress={() => onChange(opt)} activeOpacity={0.8}>
            <Text style={[styles.yesNoText, { color: selected ? '#fff' : c.primary }]}>
              {opt === 'yes' ? 'Yes' : 'No'}
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
            style={[styles.ratingBtn, selected ? { backgroundColor: c.primary, borderColor: c.primary } : { backgroundColor: '#fff', borderColor: c.primary }]}
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
      <TouchableOpacity style={[styles.numBtn, { borderColor: c.primary }]} onPress={() => onChange(clamp(value - 1, min, max))}>
        <Ionicons name="remove" size={24} color={c.primary} />
      </TouchableOpacity>
      <Text style={[styles.numValue, { color: c.primary }]}>{value}</Text>
      <TouchableOpacity style={[styles.numBtn, { borderColor: c.primary }]} onPress={() => onChange(clamp(value + 1, min, max))}>
        <Ionicons name="add" size={24} color={c.primary} />
      </TouchableOpacity>
      {unit ? <Text style={[styles.numUnit, { color: c.primary }]}>{unit}</Text> : null}
    </View>
  );
};

const MedicationInput = ({ value = [], onChange, theme }) => {
  const c = THEME[theme];
  const [expanded, setExpanded] = useState({});
  const addMed = () => {
    const newMed = { id: Date.now(), name: 'New Medication', dose: '', times: [''] };
    onChange([...value, newMed]);
    setExpanded((e) => ({ ...e, [newMed.id]: true }));
  };
  const removeMed  = (id) => onChange(value.filter((m) => m.id !== id));
  const updateMed  = (id, field, val) => onChange(value.map((m) => (m.id === id ? { ...m, [field]: val } : m)));
  const addTime    = (id) => onChange(value.map((m) => (m.id === id ? { ...m, times: [...m.times, ''] } : m)));
  const updateTime = (id, idx, val) => onChange(value.map((m) => m.id === id ? { ...m, times: m.times.map((t, i) => (i === idx ? val : t)) } : m));
  return (
    <View style={styles.medContainer}>
      {value.map((med) => (
        <View key={med.id} style={[styles.medCard, { backgroundColor: c.cardBg, borderColor: c.primaryLight }]}>
          <View style={styles.medHeader}>
            <TextInput style={[styles.medNameInput, { color: c.primary }]} value={med.name}
              onChangeText={(t) => updateMed(med.id, 'name', t)} placeholder="Medication name" placeholderTextColor="#aaa" />
            <View style={styles.medHeaderActions}>
              <TouchableOpacity onPress={() => removeMed(med.id)} style={styles.medIconBtn}>
                <Ionicons name="trash-outline" size={20} color={c.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setExpanded((e) => ({ ...e, [med.id]: !e[med.id] }))} style={styles.medIconBtn}>
                <Ionicons name={expanded[med.id] ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'} size={22} color={c.primary} />
              </TouchableOpacity>
            </View>
          </View>
          {expanded[med.id] && (
            <View style={styles.medDetail}>
              <View style={styles.medRow}>
                <Text style={[styles.medLabel, { color: c.primary }]}>Dose:</Text>
                <TextInput style={[styles.medDoseInput, { borderColor: c.primaryLight, color: c.primary }]}
                  value={med.dose} onChangeText={(t) => updateMed(med.id, 'dose', t)}
                  placeholder="e.g. 5" keyboardType="numeric" placeholderTextColor="#aaa" />
                <Text style={[styles.medLabel, { color: c.primary }]}>mg</Text>
              </View>
              {med.times.map((t, i) => (
                <View key={i} style={styles.medRow}>
                  <Text style={[styles.medLabel, { color: c.primary }]}>Time:</Text>
                  <TextInput style={[styles.medTimeInput, { borderColor: c.primaryLight, color: c.primary }]}
                    value={t} onChangeText={(v) => updateTime(med.id, i, v)} placeholder="e.g. 22:30" placeholderTextColor="#aaa" />
                </View>
              ))}
              <TouchableOpacity style={[styles.addTimeBtn, { borderColor: c.primary }]} onPress={() => addTime(med.id)}>
                <Ionicons name="add-circle-outline" size={18} color={c.primary} />
                <Text style={[styles.addTimeBtnText, { color: c.primary }]}>Add New Time</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}
      <TouchableOpacity style={[styles.addMedBtn, { backgroundColor: c.primary }]} onPress={addMed}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addMedBtnText}>Add Medicine</Text>
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

// ─── Progress Bar matching Figma design ───────────────────────────────────────
const ProgressBar = ({ current, total, theme }) => {
  const c = THEME[theme];
  const progress = current / total;
  return (
    <View style={styles.progressRow}>
      {/* Person icon */}
      <View style={[styles.progressIcon, { borderColor: c.primary }]}>
        <Ionicons name="person-outline" size={20} color={c.primary} />
      </View>

      {/* Track */}
      <View style={[styles.progressTrack, {
        borderColor: c.progressTrackBorder,
        backgroundColor: c.progressTrackBg,
      }]}>
        <View style={[styles.progressFill, {
          width: `${progress * 100}%`,
          backgroundColor: c.progressFill,
        }]} />
      </View>

      {/* Counter */}
      <Text style={[styles.progressLabel, { color: c.primary }]}>
        {current}/{total}
      </Text>
    </View>
  );
};

export default function QuestionnaireScreen() {
  const router   = useRouter();
  const rawInsets = useSafeAreaInsets();
  const insets   = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const { entryType = 'morning' } = useLocalSearchParams();
  const allQuestions = entryType === 'morning' ? MORNING_QUESTIONS : EVENING_QUESTIONS;
  const theme = entryType === 'morning' ? 'morning' : 'evening';
  const c = THEME[theme];

  const [answers, setAnswers]           = useState(() => buildInitialAnswers(allQuestions));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [done, setDone]                 = useState(false);

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
    if (!canProceed()) return;
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      await saveEntry(entryType, answers);
      setDone(true);
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
          source={isMorning
            ? require('../assets/images/splash-end-morning.png')
            : require('../assets/images/splash-end-night.png')
          }
          style={styles.splashImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
    );
  }

  if (!question) return null;

  return (
    <ImageBackground
      source={require('../assets/images/questionnaire-bg.png')}
      style={styles.root}
      imageStyle={Platform.OS === 'web' ? { width: '100%', height: '100%' } : undefined}
      resizeMode="cover"
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* ── Progress bar ── */}
        <View style={{ paddingTop: insets.top + 8 }}>
          <ProgressBar current={currentIndex + 1} total={total} theme={theme} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <Text style={[styles.questionText, { color: c.primary }]}>
            {question.number}. {question.text}
          </Text>
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
          <TouchableOpacity onPress={handleBack} activeOpacity={0.8} style={styles.navBtn}>
            <Image source={theme === 'morning' ? BUTTON_IMAGES.backDay : BUTTON_IMAGES.backNight} style={styles.navBtnImage} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={canProceed() ? 0.8 : 1}
            disabled={!canProceed()}
            style={[styles.navBtn, !canProceed() && styles.navBtnDisabled]}
          >
            <Image source={theme === 'morning' ? BUTTON_IMAGES.nextDay : BUTTON_IMAGES.nextNight} style={styles.navBtnImage} resizeMode="contain" />
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  questionText:  { fontSize: 26, fontWeight: '800', marginTop: 24, marginBottom: 40, lineHeight: 34 },
  inputArea:     { alignItems: 'center' },

  // ── Progress bar — matches Figma design ──
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
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  progressTrack: {
    flex: 1,
    height: 28,              // thick like Figma
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
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

  // ── Inputs ──
  timeRow:       { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperCol:    { alignItems: 'center', gap: 12 },
  stepBtn:       { width: 52, height: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepValue:     { fontSize: 40, fontWeight: '800', minWidth: 52, textAlign: 'center' },
  stepUnit:      { fontSize: 13, fontWeight: '600', marginTop: 4 },
  timeSep:       { fontSize: 40, fontWeight: '800', marginTop: -12 },
  durationRow:   { flexDirection: 'row', alignItems: 'center' },
  durationGap:   { width: 32 },
  yesNoRow:      { flexDirection: 'row', gap: 20, marginTop: 8 },
  yesNoBtn:      { width: 130, height: 56, borderRadius: 28, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  yesNoText:     { fontSize: 20, fontWeight: '700' },
  ratingCol:     { width: '100%', gap: 12 },
  ratingBtn:     { width: '100%', paddingVertical: 14, borderRadius: 12, borderWidth: 2, alignItems: 'center' },
  ratingText:    { fontSize: 16, fontWeight: '600' },
  numberRow:     { flexDirection: 'row', alignItems: 'center', gap: 20 },
  numBtn:        { width: 52, height: 52, borderRadius: 26, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  numValue:      { fontSize: 48, fontWeight: '800', minWidth: 60, textAlign: 'center' },
  numUnit:       { fontSize: 16, fontWeight: '600', marginLeft: 4 },
  medContainer:  { width: '100%', gap: 12 },
  medCard:       { borderRadius: 12, borderWidth: 1.5, overflow: 'hidden' },
  medHeader:     { flexDirection: 'row', alignItems: 'center', padding: 14, justifyContent: 'space-between' },
  medNameInput:  { fontSize: 16, fontWeight: '700', flex: 1 },
  medHeaderActions: { flexDirection: 'row', gap: 8 },
  medIconBtn:    { padding: 4 },
  medDetail:     { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  medRow:        { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medLabel:      { fontSize: 14, fontWeight: '600', minWidth: 40 },
  medDoseInput:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, minWidth: 60, textAlign: 'center' },
  medTimeInput:  { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: 14, minWidth: 110 },
  addTimeBtn:    { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, gap: 6, alignSelf: 'flex-start', marginTop: 4 },
  addTimeBtnText:{ fontSize: 14, fontWeight: '600' },
  addMedBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 14, gap: 8 },
  addMedBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  freeText:      { width: '100%', borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 16, minHeight: 120 },
  navRow:         { flexDirection: 'row', paddingHorizontal: 36, paddingTop: 12, gap: 4 },
  navBtn:         { flex: 1, height: 52 },
  navBtnDisabled: { opacity: 0.4 },
  navBtnImage:    { width: '100%', height: '100%' },

  splashContainer: {
    flex: 1,
    backgroundColor: '#C8DFF5',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
});
