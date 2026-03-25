import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Share,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { exportToCSV, exportToJSON, loadName, loadEntries } from '../storage/storage';

export default function ExportScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [loading, setLoading] = useState(null); // 'csv' | 'json' | null

  const handleExport = async (format) => {
    setLoading(format);
    try {
      const name = await loadName();
      const entries = await loadEntries();

      if (entries.length === 0) {
        Alert.alert('No data', 'Complete at least one entry before exporting.');
        setLoading(null);
        return;
      }

      const data = format === 'csv'
        ? await exportToCSV(name)
        : await exportToJSON(name);

      const filename = `sleep-diaries-${name ?? 'export'}-${new Date().toISOString().split('T')[0]}.${format}`;

      await Share.share({
        title: filename,
        message: data,
      });
    } catch (e) {
      Alert.alert('Export failed', e.message);
    }
    setLoading(null);
  };

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1E3A5F" />
          </TouchableOpacity>
          <Text style={styles.title}>Export Data</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          {/* Description */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={22} color="#4A7BB5" />
            <Text style={styles.infoText}>
              Export all your sleep diary entries to share with a researcher or import into a spreadsheet.
            </Text>
          </View>

          {/* CSV Export */}
          <TouchableOpacity
            style={styles.exportCard}
            onPress={() => handleExport('csv')}
            activeOpacity={0.85}
            disabled={!!loading}
          >
            <View style={styles.exportIcon}>
              <Ionicons name="grid-outline" size={28} color="#4A7BB5" />
            </View>
            <View style={styles.exportText}>
              <Text style={styles.exportTitle}>Export as CSV</Text>
              <Text style={styles.exportSubtitle}>
                One row per entry. Opens in Excel, Numbers, or any spreadsheet app.
              </Text>
            </View>
            {loading === 'csv'
              ? <ActivityIndicator color="#4A7BB5" />
              : <Ionicons name="share-outline" size={20} color="#4A7BB5" />
            }
          </TouchableOpacity>

          {/* JSON Export */}
          <TouchableOpacity
            style={styles.exportCard}
            onPress={() => handleExport('json')}
            activeOpacity={0.85}
            disabled={!!loading}
          >
            <View style={styles.exportIcon}>
              <Ionicons name="code-slash-outline" size={28} color="#4A7BB5" />
            </View>
            <View style={styles.exportText}>
              <Text style={styles.exportTitle}>Export as JSON</Text>
              <Text style={styles.exportSubtitle}>
                Full structured data including all answers. Ideal for analysis scripts.
              </Text>
            </View>
            {loading === 'json'
              ? <ActivityIndicator color="#4A7BB5" />
              : <Ionicons name="share-outline" size={20} color="#4A7BB5" />
            }
          </TouchableOpacity>

          {/* Note */}
          <Text style={styles.note}>
            Your data stays on your device at all times. Exporting shares it only with the app you choose.
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#EEF5FF' },
  header:  {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#B0CCEE',
    backgroundColor: '#EEF5FF',
  },
  backBtn: { padding: 4 },
  title:   { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },

  content: { flex: 1, padding: 20, gap: 16 },

  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5,
    borderColor: '#B0CCEE', padding: 16,
  },
  infoText: { flex: 1, fontSize: 14, color: '#4A7BB5', lineHeight: 20 },

  exportCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5,
    borderColor: '#B0CCEE', padding: 16,
  },
  exportIcon: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: '#EEF5FF', alignItems: 'center', justifyContent: 'center',
  },
  exportText:     { flex: 1, gap: 4 },
  exportTitle:    { fontSize: 16, fontWeight: '700', color: '#1E3A5F' },
  exportSubtitle: { fontSize: 13, color: '#94A3B8', lineHeight: 18 },

  note: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 },
});
