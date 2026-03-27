/**
 * app/InstructionsModal.jsx — Instructions slideshow modal
 *
 * A full-screen modal that steps through 6 instructional images.
 * Shown automatically on first login and accessible any time via
 * the Instructions button on the home screen.
 *
 * Navigation is handled by invisible TouchableOpacity zones overlaid
 * on top of the image, positioned to match the button artwork:
 *   - Close (top-left)    — dismisses and marks instructions as seen
 *   - Get Started (slide 1 only) — advances to slide 2
 *   - Back / Next (slides 2–6)  — navigate between slides
 *
 * Once closed (by any route), markInstructionsSeen() is called so the
 * modal will not auto-show again on subsequent app opens.
 */
import React, { useState } from 'react';
import {
  Modal, View, Image, TouchableOpacity,
  StyleSheet, Platform,
} from 'react-native';
import { markInstructionsSeen } from '../storage/storage';

const SLIDES = [
  require('../assets/images/instructions-1.png'),
  require('../assets/images/instructions-2.png'),
  require('../assets/images/instructions-3.png'),
  require('../assets/images/instructions-4.png'),
  require('../assets/images/instructions-5.png'),
  require('../assets/images/instructions-6.png'),
];

export default function InstructionsModal({ visible, onClose }) {
  const [index, setIndex] = useState(0);
  const isFirst = index === 0;
  const isLast  = index === SLIDES.length - 1;

  const handleClose = async () => {
    await markInstructionsSeen();
    setIndex(0);
    onClose();
  };

  const handleNext = () => { if (isLast) handleClose(); else setIndex(index + 1); };
  const handleBack = () => { if (index > 0) setIndex(index - 1); };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <Image
          source={SLIDES[index]}
          style={styles.image}
          resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'}
        />

        {/* Close button — top-left */}
        <TouchableOpacity style={styles.closeZone} onPress={handleClose} />

        {/* First slide: full-width Get Started button */}
        {isFirst && (
          <TouchableOpacity style={styles.getStartedZone} onPress={handleNext} />
        )}

        {/* Other slides: Back (left) and Next (right) buttons */}
        {!isFirst && (
          <>
            <TouchableOpacity style={styles.backZone} onPress={handleBack} />
            <TouchableOpacity style={styles.nextZone} onPress={handleNext} />
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#EEF5FC' },
  image:          { width: '100%', height: '100%', position: 'absolute' },

  // Close: top-left corner, ~12% tall, ~45% wide
  closeZone:      { position: 'absolute', top: '5%', left: 0, width: '45%', height: '8%' },

  // Get Started: centered button ~73-86% down
  getStartedZone: { position: 'absolute', bottom: '14%', left: '10%', right: '10%', height: '13%' },

  // Back: left half of button row
  backZone:       { position: 'absolute', bottom: '14%', left: '5%', width: '40%', height: '13%' },

  // Next: right half of button row
  nextZone:       { position: 'absolute', bottom: '14%', right: '5%', width: '40%', height: '13%' },
});
