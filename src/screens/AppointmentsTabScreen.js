import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
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

// Replace with API data. `change` > 0 shows green ↗, `change` < 0 shows red ↘
const STATS = [
  { id: 'today',     icon: 'calendar-outline', value: '42', label: "Today's Appointments", change: 33.2 },
  { id: 'upcoming',  icon: 'calendar-outline', value: '14', label: 'Upcoming',             change: -60.2 },
  { id: 'completed', icon: 'calendar-outline', value: '12', label: 'Completed visits',     change: -60.2 },
  { id: 'canceled',  icon: 'calendar-outline', value: '09', label: 'Canceled bookings',    change: 10.2 },
];

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'canceled', label: 'Canceled' },
];

const STATUS = {
  upcoming: { label: 'Confirmed', color: GREEN, bg: '#E6F7EA' },
  completed: { label: 'Completed', color: BROWN, bg: '#F8EDE2' },
  canceled: { label: 'Canceled', color: RED, bg: '#FCE8E9' },
};

const APPOINTMENTS = [
  {
    id: 1,
    patient: 'Ahsan Jamal',
    patientId: 'PT-2061',
    code: 'APT-0001',
    treatment: 'Hair Treatment',
    department: 'Hair Restoration',
    time: '09:00 AM',
    doctor: 'Dr. Sarah',
    doctorSpecialty: 'Hair Specialist',
    clinic: 'Dubai Clinic',
    status: 'canceled',
    paymentStatus: 'refunded',
    date: '2026-10-18',
    bookingDate: '2026-10-14',
  },
  {
    id: 2,
    patient: 'Patient B',
    patientId: 'PT-2064',
    code: 'APT-1043',
    treatment: 'Dermatology Consultation',
    department: 'Dermatology',
    time: '11:00 AM',
    doctor: 'Dr. Ali Khan',
    doctorSpecialty: 'Dermatologist',
    clinic: 'Dubai Clinic',
    status: 'upcoming',
    paymentStatus: 'paid',
    date: '2026-10-19',
    bookingDate: '2026-10-16',
  },
  {
    id: 3,
    patient: 'Sara Ahmed',
    patientId: 'PT-2070',
    code: 'APT-0003',
    treatment: 'Laser Session',
    department: 'Laser',
    time: '09:00 AM',
    doctor: 'Dr. Nora',
    doctorSpecialty: 'Laser Specialist',
    clinic: 'Riyadh Clinic',
    status: 'canceled',
    paymentStatus: 'refunded',
    date: '2026-10-17',
    bookingDate: '2026-10-12',
  },
  {
    id: 4,
    patient: 'Ahsan Jamal',
    patientId: 'PT-2061',
    code: 'APT-0004',
    treatment: 'Hair Treatment',
    department: 'Hair Restoration',
    time: '10:30 AM',
    doctor: 'Dr. Sarah',
    doctorSpecialty: 'Hair Specialist',
    clinic: 'Dubai Clinic',
    status: 'upcoming',
    paymentStatus: 'pending',
    date: '2026-10-20',
    bookingDate: '2026-10-15',
  },
  {
    id: 5,
    patient: 'Omar Khan',
    patientId: 'PT-2088',
    code: 'APT-0005',
    treatment: 'Dermatology Consultation',
    department: 'Dermatology',
    time: '11:00 AM',
    doctor: 'Dr. Ali Khan',
    doctorSpecialty: 'Dermatologist',
    clinic: 'Abu Dhabi Clinic',
    status: 'upcoming',
    paymentStatus: 'paid',
    date: '2026-10-21',
    bookingDate: '2026-10-18',
  },
  {
    id: 6,
    patient: 'Ahsan Jamal',
    patientId: 'PT-2061',
    code: 'APT-0006',
    treatment: 'Hair Treatment',
    department: 'Hair Restoration',
    time: '01:00 PM',
    doctor: 'Dr. Sarah',
    doctorSpecialty: 'Hair Specialist',
    clinic: 'Dubai Clinic',
    status: 'completed',
    paymentStatus: 'paid',
    date: '2026-10-10',
    bookingDate: '2026-10-05',
  },
  {
    id: 7,
    patient: 'Lina Farooq',
    patientId: 'PT-2091',
    code: 'APT-0007',
    treatment: 'Dental Checkup',
    department: 'Dental',
    time: '02:30 PM',
    doctor: 'Dr. Hassan',
    doctorSpecialty: 'Dentist',
    clinic: 'Sharjah Clinic',
    status: 'completed',
    paymentStatus: 'paid',
    date: '2026-10-11',
    bookingDate: '2026-10-07',
  },
];

