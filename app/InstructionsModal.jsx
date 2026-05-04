/**
 * app/InstructionsModal.jsx — Instructions slideshow modal
 *
 * A full-screen modal stepping through 7 informational slides.
 * Replaces the PNG image assets with a fully coded React Native layout,
 * matching the Figma design spec exactly.
 *
 * Background: SVG with gradient blobs (rendered via react-native-svg).
 * Typography: Livvic Bold for titles (#4988BC), Afacad Bold for body (#A5A5A5).
 * Navigation: Close (top-left), Get Started (slide 1), Back + Next (slides 2–7).
 * Pagination: 7 dots, active = #61A1D7, inactive = #DEDEDE.
 * All strings are translated via i18n.
 */
import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  ScrollView, useWindowDimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { markInstructionsSeen } from '../storage/storage';
import { FONTS } from '../theme/typography';
import { strings } from '../i18n';

const TITLE_COLOR  = '#4988BC';
const BODY_COLOR   = '#A5A5A5';
const DOT_ACTIVE   = '#61A1D7';
const DOT_INACTIVE = '#DEDEDE';
const CREAM        = '#FEFDF8';
const AMBER        = '#FFB060';
const AMBER_BORDER = '#F0A963';
const AMBER_TEXT   = '#DD7F5A';
const CLOSE_COLOR  = '#BDBDBD';
const DOT_SIZE     = 10;
const NUM_SLIDES   = 7;

function Background({ width, height }) {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 393 852"
      style={StyleSheet.absoluteFill}
    >
      <Defs>
        <LinearGradient id="g0" x1="177.754" y1="151.379" x2="175.651" y2="248.09" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#F0A963" />
          <Stop offset="1" stopColor="#FCEE21" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="g1" x1="158.642" y1="215.707" x2="151.433" y2="547.378" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#A1C5E7" />
          <Stop offset="1" stopColor="#F2F2F2" stopOpacity="0" />
        </LinearGradient>
        <LinearGradient id="g2" x1="313.55" y1="108.466" x2="313.439" y2="388.017" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#A1C5E7" />
          <Stop offset="1" stopColor="#F2F2F2" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width="393" height="852" fill="#EFF5F6" />
      <Path d="M177 235C204.062 235 226 213.062 226 186C226 158.938 204.062 137 177 137C149.938 137 128 158.938 128 186C128 213.062 149.938 235 177 235Z" fill="url(#g0)" />
      <Path d="M443.94 358.555C441.894 302.265 388.001 258.532 323.561 260.875C316.944 261.117 310.478 261.838 304.194 262.992C278.896 228.551 235.631 209.358 190.779 217.052C190.391 217.117 190.003 217.198 189.615 217.269C165.627 185.151 131.101 165 92.7254 165C50.5143 165 12.9699 189.378 -11.0233 227.241C-79.2635 232.471 -133 289.486 -133 359.054C-133 432.072 -73.8007 491.265 -0.772908 491.265C19.1685 491.265 38.0717 486.84 55.0298 478.939C66.9684 483.313 79.6227 485.671 92.7254 485.671C111.029 485.671 128.456 481.081 144.28 472.802C171.312 496.777 207.929 508.714 245.494 502.269C272.969 497.553 296.685 483.731 314.288 464.276C319.751 464.755 325.315 464.916 330.969 464.709C395.404 462.371 445.986 414.839 443.94 358.555Z" fill="url(#g1)" />
      <Path d="M401.274 188.394C402.941 184.975 404.324 181.345 405.378 177.529C413.959 146.463 397.605 114.815 368.848 106.838C349.908 101.585 330.313 107.913 316.688 121.722C308.748 118.606 299.921 116.868 290.62 116.868C258.964 116.868 232.793 136.973 228.54 163.092C228.337 163.092 228.134 163.085 227.931 163.085C198.148 163.085 174 187.277 174 217.122C174 246.967 196.025 268.971 223.952 271.013C234.193 281.67 248.573 288.302 264.503 288.302C274.003 288.302 282.951 285.939 290.802 281.774C299.351 287.595 309.674 291 320.788 291C334.912 291 347.75 285.507 357.303 276.538C367.352 283.066 379.98 286.956 393.701 286.956C426.451 286.956 453 264.802 453 237.473C453 212.286 430.448 191.495 401.274 188.39V188.394Z" fill="url(#g2)" />
    </Svg>
  );
}

