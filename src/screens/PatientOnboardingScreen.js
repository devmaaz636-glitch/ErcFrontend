import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { markPatientOnboardingDone } from '../lib/patientOnboarding';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const STEPS = [
  {
    key: 'welcome',
    icon: 'sparkles-outline',
    title: 'Welcome to ERC',
    body: 'Book treatments, manage appointments, and stay connected with Enfield Royal Clinics.',
  },
  {
    key: 'care',
    icon: 'medkit-outline',
    title: 'Your care, simplified',
    body: 'Browse treatments, choose a preferred time, and track every visit in one place.',
  },
  {
    key: 'ready',
    icon: 'checkmark-circle-outline',
    title: "You're all set",
    body: 'Create bookings, view your schedule, and update your profile whenever you need.',
  },
];

export default function PatientOnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { width } = useWindowDimensions();
  const { user } = useSession();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  const dots = useMemo(() => STEPS.map((item) => item.key), []);

  async function finish() {
    await markPatientOnboardingDone(user?.uid).catch(() => {});
    navigation.replace('PatientTabs');
  }

  function onNext() {
    if (isLast) {
      finish().catch(() => navigation.replace('PatientTabs'));
      return;
    }
    setIndex((prev) => Math.min(prev + 1, STEPS.length - 1));
  }

  function onSkip() {
    finish().catch(() => navigation.replace('PatientTabs'));
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <View
        style={{
          flex: 1,
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(20),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent, flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
            {!isLast ? (
              <Pressable accessibilityRole="button" onPress={onSkip} hitSlop={8}>
                <Text style={{ color: colors.brand, fontSize: fs(13), fontWeight: '600' }}>Skip</Text>
              </Pressable>
            ) : (
              <View style={{ height: s(20) }} />
            )}
          </View>

          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: Math.min(width * 0.42, 168),
                height: Math.min(width * 0.42, 168),
                borderRadius: 999,
                backgroundColor: colors.brandSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={step.icon} size={s(54)} color={colors.brand} />
            </View>

            <Text
              style={{
                marginTop: s(28),
                fontSize: fs(22),
                fontWeight: '700',
                color: colors.ink,
                textAlign: 'center',
              }}
            >
              {step.title}
            </Text>
            <Text
              style={{
                marginTop: s(12),
                fontSize: fs(13),
                lineHeight: fs(20),
                color: colors.desc,
                textAlign: 'center',
                paddingHorizontal: s(8),
              }}
            >
              {step.body}
            </Text>

            <View style={{ flexDirection: 'row', marginTop: s(28), gap: s(8) }}>
              {dots.map((key, dotIndex) => (
                <View
                  key={key}
                  style={{
                    width: dotIndex === index ? s(18) : s(8),
                    height: s(8),
                    borderRadius: 999,
                    backgroundColor: dotIndex === index ? colors.brand : '#E4D9CF',
                  }}
                />
              ))}
            </View>
          </View>

          <PrimaryButton
            label={isLast ? 'Get Started' : 'Next'}
            onPress={onNext}
            size="sm"
            style={{ width: '100%' }}
          />
        </View>
      </View>
    </View>
  );
}
