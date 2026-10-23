import { useCallback, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import {
  DEFAULT_PREFERENCES,
  fetchNotificationFeed,
  fetchNotificationPreferences,
  notificationErrorMessage,
  resetNotificationPreferences,
  saveNotificationPreferences,
} from '../lib/notifications';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = '#BF824F';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const DESC = '#666666';
const BG = '#FFF8F1';

const CHANNELS = [
  {
    key: 'push',
    title: 'Push Notifications',
    body: 'Receive alerts on your device',
    icon: 'notifications-outline',
  },
  {
    key: 'email',
    title: 'Email Notifications',
    body: 'Receive updates by email',
    icon: 'mail-outline',
  },
  {
    key: 'inApp',
    title: 'In-App Notifications',
    body: 'View notifications inside the app',
    icon: 'radio-button-on-outline',
  },
];

const ALERTS = [
  {
    key: 'refund',
    title: 'Refund Alerts',
    body: 'Receive alerts on your device',
    icon: 'refresh-outline',
  },
  {
    key: 'accountRequests',
    title: 'Account Requests',
    body: 'Clinic manager account requests requiring review',
    icon: 'person-outline',
  },
{
  key: 'appointmentsThreshold',
  title: 'Appointments Threshold Alerts',
  body: 'Appointments reach configured maximum thresholds',
  icon: 'calendar-outline',
},
  {
    key: 'capacityThreshold',
    title: 'Capacity Threshold Alerts',
    body: 'Branches approaching configured capacity limits',
    icon: 'pulse-outline',
  },
  {
    key: 'booking',
    title: 'Booking Alerts',
    body: 'Significant drops in branch bookings',
    icon: 'calendar-outline',
  },
];

function SectionHeader({ title, subtitle }) {
  return (
    <View style={{ marginTop: s(22), marginBottom: s(10) }}>
      <Text style={{ fontSize: fs(15), fontWeight: '700', color: INK }}>{title}</Text>
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
  const [prefs, setPrefs] = useState(DEFAULT_PREFERENCES);
  const [feed, setFeed] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const saving = useRef(false);

  const load = useCallback(async () => {
    setError('');
    try {
      const [preferences, items] = await Promise.all([
        fetchNotificationPreferences(),
        fetchNotificationFeed().catch(() => []),
      ]);
      setPrefs(preferences);
      setFeed(items);
    } catch (err) {
      setError(notificationErrorMessage(err));
      setPrefs(DEFAULT_PREFERENCES);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(() => {
        fetchNotificationFeed()
          .then(setFeed)
          .catch(() => {});
      }, 8000);
      return () => clearInterval(timer);
    }, [load])
  );

  function setChannel(key, value) {
    setPrefs((current) => ({
      ...current,
      channels: { ...current.channels, [key]: value },
    }));
    setNotice('');
  }

  function setAlert(key, value) {
    setPrefs((current) => ({
      ...current,
      alerts: { ...current.alerts, [key]: value },
    }));
    setNotice('');
  }

  async function onSave() {
    if (saving.current) return;
    saving.current = true;
    setError('');
    setNotice('');
    try {
      const next = await saveNotificationPreferences(prefs);
      setPrefs(next);
      setNotice('Preferences saved.');
    } catch (err) {
      setError(notificationErrorMessage(err));
    } finally {
      saving.current = false;
    }
  }

  async function onReset() {
    if (saving.current) return;
    saving.current = true;
    setError('');
    setNotice('');
    try {
      const next = await resetNotificationPreferences();
      setPrefs(next);
      setNotice('Defaults restored.');
    } catch (err) {
      setError(notificationErrorMessage(err));
    } finally {
      saving.current = false;
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: s(20),
          paddingBottom: Math.max(insets.bottom, 16) + 24,
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={8}
              style={{
                width: s(36),
                height: s(36),
                borderRadius: s(18),
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications-outline" size={s(18)} color={BROWN} />
            </Pressable>
          </View>

          <SectionHeader
            title="Notification Channels"
            subtitle="Choose how you want to receive admin notifications."
          />
          {CHANNELS.map((item) => (
            <PrefRow
              key={item.key}
              icon={item.icon}
              title={item.title}
              body={item.body}
              value={Boolean(prefs.channels?.[item.key])}
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
              value={Boolean(prefs.alerts?.[item.key])}
              onValueChange={(value) => setAlert(item.key, value)}
            />
          ))}

          {feed.length > 0 ? (
            <>
              <SectionHeader
                title="Recent Activity"
                subtitle="Live alerts delivered from your enabled preferences."
              />
              {feed.slice(0, 5).map((item) => (
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

          {error ? (
            <Text style={{ color: '#B42318', fontSize: fs(12), marginBottom: s(10) }}>{error}</Text>
          ) : null}
          {notice ? (
            <Text style={{ color: '#3F6B4A', fontSize: fs(12), marginBottom: s(10) }}>{notice}</Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            onPress={onSave}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(8),
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>Save Preferences</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() =>
              Alert.alert('Reset to defaults', 'Restore the default notification preferences?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Reset', onPress: onReset },
              ])
            }
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
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: BROWN }}>Reset to Defaults</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
