import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RegionGlobeButton } from '../components/RegionSwitcher';
import UserAvatar from '../components/UserAvatar';
import { IconCircleButton, NotificationBellButton, PrimaryButton } from '../components/ui';
import { roleLabel, useSession } from '../context/SessionContext';
import { useClinicData } from '../context/ClinicDataContext';
import { signOutUser } from '../lib/auth';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { scale as s, useTopPadding } from '../utils/responsive';

// If the network is slow or down, stop waiting for the server after this long
// and finish logging out locally.
const SIGN_OUT_TIMEOUT_MS = 8000;

const SETTINGS = [
  { key: 'edit', label: 'Edit Profile', icon: 'person-outline' },
  { key: 'security', label: 'Security & Privacy', icon: 'shield-checkmark-outline' },
  { key: 'notification', label: 'Notification Preferences', icon: 'notifications-outline' },
];

function SectionTitle({ title }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 22, marginBottom: 10 }}>
      {title}
    </Text>
  );
}

function InfoRow({ label, value }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: colors.ink }}>{label}</Text>
        <Text style={{ fontSize: 9, color: colors.muted, marginTop: 3 }}>{value || '—'}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.muted} />
    </View>
  );
}

function ActionRow({ label, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={14} color={colors.white} />
      </View>
      <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.ink }}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.muted} />
    </Pressable>
  );
}

/* Full-screen loading overlay shown while logging out.
   Uses a Modal so it also covers the tab bar and blocks every tap. */
function LogoutOverlay({ visible }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => {}}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.35)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{
            width: '100%',
            maxWidth: 280,
            backgroundColor: '#fff',
            borderRadius: 18,
            paddingVertical: 24,
            paddingHorizontal: 20,
            alignItems: 'center',
            shadowColor: colors.brand,
            shadowOpacity: 0.2,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 10,
          }}
        >
          <ActivityIndicator size="large" color={colors.brand} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 16 }}>
            Logging out…
          </Text>
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: 6,
              textAlign: 'center',
              lineHeight: 16,
            }}
          >
            Please wait a moment while we sign you out securely.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export default function ProfileTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user: sessionUser, displayRegion, clearSession } = useSession();
  const [loggingOut, setLoggingOut] = useState(false);
  const logoutLock = useRef(false);

  // The session is cleared during logout, so never read fields from a null user.
  const user = sessionUser ?? {};
  const { dashboard } = useClinicData();
  const isManager = user.role === 'clinic_manager';
  const displayedRole = roleLabel(user.role);

  const info = [
    { label: 'Full Name', value: user.name },
    { label: 'Primary Email', value: user.email },
    { label: 'Role', value: displayedRole },
    isManager
      ? { label: 'Assigned Branch', value: dashboard?.clinic?.name || dashboard?.clinic?.city || 'Loading assigned branch' }
      : { label: 'Assigned Region', value: displayRegion },
  ];

  async function performLogout() {
    if (logoutLock.current) return; // ignore double taps
    logoutLock.current = true;
    setLoggingOut(true);

    try {
      // Wait for the server sign-out, but never longer than the timeout
      // (slow or no internet should not leave the user stuck).
      await Promise.race([
        signOutUser(),
        new Promise((resolve) => setTimeout(resolve, SIGN_OUT_TIMEOUT_MS)),
      ]);
    } catch {
      /* still clear local session */
    }

    try {
      await clearSession();
      navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
    } catch {
      logoutLock.current = false;
      setLoggingOut(false);
      Alert.alert('Could not log out', 'Something went wrong. Please try again.');
    }
  }

  function logout() {
    if (loggingOut) return;
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: performLogout,
      },
    ]);
  }

  function onSettingPress(key) {
    if (key === 'edit') {
      navigation.navigate('EditProfile', { user });
      return;
    }
    if (key === 'security') {
      navigation.navigate('SecurityPrivacy', { user, email: user.email });
      return;
    }
    if (key === 'notification') {
      navigation.navigate('NotificationPreferences', { user });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 30 }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.brand}
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: colors.ink }}>
              Profile
            </Text>
            {user.role === 'admin' || user.role === 'Regional Admin' ? (
              <>
                <RegionGlobeButton color={colors.brand} />
                <View style={{ width: s(8) }} />
              </>
            ) : null}
            <NotificationBellButton color={colors.brand} />
          </View>

          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <UserAvatar uri={user.photoUrl} size={104} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 12 }}>
              {user.name || '—'}
            </Text>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>            {displayedRole}</Text>
          </View>

          <SectionTitle title="Account Information" />
          {info.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}

          <SectionTitle title="Account Setting" />
          {SETTINGS.map((row) => (
            <ActionRow
              key={row.key}
              label={row.label}
              icon={row.icon}
              onPress={() => onSettingPress(row.key)}
            />
          ))}

          <PrimaryButton label="Logout" onPress={logout} style={{ marginTop: 18, height: 44 }} />
        </View>
      </ScrollView>

      <LogoutOverlay visible={loggingOut} />
    </View>
  );
}