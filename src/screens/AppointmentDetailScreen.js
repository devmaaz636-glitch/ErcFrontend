import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, SkeletonRow } from '../components/ui';
import { clinicErrorMessage, fetchAppointment } from '../lib/clinic';
import { notifyBookingUpdate } from '../lib/notifyEvents';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BROWN = colors.brand;
const GREEN = colors.success;
const RED = colors.danger;
const INK = colors.ink;
const MUTED = colors.mutedBrand;
const BG = colors.background;
const DESC = colors.desc;
const CARD = colors.card;

const STATUS_META = {
  upcoming: { label: 'Upcoming', color: '#fff', bg: BROWN },
  completed: { label: 'Completed', color: BROWN, bg: colors.warningBg },
  canceled: { label: 'Canceled', color: RED, bg: colors.dangerBg },
};

const PAYMENT_META = {
  paid: { label: 'Paid', color: GREEN, bg: colors.successBg },
  pending: { label: 'Pending', color: BROWN, bg: colors.warningBg },
  refunded: { label: 'Refunded', color: RED, bg: colors.dangerBg },
  unpaid: { label: 'Unpaid', color: RED, bg: colors.dangerBg },
};

function departmentFromTreatment(treatment = '') {
  const text = treatment.toLowerCase();
  if (text.includes('derma')) return 'Dermatology';
  if (text.includes('hair')) return 'Hair Restoration';
  if (text.includes('dental')) return 'Dental';
  if (text.includes('laser')) return 'Laser';
  return treatment || 'General';
}

function endTimeFromStart(time = '11:00 AM', minutes = 45) {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time;
  let hour = Number(match[1]);
  const mins = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  const total = hour * 60 + mins + minutes;
  const endHour24 = Math.floor(total / 60) % 24;
  const endMin = total % 60;
  const endPeriod = endHour24 >= 12 ? 'PM' : 'AM';
  let endHour = endHour24 % 12;
  if (endHour === 0) endHour = 12;
  return `${endHour}:${String(endMin).padStart(2, '0')} ${endPeriod}`;
}

function formatDateLabel(value, fallback) {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatShortDate(value, fallback) {
  if (!value) return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function buildDetail(appointment = {}) {
  const status = appointment.status || 'upcoming';
  const department = appointment.department || departmentFromTreatment(appointment.treatment);
  const title =
    appointment.title ||
    (appointment.treatment?.toLowerCase().includes('consult')
      ? appointment.treatment
      : `${department} Consultation`);
  const start = appointment.time || '11:00 AM';
  const end = appointment.endTime || endTimeFromStart(start, appointment.durationMinutes || 45);
  const clinic = appointment.clinic || appointment.branch || 'Dubai Clinic';
  const code = appointment.code || `APT-${String(appointment.id || 0).padStart(4, '0')}`;
  const paymentKey = (appointment.paymentStatus || (status === 'canceled' ? 'refunded' : 'paid')).toLowerCase();

  return {
    title,
    department,
    code,
    clinic,
    status,
    statusMeta: STATUS_META[status] || STATUS_META.upcoming,
    dateLabel: formatDateLabel(appointment.date, appointment.dateLabel || '—'),
    timeRange: appointment.timeRange || `${start} - ${end}`,
    patientName: appointment.patient || 'Patient',
    patientId: appointment.patientId || '—',
    contactLabel: appointment.contactLabel || 'View if permission allows',
    doctorName: appointment.doctor || 'Doctor',
    doctorSpecialty: appointment.doctorSpecialty || department.replace(/ Consultation$/i, '') || 'Specialist',
    bookingDate: formatShortDate(appointment.bookingDate, appointment.bookingDateLabel || '—'),
    payment: PAYMENT_META[paymentKey] || PAYMENT_META.paid,
  };
}

function SectionTitle({ title }) {
  return (
    <Text style={{ fontSize: fs(14), fontWeight: '700', color: INK, marginTop: s(18), marginBottom: s(8) }}>
      {title}
    </Text>
  );
}

function Card({ children }) {
  return (
    <View
      style={{
        backgroundColor: CARD,
        borderRadius: 14,
        paddingHorizontal: s(14),
        paddingVertical: s(12),
      }}
    >
      {children}
    </View>
  );
}

function MetaRow({ label, value, valueNode, last }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: s(8),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: '#F1E7DD',
      }}
    >
      <Text style={{ flex: 1, fontSize: fs(12), color: DESC }}>{label}</Text>
      {valueNode || (
        <Text style={{ fontSize: fs(12), fontWeight: '600', color: INK, textAlign: 'right', maxWidth: '62%' }}>
          {value}
        </Text>
      )}
    </View>
  );
}

