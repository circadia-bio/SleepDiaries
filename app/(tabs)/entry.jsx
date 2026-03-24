import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function EntryTab() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>New Entry</Text>
        <Text style={styles.subtitle}>Which entry would you like to complete?</Text>

        <TouchableOpacity
          style={[styles.card, styles.morningCard]}
          onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'morning' } })}
          activeOpacity={0.85}
        >
          <Ionicons name="sunny-outline" size={36} color="#C25E00" />
          <Text style={styles.morningTitle}>Morning Entry</Text>
          <Text style={styles.morningSub}>About last night's sleep</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.card, styles.eveningCard]}
          onPress={() => router.push({ pathname: '/questionnaire', params: { entryType: 'evening' } })}
          activeOpacity={0.85}
        >
          <Ionicons name="moon-outline" size={36} color="#1E4A8A" />
          <Text style={styles.eveningTitle}>Evening Entry</Text>
          <Text style={styles.eveningSub}>About today's activities</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:  { flex: 1, backgroundColor: '#EEF5FF' },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 48, gap: 16 },
  title:     { fontSize: 28, fontWeight: '800', color: '#1E3A5F', marginBottom: 4 },
  subtitle:  { fontSize: 15, color: '#4A7BB5', marginBottom: 16 },

  card: { borderRadius: 16, padding: 28, alignItems: 'center', gap: 8 },
  morningCard: { backgroundColor: '#F5C96A' },
  eveningCard: { backgroundColor: '#7EB0E0' },

  morningTitle: { fontSize: 22, fontWeight: '800', color: '#C25E00' },
  morningSub:   { fontSize: 14, color: '#7A4800' },
  eveningTitle: { fontSize: 22, fontWeight: '800', color: '#1E4A8A' },
  eveningSub:   { fontSize: 14, color: '#2A5A8A' },
});
