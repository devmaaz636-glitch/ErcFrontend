import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, SearchField, StatusBadge, SkeletonRow, SkeletonStatGrid } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { roleLabel } from '../context/SessionContext';
import { useNotifications } from '../context/NotificationsContext';
import { useSession } from '../context/SessionContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'canceled', label: 'Canceled' },
];

const LIST_STATUS = {
  upcoming: { label: 'Confirmed', color: colors.success, bg: colors.successBg },
  completed: { label: 'Completed', color: colors.brand, bg: colors.warningBg },
  canceled: { label: 'Canceled', color: colors.danger, bg: colors.dangerBg },
};

function StatCard({ item }) {
  const up = item.change >= 0;
  const tone = up ? colors.success : colors.danger;
  const toneBg = up ? colors.successBg : colors.dangerBg;
  const iconSize = s(30);

  return (
    <View
      style={{
        width: '48%',
        backgroundColor: colors.card,
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
            borderColor: colors.brand,
            backgroundColor: colors.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={item.icon} size={s(15)} color={colors.brand} />
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: toneBg,
            borderRadius: 10,
            paddingHorizontal: s(8),
            height: s(20),
          }}
        >
          <Text style={{ fontSize: fs(8, 8), fontWeight: '600', color: tone, marginRight: 3 }}>
            {Math.abs(Number(item.change) || 0).toFixed(1)}%
          </Text>
          <Ionicons name={up ? 'trending-up' : 'trending-down'} size={s(10)} color={tone} />
        </View>
      </View>

      <Text style={{ fontSize: fs(22), fontWeight: '700', color: colors.ink, marginTop: s(12) }}>
        {item.value}
      </Text>
      <Text style={{ fontSize: fs(10), color: colors.desc, marginTop: 2 }} numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}

function FilterTabs({ active, onChange }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 24,
        padding: 4,
        marginTop: s(14),
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              height: s(32),
              borderRadius: 20,
              backgroundColor: isActive ? colors.brand : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: fs(10),
                fontWeight: '600',
                color: isActive ? colors.white : colors.desc,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AppointmentCard({ item, onPress }) {
  const st = LIST_STATUS[item.status] || LIST_STATUS.upcoming;
  const patient = item.patient || 'Appointment';
  const code = item.code || 'Appointment details';
  const treatment = item.treatment || 'Clinic visit';
  const time = item.time || 'Time not available';
  const doctor = item.doctor || 'Doctor not assigned';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: colors.card,
        marginBottom: s(12),
      }}
    >
      <View style={{ padding: s(14) }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: s(8) }}>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
              {patient}
            </Text>
            <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 2 }} numberOfLines={1}>
              {code}
            </Text>
          </View>
          <StatusBadge
            status={item.status}
            label={st.label}
            color={st.color}
            bg={st.bg}
          />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(10) }}>
          <Text style={{ flex: 1, fontSize: fs(10), color: colors.ink }} numberOfLines={1}>
            {treatment}
          </Text>
          <Ionicons name="time-outline" size={s(11)} color={colors.desc} />
          <Text style={{ fontSize: fs(9), color: colors.desc, marginLeft: 4 }}>{time}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(6) }}>
          <Ionicons name="person-outline" size={s(11)} color={colors.desc} />
          <Text style={{ fontSize: fs(9), color: colors.desc, marginLeft: 4 }} numberOfLines={1}>
            {doctor}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function AppointmentsTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { displayRegion, user } = useSession();
  const { appointments, dashboard, error, refresh, loadedOnce } = useClinicData();
  const { unreadCount } = useNotifications();
  const [tab, setTab] = useState('upcoming');
  const [query, setQuery] = useState('');

  useRefreshOnFocus(refresh);

  const stats = appointments.stats || [];
  const showSkeleton = !loadedOnce && stats.length === 0;
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (appointments.items || []).filter(
      (a) =>
        a.status === tab &&
        (!q ||
          a.patient?.toLowerCase().includes(q) ||
          a.doctor?.toLowerCase().includes(q) ||
          a.treatment?.toLowerCase().includes(q) ||
          a.code?.toLowerCase().includes(q))
    );
  }, [appointments.items, tab, query]);

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
            <View style={{ flex: 1, alignItems: 'flex-start', marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                Appointments
              </Text>
              <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 1 }} numberOfLines={1}>
                {user.role === 'clinic_manager'
                  ? `${dashboard?.clinic?.name || 'Assigned clinic'} · ${roleLabel(user.role)}`
                  : `${displayRegion || 'Region'} · ${roleLabel(user.role)}`}
              </Text>
            </View>
            <IconCircleButton
              name="notifications-outline"
              color={colors.mutedBrand}
              accessibilityLabel="Notifications"
              badgeCount={unreadCount}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          {error ? (
            <Text style={{ fontSize: fs(11), color: colors.danger, marginTop: s(12), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          {showSkeleton ? (
            <>
              <SkeletonStatGrid count={4} />
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink, marginTop: s(10) }}>
                Appointment List
              </Text>
              <SkeletonRow lines={2} style={{ marginTop: s(16) }} />
              <SkeletonRow lines={2} />
              <SkeletonRow lines={2} />
            </>
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  marginTop: s(20),
                }}
              >
                {stats.map((item) => (
                  <StatCard key={item.id} item={item} />
                ))}
              </View>

              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink, marginTop: s(10) }}>
                Appointment List
              </Text>

              <View style={{ marginTop: s(12) }}>
                <SearchField value={query} onChangeText={setQuery} />
              </View>

              <FilterTabs active={tab} onChange={setTab} />

              <View style={{ width: '100%', marginTop: s(16) }}>
                {list.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: s(30) }}>
                    <Ionicons name="calendar-outline" size={s(28)} color={colors.muted} />
                    <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>No appointments found</Text>
                  </View>
                ) : (
                  list.map((item) => (
                    <AppointmentCard
                      key={item.id}
                      item={item}
                      onPress={() =>
                        navigation.navigate('AppointmentDetail', {
                          appointment: item,
                          appointmentId: item.id,
                        })
                      }
                    />
                  ))
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

    </View>
  );
}
