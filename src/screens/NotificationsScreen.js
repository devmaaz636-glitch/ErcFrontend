import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { useNotifications } from '../context/NotificationsContext';
import { colors } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = colors.brand;
const INK = colors.ink;
const MUTED = colors.muted;
const DESC = colors.desc;
const BG = colors.background;

const CHANNELS = [
  {
    key: 'push',
    title: 'Push Notifications',
    body: 'Real-time alerts on your device via Expo Push',
    icon: 'notifications-outline',
  },
  {
    key: 'email',
    title: 'Email Notifications',
    body: 'Receive updates by email (SMTP)',
    icon: 'mail-outline',
  },
  {
    key: 'inApp',
    title: 'In-App Notifications',
    body: 'Live feed over SSE / Redis pub-sub',
    icon: 'radio-button-on-outline',
  },
];

const ALERTS = [
  {
    key: 'profileChanges',
    title: 'Profile Changes',
    body: 'Name, email, region, or photo updates',
    icon: 'person-outline',
  },
  {
    key: 'passwordChanges',
    title: 'Password Changes',
    body: 'When your account password is changed or reset',
    icon: 'lock-closed-outline',
  },
  {
    key: 'bookingUpdates',
    title: 'Booking Updates',
    body: 'Appointment and booking activity',
    icon: 'calendar-outline',
  },
  {
    key: 'refund',
    title: 'Refund Alerts',
    body: 'Refund spikes across branches',
    icon: 'refresh-outline',
  },
  {
    key: 'accountRequests',
    title: 'Account Requests',
    body: 'Clinic manager account requests requiring review',
    icon: 'people-outline',
  },
  {
    key: 'appointmentsThreshold',
    title: 'Appointments Threshold Alerts',
    body: 'Appointments reach configured maximum thresholds',
    icon: 'alert-circle-outline',
  },
  {
    key: 'capacityThreshold',
    title: 'Capacity Threshold Alerts',
    body: 'Branches approaching configured capacity limits',
    icon: 'pulse-outline',
  },
  {
    key: 'booking',
    title: 'Booking Drop Alerts',
    body: 'Significant drops in branch bookings',
    icon: 'trending-down-outline',
  },
];

function SectionHeader({ title, subtitle, right }) {
  return (
    <View style={{ marginTop: s(22), marginBottom: s(10) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: INK }}>{title}</Text>
        {right}
      </View>
      <Text style={{ fontSize: fs(11), color: DESC, marginTop: 4, lineHeight: 16 }}>{subtitle}</Text>
    </View>
  );
}

function PrefRow({ icon, title, body, value, onValueChange }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: s(12),
        paddingHorizontal: s(12),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: s(34),
          height: s(34),
          borderRadius: s(17),
          backgroundColor: BROWN,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(12),
        }}
      >
        <Ionicons name={icon} size={s(16)} color="#fff" />
      </View>
      <View style={{ flex: 1, marginRight: 10 }}>
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: INK }}>{title}</Text>
        <Text style={{ fontSize: fs(10), color: DESC, marginTop: 3, lineHeight: 14 }}>{body}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E5DED6', true: BROWN }}
        thumbColor="#fff"
        ios_backgroundColor="#E5DED6"
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const {
    preferences,
    feed,
    live,
    error,
    notice,
    setChannel,
    setAlert,
    saveAll,
    resetAll,
    sendTest,
  } = useNotifications();

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: s(20),
          paddingBottom: s(24),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={() => navigation.goBack()}
              style={{
                width: s(36),
                height: s(36),
                borderRadius: s(18),
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={s(18)} color={INK} />
            </Pressable>
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
              Notifications
            </Text>
            <Text style={{ fontSize: fs(9), color: live ? colors.success : MUTED }}>
              {live ? '● Live' : '○ Syncing'}
            </Text>
          </View>

          <SectionHeader
            title="Notification Channels"
            subtitle="Push, email, and in-app — toggles save instantly and go live in real time."
          />
          {CHANNELS.map((item) => (
            <PrefRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              body={item.body}
              value={Boolean(preferences.channels?.[item.key])}
              onValueChange={(value) => setChannel(item.key, value)}
            />
          ))}

          <SectionHeader
            title="Alert Preferences"
            subtitle="Select the events you want notifications for."
          />
          {ALERTS.map((item) => (
            <PrefRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              body={item.body}
              value={Boolean(preferences.alerts?.[item.key])}
              onValueChange={(value) => setAlert(item.key, value)}
            />
          ))}

          {feed.length > 0 ? (
            <>
              <SectionHeader
                title="Recent Activity"
                subtitle="Live alerts from your enabled channels."
              />
              {feed.slice(0, 8).map((item) => (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 14,
                    padding: s(12),
                    marginBottom: s(10),
                  }}
                >
                  <Text style={{ fontSize: fs(13), fontWeight: '700', color: INK }}>{item.title}</Text>
                  <Text style={{ fontSize: fs(10), color: DESC, marginTop: 4, lineHeight: 14 }}>
                    {item.body}
                  </Text>
                  <Text style={{ fontSize: fs(9), color: MUTED, marginTop: 6 }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: s(20),
          paddingTop: s(12),
          paddingBottom: Math.max(insets.bottom, 16),
          backgroundColor: BG,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          {error ? (
            <Text style={{ color: '#B42318', fontSize: fs(12), marginBottom: s(10) }}>{error}</Text>
          ) : null}
          {notice ? (
            <Text style={{ color: '#3F6B4A', fontSize: fs(12), marginBottom: s(10) }}>{notice}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={sendTest}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>
              Send Test Notification
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={saveAll}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: '#fff',
              borderWidth: 1.5,
              borderColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(12),
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: BROWN }}>Save Preferences</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Reset to defaults', 'Restore the default notification preferences?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', onPress: resetAll },
              ])
            }
            style={{
              height: s(48),
              borderRadius: 999,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(8),
            }}
          >
            <Text style={{ fontSize: fs(13), fontWeight: '600', color: MUTED }}>Reset to Defaults</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
