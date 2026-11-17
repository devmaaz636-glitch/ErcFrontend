import { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import ClinicMapPreview from '../components/ClinicMapPreview';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import {
  clinicMapsUrl,
  getPatientClinic,
  patientTreatmentPrice,
} from '../lib/patientClinic';
import { colors, shadows, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

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
  const { user } = useSession();

  const appointment = route.params?.appointment || {};
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
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
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
                  width: s(40),
                  height: s(40),
                  borderRadius: 10,
                  backgroundColor: '#FDECEC',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="document-text" size={s(20)} color="#E5484D" />
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
            onPress={() => navigation.goBack()}
            style={{ marginTop: s(22), width: '100%' }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => {}}
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
    </View>
  );
}
