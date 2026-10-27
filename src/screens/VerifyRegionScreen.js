import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { useClinicData } from '../context/ClinicDataContext';
import { useSession } from '../context/SessionContext';
import { auth } from '../lib/firebase';

cssInterop(Image, { className: 'style' });
const REGIONS = [
  { id: 'usa',  name: 'USA',                  code: '78690', flag: '🇺🇸' },
  { id: 'uae',  name: 'United Arab Emirates', code: '97100', flag: '🇦🇪' },
  { id: 'ksa',  name: 'Saudi Arabia',         code: '96600', flag: '🇸🇦' },
  { id: 'om',   name: 'Oman',                 code: '96800', flag: '🇴🇲' },
  { id: 'pk',   name: 'Pakistan',             code: '92000', flag: '🇵🇰' },
];

function isClinicManagerRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return role === 'clinic_manager' || role === 'clinicmanager' || role === 'manager';
}

function Chevron() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path
        d="M3 5.2 L7 9 L11 5.2"
        stroke="#8D8680"
        strokeWidth={1.4}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Pencil() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M4 16.8 V20 h3.2 L18.6 8.6 a2.2 2.2 0 0 0-3.2-3.2 L4 16.8z"
        stroke="#8D8680"
        strokeWidth={1.6}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M13.8 6.8 L17.2 10.2" stroke="#8D8680" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export default function VerifyRegionScreen() {
  const navigation = useNavigation();
  const { setRegion: persistRegion, user, updateUser } = useSession();
  const { ensureManagerHomeReady } = useClinicData();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState(REGIONS[0]);
  const [code, setCode] = useState(REGIONS[0].code);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const logoSize = Math.min(width * 0.42, 176);
  const photoHeight = Math.max(width * (434 / 430), height * 0.5);

  // Warm clinic-manager home while user is still on this screen (cache / dashboard).
  useEffect(() => {
    if (user?.role !== 'clinic_manager') return undefined;
    ensureManagerHomeReady().catch(() => {});
    return undefined;
  }, [user?.role, ensureManagerHomeReady]);

  function selectRegion(next) {
    setRegion(next);
    setCode(next.code);
    setOpen(false);
    setError('');
  }

  async function confirmRegion() {
    const nextCode = code.trim();
    if (!region || !nextCode) {
      setError('Select your region and region code.');
      return;
    }
    if (starting) return;
    setStarting(true);
    setError('');
    try {
      await persistRegion({ ...region, code: nextCode });

      let role = user?.role || '';
      let branchId = user?.branchId || user?.clinicId || null;
      try {
        // Use cached token claims (already refreshed at sign-in) — no multi-second force refresh.
        const tokenResult = await auth.currentUser?.getIdTokenResult(false);
        const claims = tokenResult?.claims || {};
        role = claims.role || role;
        branchId = claims.branchId || claims.clinicId || branchId;
      } catch {
        /* Session bootstrap will surface an authorization error if claims cannot be read. */
      }

      // Manager: open home only when full dashboard is in memory (usually already warmed at sign-in).
      if (isClinicManagerRole(role) || branchId) {
        updateUser({
          role: 'clinic_manager',
          branchId: branchId || null,
          clinicId: branchId || null,
        }).catch(() => {});
        const readyHome = await ensureManagerHomeReady().catch(() => false);
        if (!readyHome) {
          setError('Could not load your clinic home. Check connection and try again.');
          setStarting(false);
          return;
        }
        navigation.replace('ManagerTabs');
        return;
      }

      navigation.replace('MainTabs');
    } catch {
      setError('Could not continue. Check your connection and try again.');
      setStarting(false);
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
          backgroundColor: 'rgba(191, 130, 79, 0.28)',
        }}
      />

      <ScrollView bounces={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
        <View
          className="items-center justify-center"
          style={{
            flexGrow: 1,
            minHeight: Math.max(height * 0.34, 190),
            paddingTop: insets.top,
          }}
        >
          <Image
            source={require('../../assets/splashlogo.png')}
            contentFit="contain"
            accessibilityLabel="Enfield Royal Clinics"
            style={{ width: logoSize, height: logoSize }}
          />
        </View>

        <View
          className="bg-card px-6 pt-4"
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          }}
        >
          <View className="w-full self-center" style={{ maxWidth: 480 }}>
            <View className="mb-5 mt-1 h-1 w-12 self-center rounded-full bg-splash" />
            <Text
              allowFontScaling={false}
              className="text-ink"
              style={{ fontSize: Math.min(Math.max(width * 0.062, 22), 26), fontWeight: '700' }}
            >
              Verify Your Region
            </Text>
            <Text allowFontScaling={false} className="mt-2 text-[14px] leading-5 text-muted">
              Please verify that the region assigned to your account is correct before continuing.
            </Text>

            <Text allowFontScaling={false} className="mb-2 mt-6 text-[15px] font-semibold text-ink">
              Select Region
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select region"
              onPress={() => setOpen((current) => !current)}
              className="h-[54px] flex-row items-center rounded-2xl bg-white px-4"
            >
              <Text allowFontScaling={false} className="flex-1 text-[15px] text-ink">
                {region.name}
              </Text>
              <Text allowFontScaling={false} className="mr-2 text-[18px]">
                {region.flag}
              </Text>
              <Chevron />
            </Pressable>

            {open ? (
              <View className="mt-2 overflow-hidden rounded-2xl bg-white">
                {REGIONS.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => selectRegion(item)}
                    className="h-[48px] flex-row items-center px-4"
                  >
                    <Text allowFontScaling={false} className="flex-1 text-[15px] text-ink">
                      {item.name}
                    </Text>
                    <Text allowFontScaling={false} className="text-[18px]">
                      {item.flag}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <Text allowFontScaling={false} className="mb-2 mt-4 text-[15px] font-semibold text-ink">
              Region Code
            </Text>
            <View className="h-[54px] flex-row items-center rounded-2xl bg-white px-4">
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                allowFontScaling={false}
                className="h-full flex-1 text-[15px] text-ink"
              />
              <Pencil />
            </View>

            {error ? (
              <Text className="mt-3 text-[13px] text-[#B42318]">{error}</Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={starting}
              onPress={confirmRegion}
              className="mt-6 h-[54px] items-center justify-center rounded-full bg-splash"
              style={{ opacity: starting ? 0.85 : 1 }}
            >
              {starting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text allowFontScaling={false} className="text-[16px] font-semibold text-white">
                  Get Started
                </Text>
              )}
            </Pressable>

            <Text allowFontScaling={false} className="mt-5 text-center text-[14px] text-muted">
              Not your region?{' '}
              <Text
                allowFontScaling={false}
                className="font-semibold text-splash"
                onPress={() =>
                  Alert.alert(
                    'Contact Head Office',
                    'Ask Enfield Royal Clinics head office to update the region on your account.'
                  )
                }
              >
                Contact Head Office
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
