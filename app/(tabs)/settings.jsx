/**
 * app/(tabs)/settings.jsx — Settings screen
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Switch, Alert, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../../theme/typography';
import { clearAll } from '../../storage/storage';
import { QUESTIONNAIRES } from '../../data/questionnaires';
import { loadNotificationsEnabled, saveNotificationsEnabled, sendTestNotification, requestNotificationPermission } from '../../storage/notifications';
import t, { locale } from '../../i18n';

const LANGUAGE_NAMES = { 'en': 'English', 'pt-BR': 'Português (Brasil)', 'pt': 'Português (Brasil)' };
const currentLanguageName = LANGUAGE_NAMES[locale] ?? locale;

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [textToSpeech, setTextToSpeech]   = useState(false);
  const [biggerText, setBiggerText]       = useState(false);

  useEffect(() => { loadNotificationsEnabled().then(setNotifications); }, []);

  const handleNotificationsToggle = async (value) => {
    if (value) {
      const granted = await requestNotificationPermission();
      if (!granted) { Alert.alert(t('settings.permissionTitle'), t('settings.permissionBody'), [{ text: t('settings.ok') }]); return; }
    }
    setNotifications(value);
    await saveNotificationsEnabled(value);
    if (value) Alert.alert(t('settings.remindersSetTitle'), t('settings.remindersSetBody'), [{ text: t('settings.sendTestNotif'), onPress: sendTestNotification }, { text: t('settings.ok') }]);
  };

  const handleLogout = () => Alert.alert(t('settings.logOutTitle'), t('settings.logOutBody'), [
    { text: t('settings.cancel'), style: 'cancel' },
    { text: t('settings.logOut'), style: 'destructive', onPress: async () => { await clearAll(); router.replace('/'); } },
  ]);

  const handleDeleteAccount = () => Alert.alert(t('settings.deleteAccountTitle'), t('settings.deleteAccountBody'), [
    { text: t('settings.cancel'), style: 'cancel' },
    { text: t('settings.delete'), style: 'destructive', onPress: async () => { await clearAll(); router.replace('/'); } },
  ]);

  const Row = ({ label, icon, right, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={22} color="#4A7BB5" style={{ marginRight: 12 }} />
      <Text style={[styles.rowLabel, { fontFamily: FONTS.body }]}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { fontFamily: FONTS.heading }]}>{t('settings.title')}</Text>

        {Platform.OS !== 'web' && (
          <>
            <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionAccessibility')}</Text>
            <View style={styles.card}>
              <Row label={t('settings.biggerText')} icon="text-outline" right={<Switch value={biggerText} onValueChange={setBiggerText} trackColor={{ true: '#4A7BB5' }} />} />
            </View>

            <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionLanguage')}</Text>
            <View style={styles.card}>
              <Row label={t('settings.chooseLanguage')} icon="language-outline"
                right={<View style={styles.rowRight}><Text style={[styles.rowValue, { fontFamily: FONTS.bodyMedium }]}>{currentLanguageName}</Text><Ionicons name="chevron-forward" size={18} color="#94A3B8" /></View>} />
            </View>

            <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionNotifications')}</Text>
            <View style={styles.card}>
              <Row label={t('settings.dailyReminders')} icon="notifications-outline" right={<Switch value={notifications} onValueChange={handleNotificationsToggle} trackColor={{ true: '#4A7BB5' }} />} />
              <Text style={[styles.cardHint, { fontFamily: FONTS.bodyMedium }]}>{t('settings.notificationsHint')}</Text>
              {notifications && (
                <TouchableOpacity style={styles.testBtn} onPress={sendTestNotification}>
                  <Ionicons name="notifications-outline" size={16} color="#4A7BB5" />
                  <Text style={[styles.testBtnText, { fontFamily: FONTS.body }]}>{t('settings.sendTestNotif')}</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionTTS')}</Text>
            <View style={styles.card}>
              <Row label={t('settings.ttsLabel')} icon="volume-medium-outline" right={<Switch value={textToSpeech} onValueChange={setTextToSpeech} trackColor={{ true: '#4A7BB5' }} />} />
              <Text style={[styles.cardHint, { fontFamily: FONTS.bodyMedium }]}>{t('settings.ttsHint')}</Text>
            </View>
          </>
        )}

        <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionData')}</Text>
        <View style={styles.card}>
          <Row label={t('settings.exportData')} icon="download-outline" onPress={() => router.push('/export')} right={<Ionicons name="chevron-forward" size={18} color="#94A3B8" />} />
          <Text style={[styles.cardHint, { fontFamily: FONTS.bodyMedium }]}>{t('settings.exportDataHint')}</Text>
        </View>

        <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionQuestionnaires')}</Text>
        <View style={styles.card}>
          <Text style={[styles.cardHint, { fontFamily: FONTS.bodyMedium, paddingTop: 14 }]}>{t('settings.questionnairesNote')}</Text>
          {QUESTIONNAIRES.map((q, i) => (
            <View key={q.id}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.creditRow}>
                <Text style={[styles.creditTitle, { fontFamily: FONTS.body }]}>{q.title}</Text>
                <Text style={[styles.creditBody, { fontFamily: FONTS.bodyMedium }]}>{q.credit}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionAbout')}</Text>
        <View style={[styles.card, styles.aboutCard]}>
          <Image source={require('../../assets/images/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.aboutText, { fontFamily: FONTS.body }]}>© Circadia Lab</Text>
          <Text style={[styles.aboutText, { fontFamily: FONTS.bodyMedium }]}>MIT Licence</Text>
          <Text style={[styles.aboutSmall, { fontFamily: FONTS.bodyMedium }]}>Lucas França · Mario Leocadio-Miguel</Text>
          <Text style={[styles.aboutLabel, { fontFamily: FONTS.body }]}>{t('settings.aboutDesign')}</Text>
          <Text style={[styles.aboutSmall, { fontFamily: FONTS.bodyMedium }]}>Bri Baehl · Jacob Howard</Text>
          <Text style={[styles.aboutSmall, { fontFamily: FONTS.bodyMedium }]}>Frederic Kussow · Yuliana Luna Colón</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://circadia-lab.uk')} style={styles.aboutLink}>
            <Text style={[styles.aboutLinkText, { fontFamily: FONTS.body }]}>circadia-lab.uk</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeader, { fontFamily: FONTS.body }]}>{t('settings.sectionAccount')}</Text>
        <View style={styles.card}>
          <Row label={t('settings.logOut')} icon="log-out-outline" onPress={handleLogout} right={null} />
          <View style={styles.divider} />
          <TouchableOpacity style={styles.row} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={22} color="#C0392B" style={{ marginRight: 12 }} />
            <Text style={[styles.rowLabel, { color: '#C0392B', fontFamily: FONTS.body }]}>{t('settings.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:      { flex: 1, backgroundColor: '#EEF5FF' },
  content:       { padding: 24, gap: 8, paddingBottom: 40 },
  title:         { fontSize: SIZES.screenTitle, color: '#1E3A5F', marginBottom: 8 },
  sectionHeader: { fontSize: SIZES.label, color: '#E07A20', marginTop: 12, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.8 },
  card:          { backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', overflow: 'hidden', paddingHorizontal: 16 },
  row:           { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 },
  rowLabel:      { flex: 1, fontSize: SIZES.body, color: '#1E3A5F' },
  rowRight:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue:      { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  divider:       { height: 1, backgroundColor: '#E2EAF4' },
  cardHint:      { fontSize: SIZES.bodySmall, color: '#94A3B8', paddingBottom: 14, lineHeight: 24 },
  testBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 14 },
  testBtnText:   { fontSize: SIZES.bodySmall, color: '#4A7BB5' },
  aboutCard:     { alignItems: 'center', paddingVertical: 20, gap: 4 },
  logo:          { width: 160, height: 60, marginBottom: 8 },
  aboutText:     { fontSize: SIZES.body, color: '#1E3A5F' },
  aboutLabel:    { fontSize: SIZES.label, color: '#E07A20', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 8 },
  aboutSmall:    { fontSize: SIZES.bodySmall, color: '#94A3B8', textAlign: 'center', lineHeight: 24 },
  aboutLink:     { marginTop: 8 },
  aboutLinkText: { fontSize: SIZES.body, color: '#4A7BB5', textDecorationLine: 'underline' },
  creditRow:     { paddingVertical: 14, gap: 4 },
  creditTitle:   { fontSize: SIZES.bodySmall, color: '#1E3A5F' },
  creditBody:    { fontSize: 13, color: '#94A3B8', lineHeight: 20 },
});
