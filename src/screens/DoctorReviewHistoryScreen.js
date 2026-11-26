import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import BookingCalendar, { toDateKey } from '../components/BookingCalendar';
import DownloadPdfModal from '../components/DownloadPdfModal';
import { Avatar, PersonCard, StateNotice, StatusChip, cardStyle } from '../components/doctor/DoctorUI';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useDoctorQuery } from '../hooks/useDoctorQuery';
import { downloadAppointmentPdf } from '../lib/appointmentPdf';
import {
  fetchDoctorAppointment,
  fetchDoctorSlots,
  openDoctorDocument,
  saveDoctorPatientMedical,
  updateDoctorAppointment,
} from '../lib/doctorPortal';
import { formatRegionPrice } from '../lib/regionPricing';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const inputStyle = {
  borderWidth: 1,
  borderColor: '#EFE5DB',
  borderRadius: 12,
  padding: s(12),
  minHeight: s(72),
  textAlignVertical: 'top',
  color: colors.ink,
  fontSize: fs(13),
  marginTop: s(8),
};

function Title({ children, action, onAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(20), marginBottom: s(8) }}>
      <Text style={{ flex: 1, fontSize: fs(14), fontWeight: '700', color: colors.ink }}>{children}</Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8}>
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: colors.brand }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Row({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: s(6) }}>
      <Text style={{ width: '38%', fontSize: fs(11), color: colors.desc }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: fs(12), fontWeight: '600', color: colors.ink }}>{value || '—'}</Text>
    </View>
  );
}

