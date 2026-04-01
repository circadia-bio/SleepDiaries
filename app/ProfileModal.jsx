/**
 * app/ProfileModal.jsx — Profile modal
 *
 * Slides up from the home screen when the Profile button is tapped.
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, StyleSheet, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadName, saveName, loadResearchCode, saveResearchCode, loadEntries } from '../storage/storage';

const computeStreak = (entries) => {
  const today = new Date().toISOString().split('T')[0];
  const morningDates = new Set(entries.filter((e) => e.type === 'morning').map((e) => e.date));
  let streak = 0;
  let d = new Date(today);
  while (morningDates.has(d.toISOString().split('T')[0])) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'No entries yet';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

const StatChip = ({ icon, value, label, color = '#4A7BB5' }) => (
  <View style={styles.statChip}>
    <Ionicons name={icon} size={20} color={color} />
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
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

  const load = useCallback(async () => {
    const [n, c, entries] = await Promise.all([loadName(), loadResearchCode(), loadEntries()]);
    setName(n ?? '');
    setCode(c ?? '');
    setMorningCount(entries.filter((e) => e.type === 'morning').length);
    setEveningCount(entries.filter((e) => e.type === 'evening').length);
    setStreak(computeStreak(entries));
    const dates = entries.map((e) => e.date).sort();
    setMemberSince(dates[0] ?? null);
  }, []);

  useEffect(() => { if (visible) load(); }, [visible]);

  const handleSaveName = async () => {
    if (!draftName.trim()) return;
    await saveName(draftName.trim());
    setName(draftName.trim());
    setEditingName(false);
  };

  const handleSaveCode = async () => {
    await saveResearchCode(draftCode.trim());
    setCode(draftCode.trim());
    setEditingCode(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#1E3A5F" />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color="#4A7BB5" />
            </View>
            {editingName ? (
              <View style={styles.editRow}>
                <TextInput style={styles.editInput} value={draftName} onChangeText={setDraftName}
                  autoFocus autoCapitalize="words" autoCorrect={false}
                  returnKeyType="done" onSubmitEditing={handleSaveName} />
                <TouchableOpacity onPress={handleSaveName} style={styles.editSaveBtn}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingName(false)} style={styles.editCancelBtn}>
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.nameRow} onPress={() => { setDraftName(name); setEditingName(true); }}>
                <Text style={styles.nameText}>{name || 'Tap to set name'}</Text>
                <Ionicons name="pencil-outline" size={16} color="#94A3B8" style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            )}
            {editingCode ? (
              <View style={styles.editRow}>
                <TextInput style={styles.editInput} value={draftCode} onChangeText={setDraftCode}
                  autoFocus autoCapitalize="none" autoCorrect={false}
                  placeholder="Research code" placeholderTextColor="#A0B8D0"
                  returnKeyType="done" onSubmitEditing={handleSaveCode} />
                <TouchableOpacity onPress={handleSaveCode} style={styles.editSaveBtn}>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingCode(false)} style={styles.editCancelBtn}>
                  <Ionicons name="close" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.codeRow} onPress={() => { setDraftCode(code); setEditingCode(true); }}>
                <Ionicons name="code-slash-outline" size={14} color="#94A3B8" />
                <Text style={styles.codeText}>{code || 'Add research code'}</Text>
                <Ionicons name="pencil-outline" size={13} color="#94A3B8" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.sectionHeader}>Summary</Text>
          <View style={styles.statsGrid}>
            <StatChip icon="sunny-outline"    value={morningCount}           label="Morning entries" color="#E07A20" />
            <StatChip icon="moon-outline"     value={eveningCount}           label="Evening entries" color="#2A6CB5" />
            <StatChip icon="flame-outline"    value={`${streak} days`}       label="Current streak"  color="#E07A20" />
            <StatChip icon="calendar-outline" value={formatDate(memberSince)} label="Member since"   color="#4A7BB5" />
          </View>

          <Text style={styles.sectionHeader}>Sleep metrics explained</Text>
          <View style={styles.glossaryCard}>
            {[
              {
                icon: 'time-outline',
                color: '#4A7BB5',
                title: 'Sleep Duration',
                body: 'The total amount of time you were asleep. Most adults need between 7 and 9 hours per night.',
              },
              {
                icon: 'speedometer-outline',
                color: '#2E7D32',
                title: 'Sleep Efficiency',
                body: 'The percentage of time in bed that you were actually asleep. A score of 85% or above is considered healthy — higher is better.',
              },
              {
                icon: 'hourglass-outline',
                color: '#4A7BB5',
                title: 'Sleep Onset Latency',
                body: 'How long it took you to fall asleep after getting into bed. Falling asleep within 30 minutes is typical.',
              },
              {
                icon: 'moon-outline',
                color: '#2A6CB5',
                title: 'Wake After Sleep Onset (WASO)',
                body: 'The total time spent awake after first falling asleep but before getting up for the day. Lower is better.',
              },
              {
                icon: 'alert-circle-outline',
                color: '#4A7BB5',
                title: 'Night Wakings',
                body: 'The number of times you woke during the night. Occasional brief wakings are normal, but frequent disruptions can affect sleep quality.',
              },
              {
                icon: 'star-outline',
                color: '#E07A20',
                title: 'Sleep Quality',
                body: 'Your own rating of how well you slept, on a scale of 1 to 5. This captures the overall feel of your night beyond what the numbers alone can show.',
              },
              {
                icon: 'sunny-outline',
                color: '#E07A20',
                title: 'Restedness',
                body: 'How refreshed and restored you felt upon waking, on a scale of 1 to 5. This reflects whether sleep was restorative, even when duration and efficiency look good.',
              },
              {
                icon: 'alarm-outline',
                color: '#C25E00',
                title: 'Early Waking',
                body: 'The proportion of nights you woke earlier than intended and could not get back to sleep. This can be a sign of disrupted sleep or early-morning light exposure.',
              },
            ].map((item, i, arr) => (
              <View key={item.title}>
                <View style={styles.glossaryRow}>
                  <View style={[styles.glossaryIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <View style={styles.glossaryText}>
                    <Text style={[styles.glossaryTitle, { color: item.color }]}>{item.title}</Text>
                    <Text style={styles.glossaryBody}>{item.body}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.glossaryDivider} />}
              </View>
            ))}
          </View>

          <Text style={styles.sectionHeader}>Quick actions</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.actionRow}
              onPress={() => { onClose(); setTimeout(onShowInstructions, 400); }}>
              <Ionicons name="book-outline" size={20} color="#4A7BB5" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>Replay instructions</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow}
              onPress={() => Linking.openURL('https://circadia-lab.uk')}>
              <Ionicons name="globe-outline" size={20} color="#4A7BB5" style={styles.actionIcon} />
              <Text style={styles.actionLabel}>circadia-lab.uk</Text>
              <Ionicons name="open-outline" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#EEF5FF' },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#B0CCEE' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  closeBtn:    { padding: 4 },
  content:     { padding: 20, gap: 12, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', gap: 10, paddingVertical: 8 },
  avatar:        { width: 96, height: 96, borderRadius: 48, backgroundColor: '#D6E8F7', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A8C8E8' },
  nameRow:       { flexDirection: 'row', alignItems: 'center' },
  nameText:      { fontSize: 22, fontWeight: '800', color: '#1A3A5C' },
  codeRow:       { flexDirection: 'row', alignItems: 'center', gap: 5 },
  codeText:      { fontSize: 13, color: '#94A3B8' },
  editRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  editInput:     { flex: 1, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#7EB0DC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#1E3A5F' },
  editSaveBtn:   { backgroundColor: '#4A7BB5', borderRadius: 8, padding: 10 },
  editCancelBtn: { padding: 10 },
  sectionHeader: { fontSize: 13, fontWeight: '700', color: '#E07A20', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statChip:      { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', alignItems: 'center', paddingVertical: 14, gap: 4 },
  statValue:     { fontSize: 15, fontWeight: '800' },
  statLabel:     { fontSize: 11, color: '#94A3B8', textAlign: 'center' },
  glossaryCard:    { backgroundColor: '#fff', borderRadius: 16, borderWidth: 1.5, borderColor: '#B0CCEE', overflow: 'hidden' },
  glossaryRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16 },
  glossaryIcon:    { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  glossaryText:    { flex: 1, gap: 4 },
  glossaryTitle:   { fontSize: 14, fontWeight: '700' },
  glossaryBody:    { fontSize: 13, color: '#64748B', lineHeight: 19 },
  glossaryDivider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },

  card:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', overflow: 'hidden' },
  actionRow:     { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  actionIcon:    { marginRight: 12 },
  actionLabel:   { flex: 1, fontSize: 15, color: '#1E3A5F', fontWeight: '500' },
  divider:       { height: 1, backgroundColor: '#E2EAF4', marginHorizontal: 16 },
});
