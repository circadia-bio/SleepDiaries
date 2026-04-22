/**
 * app/(tabs)/home.jsx — Home screen
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, useWindowDimensions,
} from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScreenBackground from '../../components/ScreenBackground';
import { useInsets } from '../../theme/useInsets';
import { FONTS, SIZES } from '../../theme/typography';
import { hasSeenInstructions } from '../../storage/storage';
import { useEntries } from '../../storage/EntriesContext';
import InstructionsModal from '../InstructionsModal';
import ProfileModal from '../ProfileModal';
import { MIN_ENTRIES_FOR_REPORT } from '../../utils/constants';
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
    image = isLocked ? IMAGES.eveningLocked : completed ? IMAGES.eveningCompleted : IMAGES.eveningPending;
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={isLocked ? 1 : 0.9}
      disabled={isLocked}
      style={styles.entryCardWrapper}
    >
      <Image source={image} style={styles.entryCardImage} resizeMode="cover" />
    </TouchableOpacity>
  );
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useInsets();
  const { height: H } = useWindowDimensions();
  const { showInstructions: showInstructionsParam } = useLocalSearchParams();
  const { entries, todayStatus, userName, refresh } = useEntries();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showProfile, setShowProfile]           = useState(false);

  const morningCompleted = todayStatus.morningCompleted;
  const eveningCompleted = todayStatus.eveningCompleted;
  const morningCount     = entries.filter((e) => e.type === 'morning').length;
  const reportUnlocked   = morningCount >= MIN_ENTRIES_FOR_REPORT;

  useFocusEffect(useCallback(() => {
    const load = async () => {
      const [, seen] = await Promise.all([refresh(), hasSeenInstructions()]);
      if (!seen && (userName || showInstructionsParam === '1')) setShowInstructions(true);
    };
    load();
  }, [refresh, userName, showInstructionsParam]));

  const remaining = MIN_ENTRIES_FOR_REPORT - morningCount;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <ScreenBackground variant="home" />
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
              <Ionicons name="person-circle-outline" size={36} color="#4A7BB5" />
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
            <View style={styles.instructionsIconWrap}>
              <Ionicons name="book-outline" size={48} color="#4A7BB5" />
            </View>
            <View style={styles.instructionsText}>
              <Text style={[styles.instructionsTitle, { fontFamily: FONTS.heading }]}>{t('home.instructionsTitle')}</Text>
              <Text style={[styles.instructionsBody, { fontFamily: FONTS.body }]}>{t('home.instructionsBody')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
          </TouchableOpacity>

          <View style={styles.bottomRow}>
            <TouchableOpacity style={styles.bottomCard} onPress={() => router.push('/past-entries')} activeOpacity={0.8}>
              <PastEntriesCard />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bottomCard} onPress={() => reportUnlocked && router.push('/final-report')} activeOpacity={reportUnlocked ? 0.8 : 1} disabled={!reportUnlocked}>
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
  root: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  header: { paddingTop: 50, paddingBottom: 12 },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20 },
  welcomeContainer: { flex: 1, marginRight: 12 },
  welcomeText: { fontSize: 36, color: '#1A3A5C', lineHeight: 44 },
  userName:    { fontSize: 36, color: '#1A3A5C', lineHeight: 44 },
  profileButton: { alignItems: 'center', paddingTop: 4 },
  profileLabel:  { fontSize: SIZES.caption, color: '#4A7BB5', marginTop: 2 },
  body: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: SIZES.label, color: '#E07A20', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  cardsContainer: { gap: 8 },
  entryCardWrapper: { width: '100%', aspectRatio: 948 / 312, borderRadius: 14, overflow: 'hidden' },
  entryCardImage:   { width: '100%', height: '100%' },
  instructionsCard: {
    borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3,
  },
  instructionsIconWrap: { width: 72, height: 72, borderRadius: 18, backgroundColor: '#4A7BB520', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  instructionsText: { flex: 1 },
  instructionsTitle: { fontSize: SIZES.cardTitle, color: '#1A3A5C', marginBottom: 4 },
  instructionsBody:  { fontSize: SIZES.bodySmall, color: '#94A3B8', lineHeight: 20 },
  bottomRow:      { flexDirection: 'row', gap: 12 },
  bottomCard:     { flex: 1 },
  bottomCardHint: { fontSize: SIZES.caption, color: '#94A3B8', marginTop: 4, textAlign: 'center' },
});