function Sheet({ visible, title, onClose, children }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: s(18) }}
      >
        <View style={[cardStyle, { maxHeight: '90%', width: '100%', maxWidth: 420, alignSelf: 'center' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: fs(15), fontWeight: '700', color: colors.ink }}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={s(20)} color={colors.ink} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function DoctorReviewHistoryScreen() {
  const navigation = useNavigation();
  const appointmentId = useRoute().params?.appointmentId;
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const { user } = useSession();
  const loader = useCallback(() => fetchDoctorAppointment(appointmentId), [appointmentId]);
  const { data, error, loading, reload } = useDoctorQuery(loader);

  const [sheet, setSheet] = useState(null); // 'cancel' | 'complete' | 'reschedule' | 'medical'
  const [text, setText] = useState('');
  const [medications, setMedications] = useState('');
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    setSlots([]);
    setTime('');
    if (sheet !== 'reschedule' || !date) return undefined;
    fetchDoctorSlots(date)
      .then((next) => active && setSlots(next))
      .catch((slotError) => active && setSheetError(slotError.message));
    return () => {
      active = false;
    };
  }, [sheet, date]);

  const appointment = data?.appointment;
  const patient = data?.patient;
  const medical = data?.medical;
  const price = appointment
    ? formatRegionPrice(appointment.basePrice, patient?.region || user?.region, '').priceLabel.trim()
    : '';
  const today = toDateKey(new Date());

  function openSheet(name) {
    setSheetError('');
    setDate('');
    setText(name === 'medical' ? (medical?.allergies || []).join('\n') : '');
    setMedications(
      (medical?.medications || [])
        .map((item) => (item.frequency ? `${item.name} - ${item.frequency}` : item.name))
        .join('\n')
    );
    setSheet(name);
  }

  async function run(task) {
    if (saving) return;
    setSaving(true);
    setSheetError('');
    try {
      await task();
      setSheet(null);
      await reload();
    } catch (actionError) {
      if (sheet) setSheetError(actionError.message);
      else Alert.alert('Something went wrong', actionError.message);
    } finally {
      setSaving(false);
    }
  }

  const act = (payload) => run(() => updateDoctorAppointment(appointmentId, payload));

  function saveMedical() {
    const lines = (value) => value.split('\n').map((line) => line.trim()).filter(Boolean);
    return run(() =>
      saveDoctorPatientMedical(appointment.patientUid, {
        allergies: lines(text),
        medications: lines(medications).map((line) => {
          const [name, ...rest] = line.split(' - ');
          return { name, frequency: rest.join(' - ') };
        }),
      })
    );
  }

  async function downloadPdf() {
    setDownloading(true);
    try {
      await downloadAppointmentPdf(
        {
          title: 'Appointment Details',
          requestId: appointment.requestId,
          patient: patient.name,
          phone: patient.phone,
          ageGender: patient.gender,
          treatment: appointment.treatment,
          department: appointment.department,
          duration: appointment.duration,
          price,
          doctorName: appointment.doctorName,
          doctorSpecialty: appointment.doctorSpecialty,
          dateLabel: appointment.dateLabel,
          time: appointment.time,
          timeRange: `${appointment.time} - ${appointment.endTime}`,
          branch: user?.branchName,
          statusLabel: appointment.status === 'upcoming' ? 'Confirmed' : appointment.status,
          allergy: medical.allergies.join(', '),
          medication: medical.medications.map((item) => item.name).join(', '),
        },
        { fileName: `${appointment.requestId}.pdf` }
      );
      setDownloadOpen(false);
    } catch (pdfError) {
      Alert.alert('Could not create the PDF', pdfError.message);
    } finally {
      setDownloading(false);
    }
  }

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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton name="chevron-back" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
            <Text style={{ flex: 1, marginLeft: s(12), fontSize: fs(16), fontWeight: '700', color: colors.ink }}>
              Appointment Details
            </Text>
            {appointment ? <StatusChip status={appointment.status} /> : null}
          </View>

          <StateNotice loading={loading && !data} error={error} onRetry={reload} />

          {appointment ? (
            <>
              <View style={[cardStyle, { marginTop: s(16), flexDirection: 'row', alignItems: 'center' }]}>
                <Avatar />
                <View style={{ flex: 1, marginLeft: s(10) }}>
                  <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }}>{patient.name}</Text>
                  <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.desc }}>
                    {[patient.gender, patient.phone].filter(Boolean).join(' · ') || 'Profile not completed'}
                  </Text>
                  {patient.email ? (
                    <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.desc }}>{patient.email}</Text>
                  ) : null}
                </View>
              </View>

              <Title>Appointment Information</Title>
              <View style={cardStyle}>
                <Row label="Request ID" value={appointment.requestId} />
                <Row label="Treatment" value={appointment.treatment} />
                <Row label="Date" value={appointment.dateLabel} />
                <Row label="Time" value={`${appointment.time} - ${appointment.endTime}`} />
                <Row label="Duration" value={appointment.duration} />
                <Row label="Price" value={price} />
                {appointment.notes ? <Row label="Patient note" value={appointment.notes} /> : null}
                {appointment.cancelReason ? <Row label="Cancel reason" value={appointment.cancelReason} /> : null}
                {appointment.visitNotes ? <Row label="Visit notes" value={appointment.visitNotes} /> : null}
              </View>

              <Title action="Edit" onAction={() => openSheet('medical')}>
                Medical Information
              </Title>
              <View style={cardStyle}>
                <Row label="Allergies" value={medical.allergies.join(', ') || 'None recorded'} />
                <Row
                  label="Medications"
                  value={
                    medical.medications
                      .map((item) => (item.frequency ? `${item.name} (${item.frequency})` : item.name))
                      .join(', ') || 'None recorded'
                  }
                />
              </View>

              <Title>Documents</Title>
              <View style={[cardStyle, { flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="document-text" size={s(22)} color={colors.brand} />
                <Text style={{ flex: 1, marginLeft: s(10), fontSize: fs(12), color: colors.ink }} numberOfLines={1}>
                  {appointment.document?.name || 'No document attached by the patient'}
                </Text>
                {appointment.document ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Download patient document"
                    hitSlop={10}
                    onPress={() =>
                      openDoctorDocument(appointmentId).catch((docError) =>
                        Alert.alert('Could not open document', docError.message)
                      )
                    }
                  >
                    <Ionicons name="download-outline" size={s(20)} color={colors.ink} />
                  </Pressable>
                ) : null}
              </View>
              <Pressable accessibilityRole="button" onPress={() => setDownloadOpen(true)} style={{ marginTop: s(10) }}>
                <Text style={{ fontSize: fs(12), fontWeight: '700', color: colors.brand, textAlign: 'center' }}>
                  Download appointment summary (PDF)
                </Text>
              </Pressable>

              <Title>Other Visits With You</Title>
              {data.history.length ? (
                data.history.map((visit) => (
                  <PersonCard
                    key={visit.id}
                    name={visit.treatment}
                    line={`${visit.dateLabel} · ${visit.time}`}
                    subline={visit.visitNotes}
                    status={visit.status}
                    onPress={() => navigation.push('DoctorReviewHistory', { appointmentId: visit.id })}
                  />
                ))
              ) : (
                <StateNotice empty="No other visits yet." />
              )}

              {appointment.status === 'pending' ? (
                <PrimaryButton
                  label="Confirm Booking"
                  loading={saving && !sheet}
                  onPress={() => act({ action: 'confirm' })}
                  style={{ marginTop: s(22), width: '100%' }}
                />
              ) : null}
              {appointment.status === 'upcoming' && appointment.date <= today ? (
                <PrimaryButton
                  label="Mark Completed"
                  onPress={() => openSheet('complete')}
                  style={{ marginTop: s(22), width: '100%' }}
                />
              ) : null}
              {appointment.status === 'pending' || appointment.status === 'upcoming' ? (
                <View style={{ flexDirection: 'row', gap: s(10), marginTop: s(12) }}>
                  {[
                    ['reschedule', 'Reschedule', colors.ink],
                    ['cancel', 'Cancel', colors.danger],
                  ].map(([name, label, color]) => (
                    <Pressable
                      key={name}
                      accessibilityRole="button"
                      onPress={() => openSheet(name)}
                      style={[cardStyle, { flex: 1, alignItems: 'center' }]}
                    >
                      <Text style={{ fontSize: fs(13), fontWeight: '600', color }}>{label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </ScrollView>

      <Sheet
        visible={Boolean(sheet)}
        title={
          {
            cancel: 'Cancel appointment',
            complete: 'Complete visit',
            reschedule: 'Reschedule',
            medical: 'Medical information',
          }[sheet] || ''
        }
        onClose={() => setSheet(null)}
      >
        {sheet === 'cancel' || sheet === 'complete' ? (
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder={sheet === 'cancel' ? 'Reason shown to the patient (required)' : 'Visit notes (optional)'}
            placeholderTextColor={colors.muted}
            style={inputStyle}
          />
        ) : null}

        {sheet === 'medical' ? (
          <>
            <Text style={{ marginTop: s(12), fontSize: fs(11), color: colors.desc }}>Allergies, one per line</Text>
            <TextInput value={text} onChangeText={setText} multiline style={inputStyle} />
            <Text style={{ marginTop: s(12), fontSize: fs(11), color: colors.desc }}>
              Medications, one per line as: name - how often
            </Text>
            <TextInput value={medications} onChangeText={setMedications} multiline style={inputStyle} />
          </>
        ) : null}

        {sheet === 'reschedule' ? (
          <>
            <BookingCalendar
              compact
              title="New date"
              selectedDate={date || undefined}
              minDate={new Date()}
              onSelect={(value) => setDate(toDateKey(value))}
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(10) }}>
              {slots.map((slot) => (
                <Pressable
                  key={slot}
                  accessibilityRole="button"
                  onPress={() => setTime(slot)}
                  style={{
                    paddingHorizontal: s(12),
                    paddingVertical: s(8),
                    borderRadius: 999,
                    backgroundColor: time === slot ? colors.brand : '#F6E6D6',
                  }}
                >
                  <Text style={{ fontSize: fs(11), color: time === slot ? colors.white : colors.ink }}>{slot}</Text>
                </Pressable>
              ))}
              {date && !slots.length ? (
                <Text style={{ fontSize: fs(11), color: colors.desc }}>No free times on this day.</Text>
              ) : null}
            </View>
          </>
        ) : null}

        {sheetError ? (
          <Text style={{ marginTop: s(10), fontSize: fs(11), color: colors.danger }}>{sheetError}</Text>
        ) : null}
        <PrimaryButton
          label={sheet === 'cancel' ? 'Cancel Appointment' : 'Save'}
          loading={saving}
          disabled={sheet === 'reschedule' ? !date || !time : sheet === 'cancel' && !text.trim()}
          onPress={() => {
            if (sheet === 'medical') saveMedical();
            else if (sheet === 'reschedule') act({ action: 'reschedule', date, time });
            else if (sheet === 'cancel') act({ action: 'cancel', reason: text.trim() });
            else act({ action: 'complete', notes: text.trim() });
          }}
          style={{ marginTop: s(16), width: '100%' }}
        />
      </Sheet>

      <DownloadPdfModal
        visible={downloadOpen}
        onClose={() => setDownloadOpen(false)}
        onDownload={downloadPdf}
        loading={downloading}
        fileName={appointment ? `${appointment.requestId}.pdf` : 'appointment.pdf'}
      />
    </View>
  );
}
