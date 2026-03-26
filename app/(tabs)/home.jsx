import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions, ImageBackground,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS } from '../../theme/typography';
import { loadName, loadTodayStatus, loadEntries } from '../../storage/storage';
import { MIN_ENTRIES_FOR_REPORT } from '../final-report';

const { height: H } = Dimensions.get('window');

const EntryCard = ({ type, completed, morningDone, onPress }) => {
  const isMorning  = type === 'morning';
  const isLocked   = !isMorning && !morningDone;
  const titleColor = isMorning ? '#C25E00' : '#1A3D6E';
  const bgColor    = isMorning ? '#F5C96A' : '#7EB0E0';

  const statusLabel = completed
    ? `${isMorning ? 'Morning' : 'Evening'} Entry Completed`
    : isLocked
    ? 'Complete a Morning Entry first\nbefore an Evening Entry.'
    : `New Action Item: Complete ${isMorning ? 'Morning' : 'Evening'} Entry`;

  return (
    <TouchableOpacity
      style={[styles.entryCard, { backgroundColor: bgColor }, isLocked && styles.entryCardLocked]}
      onPress={onPress}
      activeOpacity={isLocked ? 1 : 0.85}
      disabled={isLocked}
    >
      <View style={styles.entryTitleRow}>
        <Text style={[styles.entryTitle, { color: titleColor }]}>
          {isMorning ? 'Morning Entry' : 'Evening Entry'}
        </Text>
        <Ionicons name={isMorning ? 'sunny' : 'moon'} size={22} color={titleColor} />
      </View>
      {!isLocked ? (
        <View style={styles.statusBadge}>
          <Ionicons
            name={completed ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={14} color={titleColor}
          />
          <Text style={[styles.statusText, { color: titleColor }]}> {statusLabel}</Text>
        </View>
      ) : (
        <Text style={styles.lockedMsg}>{statusLabel}</Text>
      )}
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [userName, setUserName]                 = useState('');
  const [morningCompleted, setMorningCompleted] = useState(false);
  const [eveningCompleted, setEveningCompleted] = useState(false);
  const [reportUnlocked, setReportUnlocked]     = useState(false);
  const [morningCount, setMorningCount]         = useState(0);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [name, status, allEntries] = await Promise.all([
          loadName(), loadTodayStatus(), loadEntries(),
        ]);
        const mCount = allEntries.filter((e) => e.type === 'morning').length;
        setUserName(name ?? '');
        setMorningCompleted(status.morningCompleted);
        setEveningCompleted(status.eveningCompleted);
        setMorningCount(mCount);
        setReportUnlocked(mCount >= MIN_ENTRIES_FOR_REPORT);
      };
      load();
    }, [])
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={require('../../assets/images/homepage-bg.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeText, { fontFamily: FONTS.heading }]}>Welcome,</Text>
              <Text style={[styles.userName,    { fontFamily: FONTS.heading }]}>{userName}!</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Ionicons name="person-circle-outline" size={32} color="#4A7BB5" />
              <Text style={[styles.profileLabel, { fontFamily: FONTS.bodyRegular }]}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { fontFamily: FONTS.body }]}>New Entry</Text>
            <EntryCard type="morning" completed={morningCompleted} morningDone={morningCompleted}
              onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })} />
            <EntryCard type="evening" completed={eveningCompleted} morningDone={morningCompleted}
              onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })} />
          </View>

          <TouchableOpacity style={styles.instructionsCard} activeOpacity={0.8}>
            <Text style={[styles.instructionsTitle, { fontFamily: FONTS.body }]}>Instructions</Text>
            <Text style={[styles.instructionsBody,  { fontFamily: FONTS.bodyRegular }]}>
              Click here to learn more about sleep diaries and additional information.
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <TouchableOpacity style={[styles.bottomCard, styles.bottomCardActive]}
              onPress={() => router.push('/past-entries')} activeOpacity={0.8}>
              <Ionicons name="time" size={36} color="#4A7BB5" />
              <Text style={[styles.bottomCardLabel, { fontFamily: FONTS.body }]}>Past Entries</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bottomCard, reportUnlocked ? styles.bottomCardActive : styles.bottomCardLocked]}
              onPress={() => reportUnlocked && router.push('/final-report')}
              activeOpacity={reportUnlocked ? 0.8 : 1} disabled={!reportUnlocked}
            >
              {reportUnlocked ? (
                <>
                  <Ionicons name="clipboard" size={36} color="#4A7BB5" />
                  <Text style={[styles.bottomCardLabel, { fontFamily: FONTS.body }]}>Final Report</Text>
                </>
              ) : (
                <>
                  <View style={styles.lockedStack}>
                    <Ionicons name="lock-closed" size={18} color="#94A3B8" />
                    <Ionicons name="clipboard-outline" size={32} color="#94A3B8" />
                  </View>
                  <Text style={[styles.bottomCardLabelLocked, { fontFamily: FONTS.bodyMedium }]}>Final Report</Text>
                  <Text style={[styles.bottomCardHint, { fontFamily: FONTS.bodyRegular }]}>
                    {MIN_ENTRIES_FOR_REPORT - morningCount} more {(MIN_ENTRIES_FOR_REPORT - morningCount) === 1 ? 'entry' : 'entries'} needed
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 32, minHeight: H },

  header: { paddingTop: 50, paddingBottom: 12 },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20,
  },
  welcomeContainer: { flex: 1, marginRight: 12 },
  welcomeText: { fontSize: 34, color: '#1A3A5C', lineHeight: 40 },
  userName:    { fontSize: 34, color: '#1A3A5C', lineHeight: 40 },
  profileButton: { alignItems: 'center', paddingTop: 4 },
  profileLabel:  { fontSize: 12, color: '#4A7BB5', marginTop: 2 },

  body: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },

  section: {
    borderWidth: 1.5, borderColor: '#A8C8E8', borderRadius: 18,
    padding: 14, paddingTop: 20, backgroundColor: 'rgba(255,255,255,0.92)', position: 'relative',
  },
  sectionLabel: {
    position: 'absolute', top: -11, left: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8, fontSize: 13, color: '#4A7BB5',
  },

  entryCard:       { borderRadius: 14, padding: 18, marginBottom: 10 },
  entryCardLocked: { opacity: 0.85 },
  entryTitleRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  entryTitle:      { fontSize: 20, fontFamily: 'Afacad-Bold', textAlign: 'center' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, alignSelf: 'center',
  },
  statusText: { fontSize: 13, fontFamily: 'Afacad-Medium' },
  lockedMsg:  { fontSize: 13, fontFamily: 'Afacad-Regular', color: '#1A3D6E', textAlign: 'center', lineHeight: 19 },

  instructionsCard: {
    borderWidth: 1.5, borderColor: '#A8C8E8', borderRadius: 18,
    padding: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center',
  },
  instructionsTitle: { fontSize: 18, color: '#1A3A5C', marginBottom: 6 },
  instructionsBody:  { fontSize: 13, color: '#4A7BB5', textAlign: 'center', lineHeight: 20 },

  bottomRow: { flexDirection: 'row', gap: 12 },
  bottomCard: {
    flex: 1, borderRadius: 18, padding: 20,
    alignItems: 'center', justifyContent: 'center', minHeight: 115, borderWidth: 1.5,
  },
  bottomCardActive: { backgroundColor: 'rgba(255,255,255,0.92)', borderColor: '#A8C8E8' },
  bottomCardLocked: { backgroundColor: 'rgba(235,235,235,0.92)', borderColor: '#D0D0D0' },
  lockedStack:           { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginBottom: 4 },
  bottomCardLabel:       { fontSize: 14, color: '#4A7BB5', marginTop: 8 },
  bottomCardLabelLocked: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  bottomCardHint:        { fontSize: 11, color: '#B0C8D8', marginTop: 3, textAlign: 'center' },
});
