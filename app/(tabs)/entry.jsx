import React, { useState, useCallback } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Platform, ImageBackground } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useInsets } from '../../theme/useInsets';
import { loadTodayStatus } from '../../storage/storage';

const CARD_IMAGES = {
  morningPending:   require('../../assets/images/morning_pending.png'),
  morningCompleted: require('../../assets/images/morning_completed.png'),
  eveningLocked:    require('../../assets/images/evening_locked.png'),
  eveningPending:   require('../../assets/images/evening_pending.png'),
  eveningCompleted: require('../../assets/images/evening_completed.png'),
};

export default function EntryTab() {
  const router = useRouter();
  const insets = useInsets();
  const [morningCompleted, setMorningCompleted] = useState(false);
  const [eveningCompleted, setEveningCompleted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTodayStatus().then((status) => {
        setMorningCompleted(status.morningCompleted);
        setEveningCompleted(status.eveningCompleted);
      });
    }, [])
  );

  const eveningLocked = !morningCompleted;

  const morningImage = morningCompleted ? CARD_IMAGES.morningCompleted : CARD_IMAGES.morningPending;
  const eveningImage = eveningLocked
    ? CARD_IMAGES.eveningLocked
    : eveningCompleted ? CARD_IMAGES.eveningCompleted : CARD_IMAGES.eveningPending;

  return (
    <View style={styles.root}>
      <ImageBackground
        source={require('../../assets/images/homepage-bg.png')}
        style={StyleSheet.absoluteFill}
        imageStyle={Platform.OS === 'web' ? { width: '100%', height: '100%' } : undefined}
        resizeMode="cover"
      />
      <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })}
          activeOpacity={0.9}
        >
          <Image source={morningImage} style={styles.cardImage} resizeMode="stretch" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => !eveningLocked && router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })}
          activeOpacity={eveningLocked ? 1 : 0.9}
          disabled={eveningLocked}
        >
          <Image source={eveningImage} style={styles.cardImage} resizeMode="stretch" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1, paddingHorizontal: 16, gap: 10, paddingBottom: 120 },
  cardImage: { width: '100%', height: 110, borderRadius: 14 },
});
