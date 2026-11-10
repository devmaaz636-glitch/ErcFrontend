import { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import CalendarStatIcon from '../components/ui/CalendarStatIcon';
import { formatAppointmentWhen } from '../components/BookingCalendar';
import { RegionGlobeButton, useActiveRegionLabel } from '../components/RegionSwitcher';
import {
  IconCircleButton,
  NotificationBellButton,
  PrimaryButton,
  SearchField,
  StatusBadge,
} from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { useSession } from '../context/SessionContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { createDoctorAppointmentsSeed } from '../lib/doctorSeed';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing, managerDashboard as managerTheme } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/userprofile.png');

const ADMIN_TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'canceled', label: 'Canceled' },
];

const MANAGER_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rescheduled', label: 'Reschedule' },
];

/** Doctor appointments — same manager layout; Pending → Upcoming only. */
const DOCTOR_TABS = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'approved', label: 'Approved' },
  { key: 'rescheduled', label: 'Reschedule' },
];

const LIST_STATUS = {
  upcoming: { label: 'Confirmed', color: colors.success, bg: colors.successBg },
  completed: { label: 'Completed', color: colors.brand, bg: colors.warningBg },
  canceled: { label: 'Canceled', color: colors.danger, bg: colors.dangerBg },
};

const REQUEST_STATUS = {
  pending: { label: 'Pending', color: '#D5B244', bg: '#FFF8DC' },
  upcoming: { label: 'Upcoming', color: '#6B5CA5', bg: '#EDE8F8' },
  approved: { label: 'Approved', color: colors.success, bg: colors.successBg },
  rescheduled: { label: 'Reschedule', color: colors.brand, bg: colors.warningBg },
  rejected: { label: 'Rejected', color: colors.danger, bg: colors.dangerBg },
};

function normalizeRequestStatus(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'reschedule') return 'rescheduled';
  return value;
}

/** Doctor filter bucket: pending counts as upcoming. */
function normalizeDoctorTabStatus(status) {
  const value = normalizeRequestStatus(status);
  if (value === 'pending') return 'upcoming';
  return value;
}

function formatRequestWhen(item) {
  const time = item?.requestedTime || item?.time || '';
  const rawDate = item?.requestedDate || item?.date || '';
  if (!rawDate && !time) return 'Time pending';
  if (!rawDate) return time;
  const date = new Date(`${rawDate}T00:00:00`);
  const dateLabel = Number.isNaN(date.getTime())
    ? rawDate
    : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return time ? `${dateLabel} · ${time}` : dateLabel;
}

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
        <LinearGradient
          colors={[colors.brand, '#EFB584']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarStatIcon size={s(14)} />
        </LinearGradient>
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

function AdminFilterTabs({ active, onChange }) {
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
      {ADMIN_TABS.map((tab) => {
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

function ManagerFilterTabs({ active, onChange, counts, tabs = MANAGER_TABS }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: s(14), paddingBottom: s(4), gap: s(8) }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        const count = counts?.[tab.key];
        const label =
          typeof count === 'number' ? `${tab.label} (${count})` : tab.label;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={{
              minWidth: s(72),
              height: s(34),
              paddingHorizontal: s(16),
              borderRadius: 999,
              backgroundColor: isActive ? colors.brand : colors.card,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: fs(11),
                fontWeight: '600',
                color: isActive ? colors.white : colors.desc,
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function AppointmentCard({ item, onPress }) {
  const st = LIST_STATUS[item.status] || LIST_STATUS.upcoming;
  const patient = item.patient || 'Appointment';
  const code = item.code || 'Appointment details';
  const treatment = item.treatment || 'Clinic visit';
  const doctor = item.doctor || 'Doctor not assigned';
  const when = formatAppointmentWhen(item);

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
          <StatusBadge status={item.status} label={st.label} color={st.color} bg={st.bg} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(10) }}>
          <Text style={{ flex: 1, fontSize: fs(10), color: colors.ink }} numberOfLines={1}>
            {treatment}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: s(8) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: s(10), marginBottom: s(4) }}>
            <Ionicons name="calendar-outline" size={s(11)} color={colors.brand} />
            <Text style={{ fontSize: fs(9), color: colors.desc, marginLeft: 4 }}>{when.day}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: s(10), marginBottom: s(4) }}>
            <Ionicons name="today-outline" size={s(11)} color={colors.brand} />
            <Text style={{ fontSize: fs(9), color: colors.desc, marginLeft: 4 }}>{when.date}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(4) }}>
            <Ionicons name="time-outline" size={s(11)} color={colors.brand} />
            <Text style={{ fontSize: fs(9), color: colors.desc, marginLeft: 4 }}>{when.time}</Text>
          </View>
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

