import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ImageBackground, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveName } from '../storage/storage';

const { height: H } = Dimensions.get('window');

export default function LoginScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const [name, setName]       = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

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
    <ImageBackground
      source={require('../assets/images/login-bg.png')}
      style={styles.root}
      resizeMode="cover"
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Form anchored to lower-middle of screen */}
        <View style={[styles.inner, { paddingBottom: insets.bottom + 40 }]}>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.subtitle}>Enter your name to get started</Text>

          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#A0B8D0"
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
              <Text style={styles.loginBtnText}>Let's go</Text>
            )}
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1 },
  container: { flex: 1 },

  inner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 36,
    paddingTop: 24,
    gap: 14,
  },

  subtitle: {
    fontSize: 15,
    color: '#4A6A8A',
    textAlign: 'center',
    fontWeight: '400',
  },
  errorText: {
    color: '#C0392B',
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  inputWrapper: { justifyContent: 'center' },
  input: {
    backgroundColor: 'rgba(240, 247, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: '#7EB0DC',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E3A5F',
  },
  loginBtn: {
    backgroundColor: '#5B9BC5',
    borderRadius: 30,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#3A7AAA',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: '#A0BDD4',
    shadowOpacity: 0,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
