import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import MedicalAlertsModal from '../components/MedicalAlertsModal';
import { IconCircleButton, NotificationBellButton, PrimaryButton } from '../components/ui';
import { downloadAppointmentPdf } from '../lib/appointmentPdf';
import { buildDoctorAppointmentDetail } from '../lib/doctorAppointmentDetail';
import { useSession } from '../context/SessionContext';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/patientimage.png');
const treatmentThumb = require('../../assets/treatmentimage.png');

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
  const { user } = useSession();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const sourceItem = route.params?.item;
  const detail = useMemo(
    () => buildDoctorAppointmentDetail({ item: sourceItem || {}, user: user || {} }),
    [sourceItem, user]
  );

  const allergies = useMemo(
    () =>
      detail.allergies || [
        detail.allergy,
        detail.allergy,
        detail.allergy,
        detail.allergy,
        detail.allergy,
      ],
    [detail.allergies, detail.allergy]
  );
  const medications = useMemo(
    () =>
      detail.medications ||
      Array.from({ length: 7 }, () => ({ name: detail.medication, frequency: 'Weekly' })),
    [detail.medications, detail.medication]
  );

  function openPreviousVisit(visit) {
    navigation.navigate('DoctorPreviousVisitDetail', {
      item: visit,
      appointment: sourceItem || detail.raw || {},
    });
  }

  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadAppointmentPdf(detail, {
        fileName: `ERC-Appointment-${detail.requestId || detail.patientId}.pdf`,
      });
    } catch {
      /* alert handled in helper */
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <MedicalAlertsModal
        visible={alertsOpen}
        onClose={() => setAlertsOpen(false)}
        allergies={allergies}
        medications={medications}
      />

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
            <Pressable
              accessibilityRole="button"
              onPress={() => setAlertsOpen(true)}
              hitSlop={8}
            >
              <Text style={{ color: colors.brand, fontSize: fs(11), fontWeight: '600' }}>See All</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => setAlertsOpen(true)}
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
          </Pressable>

          {/* Previous Visit Summary */}
          <SectionHeader title="Previous Visit Summary" />
          {detail.previousVisits.map((visit) => (
            <PreviousVisitCard
              key={visit.id}
              item={visit}
              onView={() => openPreviousVisit(visit)}
            />
          ))}

          <PrimaryButton
            label={downloading ? 'Preparing PDF…' : 'Download Appointment PDF'}
            onPress={handleDownloadPdf}
            loading={downloading}
            size="sm"
            style={{ marginTop: s(10), width: '100%', alignSelf: 'center' }}
          />

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
