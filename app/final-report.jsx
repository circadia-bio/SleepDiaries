/**
 * app/final-report.jsx — Sleep metrics summary report
 */
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share, useWindowDimensions } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadAllQuestionnaires, loadResearchCode } from '../storage/storage';
import { useEntries } from '../storage/EntriesContext';
import { MIN_ENTRIES_FOR_REPORT } from '../utils/constants';
import { computeMetrics } from '../utils/metrics';
import { QUESTIONNAIRES } from '../data/questionnaires';
import { FONTS, SIZES } from '../theme/typography';
import t, { locale } from '../i18n';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { BlurView } from 'expo-blur';
import ScreenBackground from '../components/ScreenBackground';
import IMAGES from '../assets/images';


const pad = (n) => String(Math.round(n)).padStart(2, '0');
const formatMinutes = (mins) => { if (mins === null || isNaN(mins)) return '—'; const h = Math.floor(Math.abs(mins) / 60); const m = Math.round(Math.abs(mins) % 60); return h > 0 ? `${h}h ${pad(m)}m` : `${m}m`; };

const MetricCard = ({ icon, label, value, subtext, color = '#4A7BB5', statusLabel, bar }) => (
  <View
    style={styles.metricCard}
    accessible={true}
    accessibilityLabel={[label, value, statusLabel, subtext].filter(Boolean).join(', ')}
  >
    <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}><Ionicons name={icon} size={52} color={color} accessibilityElementsHidden={true} importantForAccessibility="no" /></View>
    <View style={styles.metricText}>
      <Text style={[styles.metricLabel, { fontFamily: FONTS.bodyMedium }]}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, { color, fontFamily: FONTS.heading }]}>{value}</Text>
        {statusLabel ? <Text style={[styles.metricStatusLabel, { color, fontFamily: FONTS.bodyMedium }]}>{statusLabel}</Text> : null}
      </View>
      {subtext ? <Text style={[styles.metricSubtext, { fontFamily: FONTS.bodyMedium }]}>{subtext}</Text> : null}
      {bar ?? null}
    </View>
  </View>
);

// ─── Questionnaire scale bar ─────────────────────────────────────────────────
const PROBE_COUNTS = 40;

const buildBands = (questionnaire) => {
  const score = questionnaire.score;
  const interpret = questionnaire.interpret;
  let maxScore = 0;
  try {
    const maxAnswers = {};
    for (const item of questionnaire.items) {
      if (item.options) {
        maxAnswers[item.id] = Math.max(...item.options.map((o) => o.value));
      } else if (item.type === 'number' || item.type === 'duration_min') {
        maxAnswers[item.id] = item.max ?? 10;
      } else if (item.type === 'scale_0_10') {
        maxAnswers[item.id] = 10;
      } else if (item.type === 'yes_no') {
        maxAnswers[item.id] = 'yes';
      }
    }
    const s = score(maxAnswers);
    if (typeof s === 'number') maxScore = s;
    else return null;
  } catch (_) { return null; }
  if (maxScore <= 0) return null;

  const bands = [];
  let lastLabel = null;
  let bandStart = 0;
  for (let i = 0; i <= PROBE_COUNTS; i++) {
    const probeScore = (i / PROBE_COUNTS) * maxScore;
    const interp = interpret(probeScore);
    if (interp.label !== lastLabel) {
      if (lastLabel !== null) bands.push({ label: lastLabel, end: i / PROBE_COUNTS });
      lastLabel = interp.label;
      bandStart = i / PROBE_COUNTS;
    }
  }
  if (lastLabel) bands.push({ label: lastLabel, end: 1 });
  return { bands, maxScore };
};

const ScaleBar = ({ questionnaire, score: rawScore }) => {
  const built = useMemo(() => buildBands(questionnaire), [questionnaire]);
  if (typeof rawScore !== 'number') return null;
  if (!built) return null;
  const { bands, maxScore } = built;
  const pctScore = rawScore / maxScore;

  return (
    <View style={styles.scaleBarContainer}>
      <View style={styles.scaleBarTrack}>
        {bands.map((band, i) => {
          const prevEnd = i === 0 ? 0 : bands[i - 1].end;
          const width = (band.end - prevEnd) * 100;
          const interp = questionnaire.interpret((prevEnd + band.end) / 2 * maxScore);
          return (
            <View
              key={band.label}
              style={[styles.scaleBarSegment, { width: `${width}%`, backgroundColor: interp.color + '55' }]}
            />
          );
        })}
        <View style={[styles.scaleBarMarker, { left: `${Math.min(pctScore * 100, 97)}%` }]} />
      </View>
      <View style={styles.scaleBarEndLabels}>
        <Text style={[styles.scaleBarEndText, { fontFamily: FONTS.bodyMedium }]}>0</Text>
        <Text style={[styles.scaleBarEndText, { fontFamily: FONTS.bodyMedium }]}>{maxScore}</Text>
      </View>
    </View>
  );
};

