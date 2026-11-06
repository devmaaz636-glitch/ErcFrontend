import { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, PrimaryButton } from '../components/ui';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/patientimage.png');
const treatmentThumb = require('../../assets/treatmentimage.png');

function formatDate(value) {
  if (!value) return 'Oct 06, 2026';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
}

function endTimeFromStart(time = '02:30 PM', minutes = 60) {
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

function buildDetail(item = {}) {
  const patient = item.patient || 'Umair Khan';
  const treatment = item.treatment || 'Laser Hair Removal';
  const start = item.requestedTime || item.time || '02:30 PM';
  const end = item.endTime || endTimeFromStart(start, item.durationMinutes || 60);
  const dateLabel = formatDate(item.requestedDate || item.date);
  const code = item.patientId || item.appointmentId || item.code || 'PT-2048';

  return {
    patient,
    patientId: code.startsWith('PT-') ? code : `PT-${String(code).replace(/\D/g, '') || '2048'}`,
    phone: item.phone || '03******34',
    ageGender: item.ageGender || '28 Years • Female',
    statusLabel: 'Confirmed',
    dateLabel,
    timeRange: `${start} - ${end}`,
    treatment,
    allergy: item.allergy || 'Penicillin',
    medication: item.medication || 'Current Medication',
    previousVisits: item.previousVisits || [
      {
        id: 'pv-1',
        title: treatment,
        meta: 'Laser • 30 Minutes',
        sessions: '6 Session',
        left: '2 Session Left',
      },
      {
        id: 'pv-2',
        title: treatment,
        meta: 'Laser • 30 Minutes',
        sessions: '6 Session',
        left: '2 Session Left',
      },
      {
        id: 'pv-3',
        title: treatment,
        meta: 'Laser • 30 Minutes',
        sessions: '6 Session',
        left: '2 Session Left',
      },
    ],
  };
}

function SectionHeader({ title, right }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: s(18),
        marginBottom: s(10),
      }}
    >
      <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }}>{title}</Text>
      {right}
    </View>
  );
}

function InfoRow({ icon, label, value, last }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: s(11),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: '#F1E7DD',
      }}
    >
      <View
        style={{
          width: s(30),
          height: s(30),
          borderRadius: s(15),
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(12),
        }}
      >
        <Ionicons name={icon} size={s(14)} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.desc, fontSize: fs(9) }}>{label}</Text>
        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: 2 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function PreviousVisitCard({ item, onView }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: s(12),
        marginBottom: s(12),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={treatmentThumb}
          contentFit="cover"
          style={{
            width: s(44),
            height: s(44),
            borderRadius: s(22),
            backgroundColor: colors.fieldAlt,
          }}
        />
        <View style={{ flex: 1, marginLeft: s(10) }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ flex: 1, marginRight: s(8) }}>
              <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '700' }} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(9), marginTop: 2 }}>{item.meta}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(8) }}>
                <Text style={{ color: colors.brand, fontSize: fs(11), fontWeight: '700' }}>
                  {item.sessions}
                </Text>
                <Text style={{ color: colors.desc, fontSize: fs(10), marginLeft: s(8) }}>
                  {item.left}
                </Text>
              </View>
            </View>
            <View
              style={{
                backgroundColor: colors.successBg,
                borderRadius: 999,
                paddingHorizontal: s(8),
                paddingVertical: s(4),
              }}
            >
              <Text style={{ color: colors.success, fontSize: fs(8), fontWeight: '600' }}>
                Completed
              </Text>
            </View>
          </View>
        </View>
      </View>

      <PrimaryButton
        label="View Details"
        onPress={onView}
        size="sm"
        style={{ marginTop: s(12), width: '100%', alignSelf: 'center' }}
      />
    </View>
  );
}

export default function DoctorReviewHistoryScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);

  const detail = useMemo(() => buildDetail(route.params?.item || {}), [route.params?.item]);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 30 }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.brand}
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}>
                Appointment Detail
              </Text>
              <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 1 }}>Doctor</Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          {/* Patient card */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: s(14),
              marginTop: s(18),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <Image
                source={patientImage}
                contentFit="cover"
                style={{
                  width: s(52),
                  height: s(52),
                  borderRadius: s(26),
                  backgroundColor: colors.fieldAlt,
                }}
              />
              <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
                <Text style={{ color: colors.ink, fontSize: fs(14), fontWeight: '700' }}>
                  {detail.patient}
                </Text>
                <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 3 }}>
                  Patient ID: {detail.patientId}
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: colors.successBg,
                  borderRadius: 999,
                  paddingHorizontal: s(10),
                  paddingVertical: s(5),
                }}
              >
                <Text style={{ color: colors.success, fontSize: fs(9), fontWeight: '600' }}>
                  {detail.statusLabel}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(12) }}>
              <Ionicons name="call-outline" size={s(12)} color={colors.desc} />
              <Text style={{ color: colors.desc, fontSize: fs(10), marginLeft: 6 }}>{detail.phone}</Text>
              <View style={{ width: s(14) }} />
              <Ionicons name="person-outline" size={s(12)} color={colors.desc} />
              <Text style={{ color: colors.desc, fontSize: fs(10), marginLeft: 6 }}>
                {detail.ageGender}
              </Text>
            </View>
          </View>

          {/* Appointment Information */}
          <SectionHeader
            title="Appointment Information"
            right={
              <Pressable
                accessibilityRole="button"
                onPress={() => {}}
                style={{
                  height: s(28),
                  paddingHorizontal: s(14),
                  borderRadius: 999,
                  backgroundColor: colors.brand,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: colors.white, fontSize: fs(10), fontWeight: '600' }}>
                  Reschedule
                </Text>
              </Pressable>
            }
          />
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingHorizontal: s(14),
              paddingVertical: s(4),
            }}
          >
            <InfoRow icon="calendar-outline" label="Requested Date" value={detail.dateLabel} />
            <InfoRow icon="time-outline" label="Requested Time" value={detail.timeRange} />
            <InfoRow icon="sparkles-outline" label="Treatment" value={detail.treatment} last />
          </View>

          {/* Medical Alerts — labels left, values right */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginTop: s(18),
              marginBottom: s(4),
            }}
          >
            <View style={{ flex: 1, marginRight: s(12) }}>
              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }}>
                Medical Alerts
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 4 }}>
                Important Information To Review Before Consultation.
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => {}} hitSlop={8}>
              <Text style={{ color: colors.brand, fontSize: fs(11), fontWeight: '600' }}>See All</Text>
            </Pressable>
          </View>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingVertical: s(14),
              paddingHorizontal: s(14),
              marginTop: s(10),
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: s(14),
              }}
            >
              <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '500' }}>Allergies</Text>
              <View
                style={{
                  backgroundColor: colors.dangerBg,
                  borderRadius: 999,
                  paddingHorizontal: s(12),
                  paddingVertical: s(5),
                }}
              >
                <Text style={{ color: colors.danger, fontSize: fs(10), fontWeight: '600' }}>
                  {detail.allergy}
                </Text>
              </View>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '500' }}>
                Medications
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(11) }}>{detail.medication}</Text>
            </View>
          </View>

          {/* Previous Visit Summary */}
          <SectionHeader title="Previous Visit Summary" />
          {detail.previousVisits.map((visit) => (
            <PreviousVisitCard key={visit.id} item={visit} onView={() => {}} />
          ))}

          <PrimaryButton
            label="Back To Appointments"
            onPress={() => navigation.goBack()}
            size="sm"
            style={{ marginTop: s(10), width: '100%', alignSelf: 'center' }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
