/**
 * app/export.jsx — Data export and import screen
 *
 * Export: shares all entries as CSV or JSON via the native share sheet.
 * Import: picks a JSON file via the document picker, then asks the user
 *         whether to merge with or replace existing entries.
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert, Share,
  useWindowDimensions, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { exportToCSV, exportToJSON, loadName, loadEntries, importFromJSON } from '../storage/storage';

export default function ExportScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [loading, setLoading] = useState(null); // 'csv' | 'json' | 'import' | null

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

  const handleImport = async () => {
    // Document picker not supported on web
    if (Platform.OS === 'web') {
      Alert.alert('Not supported', 'File import is not available on the web version.');
      return;
    }
    setLoading('import');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', 'text/json', '*/*'],
        copyToCacheDirectory: true,
      });
      if (result.canceled) { setLoading(null); return; }

      const uri = result.assets[0].uri;
      const text = await fetch(uri).then((r) => r.text());
      const parsed = JSON.parse(text);

      const existing = await loadEntries();

      if (existing.length === 0) {
        // No existing data — import directly without asking
        const { imported } = await importFromJSON(parsed, 'replace');
        Alert.alert('Import successful', `${imported} ${imported === 1 ? 'entry' : 'entries'} imported.`);
      } else {
        // Ask user how to handle conflict
        Alert.alert(
          'Existing data found',
          `You already have ${existing.length} ${existing.length === 1 ? 'entry' : 'entries'}. What would you like to do?`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Merge',
              onPress: async () => {
                const { imported, skipped } = await importFromJSON(parsed, 'merge');
                Alert.alert(
                  'Merge complete',
                  `${imported} new ${imported === 1 ? 'entry' : 'entries'} added.${skipped > 0 ? `\n${skipped} duplicate${skipped === 1 ? '' : 's'} skipped.` : ''}`
                );
              },
            },
            {
              text: 'Replace',
              style: 'destructive',
              onPress: async () => {
                Alert.alert(
                  'Replace all data?',
                  'This will permanently delete all your existing entries. This cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Replace',
                      style: 'destructive',
                      onPress: async () => {
                        const { imported } = await importFromJSON(parsed, 'replace');
                        Alert.alert('Import complete', `${imported} ${imported === 1 ? 'entry' : 'entries'} imported.`);
                      },
                    },
                  ]
                );
              },
            },
          ]
        );
      }
    } catch (e) {
      Alert.alert('Import failed', e.message);
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

          {/* Divider */}
          <View style={styles.divider} />

          {/* JSON Import */}
          <TouchableOpacity
            style={styles.exportCard}
            onPress={handleImport}
            activeOpacity={0.85}
            disabled={!!loading}
          >
            <View style={[styles.exportIcon, { backgroundColor: '#FFF3E8' }]}>
              <Ionicons name="download-outline" size={28} color="#E07A20" />
            </View>
            <View style={styles.exportText}>
              <Text style={styles.exportTitle}>Import from JSON</Text>
              <Text style={styles.exportSubtitle}>
                Restore entries from a previously exported Sleep Diaries JSON file.
              </Text>
            </View>
            {loading === 'import'
              ? <ActivityIndicator color="#E07A20" />
              : <Ionicons name="folder-open-outline" size={20} color="#E07A20" />
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

  note:    { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18, paddingHorizontal: 8 },
  divider: { height: 1, backgroundColor: '#E2EAF4', marginVertical: 4 },
});
