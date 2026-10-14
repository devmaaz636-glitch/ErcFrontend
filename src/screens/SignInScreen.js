import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import Svg, { Circle, Path } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { authErrorMessage, sendPasswordReset, signInWithEmail } from '../lib/auth';
import { auth } from '../lib/firebase';
import { saveSignedInUser } from '../lib/users';

cssInterop(Image, { className: 'style' });

const REMEMBER_KEY = '@erc/remembered-email';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function EyeIcon({ off }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M2.2 12s3.6-6.2 9.8-6.2S21.8 12 21.8 12s-3.6 6.2-9.8 6.2S2.2 12 2.2 12z"
        stroke="#8D8680"
        strokeWidth={1.6}
        fill="none"
      />
      <Circle cx="12" cy="12" r="2.5" stroke="#8D8680" strokeWidth={1.6} fill="none" />
      {off ? (
        <Path d="M5 19 L19 5" stroke="#8D8680" strokeWidth={1.6} strokeLinecap="round" />
      ) : null}
    </Svg>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  trailing,
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[15px] font-semibold text-ink">{label}</Text>
      <View className="h-[54px] flex-row items-center rounded-2xl bg-field px-4">
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#B0A89F"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          allowFontScaling={false}
          className="h-full flex-1 text-[15px] text-ink"
        />
        {trailing}
      </View>
    </View>
  );
}

export default function SignInScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetting, setResetting] = useState(false);
  const signingIn = useRef(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const logoWidth = Math.min(width * 0.68, 300);
  const logoHeight = logoWidth * (81 / 264);
  const photoHeight = Math.max(width * (434 / 430), height * 0.58);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(REMEMBER_KEY)
      .then((saved) => {
        if (active && saved) {
          setEmail(saved);
          setRememberMe(true);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function persistRememberedEmail() {
    if (rememberMe) {
      await AsyncStorage.setItem(REMEMBER_KEY, email.trim());
    } else {
      await AsyncStorage.removeItem(REMEMBER_KEY);
    }
  }

  async function handleSignIn() {
    const nextEmail = email.trim();
    if (!nextEmail || !EMAIL_PATTERN.test(nextEmail)) {
      setNotice('');
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setNotice('');
      setError('Enter your password.');
      return;
    }

    if (signingIn.current) {
      return;
    }
    signingIn.current = true;
    setError('');
    setNotice('');
    try {
      await signInWithEmail(nextEmail, password);
      await persistRememberedEmail();
      if (auth.currentUser) {
        await saveSignedInUser(auth.currentUser).catch(() => {});
      }
      navigation.replace('RegionVerify');
    } catch (signInError) {
      setError(authErrorMessage(signInError));
    } finally {
      signingIn.current = false;
    }
  }

  async function handleForgotPassword() {
    const nextEmail = email.trim();
    if (!nextEmail || !EMAIL_PATTERN.test(nextEmail)) {
      setNotice('');
      setError('Enter your email, then tap Forgot Password.');
      return;
    }

    setResetting(true);
    setError('');
    setNotice('');
    try {
      await sendPasswordReset(nextEmail);
      setNotice('Password reset email sent.');
    } catch (resetError) {
      setError(authErrorMessage(resetError));
    } finally {
      setResetting(false);
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: '#C4895C' }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <Image
        source={require('../../assets/signin-bg.png')}
        contentFit="cover"
        contentPosition="center"
        style={{ position: 'absolute', top: 0, left: 0, width, height: photoHeight }}
        accessibilityLabel="Enfield Royal Clinics reception"
      />
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: 'rgba(140, 84, 40, 0.18)',
        }}
      />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          bounces={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View
            className="items-center justify-center"
            style={{
              flexGrow: 1,
              minHeight: Math.max(height * 0.36, 200),
              paddingTop: insets.top,
            }}
          >
            <Image
              source={require('../../assets/signin-logo.png')}
              contentFit="contain"
              accessibilityLabel="Enfield Royal Clinics"
              style={{ width: logoWidth, height: logoHeight }}
            />
          </View>

          <View
            className="bg-card px-6 pt-4"
            style={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingBottom: Math.max(insets.bottom, 16) + 10,
            }}
          >
            <View className="w-full self-center" style={{ maxWidth: 480 }}>
              <View className="mb-5 mt-1 h-1 w-12 self-center rounded-full bg-splash" />
              <Text
                allowFontScaling={false}
                className="text-ink"
                style={{ fontSize: Math.min(Math.max(width * 0.068, 22), 28), fontWeight: '700' }}
              >
                Welcome Back 👋
              </Text>
              <Text allowFontScaling={false} className="mt-2 text-[14px] leading-5 text-muted">
                Please fill your detail to access your account.
              </Text>

              <View className="mt-6">
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@gmail.com"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                />
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="debra.holt@example.com"
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSignIn}
                  trailing={
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                      hitSlop={8}
                      onPress={() => setShowPassword((current) => !current)}
                      className="ml-2 h-10 w-10 items-center justify-center"
                    >
                      <EyeIcon off={!showPassword} />
                    </Pressable>
                  }
                />
              </View>

              <View className="mb-5 mt-1 flex-row items-center justify-between">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: rememberMe }}
                  onPress={() => setRememberMe((current) => !current)}
                  className="flex-row items-center"
                >
                  <View
                    className={`mr-2 h-5 w-5 items-center justify-center rounded-[5px] border ${
                      rememberMe ? 'border-peach bg-peach' : 'border-[#D5CFC8] bg-white'
                    }`}
                  >
                    {rememberMe ? (
                      <Svg width={12} height={12} viewBox="0 0 14 14">
                        <Path
                          d="M2.4 7.2 L5.5 10.2 L11.6 3.6"
                          stroke="#FFFFFF"
                          strokeWidth={1.8}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    ) : null}
                  </View>
                  <Text allowFontScaling={false} className="text-[14px] text-muted">
                    Remember me
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleForgotPassword}
                  disabled={resetting}
                >
                  <Text
                    allowFontScaling={false}
                    className="text-[14px] font-medium text-splash"
                  >
                    {resetting ? 'Sending...' : 'Forgot Password?'}
                  </Text>
                </Pressable>
              </View>

              {error ? (
                <Text className="mb-3 text-[13px] text-[#B42318]">{error}</Text>
              ) : null}
              {notice ? (
                <Text className="mb-3 text-[13px] text-[#3F6B4A]">{notice}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleSignIn}
                className="h-[54px] items-center justify-center rounded-full bg-splash"
              >
                <Text allowFontScaling={false} className="text-[16px] font-semibold text-white">
                  Sign in
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
