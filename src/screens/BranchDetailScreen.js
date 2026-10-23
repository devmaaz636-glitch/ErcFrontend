import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { clinicErrorMessage, fetchBranch } from '../lib/clinic';
import { colors } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = colors.brand;
const GREEN = colors.success;
const RED = colors.danger;
const ORANGE = colors.warning;
const INK = colors.ink;
const MUTED = colors.mutedBrand;
const BG = colors.background;
const DESC = colors.desc;
const CARD = colors.card;

function buildDetail(branch = {}) {
  const capacity = Math.round(Number(branch.capacity ?? branch.progress) || 0);
  const nearLimit = capacity >= 75;

  return {
    id: branch.id,
    name: branch.name || 'Branch',
    city: branch.city || '',
    region: branch.region || '',
    stats: branch.stats || [],
    bookingsToday: branch.bookingsToday ?? Math.min(Number(branch.bookings) || 0, 99),
    capacity,
    capacityNote:
      branch.capacityNote ||
      'Capacity should use the ERC-defined measure, such as available appointment slots.',
    thresholds: branch.thresholds || [
      {
        id: 'capacity',
        icon: 'trending-up-outline',
        title: 'Capacity Threshold',
        status: nearLimit ? 'Near Limit' : 'Normal',
        tone: nearLimit ? 'warn' : 'ok',
        body: nearLimit
          ? 'Branch utilisation is approaching its configured capacity limit.'
          : 'Branch utilisation is within the configured capacity limit.',
      },
    ],
    alerts: branch.alerts || [],
  };
}

function TrendPill({ change }) {
  const up = change >= 0;
  const tone = up ? GREEN : RED;
  const toneBg = up ? '#E6F7EA' : '#FCE8E9';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: toneBg,
        borderRadius: 10,
        paddingHorizontal: s(7),
        height: s(20),
      }}
    >
      <Text style={{ fontSize: fs(8, 8), fontWeight: '600', color: tone, marginRight: 3 }}>
        {Math.abs(change).toFixed(1)}%
      </Text>
      <Ionicons name={up ? 'trending-up' : 'trending-down'} size={s(10)} color={tone} />
    </View>
  );
}

function StatCard({ item }) {
  const iconSize = s(30);
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: CARD,
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(12),
        marginBottom: s(12),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            borderWidth: 1.5,
            borderColor: BROWN,
            backgroundColor: '#FBEFE3',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={item.icon} size={s(15)} color={BROWN} />
        </View>
        <TrendPill change={item.change} />
      </View>
      <Text style={{ fontSize: fs(22), fontWeight: '700', color: INK, marginTop: s(12) }}>
        {item.value}
      </Text>
      <Text style={{ fontSize: fs(10), color: DESC, marginTop: 2 }} numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}

function statusStyle(tone) {
  if (tone === 'ok') return { color: GREEN, bg: '#E6F7EA' };
  if (tone === 'ack') return { color: BROWN, bg: '#F8EDE2' };
  return { color: ORANGE, bg: '#FBEFE3' };
}

function ThresholdRow({ item }) {
  const badge = statusStyle(item.tone);
  return (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 14,
        padding: s(12),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: s(34),
          height: s(34),
          borderRadius: s(17),
          backgroundColor: '#FBEFE3',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(10),
        }}
      >
        <Ionicons name={item.icon} size={s(16)} color={BROWN} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: fs(13), fontWeight: '700', color: INK }} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={{
              backgroundColor: badge.bg,
              borderRadius: 10,
              paddingHorizontal: s(8),
              height: s(20),
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fs(9), fontWeight: '600', color: badge.color }}>{item.status}</Text>
          </View>
        </View>
        <Text style={{ fontSize: fs(10), color: DESC, marginTop: 4, lineHeight: 15 }}>{item.body}</Text>
      </View>
    </View>
  );
}

