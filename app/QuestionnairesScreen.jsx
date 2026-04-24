/**
 * app/QuestionnairesScreen.jsx — One-time research questionnaires screen
 * Lifted from ProfileModal; pushed via router.push('/QuestionnairesScreen').
 * Accepts `morningCount` as a route param so the results-unlock logic still works.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FONTS, SIZES } from '../theme/typography';
import { loadAllQuestionnaires, loadEntries } from '../storage/storage';
import { QUESTIONNAIRES } from '../data/questionnaires';
import QuestionnaireModal from './QuestionnaireModal';
import showAlert from '../utils/alert';
import t, { locale } from '../i18n';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function QuestionnairesScreen() {
  const router = useRouter();
  const [morningCount, setMorningCount] = useState(0);
  const [qResults, setQResults]         = useState({});
  const [activeQ, setActiveQ]           = useState(null);

  const load = useCallback(async () => {
    const [entries, qr] = await Promise.all([loadEntries(), loadAllQuestionnaires()]);
    setMorningCount(entries.filter((e) => e.type === 'morning').length);
    setQResults(Object.fromEntries(qr.map((r) => [r.id, r])));
  }, []);

  useEffect(() => { load(); }, []);

  const resultsUnlocked = morningCount >= 14;

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontFamily: FONTS.heading }]}>
          {t('profileQuestionnaires.sectionTitle')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {QUESTIONNAIRES.map((q, i, arr) => {
            const result = qResults[q.id];
            const interpretation = (result && resultsUnlocked) ? q.interpret(result.score) : null;
            return (
              <View key={q.id}>
                <View style={styles.qRow}>
                  <View style={styles.qInfo}>
                    <View style={styles.qTitleRow}>
                      <Text style={[styles.qTitle, { fontFamily: FONTS.body }]}>{q.title}</Text>
                      {q.beta && (
                        <View style={styles.betaChip}>
                          <Text style={[styles.betaChipText, { fontFamily: FONTS.body }]}>BETA</Text>
                        </View>
                      )}
                    </View>
                    {result && resultsUnlocked ? (
                      <View style={styles.qResultRow}>
                        <View style={[styles.qBadge, { backgroundColor: interpretation.color + '18', borderColor: interpretation.color }]}>
                          <Text style={[styles.qBadgeText, { color: interpretation.color, fontFamily: FONTS.body }]}>
                            {result.score} — {interpretation.label}
                          </Text>
                        </View>
                        <Text style={[styles.qDate, { fontFamily: FONTS.bodyMedium }]}>
                          {formatDate(result.completedAt?.split('T')[0])}
                        </Text>
                      </View>
                    ) : result && !resultsUnlocked ? (
                      <View style={styles.qResultRow}>
                        <View style={[styles.qBadge, { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' }]}>
                          <Ionicons name="time-outline" size={13} color="#94A3B8" />
                          <Text style={[styles.qBadgeText, { color: '#94A3B8', fontFamily: FONTS.body }]}>
                            {t('profileQuestionnaires.resultsAfter14')}
                          </Text>
                        </View>
                        <Text style={[styles.qDate, { fontFamily: FONTS.bodyMedium }]}>
                          {t('profileQuestionnaires.completed')} {formatDate(result.completedAt?.split('T')[0])}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.qPending, { fontFamily: FONTS.bodyMedium }]}>
                        {t('profileQuestionnaires.notYetCompleted')}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={styles.qBtn}
                    onPress={() => {
                      if (result) {
                        showAlert(
                          t('profileQuestionnaires.redoTitle'),
                          t('profileQuestionnaires.redoBody', { title: q.shortTitle }),
                          [
                            { text: t('profileQuestionnaires.redoCancel'), style: 'cancel' },
                            { text: t('profileQuestionnaires.redoConfirm'), style: 'destructive', onPress: () => setActiveQ(q) },
                          ]
                        );
                      } else {
                        setActiveQ(q);
                      }
                    }}
                  >
                    <Text style={[styles.qBtnText, { fontFamily: FONTS.body }]}>
                      {result ? t('profileQuestionnaires.redo') : t('profileQuestionnaires.start')}
                    </Text>
                  </TouchableOpacity>
                </View>
                {i < arr.length - 1 && <View style={styles.divider} />}
              </View>
            );
          })}
        </View>

        {QUESTIONNAIRES.some((q) => q.beta) && (
          <Text style={[styles.betaFootnote, { fontFamily: FONTS.bodyMedium }]}>
            {t('profileQuestionnaires.betaFootnote')}
          </Text>
        )}
      </ScrollView>

      {activeQ && (
        <QuestionnaireModal
          visible={!!activeQ}
          questionnaire={activeQ}
          resultsUnlocked={resultsUnlocked}
          onClose={() => setActiveQ(null)}
          onComplete={async (result) => {
            setQResults((prev) => ({ ...prev, [result.id]: result }));
            setActiveQ(null);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#EEF5FF' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 18, shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  headerTitle:  { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  backBtn:      { width: 44, alignItems: 'flex-start' },
  content:      { padding: 20, gap: 12, paddingBottom: 40 },
  card:         { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', overflow: 'hidden', shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  qRow:         { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  qInfo:        { flex: 1, gap: 6 },
  qTitle:       { fontSize: SIZES.body, color: '#1E3A5F' },
  qTitleRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  betaChip:     { backgroundColor: '#F0E8FA', borderWidth: 1, borderColor: '#C4A8E0', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  betaChipText: { fontSize: 11, color: '#6B3FA0', letterSpacing: 0.5 },
  betaFootnote: { fontSize: SIZES.caption, color: '#94A3B8', lineHeight: 22, paddingHorizontal: 4, marginTop: 4, textAlign: 'center' },
  qResultRow:   { gap: 4 },
  qBadge:       { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, flexShrink: 1 },
  qBadgeText:   { fontSize: SIZES.label, flexShrink: 1 },
  qDate:        { fontSize: SIZES.caption, color: '#94A3B8' },
  qPending:     { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  qBtn:         { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: 'rgba(74,123,181,0.12)', borderWidth: 0, shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 6, elevation: 3 },
  qBtnText:     { fontSize: SIZES.label, color: '#4A7BB5' },
  divider:      { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
});
