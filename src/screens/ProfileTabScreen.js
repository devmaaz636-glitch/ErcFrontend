import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../components/BottomTabBar';
import { useTopPadding } from '../utils/responsive';

const BROWN = '#BF824F';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';

// static demo data
const USER = {
  name: 'Ahsan Jamal',
  email: 'ahsanadmin@gmail.com',
  role: 'Admin',
  region: 'USA',
};

// Put your profile photo in assets and use: require('../../assets/profile.png')
// While this is null, a brown circle with the user's initial is shown.
const PROFILE_IMAGE = null;

const INFO = [
  { label: 'Full Name', value: USER.name },
  { label: 'Primary Email', value: USER.email },
  { label: 'Role', value: USER.role },
  { label: 'Assigned Region', value: USER.region },
];

const SETTINGS = [
  { key: 'edit', label: 'Edit Profile', icon: 'person-outline' },
  { key: 'security', label: 'Security & Privacy', icon: 'shield-checkmark-outline' },
  { key: 'notification', label: 'Notification', icon: 'notifications-outline' },
];

const AUDIT = [{ key: 'audit', label: 'Audit Feed', icon: 'document-text-outline' }];

/* ---------- Pieces ---------- */
function SectionTitle({ title }) {
  return <Text style={{ fontSize: 13, fontWeight: '700', color: INK, marginTop: 22, marginBottom: 10 }}>{title}</Text>;
}

function InfoRow({ label, value }) {
  return (
    <Pressable
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, fontWeight: '600', color: INK }}>{label}</Text>
        <Text style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={MUTED} />
    </Pressable>
  );
}

function ActionRow({ label, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: '#fff',
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
          backgroundColor: BROWN,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon} size={14} color="#fff" />
      </View>
      <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: INK }}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={MUTED} />
    </Pressable>
  );
}

/* ---------- Screen ---------- */
export default function ProfileTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);

  function logout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: () => navigation.reset({ index: 0, routes: [{ name: 'SignIn' }] }),
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.navigate('Home')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={18} color={BROWN} />
            </Pressable>
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: INK }}>Profile</Text>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications-outline" size={18} color={BROWN} />
            </View>
          </View>

          {/* Avatar */}
          <View style={{ alignItems: 'center', marginTop: 18 }}>
            {PROFILE_IMAGE ? (
              <Image
                source={PROFILE_IMAGE}
                contentFit="cover"
                contentPosition="top"
                style={{ width: 104, height: 104, borderRadius: 52, backgroundColor: '#F4EEE8' }}
              />
            ) : (
              <View
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: 52,
                  backgroundColor: BROWN,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 40, fontWeight: '700', color: '#fff' }}>{USER.name.charAt(0)}</Text>
              </View>
            )}
            <Text style={{ fontSize: 14, fontWeight: '700', color: INK, marginTop: 12 }}>{USER.name}</Text>
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>{USER.role}</Text>
          </View>

          {/* Account Information */}
          <SectionTitle title="Account Information" />
          {INFO.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value} />
          ))}

          {/* Account Setting */}
          <SectionTitle title="Account Setting" />
          {SETTINGS.map((row) => (
            <ActionRow key={row.key} label={row.label} icon={row.icon} />
          ))}

          {/* Audit & Activity */}
          <SectionTitle title="Audit & Activity" />
          {AUDIT.map((row) => (
            <ActionRow key={row.key} label={row.label} icon={row.icon} />
          ))}

          {/* Logout */}
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={{
              height: 44,
              borderRadius: 22,
              backgroundColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 18,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Logout</Text>
          </Pressable>
        </View>
      </ScrollView>

      <BottomTabBar active="Profile" />
    </View>
  );
}