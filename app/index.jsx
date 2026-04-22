/**
 * app/index.jsx — Login / onboarding screen
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ActivityIndicator, Image } from 'react-native';
import ScreenBackground from '../components/ScreenBackground';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveName, saveResearchCode } from '../storage/storage';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';
import IMAGES from '../assets/images';

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [name, setName]                 = useState('');
  const [researchCode, setResearchCode] = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  const handleStart = async () => {
    if (!name.trim()) { setError(t('login.errorName')); return; }
    setError(''); setLoading(true);
    await saveName(name.trim());
    if (researchCode.trim()) await saveResearchCode(researchCode.trim());
    setLoading(false);
    router.replace({ pathname: '/(tabs)/home', params: { showInstructions: '1' } });
  };

  return (
    <View style={styles.root}>
      <ScreenBackground variant="login" />
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <View style={[styles.inner, { paddingBottom: insets.bottom }]}>

          {error ? <Text style={[styles.errorText, { fontFamily: FONTS.body }]}>{error}</Text> : null}

          <Text style={[styles.subtitle, { fontFamily: FONTS.bodyMedium }]}>{t('login.subtitle')}</Text>

          <View style={styles.inputWrapper}>
            <TextInput style={[styles.input, { fontFamily: FONTS.bodyMedium }]} placeholder={t('login.namePlaceholder')} placeholderTextColor="#A0B8D0" value={name} onChangeText={setName} autoCapitalize="words" autoCorrect={false} returnKeyType="next" />
          </View>

          <View style={styles.inputWrapper}>
            <TextInput style={[styles.input, styles.inputOptional, { fontFamily: FONTS.bodyMedium }]} placeholder={t('login.codePlaceholder')} placeholderTextColor="#A0B8D0" value={researchCode} onChangeText={setResearchCode} autoCapitalize="none" autoCorrect={false} returnKeyType="go" onSubmitEditing={handleStart} />
            <Text style={[styles.optionalLabel, { fontFamily: FONTS.bodyMedium }]}>{t('login.codeHint')}</Text>
          </View>

          <TouchableOpacity style={[styles.loginBtn, (!name.trim() || loading) && styles.loginBtnDisabled]} onPress={handleStart} activeOpacity={0.85} disabled={!name.trim() || loading}>
            {loading ? <ActivityIndicator color="#2C5282" /> : <Text style={[styles.loginBtnText, { color: name.trim() ? '#2C5282' : '#94A3B8' }, { fontFamily: FONTS.heading }]}>{t('login.cta')}</Text>}
          </TouchableOpacity>

          <Image source={IMAGES.logo} style={styles.logo} resizeMode="contain" />

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1 },
  inner:     { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 36, paddingTop: 24, gap: 14 },
  logo:         { width: 160, height: 56, alignSelf: 'center', opacity: 0.75, marginTop: 8 },
  subtitle:     { fontSize: SIZES.body, color: '#4A6A8A', textAlign: 'center' },
  errorText:    { fontSize: SIZES.body, color: '#C0392B', textAlign: 'center' },
  inputWrapper: { justifyContent: 'center', gap: 6 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 18, fontSize: SIZES.body, color: '#1E3A5F',
    shadowColor: '#4A7BB5', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  loginBtn:         { backgroundColor: 'rgba(255,255,255,0.80)', borderRadius: 30, paddingVertical: 19, alignItems: 'center', shadowColor: '#3A7AAA', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  loginBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.45)', shadowOpacity: 0 },
  loginBtnText:     { color: '#2C5282', fontSize: SIZES.cardTitle, letterSpacing: 0.3, fontFamily: undefined, fontWeight: '700' },
  inputOptional:    { borderStyle: 'dashed', borderColor: 'rgba(160,200,232,0.6)' },
  optionalLabel:    { fontSize: SIZES.caption, color: '#94A3B8', textAlign: 'center' },
});
