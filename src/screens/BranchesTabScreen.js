import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Text from '../components/AppText';
import { IconCircleButton, SearchField, SkeletonRow } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { useNotifications } from '../context/NotificationsContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const pad2 = (n) => String(n).padStart(2, '0');

function GradientFill({ id, x2 = '1', y2 = '1', height = '100%' }) {
  return (
    <Svg width="100%" height={height} style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2={x2} y2={y2}>
          <Stop offset="0" stopColor={colors.brand} />
          <Stop offset="1" stopColor={colors.brandLight} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  );
}

function StatCard({ id, label, value, sub }) {
  return (
    <View style={{ flex: 1, borderRadius: 14, overflow: 'hidden', minHeight: s(78) }}>
      <GradientFill id={`stat-${id}`} />
      <View style={{ flex: 1, padding: s(10), justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: fs(11), fontWeight: '600', color: colors.white }} numberOfLines={1}>
            {label}
          </Text>
          <Ionicons name="business-outline" size={s(12)} color={colors.brandMuted} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: s(6) }}>
          <Text style={{ fontSize: fs(20), fontWeight: '700', color: colors.white }}>{value}</Text>
          <Text style={{ fontSize: fs(8, 8), color: colors.brandMuted, marginLeft: 4, marginBottom: 3 }}>
            Clinics
          </Text>
        </View>
        <Text style={{ fontSize: fs(8, 8), color: colors.brandMuted, marginTop: s(4) }} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

function BranchCard({ item, onPress }) {
  const up = item.growth >= 0;
  const tone = up ? colors.success : colors.danger;
  const toneBg = up ? colors.successBg : colors.dangerBg;
  const pct = Math.max(0, Math.min(100, item.progress));
  const imgW = s(78);
  const imgH = s(84);

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: s(8),
        marginBottom: s(12),
        flexDirection: 'row',
      }}
    >
      <Image
        source={require('../../assets/brachtabimage.png')}
        contentFit="cover"
        style={{ width: imgW, height: imgH, borderRadius: 10, backgroundColor: colors.fieldAlt }}
      />

      <View style={{ flex: 1, marginLeft: s(10), paddingVertical: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1, fontSize: fs(12), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <Ionicons name="location-outline" size={s(10)} color={colors.desc} />
          <Text style={{ fontSize: fs(9), color: colors.desc, marginLeft: 3 }} numberOfLines={1}>
            {item.city}
            {item.region ? `, ${item.region}` : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: s(8) }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.brand }}>{item.bookings}</Text>
            <Text style={{ fontSize: fs(8, 8), color: colors.desc, marginLeft: 5 }}>( This Month Bookings )</Text>
          </View>

          <View style={{ width: s(70), alignItems: 'flex-end' }}>
            <Text style={{ fontSize: fs(8, 8), color: colors.desc, marginBottom: 3 }}>{pct}%</Text>
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
    </Pressable>
  );
}

export default function BranchesTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { branches, error, refresh, loadedOnce } = useClinicData();
  const { unreadCount } = useNotifications();
  const [query, setQuery] = useState('');

  useRefreshOnFocus(refresh);

  const items = branches.items || [];
  const showSkeleton = !loadedOnce && items.length === 0;
  const total = items.length;
  const active = items.filter((b) => b.status === 'active').length;
  const attention = items.filter((b) => b.status === 'attention').length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...items]
      .filter((b) => !q || `${b.name} ${b.city} ${b.region}`.toLowerCase().includes(q))
      .sort((a, b) => b.bookings - a.bookings);
  }, [items, query]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <Text
              style={{ flex: 1, marginLeft: s(12), fontSize: fs(16), fontWeight: '700', color: colors.ink }}
              numberOfLines={1}
            >
              Branches
            </Text>
            <IconCircleButton
              name="notifications-outline"
              color={colors.brand}
              accessibilityLabel="Notifications"
              badgeCount={unreadCount}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          <View style={{ marginTop: s(18) }}>
            <SearchField value={query} onChangeText={setQuery} showButton={false} />
          </View>

          {error ? (
            <Text style={{ fontSize: fs(11), color: colors.danger, marginTop: s(12), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          {showSkeleton ? (
            <>
              <View style={{ flexDirection: 'row', marginTop: s(16) }}>
                <SkeletonRow lines={1} style={{ flex: 1, marginBottom: 0 }} />
                <View style={{ width: s(10) }} />
                <SkeletonRow lines={1} style={{ flex: 1, marginBottom: 0 }} />
                <View style={{ width: s(10) }} />
                <SkeletonRow lines={1} style={{ flex: 1, marginBottom: 0 }} />
              </View>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink, marginTop: s(22), marginBottom: s(10) }}>
                Rank Ledger By
              </Text>
              <SkeletonRow lines={2} avatar />
              <SkeletonRow lines={2} avatar />
              <SkeletonRow lines={2} avatar />
            </>
          ) : (
            <>
          <View style={{ flexDirection: 'row', marginTop: s(16) }}>
            <StatCard id="total" label="Total" value={pad2(total)} sub="All Regions" />
            <View style={{ width: s(10) }} />
            <StatCard id="active" label="Active" value={pad2(active)} sub={`${pct(active)}% Of Total`} />
            <View style={{ width: s(10) }} />
            <StatCard
              id="attention"
              label="Attention"
              value={pad2(attention)}
              sub={`${pct(attention)}% Of Total`}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: s(22),
              marginBottom: s(10),
            }}
          >
            <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: colors.ink }}>Rank Ledger By</Text>
          </View>

          {list.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(30) }}>
              <Ionicons name="business-outline" size={s(28)} color={colors.muted} />
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>No branches found</Text>
            </View>
          ) : (
            list.map((item) => (
              <BranchCard
                key={item.id}
                item={item}
                onPress={() => navigation.navigate('BranchDetail', { branch: item, branchId: item.id })}
              />
            ))
          )}
            </>
          )}
        </View>
      </ScrollView>

    </View>
  );
}
