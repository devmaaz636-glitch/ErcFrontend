import { useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Text from '../components/AppText';
import {
  NotificationBellButton,
  PrimaryButton,
  SearchField,
  SectionHeader,
} from '../components/ui';
import { useSession } from '../context/SessionContext';
import { createDoctorHomeSeed } from '../lib/doctorSeed';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const doctorHeaderImage = require('../../assets/doctorimg.png');
const patientImage = require('../../assets/patientimage.png');

const STATUS_CHIP = {
  upcoming: { label: 'Upcoming', bg: '#EDE8F8', color: '#6B5CA5' },
  completed: { label: 'Completed', bg: colors.successBg, color: colors.success },
  pending: { label: 'Pending', bg: colors.warningBg, color: colors.brand },
  due: { label: 'Due', bg: '#FBE8D8', color: '#E39B4B' },
  canceled: { label: 'Canceled', bg: colors.dangerBg, color: colors.danger },
};

const CARD_RADIUS = 16;

function StatusChip({ status }) {
  const preset = STATUS_CHIP[String(status || '').toLowerCase()] || STATUS_CHIP.pending;
  return (
    <View
      style={{
        backgroundColor: preset.bg,
        borderRadius: 999,
        paddingHorizontal: s(10),
        paddingVertical: s(5),
      }}
    >
      <Text style={{ color: preset.color, fontSize: fs(8, 8), fontWeight: '600' }}>{preset.label}</Text>
    </View>
  );
}

/** Compact card CTA — global PrimaryButton sm + brand bg. */
function DoctorActionButton({ label, onPress }) {
  return (
    <PrimaryButton
      label={label}
      onPress={onPress}
      size="sm"
      style={{ marginTop: s(12), width: '100%' }}
    />
  );
}

function StatCard({ item }) {
  return (
    <View
      style={{
        width: '48%',
        minHeight: s(100),
        borderRadius: CARD_RADIUS,
        padding: s(14),
        marginBottom: s(12),
        backgroundColor: colors.brand,
      }}
    >
      <Ionicons name={item.icon || 'ellipse-outline'} size={s(18)} color={colors.white} />
      <Text style={{ color: colors.white, fontSize: fs(22), fontWeight: '700', marginTop: s(10) }}>
        {item.value}
      </Text>
      <Text style={{ color: colors.white, fontSize: fs(11), marginTop: 2 }} numberOfLines={2}>
        {item.label}
      </Text>
    </View>
  );
}

function NextAppointmentCard({ item, onReview }) {
  if (!item) return null;
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: CARD_RADIUS,
        padding: s(14),
        marginBottom: s(8),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={patientImage}
          contentFit="cover"
          style={{ width: s(48), height: s(48), borderRadius: s(24), backgroundColor: colors.fieldAlt }}
        />
        <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
          <Text style={{ color: colors.ink, fontSize: fs(14), fontWeight: '700' }}>{item.patient}</Text>
          {item.patientId ? (
            <Text style={{ color: colors.muted, fontSize: fs(9), marginTop: 3 }}>
              Patient ID: {item.patientId}
            </Text>
          ) : null}
        </View>
        <StatusChip status={item.status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(12) }}>
        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600' }}>{item.treatment}</Text>
        <Ionicons name="time-outline" size={s(12)} color={colors.muted} style={{ marginLeft: s(10) }} />
        <Text style={{ color: colors.muted, fontSize: fs(11), marginLeft: 4 }}>{item.time}</Text>
      </View>

      <DoctorActionButton label="Review History" onPress={onReview} />
    </View>
  );
}

function TodayAppointmentsCard({ items }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: CARD_RADIUS,
        paddingHorizontal: s(12),
        paddingVertical: s(4),
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => (
        <View
          key={item.id}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: s(12),
            borderTopWidth: index === 0 ? 0 : 1,
            borderTopColor: '#F1E7DD',
          }}
        >
          <Image
            source={patientImage}
            contentFit="cover"
            style={{ width: s(40), height: s(40), borderRadius: s(20), backgroundColor: colors.fieldAlt }}
          />
          <View style={{ flex: 1, marginLeft: s(10), marginRight: s(8) }}>
            <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '700' }}>{item.patient}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ color: colors.muted, fontSize: fs(9) }}>{item.treatment}</Text>
              <Text style={{ color: colors.muted, fontSize: fs(9) }}>  ·  </Text>
              <Ionicons name="time-outline" size={s(11)} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: fs(9), marginLeft: 3 }}>{item.time}</Text>
            </View>
          </View>
          <StatusChip status={item.status} />
        </View>
      ))}
    </View>
  );
}

