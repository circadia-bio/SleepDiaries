/**
 * app/past-entries.jsx — Past entries history screen
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, useWindowDimensions, Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { loadEntries } from '../storage/storage';
import { MORNING_QUESTIONS, EVENING_QUESTIONS } from '../data/useQuestions';
import t, { locale } from '../i18n';

const pad = (n) => String(n).padStart(2, '0');

const formatDate = (dateStr) => {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTime = (completedAt) => {
  const date = new Date(completedAt);
  return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
};

const formatAnswer = (question, value) => {
  if (value === null || value === undefined) return '—';
  switch (question.type) {
    case 'time':      return `${pad(value.hour)}:${pad(value.minute)}`;
    case 'duration': {
      const parts = [];
      if (value.hours > 0)   parts.push(`${value.hours}h`);
      if (value.minutes > 0) parts.push(`${value.minutes}m`);
      return parts.length > 0 ? parts.join(' ') : '0m';
    }
    case 'yes_no':    return value === 'yes' ? t('pastEntries.answerYes') : t('pastEntries.answerNo');
    case 'number':    return `${value}${question.unit ? ' ' + question.unit : ''}`;
    case 'rating': {
      const option = question.options?.find((o) => o.value === value);
      return option ? `${value}/5 — ${option.label}` : `${value}/5`;
    }
    case 'medication':
      if (!value || value.length === 0) return t('pastEntries.answerNone');
      return value.map((m) => `${m.name}${m.dose ? ` (${m.dose}mg)` : ''}`).join(', ');
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
      <Text style={styles.answerQuestion}>{question.number}. {question.text}</Text>
      <Text style={[styles.answerValue, { color }]}>{formatted}</Text>
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
      <TouchableOpacity
        style={[styles.cardHeader, { backgroundColor: headerBg }]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeaderLeft}>
          <Ionicons name={isMorning ? 'sunny-outline' : 'moon-outline'} size={18} color={primaryColor} />
          <Text style={[styles.cardType, { color: primaryColor }]}>
            {isMorning ? t('pastEntries.morningEntry') : t('pastEntries.eveningEntry')}
          </Text>
        </View>
        <View style={styles.cardHeaderRight}>
          <Text style={[styles.cardTime, { color: primaryColor }]}>{formatTime(entry.completedAt)}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={primaryColor} />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={[styles.cardBody, { backgroundColor: bgColor }]}>
          {questions.map((q) => {
            const value = entry.answers?.[q.id];
            if (q.conditionalOn) {
              const parentAnswer = entry.answers?.[q.conditionalOn.id];
              if (parentAnswer !== q.conditionalOn.value) return null;
            }
            return <AnswerRow key={q.id} question={q} value={value} isMorning={isMorning} />;
          })}
        </View>
      )}
    </View>
  );
};

const groupByDate = (entries) => {
  const groups = {};
  for (const entry of entries) {
    if (!groups[entry.date]) groups[entry.date] = [];
    groups[entry.date].push(entry);
  }
  for (const date of Object.keys(groups)) {
    groups[date].sort((a) => (a.type === 'morning' ? -1 : 1));
  }
  return groups;
};

const buildListItems = (grouped, dates) => {
  const items = [];
  for (const date of dates) {
    items.push({ type: 'date', id: `date-${date}`, date });
    for (const entry of grouped[date]) {
      items.push({ type: 'entry', id: entry.id, entry });
    }
  }
  return items;
};

export default function PastEntriesScreen() {
  const router = useRouter();
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const { height: windowHeight } = useWindowDimensions();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        setLoading(true);
        const all = await loadEntries();
        setEntries(all);
        setLoading(false);
      };
      load();
    }, [])
  );

  const grouped   = groupByDate(entries);
  const dates     = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const listItems = buildListItems(grouped, dates);

  const HEADER_HEIGHT = 52;
  const listHeight = windowHeight - insets.top - insets.bottom - HEADER_HEIGHT;

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return <Text style={styles.dateLabel}>{formatDate(item.date)}</Text>;
    }
    return <EntryCard entry={item.entry} />;
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={[styles.header, { height: HEADER_HEIGHT }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('pastEntries.title')}</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={[styles.centred, { height: listHeight }]}>
          <ActivityIndicator size="large" color="#4A7BB5" />
        </View>
      ) : entries.length === 0 ? (
        <View style={[styles.centred, { height: listHeight }]}>
          <Ionicons name="moon-outline" size={48} color="#B0CCEE" />
          <Text style={styles.emptyTitle}>{t('pastEntries.emptyTitle')}</Text>
          <Text style={styles.emptySubtitle}>{t('pastEntries.emptySubtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={listItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={true}
          style={{ height: listHeight }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#EEF5FF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#B0CCEE',
    backgroundColor: '#EEF5FF',
  },
  backBtn: { padding: 4 },
  title:   { fontSize: 18, fontWeight: '700', color: '#1E3A5F' },
  listContent: { padding: 16, gap: 10 },
  centred: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle:    { fontSize: 18, fontWeight: '700', color: '#4A7BB5', textAlign: 'center' },
  emptySubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
  dateLabel: {
    fontSize: 13, fontWeight: '700', color: '#4A7BB5',
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 16, marginBottom: 4,
  },
  card:            { borderRadius: 14, borderWidth: 1.5, overflow: 'hidden', marginBottom: 4 },
  cardHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  cardHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardType:        { fontSize: 15, fontWeight: '700' },
  cardTime:        { fontSize: 13, fontWeight: '500' },
  cardBody:        { paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  answerRow:      { gap: 2 },
  answerQuestion: { fontSize: 12, color: '#94A3B8', lineHeight: 16 },
  answerValue:    { fontSize: 14, fontWeight: '600' },
});
