import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Dimensions, ImageBackground, Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useInsets } from '../../theme/useInsets';
import { FONTS } from '../../theme/typography';
import { loadName, loadTodayStatus, loadEntries } from '../../storage/storage';
import { MIN_ENTRIES_FOR_REPORT } from '../final-report';

const { height: H } = Dimensions.get('window');

const CARD_IMAGES = {
  morningPending:      require('../../assets/images/morning_pending.png'),
  morningCompleted:    require('../../assets/images/morning_completed.png'),
  eveningLocked:       require('../../assets/images/evening_locked.png'),
  eveningPending:      require('../../assets/images/evening_pending.png'),
  eveningCompleted:    require('../../assets/images/evening_completed.png'),
  finalReport:         require('../../assets/images/final-report.png'),
  finalReportLocked:   require('../../assets/images/final-report-locked.png'),
  pastEntries:         require('../../assets/images/past-entries.png'),
};

const EntryCard = ({ type, completed, morningDone, onPress }) => {
  const isMorning = type === 'morning';
  const isLocked  = !isMorning && !morningDone;

  let image;
  if (isMorning) {
    image = completed ? CARD_IMAGES.morningCompleted : CARD_IMAGES.morningPending;
  } else {
    image = isLocked   ? CARD_IMAGES.eveningLocked
          : completed  ? CARD_IMAGES.eveningCompleted
          : CARD_IMAGES.eveningPending;
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={isLocked ? 1 : 0.9} disabled={isLocked}>
      <Image source={image} style={styles.entryCardImage} resizeMode="stretch" />
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useInsets();

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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        imageStyle={Platform.OS === 'web' ? { width: '100%', height: '100%' } : undefined}
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
            <View style={styles.cardsContainer}>
              <EntryCard type="morning" completed={morningCompleted} morningDone={morningCompleted}
                onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })} />
              <EntryCard type="evening" completed={eveningCompleted} morningDone={morningCompleted}
                onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })} />
            </View>
          </View>

          <TouchableOpacity style={styles.instructionsCard} activeOpacity={0.8}>
            <Text style={[styles.instructionsTitle, { fontFamily: FONTS.body }]}>Instructions</Text>
            <Text style={[styles.instructionsBody,  { fontFamily: FONTS.bodyRegular }]}>
              Click here to learn more about sleep diaries and additional information.
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            {/* Past Entries */}
            <TouchableOpacity
              style={styles.bottomCard}
              onPress={() => router.push('/past-entries')}
              activeOpacity={0.8}
            >
              <Image source={CARD_IMAGES.pastEntries} style={styles.bottomCardImage} resizeMode="contain" />
            </TouchableOpacity>

            {/* Final Report */}
            <TouchableOpacity
              style={styles.bottomCard}
              onPress={() => reportUnlocked && router.push('/final-report')}
              activeOpacity={reportUnlocked ? 0.8 : 1}
              disabled={!reportUnlocked}
            >
              <Image
                source={reportUnlocked ? CARD_IMAGES.finalReport : CARD_IMAGES.finalReportLocked}
                style={styles.bottomCardImage}
                resizeMode="contain"
              />
              {!reportUnlocked && (
                <Text style={[styles.bottomCardHint, { fontFamily: FONTS.bodyRegular }]}>
                  {MIN_ENTRIES_FOR_REPORT - morningCount} more {(MIN_ENTRIES_FOR_REPORT - morningCount) === 1 ? 'entry' : 'entries'} needed
                </Text>
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
  scrollContent: { paddingBottom: 120, minHeight: H },

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
    paddingHorizontal: 10, paddingTop: 20, paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.92)', position: 'relative',
  },
  sectionLabel: {
    position: 'absolute', top: -11, left: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8, fontSize: 13, color: '#4A7BB5',
  },

  cardsContainer: { gap: 8 },
  entryCardImage: { width: '100%', height: 110, borderRadius: 14 },

  instructionsCard: {
    borderWidth: 1.5, borderColor: '#A8C8E8', borderRadius: 18,
    padding: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center',
  },
  instructionsTitle: { fontSize: 18, color: '#1A3A5C', marginBottom: 6 },
  instructionsBody:  { fontSize: 13, color: '#4A7BB5', textAlign: 'center', lineHeight: 20 },

  bottomRow:       { flexDirection: 'row', gap: 12 },
  bottomCard:      { flex: 1, alignItems: 'center' },
  bottomCardImage: { width: '100%', height: 115 },
  bottomCardHint:  { fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});