function ManagerRequestCard({ item, onReview, isDoctor = false }) {
  const status = isDoctor
    ? normalizeDoctorTabStatus(item.status)
    : normalizeRequestStatus(item.status);
  const st =
    REQUEST_STATUS[status] ||
    (isDoctor ? REQUEST_STATUS.upcoming : REQUEST_STATUS.pending);
  const when = formatAppointmentWhen(item);
  return (
    <View
      style={{
        backgroundColor: managerTheme.colors.card,
        borderRadius: s(14),
        padding: s(12),
        marginBottom: s(12),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={patientImage}
          contentFit="cover"
          style={{ width: s(36), height: s(36), borderRadius: s(18), marginRight: s(10) }}
        />
        <View style={{ flex: 1, marginRight: s(8) }}>
          <Text style={{ color: managerTheme.colors.text, fontSize: fs(12), fontWeight: '700' }} numberOfLines={1}>
            {item.patient || 'Patient'}
          </Text>
          {isDoctor ? null : (
            <Text
              style={{ color: managerTheme.colors.secondaryText, fontSize: fs(9), marginTop: 2 }}
              numberOfLines={1}
            >
              {item.treatment || 'Treatment'}
            </Text>
          )}
        </View>
        <View
          style={{
            backgroundColor: st.bg,
            borderRadius: s(8),
            paddingHorizontal: s(8),
            paddingVertical: s(4),
          }}
        >
          <Text style={{ color: st.color, fontSize: fs(8), fontWeight: '600' }}>{st.label}</Text>
        </View>
      </View>

      {isDoctor ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(10) }}>
          <Text
            style={{
              flex: 1,
              color: managerTheme.colors.text,
              fontSize: fs(11),
              fontWeight: '600',
            }}
            numberOfLines={1}
          >
            {item.treatment || 'Treatment'}
          </Text>
          <Ionicons name="time-outline" size={s(12)} color={managerTheme.colors.secondaryText} />
          <Text
            style={{
              color: managerTheme.colors.secondaryText,
              fontSize: fs(10),
              marginLeft: 4,
            }}
          >
            {item.requestedTime || item.time || when.time}
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: s(10) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: s(10), marginBottom: 4 }}>
              <Ionicons name="calendar-outline" size={s(11)} color={colors.brand} />
              <Text style={{ color: managerTheme.colors.secondaryText, fontSize: fs(9), marginLeft: 4 }}>
                {when.day}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: s(10), marginBottom: 4 }}>
              <Ionicons name="today-outline" size={s(11)} color={colors.brand} />
              <Text style={{ color: managerTheme.colors.secondaryText, fontSize: fs(9), marginLeft: 4 }}>
                {when.date}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="time-outline" size={s(11)} color={colors.brand} />
              <Text style={{ color: managerTheme.colors.secondaryText, fontSize: fs(9), marginLeft: 4 }}>
                {when.time}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(6) }}>
            <Text
              style={{ flex: 1, color: managerTheme.colors.secondaryText, fontSize: fs(9) }}
              numberOfLines={1}
            >
              {item.doctor || 'Doctor'}
            </Text>
          </View>
        </>
      )}

      <PrimaryButton
        label={isDoctor ? 'Review History' : 'Review Request'}
        onPress={onReview}
        size="sm"
        style={{ marginTop: s(12), width: '100%' }}
      />
    </View>
  );
}

function roleLabel(user, isManager, isDoctor) {
  if (isDoctor) return 'Doctor';
  if (isManager) return 'Clinic Manager';
  const raw = String(user?.role || 'Regional Admin');
  if (raw === 'admin') return 'Regional Admin';
  if (raw === 'clinic_manager') return 'Clinic Manager';
  if (raw === 'doctor') return 'Doctor';
  return raw;
}

