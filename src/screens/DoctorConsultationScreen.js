import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import { IconCircleButton, SearchField } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { colors, managerDashboard as theme, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const doctorFallback = require('../../assets/doctor.png');
const patientImage = require('../../assets/userprofile.png');

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rescheduled', label: 'Reschedule' },
];

const BADGE = {
  pending: { label: 'Pending', color: '#D5B244', bg: '#FFF8DC' },
  approved: { label: 'Upcoming', color: '#7B6BA8', bg: '#EDE8F8' },
  rescheduled: { label: 'Reschedule', color: colors.brand, bg: colors.warningBg },
  rejected: { label: 'Rejected', color: colors.danger, bg: colors.dangerBg },
};

const BRAND_BTN = '#D59B6F';

function normalizeStatus(status) {
  const value = String(status || 'pending').toLowerCase();
  if (value === 'reschedule') return 'rescheduled';
  return value;
}

function matchesDoctor(request, doctor) {
  if (!doctor) return false;
  if (request?.doctorId && doctor.id && String(request.doctorId) === String(doctor.id)) {
    return true;
  }
  const reqName = String(request?.doctor || '').trim().toLowerCase();
  const docName = String(doctor?.name || '').trim().toLowerCase();
  if (!reqName || !docName) return false;
  return reqName === docName || reqName.includes(docName) || docName.includes(reqName);
}

function BookingCard({ item, onReview }) {
  const status = normalizeStatus(item.status);
  const badge = BADGE[status] || BADGE.pending;
  const time = item.requestedTime || item.time || 'Time pending';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Image source={patientImage} contentFit="cover" style={styles.patientAvatar} />
        <View style={{ flex: 1, marginRight: s(8) }}>
          <Text style={styles.patientName} numberOfLines={1}>
            {item.patient || 'Patient'}
          </Text>
          <Text style={styles.patientMeta} numberOfLines={1}>
            {item.treatment || 'Treatment'}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Text style={styles.metaDoctor} numberOfLines={1}>
          {item.doctor || 'Doctor'}
        </Text>
        <Ionicons name="time-outline" size={s(12)} color={theme.colors.secondaryText} />
        <Text style={styles.metaTime}>{time}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Review request"
        onPress={onReview}
        style={({ pressed }) => [styles.reviewBtn, pressed && { opacity: 0.88 }]}
      >
        <Text style={styles.reviewBtnText}>Review Request</Text>
      </Pressable>
    </View>
  );
}

