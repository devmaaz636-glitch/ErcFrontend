import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import BottomTabBar from '../components/BottomTabBar';
import Text from '../components/AppText';
import UserAvatar from '../components/UserAvatar';
import { scale as s, fs } from '../utils/responsive';

const BROWN = '#BF824F';
const BROWN_LIGHT = '#E3AB7C';
const GREEN = '#00AD28';
const INK = '#1F1B16';
const MUTED = '#BF824F';
const BG = '#FFF8F1';
const DESC = '#666666';


const DEFAULT_USER = { name: 'Ahsan', location: 'USA', photoUrl: null };

const STATS = [
  { id: 'appointments', icon: 'calendar-outline', value: '42', label: "Today's Appointments" },
  { id: 'upcoming', icon: 'time-outline', value: '08', label: 'Upcoming Appointments' },
  { id: 'canceled', icon: 'document-text-outline', value: '09', label: 'Canceled Approvals' },
  { id: 'alerts', icon: 'notifications-outline', value: '03', label: 'Clinic Alerts' },
];

const ATTENTION = [
  {
    id: 1,
    title: 'Refund Spike Detected',
    time: '5 hr ago',
    body: 'Dubai Branch 18 refunds have been requested, which is approximately 3.8× ..',
  },
  {
    id: 2,
    title: 'Booking Drop Detected',
    time: '5 hr ago',
    body: 'Dubai Branch 18 refunds have been requested, which is approximately 3.8× ...',
  },
  {
    id: 3,
    title: '3 Approvals Pending',
    time: '5 hr ago',
    body: 'Dubai Branch 18 refunds have been requested, which is approximately 3.8× ..',
  },
];

const BRANCHES = [
  { id: 1, name: 'Dubai Enfield Royal Clinic', sub: 'Revenue Rank', amount: '$65,028', change: '+8% Today', progress: 0.95 },
  { id: 2, name: 'Dubai Enfield Royal Clinic', sub: 'Revenue Rank', amount: '$60,028', change: '+8% Today', progress: 0.8 },
  { id: 3, name: 'Dubai Enfield Royal Clinic', sub: 'Revenue Rank', amount: '$55,028', change: '+8% Today', progress: 0.65 },
];

const DOCTORS = [
  { id: 1, name: 'Dr Muhammad', specialty: 'Hair Transplant', consults: 42, score: 92 },
  { id: 2, name: 'Dr Muhammad', specialty: 'Hair Transplant', consults: 42, score: 92 },
  { id: 3, name: 'Dr Muhammad', specialty: 'Hair Transplant', consults: 42, score: 92 },
];

/* ---------- Stat cards ---------- */
function StatCard({ item }) {
  const gradId = `grad-${item.id}`;
  return (
    <View
      style={{
        width: '48%',
        minHeight: s(104),
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: s(12),
      }}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={BROWN} />
            <Stop offset="1" stopColor={BROWN_LIGHT} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>

      <View style={{ flex: 1, padding: s(14), justifyContent: 'space-between' }}>
        <Ionicons name={item.icon} size={s(18)} color="#fff" />
        <View style={{ marginTop: s(10) }}>
          <Text style={{ fontSize: fs(22), fontWeight: '700', color: '#fff' }}>{item.value}</Text>
          <Text style={{ fontSize: fs(11), color: '#fff', marginTop: 2 }} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ---------- Small pieces ---------- */
function SectionHeader({ title }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(22), marginBottom: s(10) }}>
      <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: INK }}>{title}</Text>
      <Pressable hitSlop={10}>
        <Text style={{ fontSize: fs(11), color: MUTED }}>See All</Text>
      </Pressable>
    </View>
  );
}

function AttentionCard({ item }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: s(12),
        marginBottom: s(10),
        flexDirection: 'row',
      }}
    >
      <View
        style={{
          width: s(32),
          height: s(32),
          borderRadius: 8,
          backgroundColor: BROWN,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(10),
        }}
      >
        <Ionicons name="alert-circle-outline" size={s(18)} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: fs(12), fontWeight: '700', color: INK }}>{item.title}</Text>
          <Text style={{ fontSize: fs(9), color: MUTED, marginLeft: 6 }}>{item.time}</Text>
        </View>
        <Text style={{ fontSize: fs(9), lineHeight: fs(9) * 1.45, color: DESC, marginTop: 4 }}>
          {item.body}
        </Text>
      </View>
    </View>
  );
}

