import { Fragment, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Text from '../components/AppText';
import { IconCircleButton, SearchField, StatusBadge } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { useSession } from '../context/SessionContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

function GradientFill({ id }) {
  return (
    <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
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
      <GradientFill id={`mgr-stat-${id}`} />
      <View style={{ flex: 1, padding: s(10), justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: fs(11), fontWeight: '600', color: colors.white }} numberOfLines={1}>
            {label}
          </Text>
          <Ionicons name="people-outline" size={s(12)} color={colors.brandMuted} />
        </View>
        <Text style={{ fontSize: fs(20), fontWeight: '700', color: colors.white, marginTop: s(6) }}>
          {value}
        </Text>
        <Text style={{ fontSize: fs(8, 8), color: colors.brandMuted, marginTop: s(4) }} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </View>
  );
}

function ManagerCard({ item, onPress }) {
  const clinicName = item.clinic?.name || 'Unassigned';
  const location = [item.clinic?.city, item.clinic?.region].filter(Boolean).join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: s(14),
        marginBottom: s(12),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: s(44),
            height: s(44),
            borderRadius: s(22),
            backgroundColor: colors.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: s(12),
          }}
        >
          <Ionicons name="person" size={s(20)} color={colors.brand} />
        </View>
        <View style={{ flex: 1, marginRight: s(8) }}>
          <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 2 }} numberOfLines={1}>
            {item.employeeId} · {clinicName}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(12) }}>
        <Ionicons name="location-outline" size={s(11)} color={colors.desc} />
        <Text style={{ flex: 1, fontSize: fs(9), color: colors.desc, marginLeft: 4 }} numberOfLines={1}>
          {location || '—'}
        </Text>
        <Text style={{ fontSize: fs(9), color: colors.brand, fontWeight: '600' }}>
          {item.appointmentsToday ?? 0} today
        </Text>
      </View>
    </Pressable>
  );
}

export default function ClinicManagersScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { displayRegion } = useSession();
  const { managers, error, refresh } = useClinicData();
  const [query, setQuery] = useState('');

  useRefreshOnFocus(refresh);

  const cards = managers.stats?.cards || [];
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (managers.items || []).filter((m) => {
      if (!q) return true;
      const hay = `${m.name} ${m.email} ${m.employeeId} ${m.clinic?.name || ''} ${m.clinic?.city || ''}`;
      return hay.toLowerCase().includes(q);
    });
  }, [managers.items, query]);

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
            <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}>Clinic Managers</Text>
              <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 1 }}>
                {displayRegion || 'All Regions'} · Regional Admin
              </Text>
            </View>
            <IconCircleButton
              name="notifications-outline"
              color={colors.brand}
              accessibilityLabel="Notifications"
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          <View style={{ marginTop: s(18) }}>
            <SearchField value={query} onChangeText={setQuery} />
          </View>

          {error ? (
            <Text style={{ fontSize: fs(11), color: colors.danger, marginTop: s(16), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          <View style={{ flexDirection: 'row', marginTop: s(16) }}>
            {cards.map((card, index) => (
              <Fragment key={card.id}>
                {index > 0 ? <View style={{ width: s(10) }} /> : null}
                <StatCard id={card.id} label={card.label} value={card.value} sub={card.sub} />
              </Fragment>
            ))}
          </View>

          <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink, marginTop: s(22) }}>
            Manager Directory
          </Text>

          <View style={{ marginTop: s(12) }}>
            {list.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: s(30) }}>
                <Ionicons name="people-outline" size={s(28)} color={colors.muted} />
                <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>No managers found</Text>
              </View>
            ) : (
              list.map((item) => (
                <ManagerCard
                  key={item.id}
                  item={item}
                  onPress={() => navigation.navigate('ClinicManagerDetail', { managerId: item.id, manager: item })}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

    </View>
  );
}
