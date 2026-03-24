import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ─── Dummy data — replace with real state/storage later ───────────────────────
const INITIAL_STATE = {
  userName: 'Mario',
  morningCompleted: true,
  eveningCompleted: false,
  finalReportUnlocked: false,
};

// ─── Icon wrapper ─────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = '#4A7BB5' }) => {
  const map = {
    sun:      'sunny-outline',
    moon:     'moon-outline',
    clock:    'time-outline',
    list:     'clipboard-outline',
    lock:     'lock-closed-outline',
    profile:  'person-circle-outline',
    warning:  'alert-circle-outline',
    check:    'checkmark-circle-outline',
  };
  return <Ionicons name={map[name] ?? 'ellipse-outline'} size={size} color={color} />;
};

// ─── Entry card ───────────────────────────────────────────────────────────────
const EntryCard = ({ type, completed, onPress }) => {
  const isMorning = type === 'morning';
  const cardStyle = isMorning ? styles.morningCard : styles.eveningCard;
  const titleColor = isMorning ? '#C25E00' : '#1E4A8A';

  const statusLabel = completed
    ? `${isMorning ? 'Morning' : 'Evening'} Entry Completed`
    : `New Action Item: Complete ${isMorning ? 'Morning' : 'Evening'} Entry`;

  const statusStyle = [styles.statusBadge];
  const statusTextStyle = completed ? styles.statusTextComplete : styles.statusTextPending;

  return (
    <TouchableOpacity style={[styles.entryCard, cardStyle]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.entryCardInner}>
        <Text style={[styles.entryTitle, { color: titleColor }]}>
          {isMorning ? 'Morning Entry ' : 'Evening Entry '}
          <Icon name={isMorning ? 'sun' : 'moon'} size={18} color={titleColor} />
        </Text>
        <View style={statusStyle}>
          {!completed && <Icon name="warning" size={14} color="#1E4A8A" />}
          <Text style={[statusTextStyle, { marginHorizontal: 4 }]}>{statusLabel}</Text>
          {completed && <Icon name="check" size={14} color="#7A4800" />}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ─── Home screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { userName, morningCompleted, eveningCompleted, finalReportUnlocked } = INITIAL_STATE;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#DDEEFF" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerSky}>
            <View style={[styles.cloud, styles.cloudLeft]} />
            <View style={[styles.cloud, styles.cloudRight]} />
          </View>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.welcomeText}>Welcome,</Text>
              <Text style={styles.userName}>{userName}!</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Icon name="profile" size={24} color="#4A7BB5" />
              <Text style={styles.profileLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── New Entry section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>New Entry</Text>

          <EntryCard
            type="morning"
            completed={morningCompleted}
            onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })}
          />
          <EntryCard
            type="evening"
            completed={eveningCompleted}
            onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })}
          />
        </View>

        {/* ── Instructions card ── */}
        <TouchableOpacity style={styles.instructionsCard} activeOpacity={0.8}>
          <Text style={styles.instructionsTitle}>Instructions</Text>
          <Text style={styles.instructionsBody}>
            Click here to learn more about sleep diaries and additional information.
          </Text>
        </TouchableOpacity>

        {/* ── Bottom cards row ── */}
        <View style={styles.bottomRow}>
          <TouchableOpacity style={[styles.bottomCard, styles.bottomCardActive]} activeOpacity={0.8}>
            <Icon name="clock" size={32} color="#4A7BB5" />
            <Text style={styles.bottomCardLabel}>Past Entries</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.bottomCard, styles.bottomCardLocked]}
            activeOpacity={finalReportUnlocked ? 0.8 : 1}
            disabled={!finalReportUnlocked}
          >
            <View style={styles.lockedIconStack}>
              <Icon name="lock" size={20} color="#94A3B8" />
              <Icon name="list" size={28} color="#94A3B8" />
            </View>
            <Text style={styles.bottomCardLabelLocked}>Final Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: '#EEF5FF' },
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 24 },

  header: { backgroundColor: '#C8DFF5', paddingBottom: 24, overflow: 'hidden' },
  headerSky: { height: 48, position: 'relative' },
  cloud: { position: 'absolute', backgroundColor: '#DEEEFA', borderRadius: 40, opacity: 0.8 },
  cloudLeft:  { width: 100, height: 40, top: 8,  left: -10 },
  cloudRight: { width: 80,  height: 34, top: 4,  right: 20 },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  welcomeText: { fontSize: 32, fontWeight: '700', color: '#1E3A5F', lineHeight: 38 },
  userName:    { fontSize: 32, fontWeight: '700', color: '#1E3A5F', lineHeight: 38 },
  profileButton: { alignItems: 'center', marginTop: 4 },
  profileLabel:  { fontSize: 12, color: '#4A7BB5', marginTop: 2, fontWeight: '500' },

  section: {
    margin: 16,
    borderWidth: 1.5,
    borderColor: '#B0CCEE',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F5F9FF',
  },
  sectionLabel: {
    position: 'absolute',
    top: -10, left: 16,
    backgroundColor: '#F5F9FF',
    paddingHorizontal: 8,
    fontSize: 13, color: '#4A7BB5', fontWeight: '600',
  },

  entryCard:       { borderRadius: 12, padding: 16, marginBottom: 12 },
  morningCard:     { backgroundColor: '#F5C96A' },
  eveningCard:     { backgroundColor: '#7EB0E0' },
  entryCardInner:  { alignItems: 'center' },
  entryTitle:      { fontSize: 20, fontWeight: '700', marginBottom: 10 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.55)',
  },
  statusTextComplete: { fontSize: 13, fontWeight: '600', color: '#7A4800' },
  statusTextPending:  { fontSize: 13, fontWeight: '600', color: '#1E4A8A' },

  instructionsCard: {
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1.5, borderColor: '#B0CCEE',
    borderRadius: 16, padding: 20,
    backgroundColor: '#F5F9FF', alignItems: 'center',
  },
  instructionsTitle: { fontSize: 18, fontWeight: '700', color: '#1E3A5F', marginBottom: 6 },
  instructionsBody:  { fontSize: 13, color: '#4A7BB5', textAlign: 'center', lineHeight: 20 },

  bottomRow: { flexDirection: 'row', marginHorizontal: 16, gap: 12 },
  bottomCard: {
    flex: 1, borderRadius: 16, padding: 20,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 110, borderWidth: 1.5,
  },
  bottomCardActive: { backgroundColor: '#F5F9FF', borderColor: '#B0CCEE' },
  bottomCardLocked: { backgroundColor: '#F0F0F0', borderColor: '#D0D0D0' },
  lockedIconStack:  { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 8 },
  bottomCardLabel:       { fontSize: 14, fontWeight: '700', color: '#4A7BB5', marginTop: 8 },
  bottomCardLabelLocked: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
});
