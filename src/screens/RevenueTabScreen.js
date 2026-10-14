import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { G, Rect, Line, Text as SvgText } from 'react-native-svg';
import BottomTabBar from '../components/BottomTabBar';

const BROWN = '#BF824F';
const BROWN_LIGHT = '#E8C9AA';
const GREEN = '#00AD28';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// static demo data, in thousands
const ACTUAL = [128, 48, 75, 118, 82, 135, 45, 112, 118, 98, 105, 85];
const TARGET = [98, 30, 38, 65, 38, 60, 40, 98, 105, 90, 58, 40];
const Y_LABELS = [140, 120, 100, 80, 60, 40, 20];

const REGIONAL = [1, 2, 3, 3, 1].map((rank, i) => ({
  id: i + 1,
  rank,
  name: 'Dubai Enfiled Royal Clinic',
  sub: 'Sheek zahid Rd',
  amount: '$80,928',
  quota: '88% of Quota',
  progress: 0.9,
}));

/* ---------- Bar chart ---------- */
function RevenueBars({ width }) {
  const height = 170;
  const padL = 34;
  const padB = 20;
  const padT = 6;
  const innerW = width - padL - 4;
  const innerH = height - padB - padT;
  const max = 140;
  const min = 20;
  const slot = innerW / MONTHS.length;
  const barW = Math.min(4, slot / 3);

  const yFor = (v) => padT + innerH * (1 - (v - min) / (max - min));

  return (
    <Svg width={width} height={height}>
      {Y_LABELS.map((label) => (
        <G key={label}>
          <Line
            x1={padL}
            x2={width - 4}
            y1={yFor(label)}
            y2={yFor(label)}
            stroke="#F1E7DD"
            strokeWidth={0.8}
          />
          <SvgText x={padL - 6} y={yFor(label) + 3} fontSize={7} fill={MUTED} textAnchor="end">
            {`$${label}K`}
          </SvgText>
        </G>
      ))}

      {MONTHS.map((m, i) => {
        const cx = padL + slot * i + slot / 2;
        const base = yFor(min);
        const aY = yFor(ACTUAL[i]);
        const tY = yFor(TARGET[i]);
        return (
          <G key={m}>
            <Rect x={cx - barW - 1} y={aY} width={barW} height={base - aY} rx={barW / 2} fill={BROWN} />
            <Rect x={cx + 1} y={tY} width={barW} height={base - tY} rx={barW / 2} fill={BROWN_LIGHT} />
            <SvgText x={cx} y={height - 6} fontSize={7} fill={MUTED} textAnchor="middle">
              {m}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

/* ---------- Region row ---------- */
function RegionRow({ item }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 }}>
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
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{item.rank}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: INK }}>{item.name}</Text>
          <Text style={{ fontSize: 8, color: MUTED, marginTop: 2 }}>{item.sub}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: BROWN }}>{item.amount}</Text>
          <Text style={{ fontSize: 8, color: GREEN, marginTop: 2 }}>{item.quota}</Text>
        </View>
      </View>
      <View style={{ height: 5, borderRadius: 3, backgroundColor: '#F1E7DD', marginTop: 12 }}>
        <View style={{ width: `${item.progress * 100}%`, height: 5, borderRadius: 3, backgroundColor: BROWN }} />
      </View>
    </View>
  );
}

/* ---------- Screen ---------- */
export default function RevenueTabScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const contentWidth = Math.min(width, 480) - 40;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
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
              <Ionicons name="chevron-back" size={18} color={INK} />
            </Pressable>
            <Text style={{ marginLeft: 12, fontSize: 15, fontWeight: '600', color: INK }}>Revenue Snapshots</Text>
          </View>

          {/* Revenue Overview */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: INK }}>Revenue Overview</Text>
            <Pressable
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: 14,
                paddingHorizontal: 12,
                height: 26,
              }}
            >
              <Text style={{ fontSize: 10, color: INK, marginRight: 6 }}>2026</Text>
              <Ionicons name="chevron-down" size={11} color={MUTED} />
            </Pressable>
          </View>

          <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, fontSize: 20, fontWeight: '700', color: INK }}>$95,000</Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#E6F7EA',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  height: 20,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '600', color: GREEN, marginRight: 3 }}>32.2%</Text>
                <Ionicons name="trending-up" size={10} color={GREEN} />
              </View>
            </View>
            <Text style={{ fontSize: 8, color: MUTED, marginTop: 2, marginBottom: 10 }}>
              Here Is Report Of This Month Revenue
            </Text>
            <RevenueBars width={contentWidth - 28} />
          </View>

          {/* Regional Revenue */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 10 }}>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: INK }}>Regional Revenue</Text>
            <Text style={{ fontSize: 11, color: BROWN }}>See All</Text>
          </View>
          {REGIONAL.map((item) => (
            <RegionRow key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      <BottomTabBar active="Revenue" />
    </View>
  );
}