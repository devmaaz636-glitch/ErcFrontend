import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Path, Line, G, Circle, Text as SvgText } from 'react-native-svg';
import BottomTabBar from '../components/BottomTabBar';

const BROWN = '#BF824F';
const GREEN = '#00AD28';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';

const ATTENTION = [
  {
    id: 1,
    title: 'Refund Spike Detected',
    time: '5 hr ago',
    body: 'Refunds in 18 hours have risen sharply, which is significantly 24% higher than the normal pace, indicating an unusual increase in refund transactions that may require review.',
  },
  {
    id: 2,
    title: 'Booking Drop Detected',
    time: '5 hr ago',
    body: 'Bookings in 18 hours have fallen sharply, which is significantly 24% lower than the normal pace, indicating an unusual decrease in bookings that may require review.',
  },
  {
    id: 3,
    title: '3 Approvals Pending',
    time: '5 hr ago',
    body: 'Refund requests above the branch limit are waiting for your approval, which is significantly 24% higher than the normal pace and may require review.',
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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const CHART_POINTS = [0.55, 0.42, 0.7, 0.5, 0.78, 0.6, 0.85]; // static demo data (0-1)

/* ---------- Chart ---------- */
function RevenueChart({ width }) {
  const height = 150;
  const padL = 34;
  const padB = 22;
  const padT = 8;
  const innerW = width - padL - 8;
  const innerH = height - padB - padT;

  const pts = CHART_POINTS.map((v, i) => ({
    x: padL + (innerW / (CHART_POINTS.length - 1)) * i,
    y: padT + innerH * (1 - v),
  }));

  let line = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const midX = (pts[i - 1].x + pts[i].x) / 2;
    line += ` C ${midX} ${pts[i - 1].y}, ${midX} ${pts[i].y}, ${pts[i].x} ${pts[i].y}`;
  }
  const area = `${line} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`;
  const yLabels = ['100K', '75K', '50K', '25K', '0'];

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={BROWN} stopOpacity="0.85" />
          <Stop offset="1" stopColor={BROWN} stopOpacity="0.1" />
        </LinearGradient>
      </Defs>

      {yLabels.map((label, i) => {
        const y = padT + (innerH / (yLabels.length - 1)) * i;
        return (
          <G key={label}>
            <Line x1={padL} x2={width - 8} y1={y} y2={y} stroke="#EFE6DC" strokeWidth={1} />
            <SvgText x={padL - 6} y={y + 3} fontSize={8} fill={MUTED} textAnchor="end">
              {label}
            </SvgText>
          </G>
        );
      })}

      <Path d={area} fill="url(#area)" />
      <Path d={line} stroke={BROWN} strokeWidth={1.5} fill="none" />

      {DAYS.map((d, i) => (
        <SvgText key={d} x={pts[i].x} y={height - 6} fontSize={8} fill={MUTED} textAnchor="middle">
          {d}
        </SvgText>
      ))}
    </Svg>
  );
}

/* ---------- Small pieces ---------- */
function SectionHeader({ title }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
      <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: INK }}>{title}</Text>
      <Text style={{ fontSize: 11, color: MUTED }}>See All</Text>
    </View>
  );
}

function AttentionCard({ item }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: 'row' }}>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: BROWN,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Ionicons name="alert-circle-outline" size={18} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: INK }}>{item.title}</Text>
          <Text style={{ fontSize: 9, color: MUTED }}>{item.time}</Text>
        </View>
        <Text style={{ fontSize: 9, lineHeight: 13, color: MUTED, marginTop: 4 }}>{item.body}</Text>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <Pressable
            style={{
              backgroundColor: BROWN,
              paddingHorizontal: 14,
              height: 22,
              borderRadius: 11,
              justifyContent: 'center',
              marginRight: 8,
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '600', color: '#fff' }}>Investigate</Text>
          </Pressable>
          <Pressable
            style={{
              backgroundColor: '#F4EEE8',
              paddingHorizontal: 14,
              height: 22,
              borderRadius: 11,
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: '600', color: INK }}>Decline</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BranchRow({ item, rank }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: BROWN,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{rank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: INK }}>{item.name}</Text>
          <Text style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{item.sub}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: GREEN }}>{item.amount}</Text>
          <Text style={{ fontSize: 9, color: GREEN, marginTop: 2 }}>{item.change}</Text>
        </View>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: '#F1E7DD', marginTop: 10 }}>
        <View style={{ width: `${item.progress * 100}%`, height: 5, borderRadius: 3, backgroundColor: BROWN }} />
      </View>
    </View>
  );
}

function ScoreRing({ value, size = 34 }) {
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
      <Text style={{ fontSize: 8, fontWeight: '700', color: INK }}>{value}%</Text>
    </View>
  );
}

function DoctorRow({ item }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 14,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Image
        source={require('../../assets/doctor.png')}
        contentFit="cover"
        contentPosition="top"
        style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#F4EEE8' }}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: INK }}>{item.name}</Text>
        <Text style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>
          {item.specialty} • {item.consults} Consults
        </Text>
      </View>
      <ScoreRing value={item.score} />
      <Ionicons name="chevron-forward" size={16} color={MUTED} style={{ marginLeft: 10 }} />
    </View>
  );
}

/* ---------- Screen ---------- */
export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width, 480) - 40;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: BROWN,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>A</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: INK }}>Hi, Ahsan 👋</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={11} color={BROWN} />
                <Text style={{ fontSize: 11, color: MUTED, marginLeft: 2 }}>USA</Text>
              </View>
            </View>
            <Pressable style={{ padding: 6 }}>
              <Ionicons name="notifications-outline" size={22} color={MUTED} />
            </Pressable>
          </View>

          {/* Search */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 46,
              borderRadius: 23,
              backgroundColor: '#fff',
              paddingLeft: 18,
              paddingRight: 6,
              marginTop: 18,
            }}
          >
            <TextInput
              placeholder="Search Here"
              placeholderTextColor={MUTED}
              style={{ flex: 1, fontSize: 12, color: INK }}
            />
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: '#F4EEE8',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="search" size={16} color={BROWN} />
            </View>
          </View>

          {/* Regional Overview */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: INK }}>Regional Overview</Text>
            <Text style={{ fontSize: 10, color: MUTED, marginRight: 4 }}>USA: Houston</Text>
            <Ionicons name="chevron-down" size={12} color={MUTED} />
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: INK }}>$95,000</Text>
            <Text style={{ fontSize: 9, color: MUTED, marginTop: 2, marginBottom: 8 }}>
              Today's Revenue of 2 Jul Booth Bookings
            </Text>
            <RevenueChart width={contentWidth - 28} />
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