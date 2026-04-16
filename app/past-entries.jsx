/**
 * app/past-entries.jsx — Past entries history screen
 */
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEntries } from '../storage/EntriesContext';
import { MORNING_QUESTIONS, EVENING_QUESTIONS } from '../data/useQuestions';
import { FONTS, SIZES } from '../theme/typography';
import t, { locale } from '../i18n';

const pad = (n) => String(n).padStart(2, '0');

const formatDate = (dateStr) => new Date(dateStr + 'T12:00:00').toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const formatTime = (completedAt) => new Date(completedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

const formatAnswer = (question, value) => {
  if (value === null || value === undefined) return '—';
  switch (question.type) {
    case 'time':      return `${pad(value.hour)}:${pad(value.minute)}`;
    case 'duration': { const p = []; if (value.hours > 0) p.push(`${value.hours}h`); if (value.minutes > 0) p.push(`${value.minutes}m`); return p.length ? p.join(' ') : '0m'; }
    case 'yes_no':    return value === 'yes' ? t('pastEntries.answerYes') : t('pastEntries.answerNo');
    case 'number':    return `${value}${question.unit ? ' ' + question.unit : ''}`;
    case 'rating':  { const o = question.options?.find((x) => x.value === value); return o ? `${value}/5 — ${o.label}` : `${value}/5`; }
    case 'medication': return (!value || !value.length) ? t('pastEntries.answerNone') : value.map((m) => `${m.name}${m.dose ? ` (${m.dose}mg)` : ''}`).join(', ');
    case 'text_input': return value || '—';
    default:           return String(value);
  }
};

const AnswerRow = ({ question, value, isMorning }) => {
  const color = isMorning ? '#C25E00' : '#1E4A8A';
  const formatted = formatAnswer(question, value);
  if (formatted === '—' && question.optional) return null;
  return (
    <View style={styles.answerRow}>
      <Text style={[styles.answerQuestion, { fontFamily: FONTS.bodyMedium }]}>{question.number}. {question.text}</Text>
      <Text style={[styles.answerValue, { color, fontFamily: FONTS.body }]}>{formatted}</Text>
    </View>
  );
};

const EntryCard = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const isMorning    = entry.type === 'morning';
  const questions    = isMorning ? MORNING_QUESTIONS : EVENING_QUESTIONS;
  const primaryColor = isMorning ? '#C25E00' : '#1E4A8A';
  const bgColor      = isMorning ? '#FFF8EE' : '#EEF5FF';
  const borderColor  = isMorning ? '#F5C96A' : '#7EB0E0';
  const headerBg     = isMorning ? '#F5C96A' : '#7EB0E0';

  return (
    <View style={[styles.card, { borderColor }]}>
      <TouchableOpacity style={[styles.cardHeader, { backgroundColor: headerBg }]} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <View style={styles.cardHeaderLeft}>
          <Ionicons name={isMorning ? 'sunny-outline' : 'moon-outline'} size={20} color={primaryColor} />
          <Text style={[styles.cardType, { color: primaryColor, fontFamily: FONTS.body }]}>
            {isMorning ? t('pastEntries.morningEntry') : t('pastEntries.eveningEntry')}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.cardTime, { color: primaryColor, fontFamily: FONTS.bodyMedium }]}>{formatTime(entry.completedAt)}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={primaryColor} />
        </View>
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.cardBody, { backgroundColor: bgColor }]}>
          {questions.map((q) => {
            const value = entry.answers?.[q.id];
            if (q.conditionalOn) { const pa = entry.answers?.[q.conditionalOn.id]; if (pa !== q.conditionalOn.value) return null; }
            return <AnswerRow key={q.id} question={q} value={value} isMorning={isMorning} />;
          })}
        </View>
      )}
    </View>
  );
};

const groupByDate = (entries) => {
  const groups = {};
  for (const entry of entries) { if (!groups[entry.date]) groups[entry.date] = []; groups[entry.date].push(entry); }
  for (const date of Object.keys(groups)) groups[date].sort((a) => (a.type === 'morning' ? -1 : 1));
  return groups;
};

const buildListItems = (grouped, dates) => {
  const items = [];
  for (const date of dates) { items.push({ type: 'date', id: `date-${date}`, date }); for (const entry of grouped[date]) items.push({ type: 'entry', id: entry.id, entry }); }
  return items;
};

export default function PastEntriesScreen() {
  const router = useRouter();
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const { height: windowHeight } = useWindowDimensions();
  const { entries, loading, refresh } = useEntries();

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const grouped   = groupByDate(entries);
  const dates     = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const listItems = buildListItems(grouped, dates);
  const HEADER_HEIGHT = 56;
  const listHeight = windowHeight - insets.top - insets.bottom - HEADER_HEIGHT;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.header, { height: HEADER_HEIGHT }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1E3A5F" /></TouchableOpacity>
        <Text style={[styles.title, { fontFamily: FONTS.heading }]}>{t('pastEntries.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={[styles.centred, { height: listHeight }]}><ActivityIndicator size="large" color="#4A7BB5" /></View>
      ) : entries.length === 0 ? (
        <View style={[styles.centred, { height: listHeight }]}>
          <Ionicons name="moon-outline" size={52} color="#B0CCEE" />
          <Text style={[styles.emptyTitle, { fontFamily: FONTS.heading }]}>{t('pastEntries.emptyTitle')}</Text>
          <Text style={[styles.emptySubtitle, { fontFamily: FONTS.body }]}>{t('pastEntries.emptySubtitle')}</Text>
        </View>
      ) : (
        <FlatList data={listItems} keyExtractor={(item) => item.id} style={{ height: listHeight }}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          renderItem={({ item }) => item.type === 'date'
            ? <Text style={[styles.dateLabel, { fontFamily: FONTS.body }]}>{formatDate(item.date)}</Text>
            : <EntryCard entry={item.entry} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF5FF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#B0CCEE', backgroundColor: '#EEF5FF' },
  backBtn: { padding: 4 },
  title:   { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  listContent: { padding: 16, gap: 10 },
  centred: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle:    { fontSize: SIZES.cardTitle, color: '#4A7BB5', textAlign: 'center' },
  emptySubtitle: { fontSize: SIZES.body, color: '#94A3B8', textAlign: 'center', lineHeight: 26 },
  dateLabel:     { fontSize: SIZES.bodySmall, color: '#4A7BB5', textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 4 },
  card:            { borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', marginBottom: 4 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  cardHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardType:        { fontSize: SIZES.body },
  cardTime:        { fontSize: SIZES.bodySmall },
  cardBody:        { paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  answerRow:       { gap: 4 },
  answerQuestion:  { fontSize: SIZES.bodySmall, color: '#94A3B8', lineHeight: 22 },
  answerValue:     { fontSize: SIZES.body, lineHeight: 26 },
});
