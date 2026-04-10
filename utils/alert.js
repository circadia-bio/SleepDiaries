/**
 * utils/alert.js — Cross-platform alert helper
 *
 * React Native's Alert.alert is a no-op on web. This module provides a
 * drop-in replacement that uses the native Alert on iOS/Android and
 * falls back to window.confirm / window.alert on web.
 *
 * API mirrors Alert.alert:
 *   showAlert(title, message, buttons)
 *
 * buttons: array of { text, onPress, style }
 *   style: 'cancel' | 'destructive' | 'default'
 *
 * Web behaviour:
 *   - 1 button  → window.alert(message), then calls onPress
 *   - 2 buttons → window.confirm(message); calls the non-cancel button's
 *                 onPress if confirmed, cancel's onPress if dismissed
 *   - 3 buttons → two sequential confirms to replicate 3-option dialogs
 *                 (merge/replace pattern). Falls back gracefully.
 */
import { Alert, Platform } from 'react-native';

const showAlert = (title, message, buttons = [{ text: 'OK' }]) => {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  // Web fallback
  const nonCancel = buttons.filter((b) => b.style !== 'cancel');
  const cancel    = buttons.find((b) => b.style === 'cancel');

  if (buttons.length <= 1) {
    // Simple info alert
    window.alert(message ? `${title}\n\n${message}` : title);
    buttons[0]?.onPress?.();
    return;
  }

  if (nonCancel.length === 1) {
    // Standard confirm: Cancel vs one action
    const confirmed = window.confirm(message ? `${title}\n\n${message}` : title);
    if (confirmed) nonCancel[0]?.onPress?.();
    else cancel?.onPress?.();
    return;
  }

  // 3-button case (e.g. Cancel / Merge / Replace):
  // Ask first confirm with both action labels listed, then a second
  // confirm to disambiguate which action was intended.
  const actionLabels = nonCancel.map((b) => b.text).join(' / ');
  const first = window.confirm(
    `${title}\n\n${message ?? ''}\n\nPress OK to continue, Cancel to go back.\nActions available: ${actionLabels}`
  );
  if (!first) { cancel?.onPress?.(); return; }

  // Second confirm: OK = first action, Cancel = second action
  const second = window.confirm(
    `Choose action:\nOK → ${nonCancel[0].text}\nCancel → ${nonCancel[1].text}`
  );
  if (second) nonCancel[0]?.onPress?.();
  else nonCancel[1]?.onPress?.();
};

export default showAlert;
