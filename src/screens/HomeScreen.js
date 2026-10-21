import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import BottomTabBar from '../components/BottomTabBar';
import Text from '../components/AppText';
import UserAvatar from '../components/UserAvatar';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = '#BF824F';
const BROWN_LIGHT = '#E3AB7C';
const GREEN = '#00AD28';
const INK = '#1F1B16';
const MUTED = '#BF824F';
const BG = '#FFF8F1';
const DESC = '#666666';

// Replace with your logged-in user (context / store / API response).
// photoUrl is the user's own image; when empty, assets/userprofile.png is shown.
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
  { id: 1, name: 'Dubai Enfiled Royal Clinic', address: 'Sheiak zahid Rd', value: 109, quota: 88, progress: 0.95 },
  { id: 2, name: 'Dubai Enfiled Royal Clinic', address: 'Sheiak zahid Rd', value: 90, quota: 88, progress: 0.9 },
  { id: 3, name: 'Dubai Enfiled Royal Clinic', address: 'Sheiak zahid Rd', value: 70, quota: 88, progress: 0.88 },
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
function SectionHeader({ title, large }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(22), marginBottom: s(10) }}>
      <Text style={{ flex: 1, fontSize: fs(large ? 18 : 16), fontWeight: '700', color: INK }}>{title}</Text>
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
  const rankGrad = `rank-${item.id}`;
  const barGrad = `bar-${item.id}`;
  const rankSize = s(24);

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(14),
        marginBottom: s(14),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Rank badge */}
        <View
          style={{
            width: rankSize,
            height: rankSize,
            borderRadius: rankSize / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: s(12),
          }}
        >
          <Svg width={rankSize} height={rankSize} style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id={rankGrad} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={BROWN} />
                <Stop offset="1" stopColor={BROWN_LIGHT} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={rankSize} height={rankSize} fill={`url(#${rankGrad})`} />
          </Svg>
          <Text style={{ fontSize: fs(11), fontWeight: '700', color: '#fff' }}>{rank}</Text>
        </View>

        {/* Name + address */}
        <View style={{ flex: 1, marginRight: s(8) }}>
          <Text style={{ fontSize: fs(13), fontWeight: '700', color: INK }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontSize: fs(10), color: DESC, marginTop: 2 }} numberOfLines={1}>
            {item.address}
          </Text>
        </View>

        {/* Value + quota */}
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: fs(14), fontWeight: '700', color: BROWN }}>{item.value}</Text>
          <Text style={{ fontSize: fs(7, 7), color: GREEN, marginTop: 2 }}>{item.quota}% of Quota</Text>
        </View>
      </View>

      {/* Progress bar */}
      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: '#F3EBE3',
          marginTop: s(10),
          overflow: 'hidden',
        }}
      >
        <View style={{ width: `${item.progress * 100}%`, height: 6 }}>
          <Svg width="100%" height="6">
            <Defs>
              <LinearGradient id={barGrad} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={BROWN} />
                <Stop offset="1" stopColor={BROWN_LIGHT} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="6" fill={`url(#${barGrad})`} />
          </Svg>
        </View>
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
  const topPad = useTopPadding(24);
  const user = DEFAULT_USER; // TODO: replace with your logged-in user

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topPad,
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
          <SectionHeader title="Branch Leaderboard" large />
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