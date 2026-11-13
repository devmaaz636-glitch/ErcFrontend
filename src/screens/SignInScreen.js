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
import { useNavigation, useRoute } from '@react-navigation/native';
import { authErrorMessage, signInWithEmail } from '../lib/auth';
import { warmManagerHomeCache } from '../lib/clinic';
import { demoPasswordFor, findDemoManager, isDemoManagerEmail } from '../lib/demoAccounts';
import { auth } from '../lib/firebase';
import { saveSignedInUser } from '../lib/users';
import { colors } from '../theme';

function isClinicManagerRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return role === 'clinic_manager' || role === 'clinicmanager' || role === 'manager';
}

function isAdminRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return role === 'admin' || role === 'regional_admin' || role === 'regionaladmin';
}

function isDoctorRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return role === 'doctor' || role === 'clinic_doctor' || role === 'physician';
}

function isPatientRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return role === 'patient' || role === 'clinic_patient';
}

function ClearIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="9" fill="#C9C2BA" />
      <Path d="M9 9 L15 15 M15 9 L9 15" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function GoogleGlyph() {
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <Path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.2-3.5 5.7-6.5 7.1l.1.1 6.2 5.2C36.8 39 44 33.5 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </Svg>
  );
}

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
  const route = useRoute();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const signingIn = useRef(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [notice, setNotice] = useState('');

  const logoWidth = Math.min(width * 0.68, 300);
  const logoHeight = logoWidth * (81 / 264);
  const photoHeight = Math.max(width * (434 / 430), height * 0.58);

  useEffect(() => {
    // Always start with empty password. Never prefill staff/demo credentials.
    setPassword('');
    setRememberMe(false);

    const fromSignupEmail = String(route.params?.email || '').trim();
    if (route.params?.signedUp && fromSignupEmail) {
      setEmail(fromSignupEmail);
      AsyncStorage.removeItem(REMEMBER_KEY).catch(() => {});
      return undefined;
    }

    // Do not restore remembered emails — prevents showing other roles' accounts.
    AsyncStorage.removeItem(REMEMBER_KEY).catch(() => {});
    setEmail('');
    return undefined;
  }, [route.params?.signedUp, route.params?.email]);

  useEffect(() => {
    if (route.params?.signedUp) {
      setToast('Account created. Please sign in.');
      navigation.setParams?.({ signedUp: undefined });
      const timer = setTimeout(() => setToast(''), 2400);
      return () => clearTimeout(timer);
    }
    if (!route.params?.loggedOut) return undefined;
    setToast('You logged out successfully');
    setEmail('');
    setPassword('');
    setRememberMe(false);
    AsyncStorage.removeItem(REMEMBER_KEY).catch(() => {});
    navigation.setParams?.({ loggedOut: undefined });
    const timer = setTimeout(() => setToast(''), 2200);
    return () => clearTimeout(timer);
  }, [route.params?.loggedOut, route.params?.signedUp, navigation]);

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
      setError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Enter your password.');
      return;
    }

    if (signingIn.current) {
      return;
    }
    signingIn.current = true;
    setError('');
    try {
      await signInWithEmail(nextEmail, password);
      // Remember-me stores email only when the user opts in — never passwords.
      persistRememberedEmail().catch(() => {});
      if (auth.currentUser) {
        // Firestore profile write must never block sign-in.
        saveSignedInUser(auth.currentUser).catch(() => {});

        const tokenResult = await auth.currentUser.getIdTokenResult(true).catch(() => null);
        const claims = tokenResult?.claims || {};
        const patientAccount =
          isPatientRole(claims.role) || isPatientRole(claims['https://enfieldroyalclinic.com/role']);

        if (patientAccount) {
          // Patients always land on onboarding after Sign In (including post-logout).
          saveSignedInUser(auth.currentUser, { role: 'patient' }).catch(() => {});
          navigation.replace('PatientOnboarding');
          return;
        }

        // Warm the correct home cache during Region Verify (demo managers → manager shell NOW).
        if (isDemoManagerEmail(nextEmail)) {
          const demo = findDemoManager(nextEmail);
          warmManagerHomeCache(auth.currentUser.uid, {
            branchId: demo?.branchId || null,
            region: demo?.region || null,
          }).catch(() => {});
        } else if (
          !(
            isDoctorRole(claims.role) ||
            nextEmail.toLowerCase() === 'ercdoctor@gmail.com' ||
            isAdminRole(claims.role)
          ) &&
          (isClinicManagerRole(claims.role) || claims.branchId || claims.clinicId)
        ) {
          warmManagerHomeCache(auth.currentUser.uid, {
            branchId: claims.branchId || claims.clinicId || null,
            region: claims.region || null,
          }).catch(() => {});
        }
      }
      navigation.replace('RegionVerify');
    } catch (signInError) {
      let message = authErrorMessage(signInError, nextEmail);
      if (isDemoManagerEmail(nextEmail) && password !== demoPasswordFor(nextEmail)) {
        message = `Use password ${demoPasswordFor(nextEmail)} for this clinic manager.`;
      }
      setError(message);
    } finally {
      signingIn.current = false;
    }
  }

  function handleForgotPassword() {
    navigation.navigate('ForgotPassword', { email: email.trim() });
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

      {toast ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: Math.max(insets.top, 12) + 8,
            left: 24,
            right: 24,
            zIndex: 50,
            backgroundColor: colors.successBg,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              color: colors.success,
              fontSize: 13,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            {toast}
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
        >
          <View
            className="items-center justify-center"
            style={{
              height: Math.max(height * 0.28, 160),
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
              paddingBottom: Math.max(insets.bottom, 20) + 16,
              minHeight: height * 0.62,
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
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  trailing={
                    email ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Clear email"
                        hitSlop={8}
                        onPress={() => setEmail('')}
                        className="ml-2 h-10 w-10 items-center justify-center"
                      >
                        <ClearIcon />
                      </Pressable>
                    ) : null
                  }
                />
                <Field
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
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

                <Pressable accessibilityRole="button" onPress={handleForgotPassword}>
                  <Text
                    allowFontScaling={false}
                    className="text-[14px] font-medium text-splash"
                  >
                    Forgot Password?
                  </Text>
                </Pressable>
              </View>

              {error ? (
                <Text className="mb-3 text-[13px] text-[#B42318]">{error}</Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={handleSignIn}
                className="h-[54px] items-center justify-center rounded-full bg-splash"
              >
                <Text allowFontScaling={false} className="text-[16px] font-semibold text-white">
                  Sign In
                </Text>
              </Pressable>

              <View className="my-5 flex-row items-center">
                <View className="h-px flex-1 bg-[#E8E1D9]" />
                <Text allowFontScaling={false} className="mx-3 text-[13px] text-muted">
                  OR
                </Text>
                <View className="h-px flex-1 bg-[#E8E1D9]" />
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => setNotice('Google sign-in will be available soon.')}
                className="h-[54px] flex-row items-center justify-center rounded-full border border-[#E8E1D9] bg-white"
              >
                <GoogleGlyph />
                <Text allowFontScaling={false} className="ml-3 text-[15px] font-semibold text-ink">
                  Sign in with Google
                </Text>
              </Pressable>

              {notice ? (
                <Text
                  allowFontScaling={false}
                  className="mt-3 text-center text-[13px]"
                  style={{ color: colors.brand }}
                >
                  {notice}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign up for a patient account"
                onPress={() => navigation.navigate('SignUp')}
                hitSlop={10}
                style={{
                  marginTop: 22,
                  paddingVertical: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text allowFontScaling={false} className="text-[14px] text-muted">
                  {"Don't have an account? "}
                  <Text className="font-semibold text-splash">Sign Up</Text>
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