function FollowUpCard({ item, onView }) {
  if (!item) return null;
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: CARD_RADIUS,
        padding: s(14),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={patientImage}
          contentFit="cover"
          style={{
            width: s(44),
            height: s(44),
            borderRadius: s(22),
            backgroundColor: colors.fieldAlt,
            marginRight: s(10),
          }}
        />
        <View style={{ flex: 1, marginRight: s(8) }}>
          <Text style={{ color: colors.ink, fontSize: fs(13), fontWeight: '700' }}>{item.patient}</Text>
          <Text style={{ color: colors.muted, fontSize: fs(10), marginTop: 4 }}>{item.treatment}</Text>
          <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 6 }}>{item.progressLabel}</Text>
        </View>
        <StatusChip status={item.status} />
      </View>
      <DoctorActionButton label="View Patient Record" onPress={onView} />
    </View>
  );
}

export default function DoctorHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();

  const seed = useMemo(
    () =>
      createDoctorHomeSeed({
        name: user?.name || 'Dr Zeeshan Forward',
        branchName: user?.branchName || 'Dubai Branch',
        branchId: user?.branchId || 'br-dubai',
      }),
    [user?.name, user?.branchName, user?.branchId]
  );

  const displayName = seed.doctor.name;
  const branchLabel = seed.doctor.branchName;

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
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 20 }}>
            <Image
              source={doctorHeaderImage}
              contentFit="cover"
              style={{
                width: s(40),
                height: s(40),
                borderRadius: s(20),
                backgroundColor: colors.fieldAlt,
              }}
            />
            <View style={{ flex: 1, marginLeft: s(10), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                Hi, {displayName} 👋
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location-sharp" size={s(11)} color={colors.brand} />
                <Text style={{ marginLeft: 2, fontSize: fs(11), color: colors.mutedBrand, fontWeight: '600' }}>
                  {branchLabel}
                </Text>
              </View>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <View style={{ marginTop: s(18) }}>
            <SearchField />
          </View>

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(22),
            }}
          >
            {seed.stats.map((item) => (
              <StatCard key={item.id} item={item} />
            ))}
          </View>

          <SectionHeader
            title="Next Appointment"
            onAction={() => navigation.navigate('AppointmentsTab')}
          />
          <NextAppointmentCard
            item={seed.nextAppointment}
            onReview={() =>
              navigation.navigate('DoctorReviewHistory', { item: seed.nextAppointment })
            }
          />

          <View style={{ marginTop: s(8) }}>
            <SectionHeader
              title="Today's Appointments"
              onAction={() => navigation.navigate('AppointmentsTab')}
            />
            <Text style={{ color: colors.muted, fontSize: fs(10), marginTop: -s(6), marginBottom: s(10) }}>
              {seed.todayLabel}
            </Text>
            <TodayAppointmentsCard items={seed.todayAppointments} />
          </View>

          <SectionHeader title="Follow Up Reminder" onAction={() => navigation.navigate('PatientsTab')} />
          <FollowUpCard
            item={seed.followUp}
            onView={() =>
              navigation.navigate('DoctorReviewHistory', {
                item: {
                  id: seed.followUp.id,
                  patient: seed.followUp.patient,
                  patientId: 'ERC-1025',
                  appointmentId: 'ERC-1025',
                  treatment: seed.followUp.treatment,
                  department: 'Laser',
                  doctor: seed.doctor.name,
                  specialty: seed.doctor.specialty,
                  status: 'upcoming',
                  requestedDate: '2026-11-06',
                  requestedTime: '11:00 AM',
                  time: '11:00 AM',
                  durationMinutes: 45,
                  duration: '45 Min',
                  price: 'AED 850',
                  branchName: seed.doctor.branchName,
                  phone: '03******88',
                  ageGender: '29 Years • Female',
                  allergy: 'Penicillin',
                  medication: 'Current Medication',
                },
              })
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
