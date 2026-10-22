import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../components/UserAvatar';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { signOutUser } from '../lib/auth';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { useTopPadding } from '../utils/responsive';

const SETTINGS = [
  { key: 'edit', label: 'Edit Profile', icon: 'person-outline' },
  { key: 'security', label: 'Security & Privacy', icon: 'shield-checkmark-outline' },
  { key: 'notification', label: 'Notification', icon: 'notifications-outline' },
  { key: 'managers', label: 'Clinic Managers', icon: 'people-outline' },
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

export default function ProfileTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user, displayRegion, clearSession } = useSession();

  const info = [
    { label: 'Full Name', value: user.name },
    { label: 'Primary Email', value: user.email },
    { label: 'Role', value: user.role },
    { label: 'Assigned Region', value: displayRegion },
  ];

  function logout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOutUser();
          } catch {
            /* still clear local session */
          }
          await clearSession();
          navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] });
        },
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
      navigation.navigate('Notifications', { user });
      return;
    }
    if (key === 'managers') {
      navigation.navigate('ClinicManagers');
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.brand}
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: colors.ink }}>
              Profile
            </Text>
            <IconCircleButton
              name="notifications-outline"
              color={colors.brand}
              accessibilityLabel="Notifications"
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          <View style={{ alignItems: 'center', marginTop: 18 }}>
            <UserAvatar uri={user.photoUrl} size={104} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink, marginTop: 12 }}>
              {user.name || '—'}
            </Text>
            <Text style={{ fontSize: 8, color: colors.muted, marginTop: 2 }}>{user.role}</Text>
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

    </View>
  );
}
