import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import UserAvatar from '../components/UserAvatar';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useNotifications } from '../context/NotificationsContext';
import { signOutUser } from '../lib/auth';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { useTopPadding } from '../utils/responsive';

const SETTINGS = [
  { key: 'edit', label: 'Edit Profile', icon: 'person-outline' },
  { key: 'security', label: 'Security & Privacy', icon: 'shield-checkmark-outline' },
  { key: 'notification', label: 'Notification Preferences', icon: 'notifications-outline' },
];

const CHANNELS = [
  {
    key: 'push',
    title: 'Push Notifications',
    body: 'Real-time alerts on this device',
    icon: 'notifications-outline',
  },
  {
    key: 'email',
    title: 'Email Notifications',
    body: 'Updates sent to your account email',
    icon: 'mail-outline',
  },
  {
    key: 'inApp',
    title: 'In-App Notifications',
    body: 'Live feed inside the app (SSE)',
    icon: 'radio-button-on-outline',
  },
];

function SectionTitle({ title, right }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 22,
        marginBottom: 10,
      }}
    >
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: colors.ink }}>{title}</Text>
      {right}
    </View>
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

function ChannelRow({ icon, title, body, value, onValueChange }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        paddingVertical: 12,
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
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: colors.ink }}>{title}</Text>
        <Text style={{ fontSize: 9, color: colors.muted, marginTop: 3, lineHeight: 13 }}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5DED6', true: colors.brand }}
        thumbColor="#fff"
        ios_backgroundColor="#E5DED6"
      />
    </View>
  );
}

export default function ProfileTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user, displayRegion, clearSession } = useSession();
  const { channels, setChannel, live, unreadCount, notice, error } = useNotifications();

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
            <View>
              <IconCircleButton
                name="notifications-outline"
                color={colors.brand}
                accessibilityLabel="Notifications"
                onPress={() => navigation.navigate('Notifications')}
              />
              {unreadCount > 0 ? (
                <View
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: colors.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 8, fontWeight: '700' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              ) : null}
            </View>
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

          <SectionTitle
            title="Notification Channels"
            right={
              <Text style={{ fontSize: 9, color: live ? colors.success : colors.muted }}>
                {live ? '● Live' : '○ Syncing'}
              </Text>
            }
          />
          <Text style={{ fontSize: 9, color: colors.desc, marginBottom: 8, lineHeight: 13 }}>
            Toggle how you receive real-time clinic alerts. Changes save instantly.
          </Text>
          {CHANNELS.map((item) => (
            <ChannelRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              body={item.body}
              value={Boolean(channels?.[item.key])}
              onValueChange={(value) => setChannel(item.key, value)}
            />
          ))}
          {notice ? (
            <Text style={{ fontSize: 10, color: colors.success, marginBottom: 6 }}>{notice}</Text>
          ) : null}
          {error ? (
            <Text style={{ fontSize: 10, color: colors.danger, marginBottom: 6 }}>{error}</Text>
          ) : null}

          <PrimaryButton label="Logout" onPress={logout} style={{ marginTop: 18, height: 44 }} />
        </View>
      </ScrollView>
    </View>
  );
}