function Dots({ total, current }) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, { backgroundColor: i === current ? DOT_ACTIVE : DOT_INACTIVE }]} />
      ))}
    </View>
  );
}

export default function InstructionsModal({ visible, onClose }) {
  const [index, setIndex] = useState(0);
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isFirst = index === 0;
  const isLast  = index === NUM_SLIDES - 1;

  const slides = strings.instructions.slides;
  const slide  = slides[index];

  const handleClose = async () => {
    await markInstructionsSeen();
    setIndex(0);
    onClose();
  };

  const handleNext = () => { if (isLast) handleClose(); else setIndex(index + 1); };
  const handleBack = () => { if (index > 0) setIndex(index - 1); };

  const safeTop    = Math.max(insets.top, 60);
  const safeBottom = Math.max(insets.bottom, 16);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={Platform.OS === 'web'}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {Platform.OS === 'web' ? (
        <View style={styles.webOuter}>
          <View style={[styles.root, { width: '100%', maxWidth: 480, height: '90%', borderRadius: 20, overflow: 'hidden' }]}>
            <Background width={480} height={height * 0.9} />
            <View style={[styles.overlay, { paddingTop: safeTop, paddingBottom: safeBottom }]}>
              <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={CLOSE_COLOR} />
                <Text style={styles.closeText}>{strings.instructions.close}</Text>
              </TouchableOpacity>
              <View style={{ height: height * 0.9 * 0.22 }} />
              <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.body}>{slide.body}</Text>
              </ScrollView>
              <Dots total={NUM_SLIDES} current={index} />
              <View style={styles.navRow}>
                {isFirst ? (
                  <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={handleNext} activeOpacity={0.8}>
                    <Text style={styles.nextText}>{strings.instructions.getStarted}</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity style={[styles.navBtn, styles.backBtn]} onPress={handleBack} activeOpacity={0.8}>
                      <Text style={styles.backText}>{strings.instructions.back}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={handleNext} activeOpacity={0.8}>
                      <Text style={styles.nextText}>{isLast ? strings.instructions.close : strings.instructions.next}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.root, { width, height }]}>
          <Background width={width} height={height} />

        <View style={[styles.overlay, { paddingTop: safeTop, paddingBottom: safeBottom }]}>

          {/* Close button */}
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={CLOSE_COLOR} />
            <Text style={styles.closeText}>{strings.instructions.close}</Text>
          </TouchableOpacity>

          {/* Spacer pushes content below blob area */}
          <View style={{ height: height * 0.22 }} />

          {/* Scrollable slide content */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>
          </ScrollView>

          {/* Dots */}
          <Dots total={NUM_SLIDES} current={index} />

          {/* Nav buttons */}
          <View style={styles.navRow}>
            {isFirst ? (
              <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={handleNext} activeOpacity={0.8}>
                <Text style={styles.nextText}>{strings.instructions.getStarted}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={[styles.navBtn, styles.backBtn]} onPress={handleBack} activeOpacity={0.8}>
                  <Text style={styles.backText}>{strings.instructions.back}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={handleNext} activeOpacity={0.8}>
                  <Text style={styles.nextText}>
                    {isLast ? strings.instructions.close : strings.instructions.next}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

        </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#EFF5F6',
  },
  webOuter: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
    flexDirection: 'column',
    paddingHorizontal: 28,
  },
  closeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  closeText: {
    fontFamily: FONTS.body,
    fontSize: 18,
    color: CLOSE_COLOR,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  title: {
    fontFamily: FONTS.heading,
    fontSize: 38,
    lineHeight: 46,
    textAlign: 'center',
    color: TITLE_COLOR,
  },
  body: {
    fontFamily: FONTS.body,
    fontSize: 22,
    lineHeight: 28,
    textAlign: 'center',
    letterSpacing: 0.44,
    color: BODY_COLOR,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 8,
  },
  navBtn: {
    flex: 1,
    height: 51,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  backText: {
    fontFamily: FONTS.body,
    fontSize: 25,
    color: AMBER_TEXT,
  },
  nextBtn: {
    backgroundColor: 'rgba(255,176,96,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,140,0.9)',
    shadowColor: '#E07A20',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  nextText: {
    fontFamily: FONTS.body,
    fontSize: 25,
    color: CREAM,
  },
});
