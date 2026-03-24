import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [textToSpeech, setTextToSpeech] = useState(false);
  const [biggerText, setBiggerText] = useState(false);

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => router.replace('/') },
    ]);
  };

  const Row = ({ label, icon, right }) => (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color="#4A7BB5" style={{ marginRight: 12 }} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>{right}</View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Accessibility */}
        <Text style={styles.sectionHeader}>Accessibility</Text>
        <View style={styles.card}>
          <Row
            label="Bigger Text"
            icon="text-outline"
            right={<Switch value={biggerText} onValueChange={setBiggerText} trackColor={{ true: '#4A7BB5' }} />}
          />
        </View>

        {/* Language */}
        <Text style={styles.sectionHeader}>Language</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row}>
            <Ionicons name="language-outline" size={20} color="#4A7BB5" style={{ marginRight: 12 }} />
            <Text style={styles.rowLabel}>Choose Language</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>English</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <Text style={styles.sectionHeader}>Notifications</Text>
        <View style={styles.card}>
          <Row
            label="Push Notifications"
            icon="notifications-outline"
            right={<Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: '#4A7BB5' }} />}
          />
          <Text style={styles.cardHint}>
            Turning on will send push notifications to your device.
          </Text>
        </View>

        {/* Text to Speech */}
        <Text style={styles.sectionHeader}>Text to Speech</Text>
        <View style={styles.card}>
          <Row
            label="Text to Speech"
            icon="volume-medium-outline"
            right={<Switch value={textToSpeech} onValueChange={setTextToSpeech} trackColor={{ true: '#4A7BB5' }} />}
          />
          <Text style={styles.cardHint}>
            Read questions aloud through the speaker.
          </Text>
        </View>

        {/* Account */}
        <Text style={styles.sectionHeader}>Account</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#4A7BB5" style={{ marginRight: 12 }} />
            <Text style={styles.rowLabel}>Log Out</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() =>
              Alert.alert(
                'Delete Account',
                'This will permanently delete your account and all data. Are you sure?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => console.log('delete') },
                ]
              )
            }
          >
            <Ionicons name="trash-outline" size={20} color="#C0392B" style={{ marginRight: 12 }} />
            <Text style={[styles.rowLabel, { color: '#C0392B' }]}>Delete Account</Text>
          </TouchableOpacity>
          <Text style={styles.cardHint}>
            Deleting your account may delete your data. Be certain this is an action you want to take.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF5FF' },
  content:  { padding: 24, gap: 8, paddingBottom: 40 },
  title:    { fontSize: 28, fontWeight: '800', color: '#1E3A5F', marginBottom: 8 },

  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E07A20',
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#B0CCEE',
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowLabel: { flex: 1, fontSize: 15, color: '#1E3A5F', fontWeight: '500' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { fontSize: 14, color: '#94A3B8' },
  divider:  { height: 1, backgroundColor: '#E2EAF4' },
  cardHint: { fontSize: 12, color: '#94A3B8', paddingBottom: 12, lineHeight: 18 },
});
