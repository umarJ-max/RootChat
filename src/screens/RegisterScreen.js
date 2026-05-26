import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleNext = () => {
    if (!name.trim()) return Alert.alert('Error', 'Enter your name');
    if (!phone.trim()) return Alert.alert('Error', 'Enter your phone number');
    setStep(2);
  };

  const handleRegister = async () => {
    if (!password || password.length < 6)
      return Alert.alert('Error', 'Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(name, phone, password);
    } catch (e) {
      Alert.alert('Error', e.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  if (step === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoIcon}>💬</Text>
          </View>
          <Text style={styles.appName}>RootChat</Text>
          <Text style={styles.tagline}>Create your account</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#555"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 03001234567"
              placeholderTextColor="#555"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              returnKeyType="done"
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <View style={styles.logo}>
          <Text style={styles.logoIcon}>🔒</Text>
        </View>
        <Text style={styles.appName}>Set Password</Text>
        <Text style={styles.tagline}>Choose a secure password</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputWrapper}>
          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Min. 6 characters"
              placeholderTextColor="#555"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>Create Account</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
          <View style={styles.backContent}>
          <Ionicons name="arrow-back" size={16} color="#888" />
          <Text style={styles.backText}>Back</Text>
                </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logo: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginBottom: 16, elevation: 8 },
  logoIcon: { fontSize: 38 },
  appName: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 6 },
  tagline: { color: '#888', fontSize: 15 },
  form: { gap: 4 },
  backContent: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  inputWrapper: { marginBottom: 16 },
  inputLabel: { color: '#aaa', fontSize: 13, marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { backgroundColor: '#1e1e1e', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#2a2a2a' },
  eyeText: { fontSize: 16 },
  button: { backgroundColor: '#25D366', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, elevation: 4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginText: { color: '#888', fontSize: 14 },
  loginLink: { color: '#25D366', fontSize: 14, fontWeight: '600' },
  backBtn: { alignItems: 'center', marginTop: 16 },
  backText: { color: '#888', fontSize: 14 },
});