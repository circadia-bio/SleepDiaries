/**
 * app/export.jsx — Data export and import screen
 */
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator, Share, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { exportToCSV, exportToJSON, loadName, loadEntries, importFromJSON } from '../storage/storage';
import showAlert from '../utils/alert';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

export default function ExportScreen() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const [loading, setLoading] = useState(null);
  const [showSplash, setShowSplash] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { if (!showSplash) return; const t = setTimeout(() => setShowSplash(false), 2500); return () => clearTimeout(t); }, [showSplash]);

  const handleExport = async (format) => {
    setLoading(format);
    try {
      const name = await loadName(); const entries = await loadEntries();
      if (!entries.length) { showAlert(t('export.noDataTitle'), t('export.noDataBody')); setLoading(null); return; }
      await Share.share({ title: `sleep-diaries-${name ?? 'export'}-${new Date().toISOString().split('T')[0]}.${format}`, message: format === 'csv' ? await exportToCSV(name) : await exportToJSON(name) });
    } catch (e) { showAlert(t('export.exportFailTitle'), e.message); }
    setLoading(null);
  };

  const doImport = async (parsed, mode) => { await importFromJSON(parsed, mode); setShowSplash(true); setLoading(null); };

  const processImport = async (parsed) => {
    const existing = await loadEntries();
    if (!existing.length) { await doImport(parsed, 'replace'); return; }
    const count = existing.length;
    showAlert(t('export.existingDataTitle'), count === 1 ? t('export.existingDataBody_one', { count }) : t('export.existingDataBody_other', { count }), [
      { text: t('export.cancel'), style: 'cancel' },
      { text: t('export.merge'), onPress: () => doImport(parsed, 'merge') },
      { text: t('export.replace'), style: 'destructive', onPress: () => showAlert(t('export.replaceConfirmTitle'), t('export.replaceConfirmBody'), [{ text: t('export.cancel'), style: 'cancel' }, { text: t('export.replace'), style: 'destructive', onPress: () => doImport(parsed, 'replace') }]) },
    ]);
    setLoading(null);
  };

  const handleWebFileChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) { setLoading(null); return; }
    try { await processImport(JSON.parse(await file.text())); } catch (err) { showAlert(t('export.importFailTitle'), err.message); setLoading(null); }
    e.target.value = '';
  };

  const handleImport = async () => {
    setLoading('import');
    if (Platform.OS === 'web') { fileInputRef.current?.click(); return; }
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', 'text/json', '*/*'], copyToCacheDirectory: true });
      if (result.canceled) { setLoading(null); return; }
      await processImport(JSON.parse(await fetch(result.assets[0].uri).then((r) => r.text())));
    } catch (e) { showAlert(t('export.importFailTitle'), e.message); setLoading(null); }
  };

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1E3A5F" /></TouchableOpacity>
          <Text style={[styles.title, { fontFamily: FONTS.heading }]}>{t('export.title')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color="#4A7BB5" />
            <Text style={[styles.infoText, { fontFamily: FONTS.bodyMedium }]}>{t('export.infoText')}</Text>
          </View>

          {[
            { format: 'csv',  icon: 'grid-outline',       title: t('export.csvTitle'),    sub: t('export.csvSubtitle'),    color: '#4A7BB5', bg: '#EEF5FF' },
            { format: 'json', icon: 'code-slash-outline', title: t('export.jsonTitle'),   sub: t('export.jsonSubtitle'),   color: '#4A7BB5', bg: '#EEF5FF' },
          ].map(({ format, icon, title, sub, color, bg }) => (
            <TouchableOpacity key={format} style={styles.exportCard} onPress={() => handleExport(format)} activeOpacity={0.85} disabled={!!loading}>
              <View style={[styles.exportIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={30} color={color} /></View>
              <View style={styles.exportText}>
                <Text style={[styles.exportTitle, { fontFamily: FONTS.body }]}>{title}</Text>
                <Text style={[styles.exportSubtitle, { fontFamily: FONTS.bodyMedium }]}>{sub}</Text>
              </View>
              {loading === format ? <ActivityIndicator color={color} /> : <Ionicons name="share-outline" size={22} color={color} />}
            </TouchableOpacity>
          ))}

          <View style={styles.divider} />

          <TouchableOpacity style={styles.exportCard} onPress={handleImport} activeOpacity={0.85} disabled={!!loading}>
            <View style={[styles.exportIcon, { backgroundColor: '#FFF3E8' }]}><Ionicons name="download-outline" size={30} color="#E07A20" /></View>
            <View style={styles.exportText}>
              <Text style={[styles.exportTitle, { fontFamily: FONTS.body }]}>{t('export.importTitle')}</Text>
              <Text style={[styles.exportSubtitle, { fontFamily: FONTS.bodyMedium }]}>{t('export.importSubtitle')}</Text>
            </View>
            {loading === 'import' ? <ActivityIndicator color="#E07A20" /> : <Ionicons name="folder-open-outline" size={22} color="#E07A20" />}
          </TouchableOpacity>

          {Platform.OS === 'web' && <input ref={fileInputRef} type="file" accept=".json,application/json,text/plain" style={{ display: 'none' }} onChange={handleWebFileChange} />}

          <Text style={[styles.note, { fontFamily: FONTS.bodyMedium }]}>{t('export.note')}</Text>
        </View>
      </SafeAreaView>

      {showSplash && (
        <TouchableOpacity style={styles.splashOverlay} activeOpacity={1} onPress={() => setShowSplash(false)}>
          <Image source={require('../assets/splash-icon.png')} style={styles.splashImage} resizeMode="contain" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#EEF5FF' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#B0CCEE', backgroundColor: '#EEF5FF' },
  backBtn: { padding: 4 },
  title:   { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  content: { flex: 1, padding: 20, gap: 16 },
  infoCard:       { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', padding: 18 },
  infoText:       { flex: 1, fontSize: SIZES.body, color: '#4A7BB5', lineHeight: 26 },
  exportCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#B0CCEE', padding: 16 },
  exportIcon:     { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  exportText:     { flex: 1, gap: 4 },
  exportTitle:    { fontSize: SIZES.body, color: '#1E3A5F' },
  exportSubtitle: { fontSize: SIZES.bodySmall, color: '#94A3B8', lineHeight: 24 },
  note:    { fontSize: SIZES.bodySmall, color: '#94A3B8', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8 },
  divider: { height: 1, backgroundColor: '#E2EAF4', marginVertical: 4 },
  splashOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, backgroundColor: '#C8DFF5', alignItems: 'center', justifyContent: 'center' },
  splashImage:   { width: '100%', aspectRatio: 1 },
});