function BranchRow({ item, rank }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: s(12), marginBottom: s(10) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: s(22),
            height: s(22),
            borderRadius: s(11),
            backgroundColor: BROWN,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: s(10),
          }}
        >
          <Text style={{ fontSize: fs(10), fontWeight: '700', color: '#fff' }}>{rank}</Text>
        </View>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: INK }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontSize: fs(9), color: MUTED, marginTop: 2 }}>{item.sub}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: GREEN }}>{item.amount}</Text>
          <Text style={{ fontSize: fs(9), color: GREEN, marginTop: 2 }}>{item.change}</Text>
        </View>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: '#F1E7DD', marginTop: s(10) }}>
        <View style={{ width: `${item.progress * 100}%`, height: 5, borderRadius: 3, backgroundColor: BROWN }} />
      </View>
    </View>
  );
}

function ScoreRing({ value, size = s(34) }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#DDF3E2" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={GREEN}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: fs(8, 8), fontWeight: '700', color: INK }}>{value}%</Text>
    </View>
  );
}

function DoctorRow({ item }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(14),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Image
        source={require('../../assets/doctor.png')}
        contentFit="cover"
        contentPosition="top"
        style={{ width: s(48), height: s(48), borderRadius: s(24), backgroundColor: '#F4EEE8' }}
      />
      <View style={{ flex: 1, marginLeft: s(12), marginRight: 8 }}>
        <Text style={{ fontSize: fs(14), fontWeight: '600', color: INK }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: fs(9), color: MUTED, marginTop: 3 }} numberOfLines={1}>
          {item.specialty} • {item.consults} Consults
        </Text>
      </View>
      <ScoreRing value={item.score} />
      <Ionicons name="chevron-forward" size={s(16)} color={MUTED} style={{ marginLeft: s(10) }} />
    </View>
  );
}

/* ---------- Screen ---------- */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = DEFAULT_USER; // TODO: replace with your logged-in user

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: s(20),
          paddingBottom: insets.bottom + 110,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <UserAvatar uri={user.photoUrl} size={s(40)} />
            <View style={{ flex: 1, marginLeft: s(10) }}>
              <Text style={{ fontSize: fs(14), fontWeight: '700', color: INK }} numberOfLines={1}>
                Hi, {user.name} 👋
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={s(11)} color={BROWN} />
                <Text style={{ fontSize: fs(11), color: MUTED, marginLeft: 2 }} numberOfLines={1}>
                  {user.location}
                </Text>
              </View>
            </View>
            <Pressable hitSlop={10} style={{ padding: 6 }}>
              <Ionicons name="notifications-outline" size={s(22)} color={MUTED} />
            </Pressable>
          </View>

          {/* Search */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: Math.max(44, s(46)),
              borderRadius: 30,
              backgroundColor: '#fff',
              paddingLeft: s(18),
              paddingRight: 6,
              marginTop: s(18),
            }}
          >
            <TextInput
              placeholder="Search Here"
              placeholderTextColor={MUTED}
              maxFontSizeMultiplier={1.2}
              style={{ flex: 1, fontSize: fs(12), color: INK, paddingVertical: 0 }}
            />
            <View
              style={{
                width: s(34),
                height: s(34),
                borderRadius: s(17),
                backgroundColor: '#F4EEE8',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="search" size={s(16)} color={BROWN} />
            </View>
          </View>

          {/* 4 Stat Cards */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(22),
            }}
          >
            {STATS.map((item) => (
              <StatCard key={item.id} item={item} />
            ))}
          </View>

          {/* Need Attention */}
          <SectionHeader title="Need Attention" />
          {ATTENTION.map((item) => (
            <AttentionCard key={item.id} item={item} />
          ))}

          {/* Branch Leaderboard */}
          <SectionHeader title="Branch Leaderboard" />
          {BRANCHES.map((item, i) => (
            <BranchRow key={item.id} item={item} rank={i + 1} />
          ))}

          {/* Doctors Performance */}
          <SectionHeader title="Doctors Performance" />
          {DOCTORS.map((item) => (
            <DoctorRow key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      <BottomTabBar active="Home" />
    </View>
  );
}