// ─── Single questionnaire result card ────────────────────────────────────────
const QuestionnaireReportCard = ({ result, questionnaire, locale }) => {
  const interpretation = questionnaire.interpret(result.score);
  const isMCTQ = typeof result.score === 'object';
  const scoreDisplay = isMCTQ
    ? (() => { const h = result.score.msf_sc; const hh = Math.floor(h); const mm = Math.round((h % 1) * 60); return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`; })()
    : String(result.score);
  const completedDate = result.completedAt
    ? new Date(result.completedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <View style={styles.qReportCard}>
      <View style={styles.qReportHeader}>
        <Text style={[styles.qReportTitle, { fontFamily: FONTS.body }]}>{questionnaire.title}</Text>
        {questionnaire.beta && (
          <View style={styles.qReportBetaChip}>
            <Text style={[styles.qReportBetaText, { fontFamily: FONTS.body }]}>BETA</Text>
          </View>
        )}
      </View>
      <View style={styles.qReportScoreRow}>
        <View style={[styles.qReportScoreBadge, { backgroundColor: interpretation.color + '18', borderColor: interpretation.color }]}>
          <Text style={[styles.qReportScoreValue, { color: interpretation.color, fontFamily: FONTS.heading }]}>{scoreDisplay}</Text>
        </View>
        <View style={styles.qReportInterpText}>
          <Text style={[styles.qReportInterpLabel, { color: interpretation.color, fontFamily: FONTS.body }]}>{interpretation.label}</Text>
          <Text style={[styles.qReportInterpDesc, { fontFamily: FONTS.bodyMedium }]}>{interpretation.description}</Text>
        </View>
      </View>
      {!isMCTQ && <ScaleBar questionnaire={questionnaire} score={result.score} />}
      <Text style={[styles.qReportDate, { fontFamily: FONTS.bodyMedium }]}>Completed {completedDate}</Text>
    </View>
  );
};

// Renders a scale bar with boundary tick labels positioned as % of bar width.
// ticks: [{ pct: number, label: string }] — boundary positions (0–100)
const BandBar = ({ segments, marker, ticks, endLabels }) => (
  <View style={styles.scaleBarContainer}>
    <View style={styles.scaleBarTrack}>
      {segments.map((s, i) => (
        <View key={i} style={[styles.scaleBarSegment, { width: `${s.width}%`, backgroundColor: s.color + '33' }]} />
      ))}
      <View style={[styles.scaleBarMarker, { left: `${Math.min(marker, 97)}%` }]} />
    </View>
    <View style={styles.scaleBarTickRow}>
      <Text style={[styles.scaleBarEndText, { fontFamily: FONTS.bodyMedium }]}>{endLabels[0]}</Text>
      {ticks.map((tick) => (
        <Text key={tick.label} style={[styles.scaleBarTickLabel, { left: `${tick.pct}%`, fontFamily: FONTS.bodyMedium }]}>{tick.label}</Text>
      ))}
      <Text style={[styles.scaleBarEndText, { fontFamily: FONTS.bodyMedium }]}>{endLabels[1]}</Text>
    </View>
  </View>
);

const DurationBar = ({ value }) => {
  if (value === null || isNaN(value)) return null;
  const MAX = 600;
  const marker = Math.min(Math.max(value, 0), MAX) / MAX * 100;
  return <BandBar
    segments={[
      { width: 60, color: '#DC2626' },
      { width: 10, color: '#F59E0B' },
      { width: 20, color: '#2E7D32' },
      { width: 10, color: '#F59E0B' },
    ]}
    marker={marker}
    ticks={[{ pct: 60, label: '6h' }, { pct: 70, label: '7h' }, { pct: 90, label: '9h' }]}
    endLabels={['0h', '']}
  />;
};

const EfficiencyBar = ({ value }) => {
  if (value === null || isNaN(value)) return null;
  const marker = Math.min(Math.max(value, 0), 100);
  return <BandBar
    segments={[
      { width: 75, color: '#DC2626' },
      { width: 10, color: '#F59E0B' },
      { width: 15, color: '#2E7D32' },
    ]}
    marker={marker}
    ticks={[{ pct: 73, label: '75%' }, { pct: 87, label: '85%' }]}
    endLabels={['0%', '']}
  />;
};

const LatencyBar = ({ value }) => {
  if (value === null || isNaN(value)) return null;
  const MAX = 60;
  const marker = Math.min(Math.max(value, 0), MAX) / MAX * 100;
  return <BandBar
    segments={[
      { width: 25, color: '#2E7D32' },
      { width: 25, color: '#F59E0B' },
      { width: 50, color: '#DC2626' },
    ]}
    marker={marker}
    ticks={[{ pct: 25, label: '15m' }, { pct: 50, label: '30m' }]}
    endLabels={['0m', '']}
  />;
};

const WasoBar = ({ value }) => {
  if (value === null || isNaN(value)) return null;
  const MAX = 60;
  const marker = Math.min(Math.max(value, 0), MAX) / MAX * 100;
  return <BandBar
    segments={[
      { width: 33, color: '#2E7D32' },
      { width: 17, color: '#F59E0B' },
      { width: 50, color: '#DC2626' },
    ]}
    marker={marker}
    ticks={[{ pct: 33, label: '20m' }, { pct: 50, label: '30m' }]}
    endLabels={['0m', '']}
  />;
};

const durationColor  = (m) => m === null ? '#4A7BB5' : m >= 420 && m <= 540 ? '#2E7D32' : m >= 360 && m <= 600 ? '#F59E0B' : '#DC2626';
const alcoholColor   = (n) => n === null ? '#4A7BB5' : n < 1 ? '#2E7D32' : n <= 2 ? '#F59E0B' : '#DC2626';
const latencyColor   = (m) => m === null ? '#4A7BB5' : m <= 15 ? '#2E7D32' : m <= 30 ? '#F59E0B' : '#DC2626';
const wasoColor      = (m) => m === null ? '#4A7BB5' : m <= 20 ? '#2E7D32' : m <= 30 ? '#F59E0B' : '#DC2626';

const AlcoholBar = ({ value }) => {
  // NHS guideline: ≤14 units/week = 2 units/night avg; max display 5
  if (value === null || isNaN(value)) return null;
  const MAX = 5;
  const marker = Math.min(Math.max(value, 0), MAX) / MAX * 100;
  return <BandBar
    segments={[
      { width: 20, color: '#2E7D32' },  // 0–1 drink
      { width: 20, color: '#F59E0B' },  // 1–2 drinks
      { width: 60, color: '#DC2626' },  // >2 drinks
    ]}
    marker={marker}
    ticks={[{ pct: 20, label: '1' }, { pct: 40, label: '2' }]}
    endLabels={['0', '']}
  />;
};

const StarRow = ({ value, max = 5, color = '#E07A20' }) => (
  <View style={styles.starRow}>
    {Array.from({ length: max }).map((_, i) => <Ionicons key={i} name={i < Math.round(value) ? 'star' : 'star-outline'} size={20} color={color} />)}
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { fontFamily: FONTS.body }]}>{title}</Text>
    {children}
  </View>
);

// ─── Web canvas share ────────────────────────────────────────────────────────
// Loads the original HomeBg SVG as an <img> onto the canvas, then draws
// the stats panel on top — pixel-perfect with the native render.
async function handleShareWeb({ metrics, userName, dateRange }) {
  const dpr    = Math.min(window.devicePixelRatio || 1, 2);
  const W      = 390;
  const H      = 844;
  const canvas = document.createElement('canvas');
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = `${W}px`;
  canvas.style.height = `${H}px`;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // ── 1. Draw the original SVG background verbatim ──────────────────────────
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 393 852" preserveAspectRatio="xMidYMid slice" width="${W}" height="${H}"><defs><linearGradient id="hg0" x1="196.5" y1="0" x2="197" y2="583" gradientUnits="userSpaceOnUse"><stop stop-color="#B4D0E7"/><stop offset="0.341346" stop-color="#FEFDF8"/></linearGradient><linearGradient id="hg1" x1="224.862" y1="82.1894" x2="223.765" y2="130.543" gradientUnits="userSpaceOnUse"><stop stop-color="#F0A963"/><stop offset="1" stop-color="#FCEE21" stop-opacity="0"/></linearGradient><linearGradient id="hg2" x1="327.922" y1="65.3509" x2="330.382" y2="178.843" gradientUnits="userSpaceOnUse"><stop stop-color="#B4D0E7"/><stop offset="1" stop-color="#F2F2F2" stop-opacity="0"/></linearGradient><linearGradient id="hg3" x1="212.307" y1="91.4009" x2="216.631" y2="214.942" gradientUnits="userSpaceOnUse"><stop stop-color="#A1C5E7"/><stop offset="1" stop-color="#F2F2F2" stop-opacity="0"/></linearGradient><linearGradient id="hg4" x1="49.0243" y1="50.4535" x2="48.9843" y2="167.685" gradientUnits="userSpaceOnUse"><stop stop-color="#A1C5E7"/><stop offset="1" stop-color="#F2F2F2" stop-opacity="0"/></linearGradient><clipPath id="hclip1"><rect x="152" y="96" width="124" height="77"/></clipPath></defs><rect width="393" height="852" fill="url(#hg0)"/><path d="M224.5 124C237.479 124 248 113.031 248 99.5C248 85.969 237.479 75 224.5 75C211.521 75 201 85.969 201 99.5C201 113.031 211.521 124 224.5 124Z" fill="url(#hg1)"/><path d="M230.021 114.231C230.723 94.9697 249.216 80.0051 271.329 80.8069C273.6 80.8897 275.819 81.1362 277.975 81.5311C286.656 69.746 301.503 63.1784 316.894 65.8113C317.027 65.8337 317.16 65.8613 317.293 65.8854C325.525 54.8952 337.372 48 350.541 48C365.026 48 377.91 56.3418 386.143 69.2977C409.56 71.0874 428 90.5971 428 114.402C428 139.388 407.686 159.642 382.626 159.642C375.783 159.642 369.296 158.128 363.477 155.425C359.38 156.921 355.038 157.728 350.541 157.728C344.26 157.728 338.28 156.157 332.85 153.325C323.574 161.528 311.009 165.613 298.118 163.408C288.69 161.794 280.552 157.064 274.511 150.407C272.637 150.571 270.727 150.626 268.787 150.555C246.676 149.755 229.318 133.491 230.021 114.231Z" fill="url(#hg2)"/><g clip-path="url(#hclip1)"><path d="M271.871 137.569C274.325 133.767 275.674 129.299 275.519 124.556C275.09 111.343 263.157 101.005 248.867 101.466C241.002 101.72 234.061 105.194 229.483 110.468C225.245 101.964 215.354 96 203.83 96C189.761 96 178.129 104.891 176.239 116.44C176.148 116.44 176.058 116.437 175.968 116.437C162.731 116.437 152 127.135 152 140.333C152 153.53 161.789 163.26 174.201 164.163C178.753 168.876 185.144 171.808 192.224 171.808C196.446 171.808 200.423 170.764 203.913 168.922C207.712 171.496 212.3 173.002 217.24 173.002C223.517 173.002 229.223 170.573 233.469 166.606C237.935 169.493 243.548 171.213 249.646 171.213C264.202 171.213 276.002 161.417 276.002 149.332C276.002 145.003 274.486 140.967 271.873 137.569H271.871Z" fill="url(#hg3)"/></g><path d="M91.7861 83.9716C92.5987 82.5377 93.2724 81.0155 93.7864 79.4155C97.9693 66.3878 89.9976 53.1162 75.9798 49.7709C66.7475 47.5677 57.1957 50.2215 50.5541 56.0124C46.6837 54.7057 42.3809 53.9768 37.8473 53.9768C22.4161 53.9768 9.6589 62.408 7.58567 73.3612C7.48669 73.3612 7.38773 73.3582 7.28875 73.3582C-7.2291 73.3582 -19 83.5031 -19 96.0189C-19 108.535 -8.26398 117.762 5.34921 118.618C10.3413 123.088 17.3511 125.868 25.1161 125.868C29.7471 125.868 34.1088 124.878 37.9358 123.131C42.1031 125.572 47.1351 127 52.5526 127C59.4374 127 65.6953 124.697 70.3522 120.935C75.2505 123.673 81.406 125.304 88.0945 125.304C104.059 125.304 117 116.014 117 104.553C117 93.9908 106.007 85.2723 91.7861 83.9701V83.9716Z" fill="url(#hg4)"/><path d="M76.1351 61.8441C80.0209 59.2139 89.9534 55.8903 98.5975 63.638C102.651 60.3941 112.545 55.622 119.69 62.4846" fill="none" stroke="#6A8FAA" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round"/><path d="M127.094 79.3837C129.809 77.5465 136.747 75.2249 142.785 80.6368C145.616 78.3709 152.527 75.0375 157.518 79.8311" fill="none" stroke="#6A8FAA" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round"/><path d="M310.136 80.2646C313.044 78.2184 320.524 75.5637 327.18 81.3151C330.207 78.8016 337.637 75.05 343.145 80.1513" fill="none" stroke="#6A8FAA" stroke-opacity="0.4" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  await new Promise((resolve, reject) => {
    const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const img  = document.createElement('img');
    img.onload = () => { ctx.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url); resolve(); };
    img.onerror = reject;
    img.src = url;
  });

  // ── 2. Light frosted overlay so stats text pops ───────────────────────────
  ctx.fillStyle = 'rgba(238,245,255,0.45)';
  ctx.fillRect(0, 0, W, H);

  // ── 3. Stats panel (vertically centred) ──────────────────────────────────
  const pad     = 28;
  const cW      = W - pad * 2;
  const cellH   = 100;
  const cellGap = 10;
  const gridH   = cellH * 2 + cellGap;
  const totalH  = 22 + 8 + 34 + 8 + 20 + 1 + 20 + gridH; // logo-row+title+sub+div+grid
  let y = H / 2 - totalH / 2;

  ctx.textAlign = 'center';

  // Logo row
  ctx.fillStyle = '#4A7BB5';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillText('\uD83C\uDF19  SLEEP DIARIES', W / 2, y + 14);
  y += 26;

  // Title
  ctx.fillStyle = '#1E3A5F';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('My Sleep Report', W / 2, y + 28);
  y += 38;

  // Subtitle
  ctx.fillStyle = '#64748B';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(`${userName}  \u00B7  ${dateRange}`, W / 2, y + 16);
  y += 26;

  // Divider
  ctx.strokeStyle = 'rgba(74,123,181,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke();
  y += 20;

  // Stat grid
  const fmt = (mins) => {
    if (mins === null || isNaN(mins)) return '\u2014';
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.round(Math.abs(mins) % 60);
    return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
  };
  const eff     = metrics.avgSleepEfficiency !== null ? `${Math.round(metrics.avgSleepEfficiency)}%` : '\u2014';
  const effGood = metrics.avgSleepEfficiency !== null && metrics.avgSleepEfficiency >= 85;
  const stats   = [
    { label: 'Sleep Duration',   value: fmt(metrics.avgSleepDuration),    accent: '#7EB8F7', emoji: '\u23F1\uFE0F' },
    { label: 'Sleep Efficiency', value: eff,                               accent: effGood ? '#6BCBA0' : '#F4A460', emoji: '\uD83D\uDCCA' },
    { label: 'Onset Latency',    value: fmt(metrics.avgSleepOnsetLatency), accent: '#7EB8F7', emoji: '\u23F3' },
    { label: 'WASO',             value: fmt(metrics.avgWASO),              accent: '#7EB8F7', emoji: '\uD83C\uDF19' },
  ];
  const cellW = (cW - cellGap) / 2;

  stats.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx  = pad + col * (cellW + cellGap);
    const cy  = y   + row * (cellH + cellGap);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    roundRect(ctx, cx, cy, cellW, cellH, 16);
    ctx.fill();
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.emoji, cx + cellW / 2, cy + 34);
    ctx.fillStyle = s.accent;
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(s.value, cx + cellW / 2, cy + 62);
    ctx.fillStyle = '#94A3B8';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(s.label, cx + cellW / 2, cy + 80);
  });
  y += gridH + 20;

  // ── Logo + URL pinned to bottom ───────────────────────────────────────
  const logoH = 48;  const logoW = logoH * (160 / 60);
  const urlY  = H - 28;
  const logoY = urlY - logoH - 28;
  // Expo hashes asset filenames at build time, so we can't hardcode the path.
  // Instead, find any <img> in the DOM whose src contains 'logo' to get the
  // real hashed URL that Expo has already resolved.
  const logoSrc = Array.from(document.querySelectorAll('img'))
    .map(i => i.src)
    .find(s => s.includes('logo')) || '/assets/images/logo.png';
  await new Promise((resolve) => {
    const logoImg = document.createElement('img');
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      // Use the image's natural aspect ratio — don't assume 160/60
      const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
      const drawH = logoH;
      const drawW = drawH * aspect;
      ctx.drawImage(logoImg, (W - drawW) / 2, logoY, drawW, drawH);
      resolve();
    };
    logoImg.onerror = resolve;
    logoImg.src = logoSrc;
  });
  ctx.fillStyle = '#1E3A5F';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('sleepdiaries.circadia-lab.uk', W / 2, urlY);

  // ── 4. Share or download ──────────────────────────────────────────────────
  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const file = new File([blob], 'sleep-report.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'My Sleep Report' });
  } else if (navigator.share) {
    await navigator.share({ title: 'My Sleep Report', text: `${userName} \u00B7 ${dateRange} \u2014 sleepdiaries.circadia-lab.uk` });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sleep-report.png'; a.click();
    URL.revokeObjectURL(url);
  }
}

// Canvas helper: rounded rectangle
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Share card ──────────────────────────────────────────────────────────────
// Rendered off-screen, captured as a PNG, then shared via native share sheet.
const ShareCard = React.forwardRef(({ metrics, userName, dateRange, width, height }, ref) => {
  const pad2 = (n) => String(Math.round(n)).padStart(2, '0');
  const fmt = (mins) => {
    if (mins === null || isNaN(mins)) return '—';
    const h = Math.floor(Math.abs(mins) / 60);
    const m = Math.round(Math.abs(mins) % 60);
    return h > 0 ? `${h}h ${pad2(m)}m` : `${m}m`;
  };
  const eff = metrics.avgSleepEfficiency !== null ? `${Math.round(metrics.avgSleepEfficiency)}%` : '—';
  const effGood = metrics.avgSleepEfficiency !== null && metrics.avgSleepEfficiency >= 85;

  const stats = [
    { emoji: '⏱️', label: 'Sleep Duration',  value: fmt(metrics.avgSleepDuration),    accent: '#7EB8F7' },
    { emoji: '📊', label: 'Sleep Efficiency', value: eff,                               accent: effGood ? '#6BCBA0' : '#F4A460' },
    { emoji: '⏳', label: 'Onset Latency',   value: fmt(metrics.avgSleepOnsetLatency), accent: '#7EB8F7' },
    { emoji: '🌙', label: 'WASO',             value: fmt(metrics.avgWASO),              accent: '#7EB8F7' },
  ];

  return (
    <ViewShot ref={ref} options={{ format: 'png', quality: 1 }}
      style={[shareStyles.card, { width, height }]}>
      {/* Home screen background — fills the full card */}
      <ScreenBackground variant="home" />

      {/* Frosted overlay so text reads clearly over the gradient */}
      <View style={shareStyles.overlay} />

      {/* Content centred vertically */}
      <View style={shareStyles.content}>
        {/* Header */}
        <View style={shareStyles.header}>
          <View style={shareStyles.logoRow}>
            <Text style={{ fontSize: 16, lineHeight: 20 }}>🌙</Text>
            <Text style={[shareStyles.logoText, { fontFamily: FONTS.body }]}>SLEEP DIARIES</Text>
          </View>
          <Text style={[shareStyles.title, { fontFamily: FONTS.heading }]}>My Sleep Report</Text>
          <Text style={[shareStyles.subtitle, { fontFamily: FONTS.bodyMedium }]}>{userName}  ·  {dateRange}</Text>
        </View>

        {/* Divider */}
        <View style={shareStyles.divider} />

        {/* Stats grid */}
        <View style={shareStyles.grid}>
          {stats.map((s) => (
            <View key={s.label} style={shareStyles.statCell}>
              <Text style={shareStyles.statEmoji}>{s.emoji}</Text>
              <Text style={[shareStyles.statValue, { fontFamily: FONTS.heading, color: s.accent }]}>{s.value}</Text>
              <Text style={[shareStyles.statLabel, { fontFamily: FONTS.bodyMedium }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Logo + URL pinned to bottom */}
      <View style={shareStyles.bottomBrand}>
        <Image source={IMAGES.logo} style={shareStyles.logo} resizeMode="contain" />
        <Text style={[shareStyles.footer, { fontFamily: FONTS.bodyMedium }]}>sleepdiaries.circadia-lab.uk</Text>
      </View>
    </ViewShot>
  );
});

export default function FinalReportScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const rawInsets = useSafeAreaInsets();
  const insets = Platform.OS === 'web' ? { ...rawInsets, top: 44 } : rawInsets;
  const { entries: allEntries, userName, refresh } = useEntries();
  const [loading,  setLoading]  = useState(true);
  const [qResults, setQResults] = useState([]);
  const [researchCode, setResearchCode] = useState('');
  const shareCardRef = useRef(null);

  const morning = useMemo(
    () => allEntries.filter((e) => e.type === 'morning'),
    [allEntries],
  );
  const metrics = useMemo(
    () => (morning.length > 0 ? computeMetrics(morning) : null),
    [morning],
  );
  const dateRange = useMemo(() => {
    if (morning.length === 0) return '';
    const dates = morning.map((e) => e.date).sort();
    return `${dates[0]} → ${dates[dates.length - 1]}`;
  }, [morning]);

  useFocusEffect(useCallback(() => {
    const load = async () => {
      setLoading(true);
      const [, allQResults, code] = await Promise.all([refresh(), loadAllQuestionnaires(), loadResearchCode()]);
      setQResults(allQResults.filter((r) => QUESTIONNAIRES.find((q) => q.id === r.id)));
      setResearchCode(code ?? '');
      setLoading(false);
    };
    load();
  }, [refresh]));

  const handleShare = async () => {
    if (!metrics) return;
    try {
      if (Platform.OS === 'web') {
        await handleShareWeb({ metrics, userName, dateRange });
        return;
      }
      // Native: capture share card as PNG, then share
      const uri = await shareCardRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Sleep Report' });
      } else {
        await Share.share({ message: `My Sleep Report — ${userName} · ${dateRange}` });
      }
    } catch (e) {
      if (e?.message !== 'User did not share') {
        console.warn('[handleShare]', e);
        if (Platform.OS === 'web') alert('Share failed: ' + e.message);
      }
    }
  };

  const entriesLabel = metrics ? (metrics.n === 1 ? t('report.morningEntries_one', { count: metrics.n }) : t('report.morningEntries_other', { count: metrics.n })) : '';

  return (
    <View style={[styles.root, { minHeight: height }]}>
      <ScreenBackground variant="home" />
      <BlurView intensity={30} tint="light" style={styles.blur} />
      <View style={styles.bgOverlay} />
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#1E3A5F" /></TouchableOpacity>
        <Text style={[styles.title, { fontFamily: FONTS.heading }]}>{t('report.title')}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn} disabled={!metrics}><Ionicons name="share-outline" size={24} color={metrics ? '#4A7BB5' : '#ccc'} /></TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centred}><ActivityIndicator size="large" color="#4A7BB5" /></View>
      ) : !metrics ? (
        <View style={styles.centred}>
          <Ionicons name="moon-outline" size={52} color="#B0CCEE" />
          <Text style={[styles.emptyTitle, { fontFamily: FONTS.heading }]}>{t('report.notEnoughTitle')}</Text>
          <Text style={[styles.emptySubtitle, { fontFamily: FONTS.body }]}>{t('report.notEnoughSubtitle', { count: MIN_ENTRIES_FOR_REPORT })}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Off-screen share card — captured as PNG when user taps share */}
          <View style={shareStyles.offscreen} aria-hidden>
            <ShareCard ref={shareCardRef} metrics={metrics} userName={userName} dateRange={dateRange} width={width} height={height} />
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryLeft}>
              <View style={styles.summaryAvatar}>
                <Ionicons name="person" size={36} color="#4A7BB5" />
              </View>
              <Text style={[styles.summaryName, { fontFamily: FONTS.heading }]}>{userName}</Text>
              {researchCode ? <Text style={[styles.summaryCode, { fontFamily: FONTS.bodyMedium }]}>{researchCode}</Text> : null}
            </View>
            <View style={styles.summaryInfo}>
              <View style={styles.summaryStat}>
                <Ionicons name="calendar-outline" size={15} color="#94A3B8" />
                <View>
                  <Text style={[styles.summaryStatText, { fontFamily: FONTS.bodyMedium }]}>{morning.map(e => e.date).sort()[0]}</Text>
                  <Text style={[styles.summaryStatText, { fontFamily: FONTS.bodyMedium }]}>{morning.map(e => e.date).sort().slice(-1)[0]}</Text>
                </View>
              </View>
              <View style={styles.summaryStat}>
                <Ionicons name="sunny-outline" size={15} color="#94A3B8" />
                <Text style={[styles.summaryStatText, { fontFamily: FONTS.bodyMedium }]}>{entriesLabel}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Ionicons name="moon-outline" size={15} color="#94A3B8" />
                <Text style={[styles.summaryStatText, { fontFamily: FONTS.bodyMedium }]}>{allEntries.filter(e => e.type === 'evening').length} {t('report.eveningEntries')}</Text>
              </View>
              <View style={styles.summaryStat}>
                <Ionicons name="clipboard-outline" size={15} color="#94A3B8" />
                <Text style={[styles.summaryStatText, { fontFamily: FONTS.bodyMedium }]}>{qResults.length}</Text>
                <Text style={[styles.summaryStatText, { fontFamily: FONTS.bodyMedium }]}>{qResults.length === 1 ? t('report.questionnaireOne') : t('report.questionnaireOther')}</Text>
              </View>
            </View>
          </View>

          <Section title={t('report.sleepTiming')}>
            <MetricCard icon="time-outline"        label={t('report.avgSleepDuration')}   value={formatMinutes(metrics.avgSleepDuration)}    subtext={t('report.avgSleepDurationSub')}  color={durationColor(metrics.avgSleepDuration)}  bar={<DurationBar value={metrics.avgSleepDuration} />} />
            <MetricCard icon="speedometer-outline" label={t('report.sleepEfficiency')} value={metrics.avgSleepEfficiency !== null ? `${Math.round(metrics.avgSleepEfficiency)}%` : '—'} subtext={t('report.sleepEfficiencySub')} color={metrics.avgSleepEfficiency >= 85 ? '#2E7D32' : '#C25E00'} bar={<EfficiencyBar value={metrics.avgSleepEfficiency} />} />
            <MetricCard icon="hourglass-outline"   label={t('report.sleepOnsetLatency')}  value={formatMinutes(metrics.avgSleepOnsetLatency)} subtext={t('report.sleepOnsetLatencySub')} color={latencyColor(metrics.avgSleepOnsetLatency)}  bar={<LatencyBar value={metrics.avgSleepOnsetLatency} />} />
            <MetricCard icon="moon-outline"        label={t('report.waso')}               value={formatMinutes(metrics.avgWASO)}              subtext={t('report.wasoSub')}              color={wasoColor(metrics.avgWASO)}               bar={<WasoBar value={metrics.avgWASO} />} />
            <Text style={[styles.thresholdNote, { fontFamily: FONTS.bodyMedium }]}>{t('report.thresholdNote')}</Text>
          </Section>

          <Section title={t('report.sleepQuality')}>
            <MetricCard icon="star-outline"        label={t('report.nightQuality')}      value={metrics.avgQuality !== null ? metrics.avgQuality.toFixed(1) : '—'} color="#4A7BB5" bar={metrics.avgQuality !== null ? <StarRow value={metrics.avgQuality} color="#4A7BB5" /> : null} />
            <MetricCard icon="battery-half-outline" label={t('report.morningRestedness')} value={metrics.avgRestedness !== null ? metrics.avgRestedness.toFixed(1) : '—'} color="#E07A20" bar={metrics.avgRestedness !== null ? <StarRow value={metrics.avgRestedness} color="#E07A20" /> : null} />
          </Section>

          <Section title={t('report.nightDisruptions')}>
            <MetricCard icon="alert-circle-outline" label={t('report.avgNightWakings')} value={metrics.avgNightWakings !== null ? `${metrics.avgNightWakings.toFixed(1)} ${t('report.times')}` : '—'} subtext={t('report.avgNightWakingsSub')} color="#4A7BB5" />
            <MetricCard icon="alarm-outline"        label={t('report.earlyWaking')}     value={metrics.earlyWakingPct !== null ? `${metrics.earlyWakingPct}${t('report.ofNights')}` : '—'}          subtext={t('report.earlyWakingSub')}     color="#4A7BB5" />
          </Section>

          <Section title={t('report.lifestyle')}>
            <MetricCard icon="wine-outline" label={t('report.avgAlcohol')} value={metrics.avgAlcohol !== null ? `${metrics.avgAlcohol.toFixed(1)} ${t('report.drinksNight')}` : '—'} subtext={t('report.avgAlcoholSub')} color={alcoholColor(metrics.avgAlcohol)} bar={<AlcoholBar value={metrics.avgAlcohol} />} />
            <Text style={[styles.thresholdNote, { fontFamily: FONTS.bodyMedium }]}>{t('report.alcoholNote')}</Text>
          </Section>

          {qResults.length > 0 && (
            <Section title={t('report.sectionQuestionnaires')}>
              {qResults.map((result) => {
                const questionnaire = QUESTIONNAIRES.find((q) => q.id === result.id);
                if (!questionnaire) return null;
                return (
                  <QuestionnaireReportCard
                    key={result.id}
                    result={result}
                    questionnaire={questionnaire}
                    locale={locale}
                  />
                );
              })}
            </Section>
          )}

          <Text style={[styles.disclaimer, { fontFamily: FONTS.bodyMedium }]}>{t('report.disclaimer')}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: 'transparent' },
  blur:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  bgOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.60)' },
  header:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, backgroundColor: 'transparent' },
  backBtn:  { padding: 4 }, shareBtn: { padding: 4 },
  title:    { fontSize: SIZES.cardTitle, color: '#1E3A5F' },
  centred:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12, paddingTop: 80 },
  emptyTitle:    { fontSize: SIZES.cardTitle, color: '#4A7BB5', textAlign: 'center' },
  emptySubtitle: { fontSize: SIZES.body, color: '#94A3B8', textAlign: 'center', lineHeight: 26 },
  scrollContent: { padding: 16, gap: 20, paddingBottom: 40 },
  summaryCard:    { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  summaryLeft:    { alignItems: 'center', gap: 6 },
  summaryAvatar:   { width: 72, height: 72, borderRadius: 36, backgroundColor: '#D6E8F7', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#A8C8E8', flexShrink: 0 },
  summaryInfo:     { flex: 1, gap: 4, justifyContent: 'center', paddingRight: 8 },
  summaryName:     { fontSize: SIZES.body, color: '#1A3A5C' },
  summaryCode:     { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center' },
  summaryDivider:  { height: 1, backgroundColor: 'rgba(74,123,181,0.15)', width: '100%' },
  summaryStats:    { gap: 8, width: '100%' },
  summaryStat:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  summaryStatText: { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  section:        { gap: 10 },
  sectionTitle:   { fontSize: SIZES.label, color: '#E07A20', textTransform: 'uppercase', letterSpacing: 0.8 },
  metricCard:        { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  metricIcon:        { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  metricText:        { flex: 1, gap: 3 },
  metricLabel:       { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  metricValueRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  metricValue:       { fontSize: SIZES.sectionTitle, color: '#1E3A5F' },
  metricStatusLabel: { fontSize: SIZES.caption, fontWeight: '600' },
  metricSubtext:     { fontSize: SIZES.caption, color: '#94A3B8' },
  qualityCard:  { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 14, padding: 16, gap: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  qualityLabel: { fontSize: SIZES.bodySmall, color: '#94A3B8' },
  starRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starLabel:    { fontSize: SIZES.body, marginLeft: 6 },
  disclaimer:   { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 8, marginTop: 8 },
  thresholdNote: { fontSize: SIZES.caption, color: '#94A3B8', lineHeight: 22, marginTop: 4, paddingHorizontal: 2, textAlign: 'center' },

  // Questionnaire report cards
  qReportCard:       { backgroundColor: 'rgba(255,255,255,0.72)', borderRadius: 14, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.10, shadowRadius: 8, elevation: 3 },
  qReportHeader:     { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  qReportTitle:      { fontSize: SIZES.body, color: '#1E3A5F', flex: 1 },
  qReportBetaChip:   { backgroundColor: '#F0E8FA', borderWidth: 1.5, borderColor: '#C4A8E0', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  qReportBetaText:   { fontSize: 11, color: '#6B3FA0', letterSpacing: 0.5 },
  qReportScoreRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  qReportScoreBadge: { borderWidth: 2, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center', justifyContent: 'center', minWidth: 64 },
  qReportScoreValue: { fontSize: SIZES.sectionTitle },
  qReportInterpText: { flex: 1, gap: 4 },
  qReportInterpLabel:{ fontSize: SIZES.body },
  qReportInterpDesc: { fontSize: SIZES.bodySmall, color: '#64748B', lineHeight: 22 },
  qReportDate:       { fontSize: SIZES.caption, color: '#94A3B8' },

  // Scale bar
  scaleBarContainer:  { gap: 4 },
  scaleBarTrack:      { height: 16, borderRadius: 8, flexDirection: 'row', overflow: 'hidden', backgroundColor: '#F1F5F9', position: 'relative' },
  scaleBarSegment:    { height: '100%' },
  scaleBarMarker:     { position: 'absolute', top: 0, bottom: 0, width: 3, borderRadius: 2, backgroundColor: '#1E3A5F' },
  scaleBarEndLabels:  { flexDirection: 'row', justifyContent: 'space-between' },
  scaleBarEndText:    { fontSize: 12, color: '#94A3B8' },
  scaleBarTickRow:    { flexDirection: 'row', justifyContent: 'space-between', position: 'relative', height: 16 },
  scaleBarTickLabel:  { position: 'absolute', fontSize: 12, color: '#94A3B8', transform: [{ translateX: -10 }] },
});

// ─── Share card styles ────────────────────────────────────────────────────────
const shareStyles = StyleSheet.create({
  offscreen: { position: 'absolute', top: -2000, left: 0, opacity: 0, pointerEvents: 'none' },
  card:      { borderRadius: 0, overflow: 'hidden' },
  overlay:   { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(238,245,255,0.45)' },
  content:   { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, padding: 28, justifyContent: 'center', alignItems: 'center' },
  bottomBrand: { position: 'absolute', bottom: 28, left: 0, right: 0, alignItems: 'center' },
  logo:      { width: 140, height: 52, marginBottom: 50 },
  footer:    { fontSize: 13, color: '#1E3A5F', textAlign: 'center', letterSpacing: 0.4 },
  header:    { alignItems: 'center', gap: 6, paddingBottom: 16, width: '100%' },
  logoText:  { fontSize: 14, color: '#4A7BB5', letterSpacing: 1.2, textTransform: 'uppercase' },
  logoRow:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title:     { fontSize: 26, color: '#1E3A5F', textAlign: 'center' },
  subtitle:  { fontSize: 13, color: '#64748B', textAlign: 'center' },
  divider:   { height: 1, backgroundColor: 'rgba(74,123,181,0.2)', marginVertical: 16, width: '100%' },
  grid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  statCell:  { width: '47%', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 12 },
  statEmoji: { fontSize: 26, lineHeight: 32 },
  statValue: { fontSize: 20, lineHeight: 26 },
  statLabel: { fontSize: 11, color: '#94A3B8', textAlign: 'center', lineHeight: 15 },
  footer:    { position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center', fontSize: 14, color: '#1E3A5F', fontFamily: undefined, letterSpacing: 0.4 },
});