export default function AppointmentsTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();
  const regionLabel = useActiveRegionLabel();
  const { appointments, appointmentRequests, dashboard, error, refresh } = useClinicData();
  const isManager = user.role === 'clinic_manager';
  const isDoctor = user.role === 'doctor';
  const useRequestLayout = isManager || isDoctor;

  const [adminTab, setAdminTab] = useState('upcoming');
  const [managerTab, setManagerTab] = useState('all');
  const [query, setQuery] = useState('');

  const doctorSeed = useMemo(
    () =>
      createDoctorAppointmentsSeed({
        name: user?.name || 'Dr Zeeshan Forward',
        branchName: user?.branchName || dashboard?.clinic?.name || 'Dubai Branch',
      }),
    [user?.name, user?.branchName, dashboard?.clinic?.name]
  );

  // Managers force a silent sync so All / Pending / Approved / Reschedule stay live.
  const refreshOnFocus = useCallback(
    (opts) => refresh({ ...opts, silent: true, force: isManager }),
    [refresh, isManager]
  );
  useRefreshOnFocus(refreshOnFocus);

  // Keep admin appointment cards on appointment stats only — never mix home dashboard stats.
  const stats = isDoctor
    ? doctorSeed.stats
    : isManager
      ? appointments.stats?.length
        ? appointments.stats
        : dashboard?.stats || []
      : appointments.stats || [];

  const managerItems = useMemo(() => {
    if (isDoctor) {
      const live = appointmentRequests?.items?.length
        ? appointmentRequests.items
        : dashboard?.appointmentRequests || [];
      // Prefer live requests that mention this doctor; else seed.
      const doctorName = String(user?.name || '').trim().toLowerCase();
      const scoped = doctorName
        ? live.filter((item) =>
            String(item.doctor || '')
              .trim()
              .toLowerCase()
              .includes(doctorName)
          )
        : live;
      return scoped.length ? scoped : doctorSeed.items;
    }
    if (appointmentRequests?.items?.length) return appointmentRequests.items;
    // Fallback only before the full requests endpoint has hydrated.
    return dashboard?.appointmentRequests || [];
  }, [
    isDoctor,
    appointmentRequests?.items,
    dashboard?.appointmentRequests,
    doctorSeed.items,
    user?.name,
  ]);

  const managerCounts = useMemo(() => {
    if (isDoctor) {
      const counts = { all: managerItems.length, upcoming: 0, approved: 0, rescheduled: 0 };
      for (const item of managerItems) {
        const status = normalizeDoctorTabStatus(item.status);
        if (counts[status] != null) counts[status] += 1;
      }
      return counts;
    }
    if (appointmentRequests?.counts) return appointmentRequests.counts;
    const counts = { all: managerItems.length, pending: 0, approved: 0, rescheduled: 0, rejected: 0 };
    for (const item of managerItems) {
      const status = normalizeRequestStatus(item.status);
      if (counts[status] != null) counts[status] += 1;
    }
    return counts;
  }, [isDoctor, appointmentRequests?.counts, managerItems]);

  const adminList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (appointments.items || []).filter(
      (a) =>
        a.status === adminTab &&
        (!q ||
          a.patient?.toLowerCase().includes(q) ||
          a.doctor?.toLowerCase().includes(q) ||
          a.treatment?.toLowerCase().includes(q) ||
          a.code?.toLowerCase().includes(q))
    );
  }, [appointments.items, adminTab, query]);

  const managerList = useMemo(() => {
    const q = query.trim().toLowerCase();
    return managerItems.filter((item) => {
      const status = isDoctor
        ? normalizeDoctorTabStatus(item.status)
        : normalizeRequestStatus(item.status);
      const tabOk = managerTab === 'all' || status === managerTab;
      if (!tabOk) return false;
      if (!q) return true;
      const hay = `${item.patient || ''} ${item.doctor || ''} ${item.treatment || ''} ${item.appointmentId || ''} ${item.requestedTime || ''}`;
      return hay.toLowerCase().includes(q);
    });
  }, [managerItems, managerTab, query, isDoctor]);

  const subtitle = `${regionLabel || dashboard?.clinic?.region || dashboard?.clinic?.city || user?.branchName || 'Region'} · ${roleLabel(user, isManager, isDoctor)}`;
  const showHardError = Boolean(error) && stats.length === 0 && !isDoctor;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 30 }}>
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
                {subtitle}
              </Text>
            </View>
            {/* Region switcher is admin-only; manager/doctor get notifications only. */}
            {!useRequestLayout ? <RegionGlobeButton color={colors.brand} /> : null}
            {!useRequestLayout ? <View style={{ width: s(8) }} /> : null}
            <NotificationBellButton color={useRequestLayout ? colors.mutedBrand : colors.brand} />
          </View>

          {showHardError ? (
            <Text style={{ fontSize: fs(11), color: colors.danger, marginTop: s(12), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

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

          {useRequestLayout ? (
            <>
              <ManagerFilterTabs
                active={managerTab}
                onChange={setManagerTab}
                counts={managerCounts}
                tabs={isDoctor ? DOCTOR_TABS : MANAGER_TABS}
              />
              <View style={{ width: '100%', marginTop: s(12) }}>
                {managerList.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: s(30) }}>
                    <Ionicons name="calendar-outline" size={s(28)} color={colors.muted} />
                    <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>
                      No appointment requests found
                    </Text>
                  </View>
                ) : (
                  managerList.map((item) => (
                    <ManagerRequestCard
                      key={item.id}
                      item={item}
                      isDoctor={isDoctor}
                      onReview={() =>
                        isDoctor
                          ? navigation.navigate('DoctorReviewHistory', { item })
                          : navigation.navigate('AppointmentRequestDetail', { requestId: item.id })
                      }
                    />
                  ))
                )}
              </View>
            </>
          ) : (
            <>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink, marginTop: s(10) }}>
                Appointment List
              </Text>

              <View style={{ marginTop: s(12) }}>
                <SearchField value={query} onChangeText={setQuery} />
              </View>

              <AdminFilterTabs active={adminTab} onChange={setAdminTab} />

              <View style={{ width: '100%', marginTop: s(16) }}>
                {adminList.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: s(30) }}>
                    <Ionicons name="calendar-outline" size={s(28)} color={colors.muted} />
                    <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>
                      No appointments found
                    </Text>
                  </View>
                ) : (
                  adminList.map((item) => (
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
