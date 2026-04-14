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
              {/* Card header row */}
              <View style={styles.cardHeader}>
                <TextInput
                  style={[styles.nameInput, { fontFamily: FONTS.body }]}
                  value={med.name}
                  onChangeText={(v) => updateMed(med.id, 'name', v)}
                  placeholder={t('medications.namePlaceholder')}
                  placeholderTextColor={MUTED}
                />
                <TouchableOpacity
                  onPress={() => setExpanded((e) => ({ ...e, [med.id]: !e[med.id] }))}
                  style={styles.iconBtn}
                >
                  <Ionicons
                    name={expanded[med.id] ? 'chevron-up-circle-outline' : 'chevron-down-circle-outline'}
                    size={24} color={ACCENT}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeMed(med.id)} style={styles.iconBtn}>
                  <Ionicons name="trash-outline" size={22} color="#C0392B" />
                </TouchableOpacity>
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
                      <TextInput
                        style={[styles.timeInput, { fontFamily: FONTS.bodyMedium }]}
                        value={tm}
                        onChangeText={(v) => updateTime(med.id, i, v)}
                        placeholder={t('questionnaire.timePlaceholder')}
                        placeholderTextColor={MUTED}
                      />
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
  cardHeader:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  nameInput:   { flex: 1, fontSize: SIZES.body, color: TEXT },
  iconBtn:     { padding: 4 },
  cardDetail:  { borderTopWidth: 1, borderTopColor: '#E2EAF4', paddingHorizontal: 14, paddingVertical: 12, gap: 10 },
  detailRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: SIZES.bodySmall, color: TEXT, minWidth: 38 },
  doseInput:   { borderWidth: 1.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: SIZES.bodySmall, minWidth: 64, textAlign: 'center', color: TEXT },
  timeInput:   { flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, fontSize: SIZES.bodySmall, color: TEXT },
  addTimeBtn:  { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 4 },
  addTimeBtnText: { fontSize: SIZES.bodySmall, color: ACCENT },
  addBtn:      { backgroundColor: ACCENT, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  addBtnText:  { color: '#fff', fontSize: SIZES.body },
});
