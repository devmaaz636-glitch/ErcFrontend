import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { authErrorMessage, changePassword } from '../lib/auth';
import { passwordProblem } from '../lib/passwordReset';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = '#BF824F';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';

export default function SecurityPrivacyScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const email = route.params?.email || route.params?.user?.email || '';
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visibleField, setVisibleField] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function submitChangePassword() {
    setError('');
    setSuccess('');
    const problem = passwordProblem(newPassword);
    if (!currentPassword) {
      setError('Enter your current password.');
      return;
    }
    if (problem) {
      setError(problem);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Your new password must be different from your current password.');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Your password has been changed successfully.');
    } catch (changeError) {
      setError(authErrorMessage(changeError));
    } finally {
      setSaving(false);
    }
  }

  function openForgotPassword() {
    navigation.navigate('ForgotPassword', {
      email,
      from: 'security',
      headerTitle: 'Forgot Password',
    });
  }

  function renderPasswordField(label, value, onChangeText, placeholder, field) {
    const visible = visibleField === field;
    return (
      <View style={{ marginTop: s(14) }}>
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: INK, marginBottom: s(7) }}>
          {label}
        </Text>
        <View
          style={{
            height: s(52),
            borderRadius: 14,
            backgroundColor: '#fff',
            paddingHorizontal: s(14),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#B0A89F"
            secureTextEntry={!visible}
            autoCapitalize="none"
            autoCorrect={false}
            allowFontScaling={false}
            style={{ flex: 1, fontSize: fs(14), color: INK, paddingVertical: 0 }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={visible ? `Hide ${label}` : `Show ${label}`}
            hitSlop={8}
            onPress={() => setVisibleField((current) => (current === field ? null : field))}
          >
            <Ionicons
              name={visible ? 'eye-outline' : 'eye-off-outline'}
              size={s(18)}
              color={MUTED}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingTop: topPad,
            paddingHorizontal: s(20),
            paddingBottom: Math.max(insets.bottom, 16) + 24,
            alignItems: 'center',
          }}
        >
          <View style={{ width: '100%', maxWidth: 480 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <IconCircleButton
                name="chevron-back"
                color={INK}
                accessibilityLabel="Go back"
                onPress={() => navigation.goBack()}
              />

              <Text
                style={{
                  flex: 1,
                  marginLeft: s(12),
                  fontSize: fs(16),
                  fontWeight: '700',
                  color: INK,
                }}
                numberOfLines={1}
              >
                Security & Privacy
              </Text>

              <NotificationBellButton color={BROWN} />
            </View>

            <Text style={{ fontSize: fs(13), color: MUTED, marginTop: s(28), lineHeight: s(19) }}>
              Confirm your current password before choosing a new one.
            </Text>

            {renderPasswordField(
              'Current Password',
              currentPassword,
              setCurrentPassword,
              'Enter current password',
              'current'
            )}
            {renderPasswordField(
              'New Password',
              newPassword,
              setNewPassword,
              'At least 8 characters',
              'new'
            )}
            {renderPasswordField(
              'Confirm New Password',
              confirmPassword,
              setConfirmPassword,
              'Repeat new password',
              'confirm'
            )}

            {error ? (
              <Text style={{ color: '#B42318', fontSize: fs(12), marginTop: s(12) }}>{error}</Text>
            ) : null}
            {success ? (
              <Text style={{ color: '#237A57', fontSize: fs(12), marginTop: s(12) }}>{success}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={submitChangePassword}
              style={{
                height: s(52),
                borderRadius: 999,
                backgroundColor: BROWN,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: s(18),
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>
                {saving ? 'Updating...' : 'Update Password'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={openForgotPassword}
              style={{ alignItems: 'center', marginTop: s(18) }}
            >
              <Text style={{ color: BROWN, fontSize: fs(13), fontWeight: '700' }}>
                Forgot your current password?
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