export default function DoctorConsultationScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(14);
  const { dashboard, appointmentRequests } = useClinicData();

  const doctorId = route.params?.doctorId;
  const passedDoctor = route.params?.doctor;

  const doctor = useMemo(() => {
    if (passedDoctor?.id) return passedDoctor;
    const list = dashboard?.doctors || [];
    return list.find((d) => String(d.id) === String(doctorId)) || null;
  }, [passedDoctor, dashboard?.doctors, doctorId]);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const allRequests = useMemo(() => {
    if (appointmentRequests?.items?.length) return appointmentRequests.items;
    return dashboard?.appointmentRequests || [];
  }, [appointmentRequests?.items, dashboard?.appointmentRequests]);

  const doctorRequests = useMemo(() => {
    if (!doctor) return allRequests;
    return allRequests.filter((item) => matchesDoctor(item, doctor));
  }, [allRequests, doctor]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctorRequests.filter((item) => {
      const status = normalizeStatus(item.status);
      if (filter !== 'all' && status !== filter) return false;
      if (!q) return true;
      return (
        String(item.patient || '').toLowerCase().includes(q) ||
        String(item.treatment || '').toLowerCase().includes(q) ||
        String(item.doctor || '').toLowerCase().includes(q) ||
        String(item.appointmentId || '').toLowerCase().includes(q)
      );
    });
  }, [doctorRequests, filter, query]);

  const doctorCode = doctor?.id
    ? `DOC-${String(doctor.id).replace(/\D/g, '').slice(-4).padStart(4, '0') || '0000'}`
    : 'DOC-0000';
  const isActive = String(doctor?.status || 'active').toLowerCase() !== 'inactive';

  function openReview(request) {
    navigation.navigate('AppointmentRequestDetail', {
      requestId: request.id,
      request,
    });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: spacing.tabBarClearance,
        }}
      >
        <View style={styles.header}>
          <IconCircleButton
            name="chevron-back"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerTitles}>
            <Text style={styles.title}>Consultation</Text>
            <Text style={styles.subtitle}>Doctor Detail</Text>
          </View>
          <IconCircleButton
            name="ellipsis-vertical"
            color={BRAND_BTN}
            accessibilityLabel="More options"
          />
        </View>

        <SearchField value={query} onChangeText={setQuery} placeholder="Search Here" />

        <View style={styles.doctorCard}>
          <Image
            source={doctor?.photo ? { uri: doctor.photo } : doctorFallback}
            contentFit="cover"
            style={styles.doctorPhoto}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.doctorName} numberOfLines={1}>
              {doctor?.name || 'Doctor'}
            </Text>
            <Text style={styles.doctorSpecialty} numberOfLines={1}>
              {doctor?.specialty || 'Specialty'}
            </Text>
            <Text style={styles.doctorId}>Doctor ID: {doctorCode}</Text>
          </View>
          <View style={[styles.activeBadge, !isActive && styles.inactiveBadge]}>
            <Text style={[styles.activeText, !isActive && styles.inactiveText]}>
              {isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {FILTERS.map((tab) => {
            const active = filter === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                style={[styles.filterChip, active && styles.filterChipOn]}
              >
                <Text style={[styles.filterText, active && styles.filterTextOn]}>{tab.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {filtered.length ? (
          filtered.map((item) => (
            <BookingCard key={item.id} item={item} onReview={() => openReview(item)} />
          ))
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No bookings for this filter.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8F1',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(14),
  },
  headerTitles: {
    flex: 1,
    alignItems: 'flex-start',
    marginHorizontal: s(8),
  },
  title: {
    color: colors.inkDeep,
    fontSize: fs(16),
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: fs(11),
    marginTop: 2,
  },
  doctorCard: {
    marginTop: s(14),
    backgroundColor: colors.card,
    borderRadius: s(14),
    padding: s(12),
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorPhoto: {
    width: s(56),
    height: s(56),
    borderRadius: s(12),
    marginRight: s(12),
    backgroundColor: '#EEE',
  },
  doctorName: {
    color: colors.inkDeep,
    fontSize: fs(14),
    fontWeight: '700',
  },
  doctorSpecialty: {
    color: colors.desc,
    fontSize: fs(11),
    marginTop: 2,
  },
  doctorId: {
    color: colors.muted,
    fontSize: fs(10),
    marginTop: 4,
  },
  activeBadge: {
    backgroundColor: colors.successBg,
    borderRadius: s(8),
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    alignSelf: 'flex-start',
  },
  activeText: {
    color: colors.success,
    fontSize: fs(9),
    fontWeight: '600',
  },
  inactiveBadge: {
    backgroundColor: colors.dangerBg,
  },
  inactiveText: {
    color: colors.danger,
  },
  filters: {
    paddingVertical: s(14),
    gap: s(8),
  },
  filterChip: {
    paddingHorizontal: s(16),
    paddingVertical: s(8),
    borderRadius: s(18),
    marginRight: s(4),
  },
  filterChipOn: {
    backgroundColor: BRAND_BTN,
  },
  filterText: {
    color: colors.desc,
    fontSize: fs(12),
    fontWeight: '500',
  },
  filterTextOn: {
    color: '#fff',
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: s(14),
    padding: s(12),
    marginBottom: s(12),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  patientAvatar: {
    width: s(36),
    height: s(36),
    borderRadius: s(18),
    marginRight: s(10),
  },
  patientName: {
    color: colors.inkDeep,
    fontSize: fs(13),
    fontWeight: '700',
  },
  patientMeta: {
    color: colors.desc,
    fontSize: fs(10),
    marginTop: 2,
  },
  badge: {
    borderRadius: s(8),
    paddingHorizontal: s(8),
    paddingVertical: s(4),
  },
  badgeText: {
    fontSize: fs(9),
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: s(10),
  },
  metaDoctor: {
    flex: 1,
    color: colors.desc,
    fontSize: fs(10),
  },
  metaTime: {
    color: colors.desc,
    fontSize: fs(10),
    marginLeft: 4,
  },
  reviewBtn: {
    height: s(36),
    borderRadius: 999,
    backgroundColor: BRAND_BTN,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(12),
  },
  reviewBtnText: {
    color: '#fff',
    fontSize: fs(12),
    fontWeight: '600',
  },
  empty: {
    backgroundColor: colors.card,
    borderRadius: s(14),
    padding: s(20),
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: fs(12),
  },
});
