import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Linking, Modal, Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import ClinicMapPreview from '../components/ClinicMapPreview';
import BookingCalendar, { toDateKey } from '../components/BookingCalendar';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import {
  clinicMapsUrl,
  getPatientClinic,
  patientTreatmentPrice,
} from '../lib/patientClinic';
import { colors, shadows, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';
import { usePatientData } from '../context/PatientDataContext';

const PATIENT_AVATAR = require('../../assets/patientimage.png');
const DOCTOR_AVATAR = require('../../assets/treatmentdocotor.png');
const BRAND = '#BF824F';

const STATUS_STYLE = {
  upcoming: { label: 'Upcoming', color: '#6B5CA5', bg: '#EDE8F8' },
  pending: { label: 'Pending', color: '#C9A227', bg: '#F7F0D4' },
  completed: { label: 'Completed', color: colors.success, bg: colors.successBg },
  canceled: { label: 'Canceled', color: colors.danger, bg: colors.dangerBg },
};

function departmentFromTreatment(treatment = '') {
  const text = String(treatment).toLowerCase();
  if (text.includes('hair') || text.includes('prp')) return 'Hair';
  if (text.includes('filler')) return 'Injectables';
  if (text.includes('facelift')) return 'Plastic Surgery';
  if (text.includes('laser')) return 'Laser';
  return 'Laser';
}

function endTimeFromStart(time = '09:30 AM', minutes = 60) {
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
  const endPeriod = endHour24 >= 12 ? 'Pm' : 'Am';
  let endHour = endHour24 % 12;
  if (endHour === 0) endHour = 12;
  return `${endHour}:${String(endMin).padStart(2, '0')} ${endPeriod}`;
}

function formatTimeLabel(time = '09:30 AM') {
  return String(time)
    .replace(/\s*AM$/i, ' Am')
    .replace(/\s*PM$/i, ' Pm');
}

function formatDateLabel(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function timeToMinutes(value) {
  const match = String(value).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]) % 12;
  if (String(match[3]).toUpperCase() === 'PM') hours += 12;
  return hours * 60 + Number(match[2]);
}

