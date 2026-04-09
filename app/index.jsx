/**
 * app/index.jsx — Login / onboarding screen
 */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveName, saveResearchCode } from '../storage/storage';
import { FONTS, SIZES } from '../theme/typography';
import t from '../i18n';

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
    <ImageBackground source={require('../assets/images/login-bg.png')} style={styles.root} imageStyle={Platform.OS === 'web' ? { width: '100%', height: '100%' } : undefined} resizeMode="cover">
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.inner, { paddingBottom: insets.bottom + 40 }]}>

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
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.loginBtnText, { fontFamily: FONTS.body }]}>{t('login.cta')}</Text>}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1 },
  inner:     { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 36, paddingTop: 24, gap: 16 },
  subtitle:     { fontSize: SIZES.body, color: '#4A6A8A', textAlign: 'center' },
  errorText:    { fontSize: SIZES.body, color: '#C0392B', textAlign: 'center' },
  inputWrapper: { justifyContent: 'center', gap: 6 },
  input: {
    backgroundColor: 'rgba(240, 247, 255, 0.92)',
    borderWidth: 1.5, borderColor: '#7EB0DC', borderRadius: 14,
    paddingHorizontal: 20, paddingVertical: 18, fontSize: SIZES.body, color: '#1E3A5F',
  },
  loginBtn:         { backgroundColor: '#5B9BC5', borderRadius: 30, paddingVertical: 19, alignItems: 'center', shadowColor: '#3A7AAA', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4 },
  loginBtnDisabled: { backgroundColor: '#A0BDD4', shadowOpacity: 0 },
  loginBtnText:     { color: '#fff', fontSize: SIZES.body, letterSpacing: 0.3 },
  inputOptional:    { borderStyle: 'dashed', borderColor: '#A0C8E8' },
  optionalLabel:    { fontSize: SIZES.bodySmall, color: '#94A3B8', paddingHorizontal: 4 },
});
