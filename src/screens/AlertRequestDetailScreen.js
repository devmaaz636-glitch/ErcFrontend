import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { clinicErrorMessage, fetchManagerAlert, updateManagerAlert } from '../lib/clinic';
import { BRAND_BG, brandButtonBg, brandButtonText, colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BRAND = BRAND_BG;
const BRAND_DARK = BRAND_BG;
const BG = '#FFF8F1';
const PENDING_BG = '#FFE8D6';
const PENDING_FG = '#E0894A';

const TIME_OPTIONS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
];

export default function AlertRequestDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(14);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - s(40), spacing.maxContent);
  const alertId = route.params?.alertId;
  const passed = route.params?.alert;

  const [item, setItem] = useState(passed || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!passed);
  const [busy, setBusy] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [preferTime, setPreferTime] = useState('');
  const [reason, setReason] = useState('');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [success, setSuccess] = useState(null);

  const detail = useMemo(() => {
    const raw = item?.requestDetail || {};
    const branchLabel =
      raw.regionLabel ||
      item?.regionLabel ||
      (item?.branchName && item?.region
        ? `${item.branchName}, ${item.region}`
        : item?.branchName || 'Dubai Branch, UAE');
    return {
      kind: raw.kind || (item?.type === 'refund' ? 'refund' : 'reschedule'),
      code: raw.code || 'RF-1048',
      label: raw.label || 'Booking Re schedule',
      status: raw.status || 'Pending',
      submittedAt: raw.submittedAt || '06 Oct 2026 - 10:30 AM',
      rescheduleDate: raw.rescheduleDate || '12/03/26',
      rescheduleTime: raw.rescheduleTime || '09:30 AM',
      originalDate: raw.originalDate || '10/03/26',
      originalTime: raw.originalTime || '10:30 AM',
      patientName: raw.patientName || 'Maaz',
      bookingReference:
        raw.bookingReference || 'APT-1024 · Laser Treatment · Dr. Sarah Malik',
      paymentMethod: raw.paymentMethod || 'Card · TXN-88421',
      regionLabel: branchLabel,
      activity: Array.isArray(raw.activity) && raw.activity.length
        ? raw.activity
        : [
            {
              id: 'a1',
              title: 'Date request submitted',
              subtitle: '06 Oct 2026 - 10:30 AM · Clinic Manager',
              state: 'done',
            },
            {
              id: 'a2',
              title: 'Awaiting Regional Admin decision',
              subtitle: 'Pending authorisation',
              state: 'pending',
            },
          ],
    };
  }, [item]);

  const isRefund = detail.kind === 'refund' || item?.type === 'refund';

  const load = useCallback(async () => {
    if (!alertId) return null;
    try {
      const next = await fetchManagerAlert(alertId);
      setItem(next);
      setError('');
      return next;
    } catch (err) {
      setError(clinicErrorMessage(err) || 'Could not load request.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    if (!passed && alertId) {
      setLoading(true);
      load().catch(() => {});
    }
  }, [alertId, passed, load]);

  useRefreshOnFocus(load);

  // Keep Approve / Decline visible for testing until a decision is saved.
  const canDecide = useMemo(() => {
    const status = String(detail.status || '').toLowerCase();
    if (status === 'approved' || status === 'declined') return false;
    return true;
  }, [detail.status]);

  async function approve() {
    if (!alertId || busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await updateManagerAlert(alertId, { action: 'approve_reschedule' });
      setItem(next);
      setSuccess('approved');
    } catch (err) {
      setError(clinicErrorMessage(err) || 'Could not approve.');
    } finally {
      setBusy(false);
    }
  }

  async function sendDecline() {
    if (!alertId || busy) return;
    if (!preferTime.trim() || !reason.trim()) {
      setError('Select a preferred time and write a reason.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const next = await updateManagerAlert(alertId, {
        action: 'decline_reschedule',
        preferTime: preferTime.trim(),
        reason: reason.trim(),
      });
      setItem(next);
      setReasonOpen(false);
      setSuccess('declined');
    } catch (err) {
      setError(clinicErrorMessage(err) || 'Could not send reason.');
    } finally {
      setBusy(false);
    }
  }

  function backToAlerts() {
    setSuccess(null);
    navigation.navigate('ManagerAlerts');
  }

  function backToAppointments() {
    setSuccess(null);
    navigation.navigate('ManagerTabs', { screen: 'AppointmentsTab' });
  }

  if (loading && !item) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={BRAND} />
      </View>
    );
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
          paddingBottom: Math.max(insets.bottom, 16) + s(24),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: contentWidth }}>
        <View style={styles.header}>
          <IconCircleButton
            name="chevron-back"
            accessibilityLabel="Go back"
            onPress={() => navigation.goBack()}
          />
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {isRefund ? 'Refund Request Details' : 'Booking Re Schedule'}
            </Text>
          </View>
          <NotificationBellButton color={BRAND_BG} />
        </View>

        {error && !reasonOpen ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={{ flex: 1, marginRight: s(8) }}>
              <Text style={styles.cardEyebrow}>{detail.label}</Text>
              <Text style={styles.code}>#{detail.code}</Text>
            </View>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>{detail.status}</Text>
            </View>
          </View>
          <Text style={styles.meta}>Submitted: {detail.submittedAt}</Text>
          <Text style={styles.meta}>{detail.regionLabel}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <Text style={styles.approvalNeeded}>Approval Required</Text>
          </View>
          <View style={styles.datesRow}>
            <View style={{ flex: 1, paddingRight: s(8) }}>
              <Text style={styles.dateLabel}>Re Schedule Date</Text>
              <Text style={styles.dateValue}>{detail.rescheduleDate}</Text>
              <Text style={styles.timeValue}>{detail.rescheduleTime}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.dateLabel}>Original Date</Text>
              <Text style={styles.dateValue}>{detail.originalDate}</Text>
              <Text style={styles.timeValue}>{detail.originalTime}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Patient Name</Text>
          <Text style={styles.fieldValue}>{detail.patientName}</Text>
          <Text style={[styles.fieldLabel, { marginTop: s(12) }]}>Booking Reference</Text>
          <Text style={styles.fieldValue}>{detail.bookingReference}</Text>
          <Text style={[styles.fieldLabel, { marginTop: s(12) }]}>Payment Method</Text>
          <Text style={styles.fieldValue}>{detail.paymentMethod}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Request Activity</Text>
          {detail.activity.map((step) => (
            <View key={step.id} style={styles.activityRow}>
              <View
                style={[
                  styles.dot,
                  step.state === 'pending' ? styles.dotPending : styles.dotDone,
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.activityTitle,
                    step.state === 'pending' && { color: BRAND },
                  ]}
                >
                  {step.title}
                </Text>
                <Text style={styles.activitySub}>{step.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        {canDecide ? (
          <View style={{ marginTop: s(8) }}>
            <Text style={styles.sectionTitle}>Admin Decision</Text>
            <Text style={styles.help}>
              Show decision controls only if this refund exceeds the branch’s normal approval limit
              and the signed-in Regional Admin is authorised to decide it.
            </Text>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={approve}
              style={({ pressed }) => [
                styles.approveBtn,
                brandButtonBg,
                (busy || pressed) && { opacity: 0.88 },
              ]}
            >
              {busy && !reasonOpen ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.approveText, brandButtonText]}>Approve Reschedule</Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setError('');
                setPreferTime(detail.rescheduleTime || TIME_OPTIONS[0]);
                setReason('');
                setReasonOpen(true);
              }}
              style={({ pressed }) => [styles.declineBtn, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.declineText}>Decline Reschedule</Text>
            </Pressable>

            <Text style={styles.footnote}>
              Require confirmation after an authorisation acknowledgement.
            </Text>
          </View>
        ) : null}
        </View>
      </ScrollView>

      {/* Decline reason modal */}
      <Modal
        visible={reasonOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReasonOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reasonSheet}>
            <View style={styles.reasonHeader}>
              <Text style={styles.reasonTitle}>Write Reason Of Reschedule</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={12}
                onPress={() => {
                  setReasonOpen(false);
                  setError('');
                }}
                style={({ pressed }) => [styles.reasonClose, pressed && { opacity: 0.6 }]}
              >
                <Ionicons name="close" size={20} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={styles.fieldLabel}>Prefer Time</Text>
            <Pressable
              onPress={() => setTimePickerOpen(true)}
              style={styles.selectField}
            >
              <Text
                style={{
                  flex: 1,
                  color: preferTime ? colors.ink : colors.placeholder,
                  fontSize: fs(13),
                }}
              >
                {preferTime || detail.rescheduleTime || 'Select Time'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={colors.muted} />
            </Pressable>

            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="Write Here"
              placeholderTextColor={colors.placeholder}
              multiline
              textAlignVertical="top"
              style={styles.reasonInput}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={sendDecline}
              disabled={busy}
              style={({ pressed }) => [
                styles.sendBtn,
                brandButtonBg,
                (busy || pressed) && { opacity: 0.88 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.sendText, brandButtonText]}>Sent To Patient</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Time picker */}
      <Modal visible={timePickerOpen} transparent animationType="fade" onRequestClose={() => setTimePickerOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setTimePickerOpen(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Time</Text>
            <ScrollView style={{ maxHeight: s(280) }}>
              {TIME_OPTIONS.map((time) => (
                <Pressable
                  key={time}
                  onPress={() => {
                    setPreferTime(time);
                    setTimePickerOpen(false);
                  }}
                  style={styles.pickerRow}
                >
                  <Text style={styles.pickerRowText}>{time}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Success: approved */}
      <Modal visible={success === 'approved'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <Pressable style={styles.closeX} onPress={backToAlerts} hitSlop={12}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Booking Re-Schedule</Text>
            <Text style={styles.successSub}>The Changes Save Successfully</Text>
            <Pressable onPress={backToAlerts} style={[styles.successBtn, brandButtonBg]}>
              <Text style={[styles.successBtnText, brandButtonText]}>Back To Alerts</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Success: declined / message delivered */}
      <Modal visible={success === 'declined'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <Pressable style={styles.closeX} onPress={backToAppointments} hitSlop={12}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={28} color="#fff" />
            </View>
            <Text style={styles.successTitle}>Your Message Delivered</Text>
            <Text style={styles.successSub}>
              The approval decision has been recorded successfully.
            </Text>
            <Pressable onPress={backToAppointments} style={[styles.successBtn, brandButtonBg]}>
              <Text style={[styles.successBtnText, brandButtonText]}>Back To Appointments</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(14),
  },
  headerLeft: {
    flex: 1,
    marginLeft: s(12),
    marginRight: s(8),
  },
  headerTitle: {
    fontSize: fs(16),
    fontWeight: '700',
    color: colors.inkDeep,
    textAlign: 'left',
  },
  error: {
    color: colors.danger,
    fontSize: fs(11),
    textAlign: 'center',
    marginBottom: s(10),
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: s(14),
    padding: s(14),
    marginBottom: s(12),
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardEyebrow: {
    fontSize: fs(11),
    color: colors.muted,
  },
  code: {
    marginTop: 4,
    fontSize: fs(18),
    fontWeight: '700',
    color: colors.inkDeep,
  },
  pendingBadge: {
    backgroundColor: PENDING_BG,
    borderRadius: 999,
    paddingHorizontal: s(10),
    paddingVertical: s(5),
  },
  pendingText: {
    color: PENDING_FG,
    fontSize: fs(10),
    fontWeight: '700',
  },
  meta: {
    marginTop: 6,
    fontSize: fs(11),
    color: colors.muted,
  },
  sectionTitle: {
    fontSize: fs(14),
    fontWeight: '700',
    color: colors.inkDeep,
  },
  approvalNeeded: {
    color: BRAND,
    fontSize: fs(11),
    fontWeight: '600',
  },
  datesRow: {
    flexDirection: 'row',
    marginTop: s(12),
  },
  dateLabel: {
    fontSize: fs(11),
    color: colors.muted,
  },
  dateValue: {
    marginTop: 6,
    fontSize: fs(18),
    fontWeight: '700',
    color: colors.inkDeep,
  },
  fieldLabel: {
    fontSize: fs(11),
    color: colors.muted,
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: fs(13),
    color: colors.desc,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: s(12),
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 10,
  },
  dotDone: {
    backgroundColor: colors.inkDeep,
  },
  dotPending: {
    borderWidth: 2,
    borderColor: BRAND,
    backgroundColor: 'transparent',
  },
  activityTitle: {
    fontSize: fs(13),
    fontWeight: '600',
    color: colors.inkDeep,
  },
  activitySub: {
    marginTop: 2,
    fontSize: fs(11),
    color: colors.muted,
  },
  help: {
    marginTop: s(8),
    marginBottom: s(14),
    fontSize: fs(11),
    lineHeight: fs(16),
    color: colors.muted,
  },
  approveBtn: {
    height: s(50),
    borderRadius: s(12),
    backgroundColor: BRAND_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },
  declineBtn: {
    marginTop: s(10),
    height: s(50),
    borderRadius: s(12),
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5DED6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineText: {
    color: colors.inkDeep,
    fontSize: fs(14),
    fontWeight: '600',
  },
  footnote: {
    marginTop: s(10),
    fontSize: fs(10),
    color: colors.muted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26,22,20,0.45)',
    justifyContent: 'center',
    paddingHorizontal: s(22),
  },
  reasonSheet: {
    backgroundColor: '#fff',
    borderRadius: s(18),
    padding: s(18),
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(14),
  },
  reasonTitle: {
    flex: 1,
    fontSize: fs(16),
    fontWeight: '700',
    color: colors.inkDeep,
    paddingRight: s(8),
  },
  reasonClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeValue: {
    marginTop: 4,
    fontSize: fs(12),
    fontWeight: '500',
    color: colors.muted,
  },
  selectField: {
    height: s(46),
    borderRadius: s(10),
    borderWidth: 1,
    borderColor: '#E5DED6',
    paddingHorizontal: s(12),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(12),
    backgroundColor: '#fff',
  },
  reasonInput: {
    minHeight: s(120),
    borderRadius: s(12),
    borderWidth: 1,
    borderColor: '#E5DED6',
    padding: s(12),
    fontSize: fs(13),
    color: colors.ink,
    marginBottom: s(12),
  },
  sendBtn: {
    height: s(46),
    borderRadius: 999,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    paddingHorizontal: s(28),
    minWidth: '70%',
  },
  sendText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },
  pickerSheet: {
    backgroundColor: '#fff',
    borderRadius: s(16),
    paddingVertical: s(12),
    paddingHorizontal: s(8),
  },
  pickerTitle: {
    textAlign: 'center',
    fontSize: fs(14),
    fontWeight: '700',
    color: colors.ink,
    marginBottom: s(8),
  },
  pickerRow: {
    paddingVertical: s(12),
    paddingHorizontal: s(14),
    borderRadius: s(10),
  },
  pickerRowText: {
    textAlign: 'center',
    fontSize: fs(14),
    color: colors.ink,
  },
  successCard: {
    backgroundColor: '#fff',
    borderRadius: s(20),
    paddingHorizontal: s(18),
    paddingTop: s(18),
    paddingBottom: s(20),
    alignItems: 'center',
  },
  closeX: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  successIcon: {
    width: s(56),
    height: s(56),
    borderRadius: s(28),
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: s(8),
  },
  successTitle: {
    marginTop: s(14),
    fontSize: fs(18),
    fontWeight: '700',
    color: BRAND,
    textAlign: 'center',
  },
  successSub: {
    marginTop: s(8),
    fontSize: fs(12),
    color: colors.muted,
    textAlign: 'center',
    lineHeight: fs(18),
  },
  successBtn: {
    marginTop: s(18),
    height: s(48),
    borderRadius: 999,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  successBtnText: {
    color: '#fff',
    fontSize: fs(14),
    fontWeight: '700',
  },
});