function AlertRow({ item }) {
  const badge = statusStyle(item.tone);
  return (
    <Pressable
      style={{
        backgroundColor: CARD,
        borderRadius: 14,
        padding: s(12),
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
          backgroundColor: '#FBEFE3',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(10),
        }}
      >
        <Ionicons name={item.icon} size={s(16)} color={BROWN} />
      </View>
      <View style={{ flex: 1, marginRight: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: fs(13), fontWeight: '700', color: INK }} numberOfLines={1}>
            {item.title}
          </Text>
          <View
            style={{
              backgroundColor: badge.bg,
              borderRadius: 10,
              paddingHorizontal: s(8),
              height: s(20),
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fs(9), fontWeight: '600', color: badge.color }}>{item.status}</Text>
          </View>
        </View>
        <Text style={{ fontSize: fs(10), color: DESC, marginTop: 4, lineHeight: 15 }}>{item.body}</Text>
      </View>
      <Ionicons name="chevron-forward" size={s(16)} color={MUTED} />
    </Pressable>
  );
}

export default function BranchDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const branchId = route.params?.branchId || route.params?.branch?.id;
  const [branch, setBranch] = useState(route.params?.branch || null);
  const [loading, setLoading] = useState(!route.params?.branch?.stats);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!branchId) return undefined;
      let active = true;
      setLoading(true);
      fetchBranch(branchId)
        .then((item) => {
          if (active) {
            setBranch(item);
            setError('');
          }
        })
        .catch((err) => {
          if (active && !route.params?.branch) {
            setError(clinicErrorMessage(err));
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [branchId, route.params?.branch])
  );

  const detail = buildDetail(branch || {});
  const capacity = Math.max(0, Math.min(100, detail.capacity));

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
          {loading && !branch ? <ActivityIndicator color={BROWN} style={{ marginVertical: s(20) }} /> : null}
          {error ? (
            <Text style={{ fontSize: fs(11), color: RED, textAlign: 'center', marginBottom: s(8) }}>{error}</Text>
          ) : null}
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

          {(detail.city || detail.region) && (
            <Text style={{ marginTop: s(10), fontSize: fs(11), color: DESC }} numberOfLines={1}>
              {detail.name}
              {detail.city ? ` · ${detail.city}` : ''}
              {detail.region ? `, ${detail.region}` : ''}
            </Text>
          )}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(16),
            }}
          >
            {detail.stats.map((item) => (
              <StatCard key={item.id} item={item} />
            ))}
          </View>

          <Text style={{ fontSize: fs(16), fontWeight: '700', color: INK, marginTop: s(8) }}>
            Bookings & Capacity
          </Text>
          <View
            style={{
              backgroundColor: CARD,
              borderRadius: 16,
              padding: s(14),
              marginTop: s(10),
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(10), color: DESC }}>Bookings Today</Text>
                <Text style={{ fontSize: fs(22), fontWeight: '700', color: INK, marginTop: 4 }}>
                  {detail.bookingsToday}
                </Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: fs(10), color: DESC }}>Capacity Utilisation</Text>
                <Text style={{ fontSize: fs(22), fontWeight: '700', color: INK, marginTop: 4 }}>
                  {capacity}%
                </Text>
              </View>
            </View>

            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#F1E7DD',
                overflow: 'hidden',
                marginTop: s(14),
              }}
            >
              <View
                style={{
                  width: `${capacity}%`,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: BROWN,
                }}
              />
            </View>

            <Text style={{ fontSize: fs(10), color: ORANGE, marginTop: s(12), lineHeight: 15 }}>
              {detail.capacityNote}
            </Text>
          </View>

          <Text style={{ fontSize: fs(16), fontWeight: '700', color: INK, marginTop: s(22) }}>
            Threshold Status
          </Text>
          <View style={{ marginTop: s(10) }}>
            {detail.thresholds.map((item) => (
              <ThresholdRow key={item.id} item={item} />
            ))}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: s(14),
              marginBottom: s(10),
            }}
          >
            <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: INK }}>Recent Alerts</Text>
            <Pressable hitSlop={10}>
              <Text style={{ fontSize: fs(11), color: MUTED }}>See All</Text>
            </Pressable>
          </View>

          {detail.alerts.map((item) => (
            <AlertRow key={item.id} item={item} />
          ))}

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('BranchesTab')}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(10),
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>Back To Branches</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
