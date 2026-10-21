import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import BottomTabBar from '../components/BottomTabBar';
import Text from '../components/AppText';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = '#BF824F';
const BROWN_LIGHT = '#E3AB7C';
const GREEN = '#00AD28';
const RED = '#E5484D';
const INK = '#1F1B16';
const MUTED = '#BF824F';
const BG = '#FFF8F1';
const DESC = '#666666';

// Replace with API data.
// growth > 0 shows green ↗, growth < 0 shows red ↘. progress is a percentage (0-100).
// status is 'active' or 'attention'.
const BRANCHES = [
  { id: 1, name: 'Dubai Enfiled Royal Clinic', city: 'Dubai', bookings: 109, growth: 32.2, progress: 81.3, status: 'active' },
  { id: 2, name: 'Dubai Enfiled Royal Clinic', city: 'Dubai', bookings: 109, growth: 32.2, progress: 81.3, status: 'active' },
  { id: 3, name: 'Dubai Enfiled Royal Clinic', city: 'Dubai', bookings: 109, growth: 32.2, progress: 81.3, status: 'active' },
  { id: 4, name: 'Dubai Enfiled Royal Clinic', city: 'Dubai', bookings: 109, growth: 32.2, progress: 81.3, status: 'active' },
  { id: 5, name: 'Dubai Enfiled Royal Clinic', city: 'Dubai', bookings: 109, growth: 32.2, progress: 81.3, status: 'attention' },
];

const pad2 = (n) => String(n).padStart(2, '0');

/* ---------- Gradient fill helper ---------- */
function GradientFill({ id, x2 = '1', y2 = '1', height = '100%' }) {
  return (
    <Svg width="100%" height={height} style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
          <Stop offset="0" stopColor={BROWN} />
          <Stop offset="1" stopColor={BROWN_LIGHT} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

/* ---------- Stat card ---------- */
function StatCard({ id, label, value, sub }) {
  return (
    <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', minHeight: s(78) }}>
      <GradientFill id={`stat-${id}`} />
      <View style={{ flex: 1, padding: s(10), justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: fs(11), fontWeight: '600', color: '#fff' }} numberOfLines={1}>
            {label}
          </Text>
          <Ionicons name="business-outline" size={s(12)} color="#F8E7D6" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: s(6) }}>
          <Text style={{ fontSize: fs(20), fontWeight: '700', color: '#fff' }}>{value}</Text>
          <Text style={{ fontSize: fs(8, 8), color: '#F8E7D6', marginLeft: 4, marginBottom: 3 }}>Clinics</Text>
        </View>

        <Text style={{ fontSize: fs(8, 8), color: '#F8E7D6', marginTop: s(4) }} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

/* ---------- Branch card ---------- */
function BranchCard({ item }) {
  const up = item.growth >= 0;
  const tone = up ? GREEN : RED;
  const toneBg = up ? '#E6F7EA' : '#FCE8E9';
  const pct = Math.max(0, Math.min(100, item.progress));
  const imgW = s(78);
  const imgH = s(84);

  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: s(8),
        marginBottom: s(12),
        flexDirection: 'row',
      }}
    >
      <Image
        source={require('../../assets/brachtabimage.png')}
        contentFit="cover"
        style={{ width: imgW, height: imgH, borderRadius: 10, backgroundColor: '#F4EEE8' }}
      />

      <View style={{ flex: 1, marginLeft: s(10), paddingVertical: 2 }}>
        {/* Name + growth pill */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1, fontSize: fs(12), fontWeight: '700', color: INK }} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: toneBg,
              borderRadius: 10,
              paddingHorizontal: s(7),
              height: s(18),
              marginLeft: 6,
            }}
          >
            <Text style={{ fontSize: fs(8, 8), fontWeight: '600', color: tone, marginRight: 3 }}>
              {Math.abs(item.growth).toFixed(1)}%
            </Text>
            <Ionicons name={up ? 'trending-up' : 'trending-down'} size={s(9)} color={tone} />
          </View>
        </View>

        {/* City */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <Ionicons name="location-outline" size={s(10)} color={DESC} />
          <Text style={{ fontSize: fs(9), color: DESC, marginLeft: 3 }} numberOfLines={1}>
            {item.city}
          </Text>
        </View>

        {/* Bookings + progress */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: s(8) }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: BROWN }}>{item.bookings}</Text>
            <Text style={{ fontSize: fs(8, 8), color: DESC, marginLeft: 5 }}>( This Month Bookings )</Text>
          </View>

          <View style={{ width: s(70), alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fs(8, 8), color: DESC, marginBottom: 3 }}>{pct}%</Text>
            <View
              style={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                backgroundColor: '#F1E7DD',
                overflow: 'hidden',
              }}
            >
              <View style={{ width: `${pct}%`, height: 4 }}>
                <GradientFill id={`bar-${item.id}`} x2="1" y2="0" height="4" />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Screen ---------- */
// Pass `branches` from your API; demo data is the fallback.
export default function BranchesTabScreen({ branches = BRANCHES }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const [query, setQuery] = useState('');

  const total = branches.length;
  const active = branches.filter((b) => b.status === 'active').length;
  const attention = branches.filter((b) => b.status === 'attention').length;

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return branches
      .filter((b) => !q || `${b.name} ${b.city}`.toLowerCase().includes(q))
      .sort((a, b) => b.bookings - a.bookings);
  }, [branches, query]);

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={() => navigation.navigate('Home')}
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
              style={{ flex: 1, marginLeft: s(12), fontSize: fs(16), fontWeight: '700', color: INK }}
              numberOfLines={1}
            >
              Branches
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

          {/* Search */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: Math.max(44, s(46)),
              borderRadius: 30,
              backgroundColor: '#fff',
              paddingLeft: s(18),
              paddingRight: s(14),
              marginTop: s(18),
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search Here"
              placeholderTextColor={DESC}
              maxFontSizeMultiplier={1.2}
              style={{ flex: 1, fontSize: fs(12), color: INK, paddingVertical: 0 }}
            />
            <Ionicons name="search" size={s(18)} color={DESC} />
          </View>

          {/* Stat cards */}
          <View style={{ flexDirection: 'row', marginTop: s(16) }}>
            <StatCard id="total" label="Total" value={pad2(total)} sub="100% Assigned" />
            <View style={{ width: s(10) }} />
            <StatCard id="active" label="Active" value={pad2(active)} sub="100% Assigned" />
            <View style={{ width: s(10) }} />
            <StatCard id="attention" label="Attention" value={pad2(attention)} sub="100% Assigned" />
          </View>

          {/* Rank Ledger By */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: s(22),
              marginBottom: s(10),
            }}
          >
            <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: INK }}>Rank Ledger By</Text>
            <Pressable hitSlop={10}>
              <Text style={{ fontSize: fs(10), color: MUTED }}>See All</Text>
            </Pressable>
          </View>

          {/* Branch list */}
          {list.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(30) }}>
              <Ionicons name="business-outline" size={s(28)} color={MUTED} />
              <Text style={{ fontSize: fs(11), color: DESC, marginTop: 8 }}>No branches found</Text>
            </View>
          ) : (
            list.map((item) => <BranchCard key={item.id} item={item} />)
          )}
        </View>
      </ScrollView>

      <BottomTabBar active="Branches" />
    </View>
  );
}