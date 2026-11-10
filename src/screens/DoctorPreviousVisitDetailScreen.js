import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import DownloadPdfModal from '../components/DownloadPdfModal';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { downloadAppointmentPdf } from '../lib/appointmentPdf';
import { buildDoctorAppointmentDetail } from '../lib/doctorAppointmentDetail';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/patientimage.png');
const treatmentThumb = require('../../assets/treatmentimage.png');
const doctorImage = require('../../assets/doctorimg.png');

function ScheduleRow({ icon, label, value, last }) {
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

function SectionTitle({ title }) {
  return (
    <Text
      style={{
        fontSize: fs(14),
        fontWeight: '700',
        color: colors.ink,
        marginTop: s(18),
        marginBottom: s(10),
      }}
    >
      {title}
    </Text>
  );
}

export default function DoctorPreviousVisitDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const detail = useMemo(
    () =>
      buildDoctorAppointmentDetail({
        item: route.params?.appointment || {},
        visit: route.params?.item || {},
        user: user || {},
      }),
    [route.params?.appointment, route.params?.item, user]
  );

  const pdfFileName = `ERC-${detail.requestId || detail.patientId}.pdf`;

  async function handleDownloadPdf() {
    if (downloading) return;
    setDownloading(true);
    try {
      const result = await downloadAppointmentPdf(detail, { fileName: pdfFileName });
      if (!result?.canceled) {
        setDownloadOpen(false);
      }
    } catch {
      /* alert handled in helper */
    } finally {
      setDownloading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <DownloadPdfModal
        visible={downloadOpen}
        onClose={() => (downloading ? null : setDownloadOpen(false))}
        onDownload={handleDownloadPdf}
        loading={downloading}
        fileName={detail.documentName || pdfFileName}
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.brand}
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}>
                Appointment Details
              </Text>
              <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 1 }}>
                Request ID: {detail.requestId}
              </Text>
            </View>
          </View>

          {/* Patient Information */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: s(14),
              marginTop: s(18),
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Image
              source={patientImage}
              contentFit="cover"
              style={{
                width: s(48),
                height: s(48),
                borderRadius: s(24),
                backgroundColor: colors.fieldAlt,
              }}
            />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ color: colors.ink, fontSize: fs(13), fontWeight: '700' }}>
                {detail.patient || 'Patient Information'}
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 3 }}>
                Patient ID: {detail.patientId}
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 2 }}>{detail.phone}</Text>
            </View>
          </View>

          {/* Treatment Details */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: s(14),
              marginTop: s(12),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              <View style={{ flex: 1, marginLeft: s(12) }}>
                <Text style={{ color: colors.ink, fontSize: fs(13), fontWeight: '700' }}>
                  {detail.treatment}
                </Text>
                <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 3 }}>
                  Department: {detail.department}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: s(14) }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.desc, fontSize: fs(9) }}>Duration</Text>
                <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: 3 }}>
                  {detail.duration}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.desc, fontSize: fs(9) }}>Treatment Price</Text>
                <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: 3 }}>
                  {detail.price}
                </Text>
              </View>
            </View>
          </View>

          <SectionTitle title="Selected Doctor" />
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: s(14),
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Image
              source={doctorImage}
              contentFit="cover"
              style={{
                width: s(44),
                height: s(44),
                borderRadius: s(22),
                backgroundColor: colors.fieldAlt,
              }}
            />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ color: colors.ink, fontSize: fs(13), fontWeight: '700' }}>
                {detail.doctorName}
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 3 }}>
                {detail.doctorSpecialty}
              </Text>
            </View>
          </View>

          <SectionTitle title="Appointment Schedule" />
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingHorizontal: s(14),
              paddingVertical: s(4),
            }}
          >
            <ScheduleRow icon="calendar-outline" label="Requested Date" value={detail.dateLabel} />
            <ScheduleRow icon="time-outline" label="Requested Time" value={detail.timeRange} />
            <ScheduleRow icon="business-outline" label="Branch" value={detail.branch} last />
          </View>

          <SectionTitle title="Patient Documents" />
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: s(14),
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: s(36),
                height: s(40),
                borderRadius: 6,
                backgroundColor: colors.dangerBg,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: s(12),
              }}
            >
              <Text style={{ color: colors.danger, fontSize: fs(8), fontWeight: '700' }}>PDF</Text>
            </View>
            <Text style={{ flex: 1, color: colors.ink, fontSize: fs(12), fontWeight: '600' }}>
              {detail.documentName}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Download appointment PDF"
              hitSlop={8}
              onPress={() => setDownloadOpen(true)}
            >
              <Ionicons name="download-outline" size={s(18)} color={colors.brand} />
            </Pressable>
          </View>

          <PrimaryButton
            label="Back To Appointments"
            onPress={() => navigation.goBack()}
            size="sm"
            style={{ marginTop: s(22), width: '100%', alignSelf: 'center' }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
