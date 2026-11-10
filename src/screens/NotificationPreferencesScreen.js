import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { useNotifications } from '../context/NotificationsContext';
import { colors } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = colors.brand;
const INK = colors.ink;
const DESC = colors.desc;
const BG = colors.background;

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
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel={`${title} ${value ? 'enabled' : 'disabled'}`}
        accessibilityState={{ checked: value }}
        hitSlop={8}
        onPress={() => onValueChange(!value)}
        style={{
          width: s(42),
          height: s(24),
          borderRadius: s(12),
          padding: s(3),
          justifyContent: 'center',
          backgroundColor: value ? colors.brandSoft : '#E5DED6',
        }}
      >
        <View
          style={{
            width: s(18),
            height: s(18),
            borderRadius: s(9),
            backgroundColor: value ? BROWN : '#fff',
            alignSelf: value ? 'flex-end' : 'flex-start',
            elevation: 1,
          }}
        />
      </Pressable>
    </View>
  );
}

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { preferences, error, notice, setChannel, saveAll, resetAll, sendTest, setNotice, setError, refresh } =
    useNotifications();

  useEffect(() => {
    setNotice?.('');
    setError?.('');
    refresh?.().catch(() => {});
  }, [setNotice, setError, refresh]);

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
            <IconCircleButton
              name="chevron-back"
              color={INK}
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                marginHorizontal: s(8),
                fontSize: fs(16),
                fontWeight: '700',
                color: INK,
              }}
              numberOfLines={1}
            >
              Notifications
            </Text>
            <NotificationBellButton color={BROWN} />
          </View>

          <Text style={{ fontSize: fs(15), fontWeight: '700', color: INK, marginTop: s(22) }}>
            Notification Channels
          </Text>
          <Text style={{ fontSize: fs(11), color: DESC, marginTop: 4, marginBottom: s(12), lineHeight: 16 }}>
            Choose how you want to receive admin notifications.
          </Text>

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
            onPress={saveAll}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>Save Preferences</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send test notification"
            onPress={sendTest}
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
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: BROWN }}>Send Test Notification</Text>
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
              height: s(52),
              borderRadius: 999,
              backgroundColor: '#fff',
              borderWidth: 1.5,
              borderColor: '#E5DED6',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(12),
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: INK }}>Reset to Defaults</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
