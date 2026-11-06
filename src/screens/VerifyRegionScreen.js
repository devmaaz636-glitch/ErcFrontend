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
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ADMIN_REGIONS, matchRegion, regionForBranchId } from '../components/RegionSwitcher';
import { useClinicData } from '../context/ClinicDataContext';
import { useSession } from '../context/SessionContext';
import { auth } from '../lib/firebase';
import { colors } from '../theme';

cssInterop(Image, { className: 'style' });
const REGIONS = ADMIN_REGIONS;

function isClinicManagerRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return role === 'clinic_manager' || role === 'clinicmanager' || role === 'manager';
}

function isDoctorRole(value) {
  const role = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, '_');
  return role === 'doctor' || role === 'clinic_doctor' || role === 'physician';
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
  const route = useRoute();
  const switchMode = route.params?.mode === 'switch';
  const { setRegion: persistRegion, user, updateUser, region: sessionRegion } = useSession();
  const { ensureManagerHomeReady, ensureAdminHomeReady } = useClinicData();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isDoctorAccount = isDoctorRole(user?.role);
  const isManagerAccount =
    !isDoctorAccount &&
    (isClinicManagerRole(user?.role) || Boolean(user?.branchId || user?.clinicId));
  const sessionLockedRegion =
    isManagerAccount || isDoctorAccount
      ? regionForBranchId(user?.branchId || user?.clinicId) ||
        matchRegion(user?.region) ||
        matchRegion(sessionRegion?.short || sessionRegion?.name) ||
        (isDoctorAccount ? matchRegion('UAE') : null)
      : null;
  const initialRegion =
    sessionLockedRegion ||
    REGIONS.find((item) => item.name === sessionRegion?.name || item.id === sessionRegion?.id) ||
    REGIONS[0];
  const [region, setRegion] = useState(initialRegion);
  const [code, setCode] = useState(
    sessionLockedRegion?.code || sessionRegion?.code || initialRegion.code
  );
  const [claimsLockedRegion, setClaimsLockedRegion] = useState(sessionLockedRegion);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const regionLocked = Boolean(claimsLockedRegion || sessionLockedRegion);

  const logoSize = Math.min(width * 0.42, 176);
  const photoHeight = Math.max(width * (434 / 430), height * 0.5);

  // Warm home while user is still on this screen (admin + clinic manager).
  // Prefer manager whenever branchId/claims look like a clinic manager — never warm admin for them.
  // Doctors use local seed home — do not warm admin/manager dashboards.
  useEffect(() => {
    if (isDoctorRole(user?.role)) return undefined;
    const managerLikely =
      isClinicManagerRole(user?.role) ||
      Boolean(user?.branchId || user?.clinicId) ||
      isManagerAccount;
    if (managerLikely) {
      ensureManagerHomeReady().catch(() => {});
      return undefined;
    }
    if (user?.role === 'admin') {
      ensureAdminHomeReady().catch(() => {});
    }
    return undefined;
  }, [
    user?.role,
    user?.branchId,
    user?.clinicId,
    isManagerAccount,
    ensureManagerHomeReady,
    ensureAdminHomeReady,
  ]);

  // Keep clinic managers pinned to their assigned branch region (claims + session).
  useEffect(() => {
    let active = true;
    async function lockFromClaims() {
      let branchId = user?.branchId || user?.clinicId || null;
      let role = user?.role || '';
      try {
        const tokenResult = await auth.currentUser?.getIdTokenResult(true);
        const claims = tokenResult?.claims || {};
        role = claims.role || role;
        branchId = claims.branchId || claims.clinicId || branchId;
      } catch {
        /* ignore — session hydrate still applies */
      }
      if (!active) return;
      if (isDoctorRole(role)) {
        const assigned =
          regionForBranchId(branchId || 'br-dubai') || matchRegion(user?.region) || matchRegion('UAE');
        setClaimsLockedRegion(assigned);
        setRegion(assigned);
        setCode(assigned.code);
        setOpen(false);
        return;
      }
      if (!isClinicManagerRole(role) && !branchId) return;
      const assigned = regionForBranchId(branchId) || matchRegion(user?.region);
      if (!assigned) return;
      setClaimsLockedRegion(assigned);
      setRegion(assigned);
      setCode(assigned.code);
      setOpen(false);
    }
    lockFromClaims();
    return () => {
      active = false;
    };
  }, [isManagerAccount, isDoctorAccount, user?.branchId, user?.clinicId, user?.region, user?.role]);

  function selectRegion(next) {
    if (regionLocked) return;
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
      let role = user?.role || '';
      let branchId = user?.branchId || user?.clinicId || null;
      // Skip forced token refresh when manager claims are already on the session (instant Get Started).
      const claimsAlreadyReady =
        (isClinicManagerRole(role) && Boolean(branchId)) || isDoctorRole(role);
      if (!claimsAlreadyReady) {
        try {
          const tokenResult = await auth.currentUser?.getIdTokenResult(true);
          const claims = tokenResult?.claims || {};
          role = claims.role || role;
          branchId = claims.branchId || claims.clinicId || branchId;
        } catch {
          /* Session bootstrap will surface an authorization error if claims cannot be read. */
        }
      }

      const isDoctorFlow =
        isDoctorRole(role) ||
        String(user?.email || auth.currentUser?.email || '')
          .trim()
          .toLowerCase() === 'ercdoctor@gmail.com';
      const isManagerFlow = !isDoctorFlow && (isClinicManagerRole(role) || Boolean(branchId));
      const assignedRegion =
        ((isManagerFlow || isDoctorFlow) &&
          (regionForBranchId(branchId || (isDoctorFlow ? 'br-dubai' : null)) ||
            matchRegion(user?.region) ||
            (isDoctorFlow ? matchRegion('UAE') : null))) ||
        null;
      const effectiveRegion = assignedRegion || region;
      const effectiveCode = assignedRegion?.code || nextCode;

      if ((isManagerFlow || isDoctorFlow) && assignedRegion && region.id !== assignedRegion.id) {
        setError(`Your account is assigned to ${assignedRegion.short} only.`);
        setRegion(assignedRegion);
        setCode(assignedRegion.code);
        setStarting(false);
        return;
      }

      // Region state is updated synchronously; persistence must not block mobile navigation.
      persistRegion({ ...effectiveRegion, code: effectiveCode }).catch(() => {});

      if (isDoctorFlow) {
        updateUser({
          role: 'doctor',
          branchId: branchId || 'br-dubai',
          clinicId: branchId || 'br-dubai',
          branchName: 'Dubai Branch',
          name: user?.name || 'Dr Zeeshan Forward',
          region: effectiveRegion.short || effectiveRegion.name || 'UAE',
        }).catch(() => {});
        if (switchMode) {
          navigation.goBack();
        } else {
          navigation.replace('DoctorTabs');
        }
        return;
      }

      if (isManagerFlow) {
        // Apply manager role + shell BEFORE navigate so Home never paints empty placeholders.
        updateUser({
          role: 'clinic_manager',
          branchId: branchId || null,
          clinicId: branchId || null,
          region: effectiveRegion.short || effectiveRegion.name,
        }).catch(() => {});
        await ensureManagerHomeReady().catch(() => true);
        if (switchMode) {
          navigation.goBack();
        } else {
          navigation.replace('ManagerTabs');
        }
        return;
      }

      updateUser({ region: effectiveRegion.short || effectiveRegion.name }).catch(() => {});
      // Admin: prime shell quickly, never wait on network.
      ensureAdminHomeReady().catch(() => {});

      if (switchMode) {
        navigation.goBack();
      } else {
        navigation.replace('MainTabs');
      }
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
          {switchMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close switch region"
              onPress={() => navigation.goBack()}
              hitSlop={10}
              style={{
                position: 'absolute',
                top: insets.top + 8,
                left: 16,
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: 'rgba(255,255,255,0.92)',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
              }}
            >
              <Ionicons name="close" size={20} color={colors.ink} />
            </Pressable>
          ) : null}
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
              {switchMode ? 'Switch Region' : 'Verify Your Region'}
            </Text>
            <Text allowFontScaling={false} className="mt-2 text-[14px] leading-5 text-muted">
              {regionLocked
                ? `Your clinic manager account is locked to ${region.short || region.name}. Data from other regions is not available.`
                : switchMode
                  ? 'Choose another region for your regional admin workspace.'
                  : 'Please verify that the region assigned to your account is correct before continuing.'}
            </Text>

            <Text allowFontScaling={false} className="mb-2 mt-6 text-[15px] font-semibold text-ink">
              Select Region
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select region"
              accessibilityState={{ disabled: regionLocked }}
              disabled={regionLocked}
              onPress={() => {
                if (regionLocked) return;
                setOpen((current) => !current);
              }}
              className="h-[54px] flex-row items-center rounded-2xl bg-white px-4"
              style={{ opacity: regionLocked ? 0.92 : 1 }}
            >
              <Text allowFontScaling={false} className="flex-1 text-[15px] text-ink">
                {region.name}
              </Text>
              <Text allowFontScaling={false} className="mr-2 text-[18px]">
                {region.flag}
              </Text>
              {regionLocked ? null : <Chevron />}
            </Pressable>

            {open && !regionLocked ? (
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
                onChangeText={regionLocked ? undefined : setCode}
                editable={!regionLocked}
                keyboardType="number-pad"
                allowFontScaling={false}
                className="h-full flex-1 text-[15px] text-ink"
              />
              {regionLocked ? null : <Pencil />}
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
                  {switchMode ? 'Save Region' : 'Get Started'}
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
