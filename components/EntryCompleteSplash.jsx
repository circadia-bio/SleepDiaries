/**
 * components/EntryCompleteSplash.jsx
 *
 * "Entry complete" screen shown after saving a morning or evening entry.
 * Replaces the splash-end-*.png artwork: everything is drawn with
 * react-native-svg and the text comes from i18n, so it is translated in every
 * language. Purely presentational: the parent handles tap-to-continue and the
 * auto-redirect.
 *
 * Props:
 *   type  'morning' | 'evening'
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Polyline, Defs, LinearGradient, Stop } from 'react-native-svg';
import t from '../i18n';
import { FONTS } from '../theme/typography';

const PALETTE = {
  morning: { title: '#C4623F', badge: '#F0A862', check: '#5FA3DB', button: '#B9D3EC' },
  evening: { title: '#3F82C0', badge: '#A2C6E8', check: '#DD7F5A', button: '#F0A862' },
};

const CREAM = '#FFFDF7';
const NAVY = '#1E3A5F';

// Points evenly spaced around a circle, used for the scalloped badge edge.
const lobes = (count, distance, radius) =>
  Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { cx: Math.cos(angle) * distance, cy: Math.sin(angle) * distance, r: radius };
  });

function Clouds() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      width="100%"
      height="100%"
      viewBox="0 0 393 852"
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <LinearGradient id="splashCloudTop" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#A8CBEA" stopOpacity="0.9" />
          <Stop offset="1" stopColor={CREAM} stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="splashCloudBottom" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CFE0F1" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#EEF4FA" stopOpacity="0.9" />
        </LinearGradient>
      </Defs>
      {/* Top clouds */}
      <Circle cx="150" cy="55" r="85" fill="url(#splashCloudTop)" />
      <Circle cx="270" cy="85" r="95" fill="url(#splashCloudTop)" />
      <Circle cx="370" cy="115" r="75" fill="url(#splashCloudTop)" />
      {/* Bottom clouds */}
      <Circle cx="30" cy="800" r="95" fill="url(#splashCloudBottom)" />
      <Circle cx="170" cy="830" r="100" fill="url(#splashCloudBottom)" />
      <Circle cx="320" cy="810" r="80" fill="url(#splashCloudBottom)" />
      <Circle cx="385" cy="850" r="70" fill="url(#splashCloudBottom)" />
    </Svg>
  );
}

function Badge({ fill, check }) {
  return (
    <Svg width={260} height={260} viewBox="-130 -130 260 260">
      {lobes(12, 84, 34).map((l, i) => (
        <Circle key={`outer${i}`} cx={l.cx} cy={l.cy} r={l.r} fill={fill} />
      ))}
      <Circle cx={0} cy={0} r={90} fill={fill} />
      {lobes(10, 52, 22).map((l, i) => (
        <Circle key={`inner${i}`} cx={l.cx} cy={l.cy} r={l.r} fill="#FFFFFF" />
      ))}
      <Circle cx={0} cy={0} r={58} fill="#FFFFFF" />
      <Polyline
        points="-34,2 -10,26 36,-22"
        fill="none"
        stroke={check}
        strokeWidth={11}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function EntryCompleteSplash({ type }) {
  const morning = type === 'morning';
  const p = morning ? PALETTE.morning : PALETTE.evening;

  return (
    <View style={styles.root}>
      <Clouds />
      <View style={styles.content}>
        <Text style={[styles.title, { color: p.title }]}>
          {t(`appText.entrySaved${morning ? 'Morning' : 'Evening'}`)}
        </Text>
        <Badge fill={p.badge} check={p.check} />
        <View style={[styles.button, { backgroundColor: p.button }]}>
          <Text style={styles.buttonText}>{t('appText.homepage')}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: CREAM },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  title: { fontFamily: FONTS.heading, fontSize: 36, textAlign: 'center', maxWidth: 340 },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 44,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: { fontFamily: FONTS.heading, fontSize: 24, color: NAVY },
});