function PersonRow({ name, subtitle }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          width: s(40),
          height: s(40),
          borderRadius: s(20),
          backgroundColor: BROWN,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(12),
        }}
      >
        <Ionicons name="person" size={s(18)} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: BROWN }} numberOfLines={1}>
          {name}
        </Text>
        <Text style={{ fontSize: fs(10), color: DESC, marginTop: 2 }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export default function AppointmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const appointmentId = route.params?.appointmentId || route.params?.appointment?.id;
  const [appointment, setAppointment] = useState(route.params?.appointment || null);
  const [loading, setLoading] = useState(!route.params?.appointment);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (!appointmentId) return undefined;
      let active = true;
      setLoading(true);
      const seeded = route.params?.appointment;
      if (seeded?.id || seeded?.code) {
        notifyBookingUpdate({
          onceKey: seeded.id || seeded.code,
          code: seeded.code,
          title: seeded.treatment || seeded.title,
          status: seeded.status,
          clinic: seeded.clinic,
        }).catch(() => {});
      }

      fetchAppointment(appointmentId)
        .then((item) => {
          if (active) {
            setAppointment(item);
            setError('');
            notifyBookingUpdate({
              onceKey: item.id || item.code,
              code: item.code,
              title: item.treatment || item.title,
              status: item.status,
              clinic: item.clinic,
            }).catch(() => {});
          }
        })
        .catch((err) => {
          if (active && !route.params?.appointment) {
            setError(clinicErrorMessage(err));
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [appointmentId, route.params?.appointment])
  );

  const detail = buildDetail(appointment || {});

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
          {loading && !appointment ? (
            <View style={{ marginTop: s(24) }}>
              <SkeletonRow lines={2} />
              <SkeletonRow lines={3} />
              <SkeletonRow lines={2} />
            </View>
          ) : null}
          {error ? (
            <Text style={{ fontSize: fs(11), color: RED, textAlign: 'center', marginBottom: s(12) }}>
              {error}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ marginTop: 2 }}>
              <IconCircleButton
                name="chevron-back"
                color={INK}
                accessibilityLabel="Go back"
                onPress={() => navigation.goBack()}
              />
            </View>

            <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: INK }} numberOfLines={2}>
                {detail.title}
              </Text>
              <Text style={{ fontSize: fs(11), color: DESC, marginTop: 3 }} numberOfLines={1}>
                Department: {detail.department}
              </Text>
            </View>

            <View style={{ marginTop: 2 }}>
              <NotificationBellButton color={BROWN} />
            </View>
          </View>

          <SectionTitle title="Appointment Details" />
          <Card>
            <Text style={{ fontSize: fs(12), fontWeight: '600', color: INK }}>
              {detail.code} · {detail.clinic}
            </Text>
          </Card>

          <SectionTitle title="Appointment Overview" />
          <Card>
            <MetaRow
              label="Status"
              valueNode={
                <View
                  style={{
                    backgroundColor: detail.statusMeta.bg,
                    borderRadius: 10,
                    paddingHorizontal: s(10),
                    height: s(22),
                    justifyContent: 'center',
                  }}
                >
                  <Text
                    style={{
                      fontSize: fs(10),
                      fontWeight: '700',
                      color: detail.statusMeta.color,
                    }}
                  >
                    {detail.statusMeta.label}
                  </Text>
                </View>
              }
            />
            <MetaRow label="Date" value={detail.dateLabel} />
            <MetaRow label="Time" value={detail.timeRange} last />
          </Card>

          <SectionTitle title="Appointment Overview" />
          <Card>
            <PersonRow
              name={detail.patientName}
              subtitle={`Patient ID : ${detail.patientId}`}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: s(12),
                paddingTop: s(10),
                borderTopWidth: 1,
                borderTopColor: '#F1E7DD',
              }}
            >
              <Text style={{ flex: 1, fontSize: fs(12), color: DESC }}>Contact</Text>
              <Text style={{ fontSize: fs(12), fontWeight: '600', color: BROWN }}>
                {detail.contactLabel}
              </Text>
            </View>
          </Card>

          <SectionTitle title="Doctor Information" />
          <Card>
            <PersonRow name={detail.doctorName} subtitle={detail.doctorSpecialty} />
          </Card>

          <SectionTitle title="Booking Information" />
          <Card>
            <MetaRow label="Appointment ID" value={detail.code} />
            <MetaRow label="Booking Date" value={detail.bookingDate} />
            <MetaRow label="Clinic" value={detail.clinic} />
            <MetaRow
              label="Payment Status"
              last
              valueNode={
                <View
                  style={{
                    backgroundColor: detail.payment.bg,
                    borderRadius: 10,
                    paddingHorizontal: s(10),
                    height: s(22),
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: fs(10), fontWeight: '700', color: detail.payment.color }}>
                    {detail.payment.label}
                  </Text>
                </View>
              }
            />
          </Card>

          <Pressable
            accessibilityRole="button"
            onPress={() => navigateToTab(navigation, TAB_ROUTES.Appointments)}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: BROWN,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(22),
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: '#fff' }}>
              Back To Appointments
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
