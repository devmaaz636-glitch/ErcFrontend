import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, useWindowDimensions, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { useSession } from '../context/SessionContext';
import { auth } from '../lib/firebase';
import { markPatientOnboardingDone } from '../lib/patientOnboarding';
import { colors } from '../theme';

const STEPS = [
  {
    key: 'consult',
    image: require('../../assets/onboarding1.png'),
    title: ['Deliver The Best Patient', 'Consultations'],
    body: 'Access patient records, review medical history, and provide personalized care for better consultation experiences.',
  },
  {
    key: 'team',
    image: require('../../assets/Onboarding2.png'),
    title: ['Deliver The Best Patient', 'Consultations'],
    body: 'Access patient records, review medical history, and provide personalized care for better consultation experiences.',
  },
  {
    key: 'locate',
    image: require('../../assets/onboarding3.png'),
    title: ['Deliver The Best Patient', 'Consultations'],
    body: 'Access patient records, review medical history, and provide personalized care for better consultation experiences.',
  },
];

export default function PatientOnboardingScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { user } = useSession();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const dots = useMemo(() => STEPS.map((item) => item.key), []);

  const sidePad = Math.max(24, width * 0.06);
  // Sized so "Deliver The Best Patient" fits on one line on iOS and Android
  const titleSize = Math.min(Math.max((width - sidePad * 2) / 13, 22), 34);
  const titleLine = titleSize * 1.18;
  const bodySize = Math.min(Math.max(width * 0.042, 15), 17);

  // Lifts the Next button, dots and bottom description a little higher
  const bottomLift = Math.max(height * 0.03, 20);

  async function finish() {
    const uid = user?.uid || auth.currentUser?.uid;
    await markPatientOnboardingDone(uid).catch(() => {});
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
    <View style={{ flex: 1, backgroundColor: '#1A1614' }}>
      <StatusBar style="light" translucent />

      <Image
        source={step.image}
        contentFit="cover"
        contentPosition="center"
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
        transition={180}
      />

      {/* Dim overlay so heading and description are clearer */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.28)',
        }}
      />

      <LinearGradient
        colors={['rgba(12,8,6,0.62)', 'rgba(12,8,6,0.22)', 'transparent']}
        locations={[0, 0.28, 0.5]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.48 }}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['transparent', 'rgba(196,137,92,0.28)', 'rgba(150,90,45,0.78)']}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: height * 0.46 }}
        pointerEvents="none"
      />

      <View
        style={{
          flex: 1,
          paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 10) + 6,
          paddingHorizontal: sidePad,
          paddingBottom: Math.max(insets.bottom, 14) + 8 + bottomLift,
        }}
      >
        {/* Skip — top right */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', minHeight: 28 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
            onPress={onSkip}
            hitSlop={12}
            style={{ paddingVertical: 4, paddingLeft: 12 }}
          >
            <Text
              allowFontScaling={false}
              style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '400', letterSpacing: 0.2 }}
            >
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Top copy block — heading (2 lines) + description */}
        <View style={{ marginTop: height * 0.035 }}>
          {step.title.map((line) => (
            <Text
              key={line}
              allowFontScaling={false}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
              style={{
                color: '#FFFFFF',
                fontSize: titleSize,
                fontWeight: '700',
                lineHeight: titleLine,
                letterSpacing: -0.3,
              }}
            >
              {line}
            </Text>
          ))}
          <Text
            allowFontScaling={false}
            style={{
              marginTop: 12,
              color: '#FFFFFF',
              fontSize: bodySize,
              lineHeight: bodySize * 1.45,
              fontWeight: '400',
              paddingRight: width * 0.08,
            }}
          >
            {step.body}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Bottom actions: Next button, dots, then description */}
        <View style={{ width: '100%', alignItems: 'center' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isLast ? 'Get started' : 'Next'}
            onPress={onNext}
            style={{
              width: '100%',
              height: 54,
              borderRadius: 999,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                color: colors.brand,
                fontSize: 17,
                fontWeight: '600',
              }}
            >
              {isLast ? 'Get Started >' : 'Next >'}
            </Text>
          </Pressable>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 18,
              gap: 8,
            }}
          >
            {dots.map((key, dotIndex) => {
              const active = dotIndex === index;
              return (
                <View
                  key={key}
                  style={{
                    width: active ? 26 : 7,
                    height: 7,
                    borderRadius: 999,
                    backgroundColor: active ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  }}
                />
              );
            })}
          </View>

          <Text
            allowFontScaling={false}
            style={{
              marginTop: 16,
              color: '#FFFFFF',
              fontSize: bodySize,
              lineHeight: bodySize * 1.45,
              textAlign: 'center',
              paddingHorizontal: 4,
            }}
          >
            {step.body}
          </Text>
        </View>
      </View>
    </View>
  );
}