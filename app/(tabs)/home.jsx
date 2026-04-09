/**
 * app/(tabs)/home.jsx — Home screen
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, ImageBackground, Image, useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useInsets } from '../../theme/useInsets';
import { FONTS } from '../../theme/typography';
import { loadName, loadTodayStatus, loadEntries, hasSeenInstructions } from '../../storage/storage';
import InstructionsModal from '../InstructionsModal';
import ProfileModal from '../ProfileModal';
import { MIN_ENTRIES_FOR_REPORT } from '../final-report';
import t from '../../i18n';
import IMAGES from '../../assets/images';
import { PastEntriesCard, FinalReportCard } from '../../components/BottomCards';

const EntryCard = ({ type, completed, morningDone, onPress }) => {
  const isMorning = type === 'morning';
  const isLocked  = !isMorning && !morningDone;

  let image;
  if (isMorning) {
    image = completed ? IMAGES.morningCompleted : IMAGES.morningPending;
  } else {
    image = isLocked  ? IMAGES.eveningLocked
          : completed ? IMAGES.eveningCompleted
          : IMAGES.eveningPending;
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
  const { height: H } = useWindowDimensions();
  const { showInstructions: showInstructionsParam } = useLocalSearchParams();

  const [userName, setUserName]                 = useState('');
  const [morningCompleted, setMorningCompleted] = useState(false);
  const [eveningCompleted, setEveningCompleted] = useState(false);
  const [reportUnlocked, setReportUnlocked]     = useState(false);
  const [morningCount, setMorningCount]         = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showProfile, setShowProfile]           = useState(false);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        const [name, status, allEntries, seen] = await Promise.all([
          loadName(), loadTodayStatus(), loadEntries(), hasSeenInstructions(),
        ]);
        const mCount = allEntries.filter((e) => e.type === 'morning').length;
        setUserName(name ?? '');
        setMorningCompleted(status.morningCompleted);
        setEveningCompleted(status.eveningCompleted);
        setMorningCount(mCount);
        setReportUnlocked(mCount >= MIN_ENTRIES_FOR_REPORT);
        if (!seen && (name || showInstructionsParam === '1')) setShowInstructions(true);
      };
      load();
    }, [])
  );

  const remaining = MIN_ENTRIES_FOR_REPORT - morningCount;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ImageBackground
        source={IMAGES.homepageBg}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        imageStyle={Platform.OS === 'web' ? { width: '100%', height: '100%' } : undefined}
        resizeMode="cover"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 8, minHeight: H }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.welcomeContainer}>
              <Text style={[styles.welcomeText, { fontFamily: FONTS.heading }]}>{t('home.welcome')}</Text>
              <Text style={[styles.userName,    { fontFamily: FONTS.heading }]}>{userName}!</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => setShowProfile(true)}>
              <Ionicons name="person-circle-outline" size={32} color="#4A7BB5" />
              <Text style={[styles.profileLabel, { fontFamily: FONTS.body }]}>{t('home.profile')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { fontFamily: FONTS.body }]}>{t('home.newEntry')}</Text>
            <View style={styles.cardsContainer}>
              <EntryCard type="morning" completed={morningCompleted} morningDone={morningCompleted}
                onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })} />
              <EntryCard type="evening" completed={eveningCompleted} morningDone={morningCompleted}
                onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })} />
            </View>
          </View>

          <TouchableOpacity style={styles.instructionsCard} activeOpacity={0.8} onPress={() => setShowInstructions(true)}>
            <Text style={[styles.instructionsTitle, { fontFamily: FONTS.heading }]}>{t('home.instructionsTitle')}</Text>
            <Text style={[styles.instructionsBody, { fontFamily: FONTS.body }]}>
              {t('home.instructionsBody')}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <TouchableOpacity
              style={styles.bottomCard}
              onPress={() => router.push('/past-entries')}
              activeOpacity={0.8}
            >
              <PastEntriesCard />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bottomCard}
              onPress={() => reportUnlocked && router.push('/final-report')}
              activeOpacity={reportUnlocked ? 0.8 : 1}
              disabled={!reportUnlocked}
            >
              <FinalReportCard unlocked={reportUnlocked} />
              {!reportUnlocked && (
                <Text style={[styles.bottomCardHint, { fontFamily: FONTS.body }]}>
                  {t('home.entriesNeeded', { count: remaining })}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <InstructionsModal visible={showInstructions} onClose={() => setShowInstructions(false)} />
      <ProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onShowInstructions={() => setShowInstructions(true)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1 },
  scrollView:    { flex: 1 },
  scrollContent: { paddingBottom: 120 },

  header: { paddingTop: 50, paddingBottom: 12 },
  headerContent: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', paddingHorizontal: 20,
  },
  welcomeContainer: { flex: 1, marginRight: 12 },
  welcomeText: { fontSize: 34, color: '#1A3A5C', lineHeight: 40 },
  userName:    { fontSize: 34, color: '#1A3A5C', lineHeight: 40 },
  profileButton: { alignItems: 'center', paddingTop: 4 },
  profileLabel:  { fontSize: 14, color: '#4A7BB5', marginTop: 2 },

  body: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },

  section: {
    borderWidth: 1.5, borderColor: '#A8C8E8', borderRadius: 18,
    paddingHorizontal: 10, paddingTop: 20, paddingBottom: 10,
    backgroundColor: 'rgba(255,255,255,0.92)', position: 'relative',
  },
  sectionLabel: {
    position: 'absolute', top: -11, left: 14,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8, fontSize: 15, color: '#4A7BB5',
  },

  cardsContainer: { gap: 8 },
  entryCardImage: { width: '100%', height: 110, borderRadius: 14 },

  instructionsCard: {
    borderWidth: 1.5, borderColor: '#A8C8E8', borderRadius: 18,
    padding: 20, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center',
  },
  instructionsTitle: { fontSize: 20, color: '#1A3A5C', marginBottom: 6 },
  instructionsBody:  { fontSize: 15, color: '#4A7BB5', textAlign: 'center', lineHeight: 22 },

  bottomRow:      { flexDirection: 'row', gap: 12 },
  bottomCard:     { flex: 1 },
  bottomCardHint: { fontSize: 13, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});