function formatSlotTime(total) {
  let hours = Math.floor(total / 60);
  const minutes = total % 60;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  hours %= 12;
  if (!hours) hours = 12;
  return `${hours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

function buildRescheduleSlots() {
  const slots = [];
  for (let start = 9 * 60; start + 60 <= 17 * 60; start += 60) {
    slots.push(`${formatSlotTime(start)} - ${formatSlotTime(start + 60)}`);
  }
  return slots;
}

function SectionTitle({ title }) {
  return (
    <Text
      style={{
        marginTop: s(18),
        marginBottom: s(10),
        fontSize: fs(14),
        fontWeight: '700',
        color: colors.ink,
      }}
    >
      {title}
    </Text>
  );
}

function Card({ children, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderRadius: 18,
          padding: s(14),
          ...shadows.card,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function StatusBadge({ status }) {
  const tone = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <View
      style={{
        backgroundColor: tone.bg,
        borderRadius: 999,
        paddingHorizontal: s(12),
        paddingVertical: s(6),
      }}
    >
      <Text style={{ color: tone.color, fontSize: fs(11), fontWeight: '600' }}>{tone.label}</Text>
    </View>
  );
}

function ScheduleRow({ icon, label, value, last }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: last ? 0 : s(14),
      }}
    >
      <View
        style={{
          width: s(36),
          height: s(36),
          borderRadius: s(18),
          backgroundColor: '#F6E6D6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={s(16)} color={BRAND} />
      </View>
      <View style={{ marginLeft: s(12), flex: 1 }}>
        <Text style={{ fontSize: fs(11), color: colors.desc }}>{label}</Text>
        <Text style={{ marginTop: 2, fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export default function PatientAppointmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(16);
  const { width: windowW } = useWindowDimensions();
  const pageWidth = Math.min(windowW - spacing.screen * 2, spacing.maxContent);
  const { user } = useSession();
  const { changeAppointment, fetchAvailability } = usePatientData();
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [preferredDay, setPreferredDay] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [reason, setReason] = useState('');
  const [rescheduleError, setRescheduleError] = useState('');

  const [appointment, setAppointment] = useState(route.params?.appointment || {});
  // Clinic + map follow the signed-in patient's region/branch (same UI, region data only).
  const clinic = useMemo(
    () =>
      getPatientClinic({
        region: user?.region || user?.displayRegion,
        displayRegion: user?.displayRegion,
        branchId: user?.branchId || user?.clinicId,
        clinicId: user?.clinicId,
        branchName: user?.branchName,
        city: user?.city,
      }),
    [
      user?.region,
      user?.displayRegion,
      user?.branchId,
      user?.clinicId,
      user?.branchName,
      user?.city,
    ]
  );
  const priced = useMemo(
    () =>
      patientTreatmentPrice(appointment.basePrice ?? 600, user?.region || user?.displayRegion || user),
    [appointment.basePrice, user?.region, user?.displayRegion]
  );

  const status = appointment.status || 'pending';
  const treatment = appointment.treatment || 'Laser Treatment';
  const department = appointment.department || departmentFromTreatment(treatment);
  const duration = appointment.duration || '30 Min';
  const requestId = appointment.requestId || `APT-${String(appointment.id || '1024').replace(/\D/g, '').padStart(4, '0') || '1024'}`;
  const doctorName = appointment.doctorName || 'Dr Muhammad';
  const doctorSpecialty = appointment.doctorSpecialty || `${department} Specialist`;
  const dateLabel = appointment.dateLabel || 'Oct 06, 2026';
  const start = appointment.time || '02:30 PM';
  const end = appointment.endTime || endTimeFromStart(start, appointment.durationMinutes || 60);
  const timeRange = appointment.timeRange || `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`;
  const documentName = appointment.documentName || 'Patient Issue.Pdf';
  const [rescheduleSlots, setRescheduleSlots] = useState([]);

  useEffect(() => {
    let active = true;
    if (!preferredDay || !appointment.doctorId) {
      setRescheduleSlots([]);
      return () => { active = false; };
    }
    fetchAvailability(appointment.doctorId, preferredDay)
      .then((slots) => { if (active) setRescheduleSlots(slots); })
      .catch((error) => { if (active) setRescheduleError(error.message); });
    return () => { active = false; };
  }, [appointment.doctorId, fetchAvailability, preferredDay]);

  const openClinicMap = () => {
    const url = clinicMapsUrl(clinic);
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(28),
        }}
      >
        <View style={{ width: pageWidth, alignSelf: 'center' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              color={BRAND}
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}>
                Appointment Details
              </Text>
              <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.desc }}>
                Request ID: {requestId}
              </Text>
            </View>
            <StatusBadge status={status} />
          </View>

          {/* Treatment summary */}
          <Card style={{ marginTop: s(18) }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={PATIENT_AVATAR}
                contentFit="cover"
                style={{
                  width: s(48),
                  height: s(48),
                  borderRadius: s(24),
                  backgroundColor: colors.fieldAlt,
                }}
              />
              <View style={{ marginLeft: s(12), flex: 1 }}>
                <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }}>
                  {treatment}
                </Text>
                <Text style={{ marginTop: 3, fontSize: fs(11), color: colors.desc }}>
                  Department: {department}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                marginTop: s(16),
                paddingTop: s(14),
                borderTopWidth: 1,
                borderTopColor: '#F1EBE4',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(11), color: colors.desc }}>Duration</Text>
                <Text style={{ marginTop: 4, fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                  {duration}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: fs(11), color: colors.desc }}>Treatment Price</Text>
                <Text style={{ marginTop: 4, fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                  {appointment.priceLabel || priced.priceLabel}
                </Text>
              </View>
            </View>
          </Card>

          {/* Selected Doctor */}
          <SectionTitle title="Selected Doctor" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={DOCTOR_AVATAR}
                contentFit="cover"
                style={{
                  width: s(46),
                  height: s(46),
                  borderRadius: s(23),
                  backgroundColor: colors.fieldAlt,
                }}
              />
              <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
                <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                  {doctorName}
                </Text>
                <Text style={{ marginTop: 3, fontSize: fs(11), color: colors.desc }}>
                  {doctorSpecialty}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: '#F7F0D4',
                  borderRadius: 999,
                  paddingHorizontal: s(10),
                  paddingVertical: s(6),
                }}
              >
                <Text style={{ color: '#C9A227', fontSize: fs(10), fontWeight: '600' }}>
                  Requested doctor
                </Text>
              </View>
            </View>
          </Card>

          {/* Schedule */}
          <SectionTitle title="Appointment Schedule" />
          <Card>
            <ScheduleRow icon="calendar-outline" label="Requested Date" value={dateLabel} />
            <ScheduleRow
              icon="time-outline"
              label="Requested Time"
              value={timeRange}
              last
            />
          </Card>

          {/* Clinic Information — region dynamic */}
          <SectionTitle title="Clinic Information" />
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ClinicMapPreview clinic={clinic} height={s(176)} onPress={openClinicMap} />
            <View style={{ padding: s(14) }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text
                  style={{ flex: 1, fontSize: fs(14), fontWeight: '700', color: BRAND, marginRight: s(8) }}
                >
                  {clinic.name}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open clinic in maps"
                  onPress={openClinicMap}
                  style={{
                    width: s(30),
                    height: s(30),
                    borderRadius: s(15),
                    backgroundColor: '#F6E6D6',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons
                    name="arrow-up-outline"
                    size={s(14)}
                    color={BRAND}
                    style={{ transform: [{ rotate: '45deg' }] }}
                  />
                </Pressable>
              </View>
              <Text style={{ marginTop: s(8), fontSize: fs(12), color: colors.desc, lineHeight: fs(18) }}>
                {clinic.tagline}
              </Text>
              <Text
                style={{ marginTop: s(8), fontSize: fs(11), color: colors.muted, lineHeight: fs(16) }}
              >
                {clinic.address}
              </Text>

              <View
                style={{
                  marginTop: s(12),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: s(10) }}>
                  <Ionicons name="location-outline" size={s(13)} color={BRAND} />
                  <Text
                    style={{ marginLeft: 3, fontSize: fs(10), color: colors.desc, flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {clinic.city}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${clinic.phone}`}
                  onPress={() => {
                    if (clinic.phone) {
                      Linking.openURL(`tel:${String(clinic.phone).replace(/[^\d+]/g, '')}`).catch(
                        () => {}
                      );
                    }
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: s(10) }}
                >
                  <Ionicons name="call-outline" size={s(13)} color={BRAND} />
                  <Text
                    style={{ marginLeft: 3, fontSize: fs(10), color: colors.desc, flexShrink: 1 }}
                    numberOfLines={1}
                  >
                    {clinic.phone}
                  </Text>
                </Pressable>
                {clinic.email ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Email ${clinic.email}`}
                    onPress={() => Linking.openURL(`mailto:${clinic.email}`).catch(() => {})}
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}
                  >
                    <Ionicons name="mail-outline" size={s(13)} color={BRAND} />
                    <Text
                      style={{ marginLeft: 3, fontSize: fs(10), color: colors.desc, flexShrink: 1 }}
                      numberOfLines={1}
                    >
                      {clinic.email}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Card>

          {/* Documents */}
          <SectionTitle title="My Documents" />
          <Card>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: s(44),
                  height: s(44),
                  borderRadius: s(10),
                  backgroundColor: '#F4E8DE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="document-text" size={s(24)} color={BRAND} />
              </View>
              <Text
                style={{
                  flex: 1,
                  marginLeft: s(12),
                  fontSize: fs(13),
                  fontWeight: '600',
                  color: colors.ink,
                }}
                numberOfLines={1}
              >
                {documentName}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Download document"
                hitSlop={8}
                onPress={() => {}}
              >
                <Ionicons name="download-outline" size={s(20)} color={colors.ink} />
              </Pressable>
            </View>
          </Card>

          {/* Actions */}
          <PrimaryButton
            label="Cancel"
            onPress={() => {
              Alert.alert('Cancel appointment', 'Are you sure you want to cancel this appointment?', [
                { text: 'Keep appointment', style: 'cancel' },
                {
                  text: 'Cancel appointment', style: 'destructive',
                  onPress: async () => {
                    try {
                      const item = await changeAppointment(appointment.id, { action: 'cancel' });
                      setAppointment(item);
                    } catch (error) {
                      Alert.alert('Could not cancel', error.message);
                    }
                  },
                },
              ]);
            }}
            style={{ marginTop: s(22), width: '100%' }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setPreferredDay('');
              setPreferredTime('');
              setReason('');
              setRescheduleError('');
              setRescheduleOpen(true);
            }}
            style={{
              marginTop: s(12),
              height: s(48),
              borderRadius: 999,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: '#E8E0D8',
              alignItems: 'center',
              justifyContent: 'center',
              ...shadows.card,
            }}
          >
            <Text style={{ fontSize: fs(14), fontWeight: '600', color: colors.ink }}>Reschedule</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={rescheduleOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(20,20,20,0.38)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: s(24),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              maxHeight: '92%',
              borderRadius: s(18),
              backgroundColor: '#FFFFFF',
              padding: s(18),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(16) }}>
              <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: colors.ink }}>
                Appointment Schedule
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close reschedule"
                hitSlop={10}
                onPress={() => setRescheduleOpen(false)}
              >
                <Ionicons name="close" size={s(18)} color={colors.muted} />
              </Pressable>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: s(2) }}
            >
              <Text style={{ fontSize: fs(12), fontWeight: '600', color: colors.ink, marginBottom: s(8) }}>
                Select Day
              </Text>
              <BookingCalendar
                title=""
                compact
                selectedDate={preferredDay}
                minDate={toDateKey(new Date())}
                onSelect={(value) => {
                  const selected = new Date(`${value}T00:00:00`);
                  if (selected.getDay() === 0) {
                    setPreferredDay('');
                    setPreferredTime('');
                    setRescheduleError('This doctor is unavailable on Sunday.');
                    return;
                  }
                  setPreferredDay(value);
                  setPreferredTime('');
                  setRescheduleError('');
                }}
              />

              <Text style={{ marginTop: s(14), fontSize: fs(12), fontWeight: '600', color: colors.ink, marginBottom: s(8) }}>
                Select Time
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {rescheduleSlots.map((slot) => {
                  const active = preferredTime === slot;
                  return (
                    <Pressable
                      key={slot}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active, disabled: !preferredDay }}
                      disabled={!preferredDay}
                      onPress={() => {
                        setPreferredTime(slot);
                        setRescheduleError('');
                      }}
                      style={{
                        width: '48%',
                        height: s(50),
                        borderRadius: s(10),
                        borderWidth: 1,
                        borderColor: active ? BRAND : '#EFEAE5',
                        backgroundColor: active ? BRAND : '#FFFFFF',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: s(8),
                        opacity: preferredDay ? 1 : 0.45,
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        numberOfLines={2}
                        style={{ color: active ? '#FFFFFF' : colors.ink, fontSize: fs(9), fontWeight: '700', textAlign: 'center' }}
                      >
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ marginTop: s(6), fontSize: fs(12), fontWeight: '600', color: colors.ink, marginBottom: s(8) }}>
                Reason For Reschedule
              </Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Write your reason"
                placeholderTextColor={colors.muted}
                multiline
                textAlignVertical="top"
                style={{
                  height: s(82),
                  borderRadius: s(12),
                  borderWidth: 1,
                  borderColor: '#EFEAE5',
                  paddingHorizontal: s(12),
                  paddingVertical: s(10),
                  fontSize: fs(11),
                  color: colors.ink,
                }}
              />

              {rescheduleError ? (
                <Text style={{ color: colors.danger, fontSize: fs(10), textAlign: 'center', marginTop: s(8) }}>
                  {rescheduleError}
                </Text>
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={async () => {
                  if (!preferredDay) {
                    setRescheduleError('Please select a reschedule date.');
                    return;
                  }
                  if (!preferredTime) {
                    setRescheduleError('Please select an available time.');
                    return;
                  }
                  if (!reason.trim()) {
                    setRescheduleError('Please write a reason for rescheduling.');
                    return;
                  }
                  const start = preferredTime.split(' - ')[0];
                  try {
                    const item = await changeAppointment(appointment.id, {
                      action: 'reschedule', date: preferredDay, time: start, reason,
                    });
                    setAppointment(item);
                    setRescheduleOpen(false);
                    setRescheduleError('');
                    setRescheduleSuccess(true);
                  } catch (error) {
                    setRescheduleError(error.message);
                  }
                }}
                style={{
                  height: s(48),
                  borderRadius: 999,
                  backgroundColor: BRAND,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: s(14),
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: fs(13), fontWeight: '700' }}>Confirm</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={rescheduleSuccess}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleSuccess(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(20,20,20,0.38)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: s(24),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 340,
              borderRadius: s(18),
              backgroundColor: '#FFFFFF',
              padding: s(20),
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: s(64),
                height: s(64),
                borderRadius: s(32),
                backgroundColor: '#2BB673',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark" size={s(36)} color="#FFFFFF" />
            </View>
            <Text
              style={{
                marginTop: s(16),
                fontSize: fs(18),
                fontWeight: '700',
                color: BRAND,
                textAlign: 'center',
              }}
            >
              Rescheduled Successfully
            </Text>
            <Text
              style={{
                marginTop: s(8),
                fontSize: fs(11),
                color: colors.desc,
                textAlign: 'center',
              }}
            >
              Your appointment reschedule request was submitted successfully.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setRescheduleSuccess(false);
                navigateToTab(navigation, TAB_ROUTES.Appointments);
              }}
              style={{
                height: s(48),
                borderRadius: 999,
                backgroundColor: BRAND,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: s(20),
                width: '100%',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: fs(13), fontWeight: '700' }}>
                Back To Appointments
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
