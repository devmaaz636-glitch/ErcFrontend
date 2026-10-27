import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { fetchManagerAppointmentRequest, updateManagerAppointmentRequest } from '../lib/clinic';
import { managerDashboard as theme } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/userprofile.png');
const doctorImage = require('../../assets/doctor.png');

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function InfoRow({ icon, label, value, last = false }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: s(6),
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: theme.colors.border,
    }}>
      <View style={{
        width: s(25),
        height: s(25),
        borderRadius: s(13),
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: s(9),
        backgroundColor: theme.colors.requestIcon,
      }}>
        <Ionicons name={icon} size={s(14)} color="#fff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7) }}>{label}</Text>
        <Text style={{ color: theme.colors.text, fontSize: fs(10, 8), fontWeight: '500', marginTop: 2 }}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function PaymentRow({ label, value, last = false }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: s(7),
      borderBottomWidth: last ? 0 : 1,
      borderBottomColor: theme.colors.border,
    }}>
      <Text style={{ color: theme.colors.text, fontSize: fs(10, 8) }}>{label}</Text>
      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7) }}>{value}</Text>
    </View>
  );
}

function Section({ title, children, style }) {
  return (
    <View style={style}>
      {title ? (
        <Text style={{ color: theme.colors.text, fontSize: fs(12), fontWeight: '700', marginBottom: s(8) }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function Card({ children, style }) {
  return (
    <View style={[{
      backgroundColor: theme.colors.card,
      borderRadius: s(theme.radius.requestCard),
      paddingHorizontal: s(12),
      paddingVertical: s(10),
    }, style]}>
      {children}
    </View>
  );
}

export default function AppointmentRequestDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(10);
  const requestId = route.params?.requestId;
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [reasonModal, setReasonModal] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    let active = true;
    fetchManagerAppointmentRequest(requestId)
      .then((item) => {
        if (!active) return;
        setRequest(item);
        setDate(item.requestedDate || '');
        setTime(item.requestedTime || '');
      })
      .catch((err) => {
        if (active) setError(err.message || 'Could not load appointment request.');
      });
    return () => {
      active = false;
    };
  }, [requestId]);

  const statusLabel = useMemo(() => {
    const status = String(request?.status || 'pending');
    return status.charAt(0).toUpperCase() + status.slice(1);
  }, [request?.status]);

  async function review(action, extra = {}) {
    setSaving(true);
    setError('');
    try {
      const item = await updateManagerAppointmentRequest(requestId, { action, ...extra });
      setRequest(item);
      setRescheduling(false);
      setReasonModal(false);
      if (action === 'approve') {
        setOutcome('approved');
      } else if (action === 'reschedule') {
        setOutcome('delivered');
      }
    } catch (err) {
      setError(err.message || 'Could not update appointment request.');
    } finally {
      setSaving(false);
    }
  }

  const canReview = request?.status === 'pending';

  function closeOutcome() {
    setOutcome(null);
    navigation.goBack();
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.page }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad - s(2),
          paddingHorizontal: s(21),
          paddingBottom: s(28),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: theme.layout.maxWidth }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(19) }}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={{ width: s(40), height: s(40), borderRadius: s(20), backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center' }}
            >
              <Ionicons name="chevron-back" size={s(19)} color={theme.colors.secondaryText} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: s(10) }}>
              <Text style={{ color: theme.colors.text, fontSize: fs(15), fontWeight: '500' }}>Appointment Details</Text>
              <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7), marginTop: 2 }}>
                Request ID: {request?.appointmentId || request?.id || '—'}
              </Text>
            </View>
            <View style={{ backgroundColor: theme.colors.pendingSoft, borderRadius: s(8), paddingHorizontal: s(10), paddingVertical: s(4) }}>
              <Text style={{ color: theme.colors.pending, fontSize: fs(7, 7), fontWeight: '600' }}>{statusLabel}</Text>
            </View>
          </View>

          {error ? (
            <Pressable onPress={() => setError('')} style={{ marginBottom: s(10) }}>
              <Text style={{ color: '#E5484D', fontSize: fs(9), textAlign: 'center' }}>{error}</Text>
            </Pressable>
          ) : null}

          {request ? (
            <>
              <Section title="Patient Information">
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={patientImage} contentFit="cover" style={{ width: s(38), height: s(38), borderRadius: s(19), marginRight: s(11) }} />
                    <View>
                      <Text style={{ color: theme.colors.text, fontSize: fs(11, 9), fontWeight: '500' }}>{request.patient || 'Patient'}</Text>
                      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7), marginTop: 3 }}>Patient ID: {request.patientId || '—'}</Text>
                      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7), marginTop: 3 }}>{request.patientPhone || 'Phone unavailable'}</Text>
                    </View>
                  </View>
                </Card>
              </Section>

              <Section title="" style={{ marginTop: s(15) }}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={patientImage} contentFit="cover" style={{ width: s(38), height: s(38), borderRadius: s(19), marginRight: s(11) }} />
                    <View>
                      <Text style={{ color: theme.colors.text, fontSize: fs(11, 9), fontWeight: '500' }}>{request.treatment || 'Treatment'}</Text>
                      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7), marginTop: 3 }}>Department: {request.department || 'General'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: s(11) }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: fs(8, 7) }}>Duration</Text>
                      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7), marginTop: 4 }}>{request.duration || '—'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: fs(8, 7) }}>Treatment Price</Text>
                      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7), marginTop: 4 }}>{request.treatmentPrice || '—'}</Text>
                    </View>
                  </View>
                </Card>
              </Section>

              <Section title="Selected Doctor" style={{ marginTop: s(24) }}>
                <Card>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image source={doctorImage} contentFit="contain" style={{ width: s(45), height: s(42), marginRight: s(10) }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.colors.text, fontSize: fs(10, 8), fontWeight: '600' }}>{request.doctor || 'Doctor'}</Text>
                      <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 7), marginTop: 3 }}>{request.doctorSpecialty || 'Specialist'}</Text>
                    </View>
                    <View style={{ backgroundColor: theme.colors.pendingSoft, borderRadius: s(8), paddingHorizontal: s(7), paddingVertical: s(3) }}>
                      <Text style={{ color: theme.colors.pending, fontSize: fs(7, 7) }}>Requested doctor</Text>
                    </View>
                  </View>
                </Card>
              </Section>

              <Section title="Appointment Schedule" style={{ marginTop: s(24) }}>
                <Card>
                  <InfoRow icon="calendar-outline" label="Requested Date" value={formatDate(request.requestedDate)} />
                  <InfoRow icon="time-outline" label="Requested Time" value={request.requestedTime || '—'} />
                  <InfoRow icon="business-outline" label="Branch" value={request.branch || 'Assigned branch'} last />
                </Card>
              </Section>

              <Section title="Payment Information" style={{ marginTop: s(24) }}>
                <Card>
                  <PaymentRow label="Payment Status" value={request.paymentStatus || 'Not Paid'} />
                  <PaymentRow label="Deposit Required" value={request.depositRequired || '—'} last />
                </Card>
              </Section>

              {canReview && !rescheduling ? (
                <>
                  <Pressable
                    disabled={saving}
                    onPress={() => review('approve')}
                    style={{ height: s(34), borderRadius: s(18), backgroundColor: theme.colors.brandButton || theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: s(23) }}
                  >
                    <Text style={{ color: '#fff', fontSize: fs(10), fontWeight: '500' }}>{saving ? 'Updating…' : 'Approve Request'}</Text>
                  </Pressable>
                  <Pressable
                    disabled={saving}
                    onPress={() => setReasonModal(true)}
                    style={{ height: s(34), borderRadius: s(18), backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', marginTop: s(10) }}
                  >
                    <Text style={{ color: theme.colors.secondaryText, fontSize: fs(10), fontWeight: '500' }}>Reschedule</Text>
                  </Pressable>
                </>
              ) : null}

              {canReview && rescheduling ? (
                <Card style={{ marginTop: s(18) }}>
                  <Text style={{ color: theme.colors.text, fontSize: fs(10), fontWeight: '600' }}>Choose new schedule</Text>
                  <TextInput value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={theme.colors.tertiaryText} style={{ color: theme.colors.text, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: s(8), fontSize: fs(10) }} />
                  <TextInput value={time} onChangeText={setTime} placeholder="e.g. 02:30 PM - 03:30 PM" placeholderTextColor={theme.colors.tertiaryText} style={{ color: theme.colors.text, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingVertical: s(8), fontSize: fs(10) }} />
                  <Pressable disabled={saving} onPress={() => setRescheduling(false)} style={{ height: s(32), borderRadius: s(17), backgroundColor: theme.colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: s(12) }}>
                    <Text style={{ color: '#fff', fontSize: fs(10) }}>Write Reason Of Reschedule</Text>
                  </Pressable>
                </Card>
              ) : null}
            </>
          ) : (
            <Card><Text style={{ color: theme.colors.secondaryText, fontSize: fs(10), textAlign: 'center' }}>Loading request…</Text></Card>
          )}
        </View>
      </ScrollView>

      <Modal visible={Boolean(outcome) || reasonModal} transparent animationType="fade" onRequestClose={() => setReasonModal(false)}>
        <View style={modalStyles.backdrop}>
          <View style={modalStyles.dialog}>
            {outcome ? (
              <>
                <Pressable accessibilityLabel="Close" onPress={closeOutcome} style={modalStyles.close}>
                  <Ionicons name="close" size={s(15)} color={theme.colors.secondaryText} />
                </Pressable>
                <View style={modalStyles.successIcon}>
                  <Ionicons name="checkmark" size={s(25)} color="#fff" />
                </View>
                <Text style={modalStyles.title}>{outcome === 'approved' ? 'Request Approved' : 'Your Message Delivered'}</Text>
                <Text style={modalStyles.subtitle}>The Approval Decision has been Recorded Successfully</Text>
                <Pressable onPress={closeOutcome} style={modalStyles.primaryButton}>
                  <Text style={modalStyles.primaryButtonText}>Back To Appointments</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={modalStyles.reasonTitle}>Write Reason Of Reschedule</Text>
                <TextInput
                  autoFocus
                  multiline
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Write Here"
                  placeholderTextColor={theme.colors.tertiaryText}
                  textAlignVertical="top"
                  style={modalStyles.reasonInput}
                />
                <Pressable
                  disabled={saving || !reason.trim()}
                  onPress={() => review('reschedule', {
                    requestedDate: date,
                    requestedTime: time,
                    note: reason.trim(),
                  })}
                  style={[modalStyles.primaryButton, (!reason.trim() || saving) && { opacity: 0.55 }]}
                >
                  <Text style={modalStyles.primaryButtonText}>{saving ? 'Sending…' : 'Sent To Patient'}</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const modalStyles = {
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.38)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(21),
  },
  dialog: {
    width: '100%',
    maxWidth: s(330),
    backgroundColor: theme.colors.card,
    borderRadius: s(9),
    paddingHorizontal: s(21),
    paddingTop: s(20),
    paddingBottom: s(17),
    alignItems: 'center',
  },
  close: {
    position: 'absolute',
    right: s(11),
    top: s(9),
    padding: s(4),
  },
  successIcon: {
    width: s(28),
    height: s(28),
    borderRadius: s(14),
    backgroundColor: '#0BAA0B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: s(12),
  },
  title: {
    color: theme.colors.primary,
    fontSize: fs(13, 12),
    fontWeight: '500',
    textAlign: 'center',
  },
  subtitle: {
    color: theme.colors.tertiaryText,
    fontSize: fs(6, 6),
    marginTop: s(3),
    textAlign: 'center',
  },
  primaryButton: {
    width: '82%',
    height: s(30),
    borderRadius: s(16),
    backgroundColor: '#DFA16C',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(18),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: fs(10, 9),
    fontWeight: '500',
  },
  reasonTitle: {
    width: '100%',
    color: theme.colors.text,
    fontSize: fs(14, 13),
    fontWeight: '500',
    marginBottom: s(10),
  },
  reasonInput: {
    width: '100%',
    height: s(126),
    borderWidth: 1,
    borderColor: '#E8E2DC',
    borderRadius: s(9),
    paddingHorizontal: s(10),
    paddingTop: s(10),
    color: theme.colors.text,
    fontSize: fs(9, 8),
  },
};
