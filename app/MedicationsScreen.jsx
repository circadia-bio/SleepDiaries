/**
 * app/MedicationsScreen.jsx — Medication presets screen
 *
 * Lets participants save their regular medications (name, dose, usual times).
 * These presets are automatically loaded into the medication questions
 * (mq10b and eq4b) when starting a diary entry, saving re-entry each day.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONTS, SIZES } from '../theme/typography';
import { loadMedicationPresets, saveMedicationPresets } from '../storage/storage';
import t from '../i18n';

const ACCENT   = '#4A7BB5';
const ACCENT_L = '#D6E8F7';
const BORDER   = '#B0CCEE';
const BG       = '#EEF5FF';
const CARD     = '#fff';
const TEXT     = '#1E3A5F';
const MUTED    = '#94A3B8';

const MedTimeInput = ({ value = '', onChange }) => {
  const parse = (v) => {
    const [h, m] = (v || '').split(':').map(Number);
    return { h: isNaN(h) ? 0 : h, m: isNaN(m) ? 0 : m };
  };
  const { h, m } = parse(value);
  const fmt = (n) => String(n).padStart(2, '0');
  const update = (newH, newM) => onChange(`${fmt(newH)}:${fmt(newM)}`);
  const MedStepper = ({ val, max, onVal }) => (
    <View style={mtStyles.stepper}>
      <TouchableOpacity onPress={() => onVal(val <= 0 ? max : val - 1)} style={mtStyles.btn}>
        <Ionicons name="remove" size={14} color={ACCENT} />
      </TouchableOpacity>
      <Text style={mtStyles.val}>{fmt(val)}</Text>
      <TouchableOpacity onPress={() => onVal(val >= max ? 0 : val + 1)} style={mtStyles.btn}>
        <Ionicons name="add" size={14} color={ACCENT} />
      </TouchableOpacity>
    </View>
  );
  return (
    <View style={mtStyles.row}>
      <MedStepper val={h} max={23} onVal={(v) => update(v, m)} />
      <Text style={mtStyles.sep}>:</Text>
      <MedStepper val={m} max={59} onVal={(v) => update(h, v)} />
    </View>
  );
};

const mtStyles = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sep:     { fontSize: 18, fontWeight: '800', color: TEXT, marginHorizontal: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  btn:     { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', justifyContent: 'center' },
  val:     { fontSize: 16, fontWeight: '700', minWidth: 26, textAlign: 'center', color: TEXT },
});

export default function MedicationsScreen() {
  const router = useRouter();
  const [presets, setPresets] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadMedicationPresets().then(setPresets);
  }, []);

  const persist = useCallback(async (next) => {
    setPresets(next);
    setDirty(true);
    await saveMedicationPresets(next);
  }, []);

  const addMed = () => {
    const id = Date.now();
    const next = [...presets, { id, name: '', dose: '', times: [''] }];
    setExpanded((e) => ({ ...e, [id]: true }));
    persist(next);
  };

  const removeMed = (id) => persist(presets.filter((m) => m.id !== id));

  const updateMed = (id, field, val) =>
    persist(presets.map((m) => (m.id === id ? { ...m, [field]: val } : m)));

  const addTime = (id) =>
    persist(presets.map((m) => (m.id === id ? { ...m, times: [...m.times, ''] } : m)));

  const removeTime = (id, idx) =>
    persist(presets.map((m) =>
      m.id === id ? { ...m, times: m.times.filter((_, i) => i !== idx) } : m
    ));

  const updateTime = (id, idx, val) =>
    persist(presets.map((m) =>
      m.id === id ? { ...m, times: m.times.map((tm, i) => (i === idx ? val : tm)) } : m
    ));

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={TEXT} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: FONTS.heading }]}>
          {t('medications.title')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Text style={[styles.hint, { fontFamily: FONTS.bodyMedium }]}>
            {t('medications.hint')}
          </Text>

          {presets.length === 0 && (
            <View style={styles.emptyCard}>
              <Ionicons name="medkit-outline" size={36} color={MUTED} />
              <Text style={[styles.emptyText, { fontFamily: FONTS.bodyMedium }]}>
                {t('medications.empty')}
              </Text>
            </View>
          )}

          {presets.map((med) => (
            <View key={med.id} style={styles.card}>
              {/* Card header: actions row */}
              <View style={styles.cardHeader}>
                <TouchableOpacity
                  onPress={() => setExpanded((e) => ({ ...e, [med.id]: !e[med.id] }))}
                  style={styles.expandBtn}
                >
                  <Ionicons
                    name={expanded[med.id] ? 'chevron-up' : 'chevron-down'}
                    size={16} color={ACCENT}
                  />
                  <Text style={[styles.expandLabel, { fontFamily: FONTS.body }]}>
                    {expanded[med.id] ? t('questionnaire.collapse') : t('questionnaire.doseAndTime')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeMed(med.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={22} color="#C0392B" />
                </TouchableOpacity>
              </View>

              {/* Name field — always visible, clearly labelled */}
              <View style={styles.nameRow}>
                <Text style={[styles.detailLabel, { fontFamily: FONTS.body }]}>
                  {t('questionnaire.medName')}
                </Text>
                <TextInput
                  style={[styles.nameInput, { fontFamily: FONTS.body }]}
                  value={med.name}
                  onChangeText={(v) => updateMed(med.id, 'name', v)}
                  placeholder={t('medications.namePlaceholder')}
                  placeholderTextColor={MUTED}
                />
              </View>

              {/* Expanded detail */}
              {expanded[med.id] && (
                <View style={styles.cardDetail}>
                  {/* Dose */}
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { fontFamily: FONTS.body }]}>
                      {t('questionnaire.dose')}
                    </Text>
                    <TextInput
                      style={[styles.doseInput, { fontFamily: FONTS.bodyMedium }]}
                      value={med.dose}
                      onChangeText={(v) => updateMed(med.id, 'dose', v)}
                      placeholder={t('questionnaire.dosePlaceholder')}
                      placeholderTextColor={MUTED}
                      keyboardType="numeric"
                    />
                    <Text style={[styles.detailLabel, { fontFamily: FONTS.body }]}>
                      {t('questionnaire.mgUnit')}
                    </Text>
                  </View>

                  {/* Times */}
                  {med.times.map((tm, i) => (
                    <View key={i} style={styles.detailRow}>
                      <Text style={[styles.detailLabel, { fontFamily: FONTS.body }]}>
                        {t('questionnaire.time')}
                      </Text>
                      <MedTimeInput value={tm} onChange={(v) => updateTime(med.id, i, v)} />
                      {med.times.length > 1 && (
                        <TouchableOpacity onPress={() => removeTime(med.id, i)} style={styles.iconBtn}>
                          <Ionicons name="close-circle-outline" size={20} color={MUTED} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}

                  <TouchableOpacity style={styles.addTimeBtn} onPress={() => addTime(med.id)}>
                    <Ionicons name="add-circle-outline" size={18} color={ACCENT} />
                    <Text style={[styles.addTimeBtnText, { fontFamily: FONTS.body }]}>
                      {t('questionnaire.addNewTime')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addBtn} onPress={addMed}>
            <Ionicons name="add" size={22} color="#fff" />
            <Text style={[styles.addBtnText, { fontFamily: FONTS.body }]}>
              {t('medications.add')}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: BG },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: BORDER },
  headerTitle: { fontSize: SIZES.cardTitle, color: TEXT },
  backBtn:     { width: 44, alignItems: 'flex-start' },
  content:     { padding: 20, gap: 12, paddingBottom: 48 },
  hint:        { fontSize: SIZES.bodySmall, color: MUTED, lineHeight: 22 },
  emptyCard:   { backgroundColor: CARD, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyText:   { fontSize: SIZES.bodySmall, color: MUTED, textAlign: 'center' },
  card:        { backgroundColor: CARD, borderRadius: 14, borderWidth: 1.5, borderColor: BORDER, overflow: 'hidden' },
  cardHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 8, justifyContent: 'space-between' },
  expandBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: BORDER, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  expandLabel: { fontSize: SIZES.caption, color: ACCENT },
  nameRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 12, gap: 8 },
  nameInput:   { flex: 1, fontSize: SIZES.body, color: TEXT, borderWidth: 1.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  iconBtn:     { padding: 4 },
  cardDetail:  { borderTopWidth: 1, borderTopColor: '#E2EAF4', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: SIZES.bodySmall, color: TEXT, minWidth: 38 },
  doseInput:   { borderWidth: 1.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: SIZES.bodySmall, minWidth: 64, textAlign: 'center', color: TEXT },
  addTimeBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  addTimeBtnText: { fontSize: SIZES.bodySmall, color: ACCENT },
  addBtn:      { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText:  { color: '#fff', fontSize: SIZES.body },
});