/* ---------- Stat card ---------- */
function StatCard({ item }) {
  const up = item.change >= 0;
  const tone = up ? GREEN : RED;
  const toneBg = up ? '#E6F7EA' : '#FCE8E9';
  const iconSize = s(30);

  return (
    <View
      style={{
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(12),
        marginBottom: s(12),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Icon in ringed circle */}
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

        {/* Change pill */}
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
            {Math.abs(item.change).toFixed(1)}%
          </Text>
          <Ionicons name={up ? 'trending-up' : 'trending-down'} size={s(10)} color={tone} />
        </View>
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

/* ---------- Tabs ---------- */
function FilterTabs({ active, onChange }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#fff',
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
              backgroundColor: isActive ? BROWN : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fs(10), fontWeight: '600', color: isActive ? '#fff' : DESC }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Appointment card ---------- */
function AppointmentCard({ item, featured, onPress }) {
  const gradId = `appt-${item.id}`;
  const st = STATUS[item.status];

  const titleColor = featured ? '#fff' : INK;
  const subColor = featured ? 'rgba(255,255,255,0.85)' : DESC;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginBottom: s(12),
      }}
    >
      {featured && (
        <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
          <Defs>
            <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={BROWN} />
              <Stop offset="1" stopColor={BROWN_LIGHT} />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
        </Svg>
      )}

      <View style={{ padding: s(14) }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, marginRight: s(8) }}>
            <Text style={{ fontSize: fs(13), fontWeight: '700', color: titleColor }} numberOfLines={1}>
              {item.patient}
            </Text>
            <Text style={{ fontSize: fs(9), color: subColor, marginTop: 2 }} numberOfLines={1}>
              {item.code}
            </Text>
          </View>

          <View
            style={{
              backgroundColor: featured ? 'rgba(255,255,255,0.25)' : st.bg,
              borderRadius: 10,
              paddingHorizontal: s(10),
              height: s(20),
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: fs(8, 8), fontWeight: '600', color: featured ? '#fff' : st.color }}>
              {st.label}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(10) }}>
          <Text style={{ flex: 1, fontSize: fs(10), color: titleColor }} numberOfLines={1}>
            {item.treatment}
          </Text>
          <Ionicons name="time-outline" size={s(11)} color={subColor} />
          <Text style={{ fontSize: fs(9), color: subColor, marginLeft: 4 }}>{item.time}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(6) }}>
          <Ionicons name="person-outline" size={s(11)} color={subColor} />
          <Text style={{ fontSize: fs(9), color: subColor, marginLeft: 4 }} numberOfLines={1}>
            {item.doctor}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/* ---------- Screen ---------- */
// Pass `stats` and `appointments` from your API; demo data is the fallback.
export default function AppointmentsTabScreen({ stats = STATS, appointments = APPOINTMENTS }) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const [tab, setTab] = useState('canceled');
  const [query, setQuery] = useState('');

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return appointments.filter(
      (a) =>
        a.status === tab &&
        (!q ||
          a.patient.toLowerCase().includes(q) ||
          a.doctor.toLowerCase().includes(q) ||
          a.treatment.toLowerCase().includes(q))
    );
  }, [appointments, tab, query]);

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
          {/* Header: back icon, left-aligned title, bell */}
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

            <View style={{ flex: 1, alignItems: 'flex-start', marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: INK }} numberOfLines={1}>
                Appointments
              </Text>
              <Text style={{ fontSize: fs(9), color: DESC, marginTop: 1 }} numberOfLines={1}>
                UAE Region · Regional Admin
              </Text>
            </View>

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
              <Ionicons name="notifications-outline" size={s(18)} color={MUTED} />
            </Pressable>
          </View>

          {/* Stat cards */}
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

          {/* Appointment List */}
          <Text style={{ fontSize: fs(18), fontWeight: '700', color: INK, marginTop: s(10) }}>
            Appointment List
          </Text>

          {/* Search */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: Math.max(44, s(44)),
              borderRadius: 30,
              backgroundColor: '#fff',
              paddingLeft: s(18),
              paddingRight: 6,
              marginTop: s(12),
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search Here"
              placeholderTextColor={MUTED}
              maxFontSizeMultiplier={1.2}
              style={{ flex: 1, fontSize: fs(12), color: INK, paddingVertical: 0 }}
            />
            <View
              style={{
                width: s(32),
                height: s(32),
                borderRadius: s(16),
                backgroundColor: '#F4EEE8',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="search" size={s(15)} color={BROWN} />
            </View>
          </View>

          {/* Filter tabs */}
          <FilterTabs active={tab} onChange={setTab} />

          {/* List */}
          <View style={{ width: '100%', marginTop: s(16) }}>
            {list.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: s(30) }}>
                <Ionicons name="calendar-outline" size={s(28)} color={MUTED} />
                <Text style={{ fontSize: fs(11), color: DESC, marginTop: 8 }}>No appointments found</Text>
              </View>
            ) : (
              list.map((item, i) => (
                <AppointmentCard
                  key={item.id}
                  item={item}
                  featured={i === 0}
                  onPress={() => navigation.navigate('AppointmentDetail', { appointment: item })}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <BottomTabBar active="Appointments" />
    </View>
  );
}