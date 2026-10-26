import { useEffect } from 'react';
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

export default function NotificationPreferencesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { preferences, error, notice, setChannel, saveAll, resetAll, setNotice, setError } =
    useNotifications();

  useEffect(() => {
    setNotice?.('');
    setError?.('');
  }, [setNotice, setError]);

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={8}
              onPress={() => navigation.navigate('Notifications')}
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
          {notice && !String(notice).toLowerCase().includes('test') ? (
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
