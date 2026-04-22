/**
 * app/ProfileModal.jsx — Profile modal
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadName, saveName, loadResearchCode, saveResearchCode, loadEntries, loadAllQuestionnaires, loadMedicationPresets } from '../storage/storage';
import { useRouter } from 'expo-router';
import { FONTS, SIZES } from '../theme/typography';
import showAlert from '../utils/alert';
import t, { locale } from '../i18n';

const computeStreak = (entries) => {
  const today = new Date().toISOString().split('T')[0];
  const morningDates = new Set(entries.filter((e) => e.type === 'morning').map((e) => e.date));
  let streak = 0; let d = new Date(today);
  while (morningDates.has(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const formatDate = (dateStr) => {
  if (!dateStr) return t('profile.noEntries');
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};

const StatChip = ({ icon, value, label, color = '#4A7BB5' }) => (
  <View style={styles.statChip}>
    <Ionicons name={icon} size={52} color={color} />
    <Text style={[styles.statValue, { color, fontFamily: FONTS.heading }]} numberOfLines={2} adjustsFontSizeToFit>{value}</Text>
    <Text style={[styles.statLabel, { fontFamily: FONTS.bodyMedium }]}>{label}</Text>
  </View>
);

export default function ProfileModal({ visible, onClose, onShowInstructions }) {
  const insets = useSafeAreaInsets();
  const [name, setName]               = useState('');
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName]     = useState('');
  const [code, setCode]               = useState('');
  const [editingCode, setEditingCode] = useState(false);
  const [draftCode, setDraftCode]     = useState('');
  const [morningCount, setMorningCount] = useState(0);
  const [eveningCount, setEveningCount] = useState(0);
  const [streak, setStreak]             = useState(0);
  const [memberSince, setMemberSince]   = useState(null);
  const [questionnaireCount, setQuestionnaireCount] = useState(0);
  const [medicationCount, setMedicationCount]       = useState(0);
  const router = useRouter();

  const load = useCallback(async () => {
    const [n, c, entries, qResults, meds] = await Promise.all([loadName(), loadResearchCode(), loadEntries(), loadAllQuestionnaires(), loadMedicationPresets()]);
    setName(n ?? ''); setCode(c ?? '');
    const morningCount = entries.filter((e) => e.type === 'morning').length;
    setMorningCount(morningCount);
    setEveningCount(entries.filter((e) => e.type === 'evening').length);
    setStreak(computeStreak(entries));
    setMemberSince(entries.map((e) => e.date).sort()[0] ?? null);
    setQuestionnaireCount(qResults.length);
    setMedicationCount((meds ?? []).length);
  }, []);

  useEffect(() => { if (visible) load(); }, [visible]);

  const handleSaveName = async () => {
    if (!draftName.trim()) return;
    await saveName(draftName.trim()); setName(draftName.trim()); setEditingName(false);
  };
  const handleSaveCode = async () => {
    await saveResearchCode(draftCode.trim()); setCode(draftCode.trim()); setEditingCode(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: FONTS.heading }]}>{t('profile.title')}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={26} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}><Ionicons name="person" size={52} color="#4A7BB5" /></View>

            {editingName ? (
              <View style={styles.editRow}>
                <TextInput style={[styles.editInput, { fontFamily: FONTS.body }]} value={draftName} onChangeText={setDraftName} autoFocus autoCapitalize="words" autoCorrect={false} returnKeyType="done" onSubmitEditing={handleSaveName} />
                <TouchableOpacity onPress={handleSaveName} style={styles.editSaveBtn}><Ionicons name="checkmark" size={22} color="#fff" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingName(false)} style={styles.editCancelBtn}><Ionicons name="close" size={22} color="#94A3B8" /></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nameRow} onPress={() => { setDraftName(name); setEditingName(true); }}>
                <Text style={[styles.nameText, { fontFamily: FONTS.heading }]}>{name || t('profile.tapToSetName')}</Text>
                <Ionicons name="pencil-outline" size={18} color="#94A3B8" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}

            {editingCode ? (
              <View style={styles.editRow}>
                <TextInput style={[styles.editInput, { fontFamily: FONTS.bodyMedium }]} value={draftCode} onChangeText={setDraftCode} autoFocus autoCapitalize="none" autoCorrect={false} placeholder={t('profile.researchCodePlaceholder')} placeholderTextColor="#A0B8D0" returnKeyType="done" onSubmitEditing={handleSaveCode} />
                <TouchableOpacity onPress={handleSaveCode} style={styles.editSaveBtn}><Ionicons name="checkmark" size={22} color="#fff" /></TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingCode(false)} style={styles.editCancelBtn}><Ionicons name="close" size={22} color="#94A3B8" /></TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.codeRow} onPress={() => { setDraftCode(code); setEditingCode(true); }}>
                <Ionicons name="code-slash-outline" size={16} color="#94A3B8" />
                <Text style={[styles.codeText, { fontFamily: FONTS.bodyMedium }]}>{code || t('profile.addResearchCode')}</Text>
                <Ionicons name="pencil-outline" size={15} color="#94A3B8" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('profile.sectionSummary')}</Text>
          <View style={styles.statsGrid}>
            <StatChip icon="sunny-outline"    value={morningCount}                               label={t('profile.statMorning')} color="#E07A20" />
            <StatChip icon="moon-outline"     value={eveningCount}                               label={t('profile.statEvening')} color="#2A6CB5" />
            <StatChip icon="flame-outline"    value={`${streak} ${t('profile.statStreakUnit')}`} label={t('profile.statStreak')}  color="#E07A20" />
            <StatChip icon="calendar-outline" value={formatDate(memberSince)}                    label={t('profile.statSince')}   color="#4A7BB5" />
            <StatChip icon="clipboard-outline" value={questionnaireCount}                         label={t('profile.statQuestionnaires')} color="#4A7BB5" />
            <StatChip icon="medkit-outline"    value={medicationCount}                            label={t('profile.statMedications')}   color="#4A7BB5" />
          </View>

          <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('profile.sectionActions')}</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={() => { onClose(); setTimeout(() => router.push('/QuestionnairesScreen'), 400); }}>
              <Ionicons name="clipboard-outline" size={22} color="#4A7BB5" style={styles.actionIcon} />
              <Text style={[styles.actionLabel, { fontFamily: FONTS.body }]}>{t('profileQuestionnaires.sectionTitle')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={() => { onClose(); setTimeout(() => router.push('/MedicationsScreen'), 400); }}>
              <Ionicons name="medkit-outline" size={22} color="#4A7BB5" style={styles.actionIcon} />
              <Text style={[styles.actionLabel, { fontFamily: FONTS.body }]}>{t('medications.title')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={() => { onClose(); setTimeout(() => router.push('/SleepMetricsScreen'), 400); }}>
              <Ionicons name="bar-chart-outline" size={22} color="#4A7BB5" style={styles.actionIcon} />
              <Text style={[styles.actionLabel, { fontFamily: FONTS.body }]}>{t('profile.sectionGlossary')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={() => { onClose(); setTimeout(onShowInstructions, 400); }}>
              <Ionicons name="book-outline" size={22} color="#4A7BB5" style={styles.actionIcon} />
              <Text style={[styles.actionLabel, { fontFamily: FONTS.body }]}>{t('profile.replayInstructions')}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={() => Linking.openURL('https://circadia-lab.uk')}>
              <Ionicons name="globe-outline" size={22} color="#4A7BB5" style={styles.actionIcon} />
              <Text style={[styles.actionLabel, { fontFamily: FONTS.body }]}>{t('profile.website')}</Text>
              <Ionicons name="open-outline" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>


    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#EEF5FF' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#B0CCEE' },
  headerTitle: { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  closeBtn:    { padding: 4 },
  content:     { padding: 20, gap: 12, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar:        { width: 100, height: 100, borderRadius: 50, backgroundColor: '#D6E8F7', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A8C8E8' },
  nameRow:       { flexDirection: 'row', alignItems: 'center' },
  nameText:      { fontSize: SIZES.sectionTitle, color: '#1A3A5C' },
  codeRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  codeText:      { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  editRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  editInput:     { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#7EB0DC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: SIZES.body, color: '#1E3A5F' },
  editSaveBtn:   { backgroundColor: '#4A7BB5', borderRadius: 8, padding: 10 },
  editCancelBtn: { padding: 10 },
  sectionHeader: { fontSize: SIZES.label, color: '#E07A20', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statChip:      { flex: 1, minWidth: '45%', aspectRatio: 1, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 4, shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  statValue:     { fontSize: SIZES.body, textAlign: 'center', paddingHorizontal: 6 },
  statLabel:     { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center' },
  card:          { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden', shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  actionRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  actionIcon:    { marginRight: 12 },
  actionLabel:   { flex: 1, fontSize: SIZES.body, color: '#1E3A5F' },
  divider:       { height: 1, backgroundColor: '#E2EAF4', marginHorizontal: 16 },

});
