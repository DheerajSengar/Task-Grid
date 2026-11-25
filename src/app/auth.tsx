import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { formatAuthError } from '@/services/authService';
import { DesignTheme } from '@/constants/designTheme';

export default function AuthScreen() {
  const params = useLocalSearchParams<{ mode?: 'signin' | 'signup'; addAccount?: string; email?: string }>();
  const { user, signIn, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(params.mode === 'signup' ? 'signup' : 'signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(params.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (mode === 'signup' && !displayName.trim()) {
      setError('Please enter your name');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMsg('');

      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName.trim());
      }

      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}

      router.replace('/tabs' as any);
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(formatAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first to receive a password reset link.');
      return;
    }
    try {
      setIsResetting(true);
      setError('');
      setSuccessMsg('');
      await sendPasswordReset(email.trim());
      setSuccessMsg(
        `Password reset email sent to ${email.trim()}! Please check your inbox (and spam folder) to reset your password.`
      );
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      } catch {}
    } catch (err: any) {
      setError(formatAuthError(err));
    } finally {
      setIsResetting(false);
    }
  };

  const handleQuickDemo = () => {
    setEmail('demo2026@taskmanager.com');
    setPassword('TestPassword123!');
    setDisplayName('Demo User');
    setError('');
    setSuccessMsg('');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            {user ? (
              <Pressable
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace('/tabs');
                  }
                }}
                style={styles.backBtn}
                hitSlop={10}>
                <Ionicons name="arrow-back" size={20} color="#111827" />
              </Pressable>
            ) : (
              <View style={{ width: 36 }} />
            )}
            <Text style={styles.headerTitle}>
              {user
                ? (mode === 'signin' ? 'Sign In Another Account' : 'Create Another Account')
                : (mode === 'signin' ? 'Sign In' : 'Create Account')}
            </Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Main Card */}
          <View style={styles.card}>
            {/* Branding Logo Icon */}
            <View style={styles.brandContainer}>
              <View style={styles.brandIconWrap}>
                <Ionicons name="shield-checkmark" size={32} color="#10B981" />
              </View>
              <Text style={styles.brandTitle}>TaskManager</Text>
              <Text style={styles.brandSubtitle}>
                {user
                  ? 'Sign in to add another account to this device'
                  : 'Sync tasks securely across your devices'}
              </Text>
            </View>

            {/* Mode Switcher Tabs */}
            <View style={styles.switcherRow}>
              <Pressable
                onPress={() => {
                  setMode('signin');
                  setError('');
                }}
                style={[
                  styles.switcherBtn,
                  mode === 'signin' && styles.switcherBtnActive,
                ]}>
                <Text
                  style={[
                    styles.switcherText,
                    mode === 'signin' && styles.switcherTextActive,
                  ]}>
                  Sign In
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setMode('signup');
                  setError('');
                }}
                style={[
                  styles.switcherBtn,
                  mode === 'signup' && styles.switcherBtnActive,
                ]}>
                <Text
                  style={[
                    styles.switcherText,
                    mode === 'signup' && styles.switcherTextActive,
                  ]}>
                  Sign Up
                </Text>
              </Pressable>
            </View>

            {/* Error Banner with Smart Recovery Actions */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorText}>{error}</Text>
                  {error.includes('Invalid email or password') || error.includes('Incorrect') ? (
                    <View style={styles.recoveryRow}>
                      <Pressable
                        onPress={handleForgotPassword}
                        disabled={isResetting}
                        style={styles.recoveryChip}>
                        <Ionicons name="mail-outline" size={13} color="#065F46" />
                        <Text style={styles.recoveryChipText}>
                          {isResetting ? 'Sending...' : 'Send Reset Link'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setMode('signup');
                          setError('');
                        }}
                        style={styles.recoveryChip}>
                        <Ionicons name="person-add-outline" size={13} color="#065F46" />
                        <Text style={styles.recoveryChipText}>Switch to Sign Up</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Success Banner */}
            {successMsg ? (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Name Input (Sign Up only) */}
            {mode === 'signup' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="e.g. Dheeraj Sengar"
                  placeholderTextColor="#64748B"
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>
            )}

            {/* Email Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#64748B"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password Input */}
            <View style={styles.fieldGroup}>
              <View style={styles.passwordHeaderRow}>
                <Text style={styles.label}>Password</Text>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                  <Pressable onPress={handleForgotPassword} disabled={isResetting} hitSlop={6}>
                    <Text style={styles.forgotPasswordLink}>
                      {isResetting ? 'Sending link...' : 'Forgot Password?'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={handleQuickDemo} hitSlop={6}>
                    <Text style={styles.quickFillLink}>⚡ Demo</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#64748B"
                  style={[styles.input, { flex: 1, borderTopRightRadius: 0, borderBottomRightRadius: 0, borderWidth: 0 }]}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#94A3B8"
                  />
                </Pressable>
              </View>
            </View>

            {/* Primary Submit Button (Pastel Mint Green) */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                isSubmitting && { opacity: 0.7 },
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={mode === 'signin' ? 'log-in-outline' : 'person-add-outline'}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.submitBtnText}>
                    {mode === 'signin' ? 'Sign In to Account' : 'Create My Account'}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: DesignTheme.colors.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    maxWidth: 480,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.04)',
      },
      default: {
        elevation: 2,
      },
    }),
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  brandIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F9EE',
    borderWidth: 1,
    borderColor: '#D1FADF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#111827',
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  switcherRow: {
    flexDirection: 'row',
    backgroundColor: '#E8F9EE',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  switcherBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  switcherBtnActive: {
    backgroundColor: '#10B981',
  },
  switcherText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#065F46',
  },
  switcherTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  recoveryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
  },
  recoveryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1FADF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  recoveryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: '#065F46',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  passwordHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotPasswordLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065F46',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF9',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderRadius: 14,
    overflow: 'hidden',
  },
  eyeBtn: {
    paddingHorizontal: 14,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  submitBtnPressed: {
    transform: [{ scale: 0.99 }],
    backgroundColor: '#059669',
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E9E7',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderRadius: 16,
    paddingVertical: 14,
    gap: 8,
  },
  guestBtnPressed: {
    backgroundColor: '#E8F9EE',
  },
  guestBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  quickFillLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
});
