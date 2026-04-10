/**
 * app/ProfileModal.jsx — Profile modal
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadName, saveName, loadResearchCode, saveResearchCode, loadEntries, loadAllQuestionnaires } from '../storage/storage';
import { QUESTIONNAIRES } from '../data/questionnaires';
import QuestionnaireModal from './QuestionnaireModal';
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
    <Ionicons name={icon} size={22} color={color} />
    <Text style={[styles.statValue, { color, fontFamily: FONTS.heading }]}>{value}</Text>
    <Text style={[styles.statLabel, { fontFamily: FONTS.bodyMedium }]}>{label}</Text>
  </View>
);

const GLOSSARY_ITEMS = [
  { key: 'sleepDuration',     icon: 'time-outline',         color: '#4A7BB5' },
  { key: 'sleepEfficiency',   icon: 'speedometer-outline',  color: '#2E7D32' },
  { key: 'sleepOnsetLatency', icon: 'hourglass-outline',    color: '#4A7BB5' },
  { key: 'waso',              icon: 'moon-outline',          color: '#2A6CB5' },
  { key: 'nightWakings',      icon: 'alert-circle-outline', color: '#4A7BB5' },
  { key: 'sleepQuality',      icon: 'star-outline',         color: '#E07A20' },
  { key: 'restedness',        icon: 'sunny-outline',        color: '#E07A20' },
  { key: 'earlyWaking',       icon: 'alarm-outline',        color: '#C25E00' },
];

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
  const [qResults, setQResults]         = useState({});
  const [activeQ, setActiveQ]           = useState(null);

  const load = useCallback(async () => {
    const [n, c, entries] = await Promise.all([loadName(), loadResearchCode(), loadEntries()]);
    setName(n ?? ''); setCode(c ?? '');
    const morningCount = entries.filter((e) => e.type === 'morning').length;
    setMorningCount(morningCount);
    setEveningCount(entries.filter((e) => e.type === 'evening').length);
    setStreak(computeStreak(entries));
    setMemberSince(entries.map((e) => e.date).sort()[0] ?? null);
    const qr = await loadAllQuestionnaires();
    setQResults(Object.fromEntries(qr.map((r) => [r.id, r])));
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
          </View>

          <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('profileQuestionnaires.sectionTitle')}</Text>
          <View style={styles.glossaryCard}>
            {QUESTIONNAIRES.map((q, i, arr) => {
              const result = qResults[q.id];
              const resultsUnlocked = morningCount >= 14;
              const interpretation = (result && resultsUnlocked) ? q.interpret(result.score) : null;
              return (
                <View key={q.id}>
                  <View style={styles.qRow}>
                    <View style={styles.qInfo}>
                      <View style={styles.qTitleRow}>
                        <Text style={[styles.qTitle, { fontFamily: FONTS.body }]}>{q.title}</Text>
                        {q.beta && (
                          <View style={styles.betaChip}>
                            <Text style={[styles.betaChipText, { fontFamily: FONTS.body }]}>BETA</Text>
                          </View>
                        )}
                      </View>
                      {result && resultsUnlocked ? (
                        <View style={styles.qResultRow}>
                          <View style={[styles.qBadge, { backgroundColor: interpretation.color + '18', borderColor: interpretation.color }]}>
                            <Text style={[styles.qBadgeText, { color: interpretation.color, fontFamily: FONTS.body }]}>
                              {result.score} — {interpretation.label}
                            </Text>
                          </View>
                          <Text style={[styles.qDate, { fontFamily: FONTS.bodyMedium }]}>
                            {formatDate(result.completedAt?.split('T')[0])}
                          </Text>
                        </View>
                      ) : result && !resultsUnlocked ? (
                        <View style={styles.qResultRow}>
                          <View style={[styles.qBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                            <Ionicons name="time-outline" size={13} color="#94A3B8" />
                            <Text style={[styles.qBadgeText, { color: '#94A3B8', fontFamily: FONTS.body }]}>
                              {t('profileQuestionnaires.resultsAfter14')}
                            </Text>
                          </View>
                          <Text style={[styles.qDate, { fontFamily: FONTS.bodyMedium }]}>
                            {t('profileQuestionnaires.completed')} {formatDate(result.completedAt?.split('T')[0])}
                          </Text>
                        </View>
                      ) : (
                        <Text style={[styles.qPending, { fontFamily: FONTS.bodyMedium }]}>{t('profileQuestionnaires.notYetCompleted')}</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.qBtn, { borderColor: result ? '#94A3B8' : '#4A7BB5' }]}
                      onPress={() => {
                        if (result) {
                          showAlert(
                            t('profileQuestionnaires.redoTitle'),
                            t('profileQuestionnaires.redoBody', { title: q.shortTitle }),
                            [
                              { text: t('profileQuestionnaires.redoCancel'), style: 'cancel' },
                              { text: t('profileQuestionnaires.redoConfirm'), style: 'destructive', onPress: () => setActiveQ(q) },
                            ]
                          );
                        } else {
                          setActiveQ(q);
                        }
                      }}
                    >
                      <Text style={[styles.qBtnText, { color: result ? '#94A3B8' : '#4A7BB5', fontFamily: FONTS.body }]}>
                        {result ? t('profileQuestionnaires.redo') : t('profileQuestionnaires.start')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {i < arr.length - 1 && <View style={styles.glossaryDivider} />}
                </View>
              );
            })}
          </View>
          {QUESTIONNAIRES.some((q) => q.beta) && (
            <Text style={[styles.betaFootnote, { fontFamily: FONTS.bodyMedium }]}>
              {t('profileQuestionnaires.betaFootnote')}
            </Text>
          )}

          <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('profile.sectionGlossary')}</Text>
          <View style={styles.glossaryCard}>
            {GLOSSARY_ITEMS.map((item, i, arr) => (
              <View key={item.key}>
                <View style={styles.glossaryRow}>
                  <View style={[styles.glossaryIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={22} color={item.color} />
                  </View>
                  <View style={styles.glossaryText}>
                    <Text style={[styles.glossaryTitle, { color: item.color, fontFamily: FONTS.body }]}>{t(`profile.glossary.${item.key}.title`)}</Text>
                    <Text style={[styles.glossaryBody, { fontFamily: FONTS.bodyMedium }]}>{t(`profile.glossary.${item.key}.body`)}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.glossaryDivider} />}
              </View>
            ))}
          </View>

          <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('profile.sectionActions')}</Text>
          <View style={styles.card}>
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

      {/* One-time questionnaire modal */}
      {activeQ && (
        <QuestionnaireModal
          visible={!!activeQ}
          questionnaire={activeQ}
          resultsUnlocked={morningCount >= 14}
          onClose={() => setActiveQ(null)}
          onComplete={async (result) => {
            setQResults((prev) => ({ ...prev, [result.id]: result }));
            setActiveQ(null);
          }}
        />
      )}
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
  statChip:      { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', alignItems: 'center', paddingVertical: 14, gap: 4 },
  statValue:     { fontSize: SIZES.body },
  statLabel:     { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center' },
  glossaryCard:    { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#B0CCEE', overflow: 'hidden' },
  glossaryRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  glossaryIcon:    { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glossaryText:    { flex: 1, gap: 4 },
  glossaryTitle:   { fontSize: SIZES.body },
  glossaryBody:    { fontSize: SIZES.bodySmall, color: '#64748B', lineHeight: 24 },
  glossaryDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  card:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', overflow: 'hidden' },
  actionRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  actionIcon:    { marginRight: 12 },
  actionLabel:   { flex: 1, fontSize: SIZES.body, color: '#1E3A5F' },
  divider:       { height: 1, backgroundColor: '#E2EAF4', marginHorizontal: 16 },

  // Questionnaires
  qRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  qInfo:         { flex: 1, gap: 6 },
  qTitle:        { fontSize: SIZES.body, color: '#1E3A5F' },
  qTitleRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  betaChip:      { backgroundColor: '#F0E8FA', borderWidth: 1.5, borderColor: '#C4A8E0', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  betaChipText:  { fontSize: 11, color: '#6B3FA0', letterSpacing: 0.5 },
  betaFootnote:  { fontSize: 13, color: '#94A3B8', lineHeight: 20, paddingHorizontal: 4, marginTop: 4 },
  qResultRow:    { gap: 4 },
  qBadge:        { alignSelf: 'flex-start', borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  qBadgeText:    { fontSize: SIZES.label },
  qDate:         { fontSize: SIZES.caption, color: '#94A3B8' },
  qPending:      { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  qBtn:          { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  qBtnText:      { fontSize: SIZES.label },

});
