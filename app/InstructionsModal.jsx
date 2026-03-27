import React, { useState } from 'react';
import {
  Modal, Image, TouchableOpacity,
  StyleSheet, Dimensions, Platform,
} from 'react-native';
import { markInstructionsSeen } from '../storage/storage';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  require('../assets/images/instructions-1.png'),
  require('../assets/images/instructions-2.png'),
  require('../assets/images/instructions-3.png'),
  require('../assets/images/instructions-4.png'),
  require('../assets/images/instructions-5.png'),
  require('../assets/images/instructions-6.png'),
];

const CLOSE_ZONE       = { top: 0.05, bottom: 0.13, right: 0.45 };
const GET_STARTED_ZONE = { top: 0.73, bottom: 0.86 };
const NEXT_ZONE        = { top: 0.73, bottom: 0.86, left: 0.5 };
const BACK_ZONE        = { top: 0.73, bottom: 0.86, right: 0.5 };

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

  const handleTap = (evt) => {
    const { locationX: x, locationY: y } = evt.nativeEvent;
    const rx = x / W;
    const ry = y / H;

    if (ry >= CLOSE_ZONE.top && ry <= CLOSE_ZONE.bottom && rx <= CLOSE_ZONE.right) {
      handleClose(); return;
    }
    if (isFirst && ry >= GET_STARTED_ZONE.top && ry <= GET_STARTED_ZONE.bottom) {
      handleNext(); return;
    }
    if (!isFirst && ry >= NEXT_ZONE.top && ry <= NEXT_ZONE.bottom && rx >= NEXT_ZONE.left) {
      handleNext(); return;
    }
    if (!isFirst && ry >= BACK_ZONE.top && ry <= BACK_ZONE.bottom && rx <= BACK_ZONE.right) {
      handleBack(); return;
    }
    if (rx > 0.5) handleNext();
    else if (!isFirst) handleBack();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.container} activeOpacity={1} onPress={handleTap}>
        <Image
          source={SLIDES[index]}
          style={styles.image}
          resizeMode={Platform.OS === 'web' ? 'contain' : 'cover'}
        />
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF5FC' },
  image:     { width: '100%', height: '100%' },
});
