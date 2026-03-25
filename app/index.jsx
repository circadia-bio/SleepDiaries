import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { saveName } from '../storage/storage';

export default function LoginScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = async () => {
    if (!name.trim()) {
      setError('Please enter your name to continue.');
      return;
    }
    setError('');
    setLoading(true);
    await saveName(name.trim());
    setLoading(false);
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.cloudTopLeft} />
        <View style={styles.cloudTopRight} />
        <View style={styles.cloudBottomLeft} />
        <View style={styles.cloudBottomRight} />

        <View style={styles.inner}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="moon" size={36} color="#fff" />
            </View>
            <Text style={styles.appName}>Sleep Diaries</Text>
            <Text style={styles.subtitle}>Let's get started — what's your name?</Text>
          </View>

          <View style={styles.form}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#A0B4CC"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={handleStart}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, (!name.trim() || loading) && styles.loginBtnDisabled]}
              onPress={handleStart}
              activeOpacity={0.85}
              disabled={!name.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.loginBtnText}>Let's go →</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea:    { flex: 1, backgroundColor: '#C8DFF5' },
  container:   { flex: 1 },
  cloudTopLeft:    { position: 'absolute', width: 160, height: 70, borderRadius: 35, backgroundColor: '#DEEEFA', top: 20,   left: -30,  opacity: 0.8 },
  cloudTopRight:   { position: 'absolute', width: 120, height: 55, borderRadius: 28, backgroundColor: '#DEEEFA', top: 50,   right: -20, opacity: 0.7 },
  cloudBottomLeft: { position: 'absolute', width: 140, height: 60, borderRadius: 30, backgroundColor: '#DEEEFA', bottom: 30, left: -20,  opacity: 0.7 },
  cloudBottomRight:{ position: 'absolute', width: 180, height: 70, borderRadius: 35, backgroundColor: '#DEEEFA', bottom: 10, right: -30, opacity: 0.8 },
  inner:          { flex: 1, paddingHorizontal: 32, justifyContent: 'center', gap: 32 },
  logoContainer:  { alignItems: 'center', gap: 8 },
  logoBox:        { width: 80, height: 80, borderRadius: 20, backgroundColor: '#4A7BB5', alignItems: 'center', justifyContent: 'center', marginBottom: 8, transform: [{ rotate: '-8deg' }] },
  appName:        { fontSize: 32, fontWeight: '800', color: '#E07A20', letterSpacing: 0.5 },
  subtitle:       { fontSize: 14, color: '#4A7BB5', textAlign: 'center' },
  form:           { gap: 14 },
  inputWrapper:   { position: 'relative', justifyContent: 'center' },
  input:          { backgroundColor: '#EEF5FF', borderWidth: 1.5, borderColor: '#B0CCEE', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 14, fontSize: 16, color: '#1E3A5F' },
  errorText:      { color: '#C0392B', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  loginBtn:       { backgroundColor: '#4A7BB5', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 4 },
  loginBtnDisabled: { backgroundColor: '#A0B4CC' },
  loginBtnText:   { color: '#fff', fontSize: 18, fontWeight: '700' },
});
