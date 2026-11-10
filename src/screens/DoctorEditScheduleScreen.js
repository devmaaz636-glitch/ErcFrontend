import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import {
  WEEK_DAYS,
  createDefaultWeeklySchedule,
} from '../components/SelectScheduleModal';
import { IconCircleButton, NotificationBellButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import {
  loadDoctorLeaveRequests,
  saveDoctorLeaveRequests,
  saveDoctorWeeklySchedule,
} from '../lib/doctorScheduleStorage';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const TIME_OPTIONS = [
  '06:00 AM',
  '07:00 AM',
  '08:00 AM',
  '09:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '01:00 PM',
  '02:00 PM',
  '03:00 PM',
  '04:00 PM',
  '05:00 PM',
  '06:00 PM',
  '07:00 PM',
  '08:00 PM',
  '09:00 PM',
];

function normalizeSchedule(value) {
  const base = createDefaultWeeklySchedule();
  if (!value || typeof value !== 'object') return base;
  WEEK_DAYS.forEach((day) => {
    const item = value[day.key];
    if (!item) return;
    base[day.key] = {
      enabled: Boolean(item.enabled),
      start: item.start || '09:00 AM',
      end: item.end || '05:00 PM',
    };
  });
  return base;
}

function TimeField({ label, value, disabled, onPress }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.desc, fontSize: fs(10), marginBottom: 6 }}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={{
          height: s(42),
          borderRadius: 10,
          backgroundColor: colors.brandField || '#F4EEE7',
          borderWidth: 1,
          borderColor: '#E8E1D9',
          paddingHorizontal: s(12),
          flexDirection: 'row',
          alignItems: 'center',
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <Text style={{ flex: 1, color: colors.ink, fontSize: fs(12) }}>{value}</Text>
        <Ionicons name="chevron-down" size={s(14)} color={colors.muted} />
      </Pressable>
    </View>
  );
}

export default function DoctorEditScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();
  const mode = route.params?.mode === 'leave' ? 'leave' : 'hours';

  const [schedule, setSchedule] = useState(() => normalizeSchedule(route.params?.schedule));
  const [picker, setPicker] = useState(null);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [preferTime, setPreferTime] = useState('09:00 AM');
  const [preferDay, setPreferDay] = useState('Monday');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [timeMenuOpen, setTimeMenuOpen] = useState(false);
  const [dayMenuOpen, setDayMenuOpen] = useState(false);

  useEffect(() => {
    setSchedule(normalizeSchedule(route.params?.schedule));
  }, [route.params?.schedule]);

  const canSave = useMemo(
    () => (mode === 'leave' ? true : WEEK_DAYS.some((day) => schedule[day.key]?.enabled)),
    [mode, schedule]
  );

  function toggleDay(key) {
    setSchedule((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  }

  function pickTime(time) {
    if (!picker) return;
    setSchedule((prev) => ({
      ...prev,
      [picker.dayKey]: {
        ...prev[picker.dayKey],
        [picker.field]: time,
      },
    }));
    setPicker(null);
  }

  function openReasonModal() {
    if (!canSave || saving) return;
    setReason('');
    setPreferTime('09:00 AM');
    setPreferDay('Monday');
    setReasonOpen(true);
  }

  async function submitToManager() {
    if (!reason.trim() || saving) return;
    setSaving(true);
    try {
      if (mode === 'hours') {
        await saveDoctorWeeklySchedule(user?.uid, schedule);
      } else {
        const existing = await loadDoctorLeaveRequests(user?.uid);
        const next = [
          {
            id: `leave-${Date.now()}`,
            title: 'Leave Request',
            status: 'Pending',
            range: `Preferred ${preferDay} · ${preferTime}`,
            note: reason.trim(),
            preferDay,
            preferTime,
          },
          ...existing,
        ];
        await saveDoctorLeaveRequests(user?.uid, next);
      }
      setReasonOpen(false);
      setSuccessOpen(true);
    } finally {
      setSaving(false);
    }
  }

  function closeSuccess() {
    setSuccessOpen(false);
    navigation.navigate('DoctorTabs', { screen: 'AppointmentsTab' });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}>Schedule</Text>
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 2 }}>
                Manage your Patients
              </Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <Text
            style={{
              marginTop: s(18),
              marginBottom: s(12),
              fontSize: fs(14),
              fontWeight: '700',
              color: colors.ink,
            }}
          >
            Manage Your Schedule
          </Text>

          {WEEK_DAYS.map((day) => {
            const item = schedule[day.key];
            const enabled = item.enabled;
            return (
              <View
                key={day.key}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: s(14),
                  marginBottom: s(10),
                }}
              >
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: enabled }}
                  onPress={() => toggleDay(day.key)}
                  style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(12) }}
                >
                  <View
                    style={{
                      width: s(22),
                      height: s(22),
                      borderRadius: s(11),
                      borderWidth: 1.5,
                      borderColor: enabled ? colors.brand : '#C9C1B8',
                      backgroundColor: enabled ? colors.brand : colors.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: s(10),
                    }}
                  >
                    {enabled ? <Ionicons name="checkmark" size={s(12)} color={colors.white} /> : null}
                  </View>
                  <Text
                    style={{
                      color: enabled ? colors.ink : colors.muted,
                      fontSize: fs(14),
                      fontWeight: enabled ? '700' : '500',
                    }}
                  >
                    {day.label}
                  </Text>
                </Pressable>

                <View style={{ flexDirection: 'row' }}>
                  <TimeField
                    label="Start Time"
                    value={item.start}
                    disabled={!enabled}
                    onPress={() => enabled && setPicker({ dayKey: day.key, field: 'start' })}
                  />
                  <View style={{ width: s(12) }} />
                  <TimeField
                    label="End Time"
                    value={item.end}
                    disabled={!enabled}
                    onPress={() => enabled && setPicker({ dayKey: day.key, field: 'end' })}
                  />
                </View>
              </View>
            );
          })}

          <PrimaryButton
            label="Save"
            onPress={openReasonModal}
            disabled={!canSave}
            size="sm"
            style={{ marginTop: s(8), width: '100%' }}
          />
        </View>
      </ScrollView>

      {/* Time picker */}
      <Modal visible={Boolean(picker)} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(26, 22, 20, 0.4)',
            justifyContent: 'center',
            paddingHorizontal: 28,
          }}
          onPress={() => setPicker(null)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 8,
              maxHeight: '70%',
            }}
          >
            <Text
              style={{
                fontSize: fs(15),
                fontWeight: '700',
                color: colors.ink,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {picker?.field === 'end' ? 'End Time' : 'Start Time'}
            </Text>
            <ScrollView style={{ maxHeight: s(280) }} showsVerticalScrollIndicator={false}>
              {TIME_OPTIONS.map((time) => (
                <Pressable
                  key={time}
                  onPress={() => pickTime(time)}
                  style={{ paddingVertical: 12, paddingHorizontal: 14, borderRadius: 10 }}
                >
                  <Text style={{ fontSize: fs(14), color: colors.ink, textAlign: 'center' }}>{time}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Reason → manager */}
      <Modal visible={reasonOpen} transparent animationType="fade" onRequestClose={() => setReasonOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.38)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: s(22),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingHorizontal: s(18),
              paddingTop: s(18),
              paddingBottom: s(16),
            }}
          >
            <Pressable
              accessibilityLabel="Close"
              onPress={() => setReasonOpen(false)}
              style={{ position: 'absolute', right: s(12), top: s(10), padding: s(4), zIndex: 2 }}
            >
              <Ionicons name="close" size={s(16)} color={colors.muted} />
            </Pressable>

            <Text
              style={{
                color: colors.ink,
                fontSize: fs(14),
                fontWeight: '700',
                textAlign: 'center',
                marginBottom: s(14),
              }}
            >
              Write Reason Of Reschedule
            </Text>

            <Text style={{ color: colors.desc, fontSize: fs(10), marginBottom: 6 }}>Prefer Time</Text>
            <Pressable
              onPress={() => setTimeMenuOpen(true)}
              style={{
                height: s(44),
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E8E1D9',
                backgroundColor: colors.brandField || '#F4EEE7',
                paddingHorizontal: s(12),
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: s(12),
              }}
            >
              <Text style={{ flex: 1, color: colors.ink, fontSize: fs(12) }}>{preferTime}</Text>
              <Ionicons name="chevron-down" size={s(14)} color={colors.muted} />
            </Pressable>

            <Text style={{ color: colors.desc, fontSize: fs(10), marginBottom: 6 }}>Prefer Day</Text>
            <Pressable
              onPress={() => setDayMenuOpen(true)}
              style={{
                height: s(44),
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#E8E1D9',
                backgroundColor: colors.brandField || '#F4EEE7',
                paddingHorizontal: s(12),
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: s(12),
              }}
            >
              <Text style={{ flex: 1, color: colors.ink, fontSize: fs(12) }}>{preferDay}</Text>
              <Ionicons name="chevron-down" size={s(14)} color={colors.muted} />
            </Pressable>

            <TextInput
              multiline
              value={reason}
              onChangeText={setReason}
              placeholder="Write Here"
              placeholderTextColor={colors.muted}
              textAlignVertical="top"
              style={{
                minHeight: s(110),
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E8E1D9',
                padding: s(12),
                color: colors.ink,
                fontSize: fs(12),
                marginBottom: s(14),
              }}
            />

            <PrimaryButton
              label={saving ? 'Sending…' : 'Sent To Manager'}
              onPress={submitToManager}
              loading={saving}
              disabled={saving || !reason.trim()}
              size="sm"
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={timeMenuOpen} transparent animationType="fade" onRequestClose={() => setTimeMenuOpen(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(26, 22, 20, 0.4)',
            justifyContent: 'center',
            paddingHorizontal: 28,
          }}
          onPress={() => setTimeMenuOpen(false)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 8,
              maxHeight: '70%',
            }}
          >
            <Text
              style={{
                fontSize: fs(15),
                fontWeight: '700',
                color: colors.ink,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Select Time
            </Text>
            <ScrollView style={{ maxHeight: s(280) }} showsVerticalScrollIndicator={false}>
              {TIME_OPTIONS.map((time) => (
                <Pressable
                  key={time}
                  onPress={() => {
                    setPreferTime(time);
                    setTimeMenuOpen(false);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 14 }}
                >
                  <Text style={{ fontSize: fs(14), color: colors.ink, textAlign: 'center' }}>{time}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={dayMenuOpen} transparent animationType="fade" onRequestClose={() => setDayMenuOpen(false)}>
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(26, 22, 20, 0.4)',
            justifyContent: 'center',
            paddingHorizontal: 28,
          }}
          onPress={() => setDayMenuOpen(false)}
        >
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingVertical: 14,
              paddingHorizontal: 8,
              maxHeight: '70%',
            }}
          >
            <Text
              style={{
                fontSize: fs(15),
                fontWeight: '700',
                color: colors.ink,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              Select Day
            </Text>
            <ScrollView style={{ maxHeight: s(280) }} showsVerticalScrollIndicator={false}>
              {WEEK_DAYS.map((day) => (
                <Pressable
                  key={day.key}
                  onPress={() => {
                    setPreferDay(day.label);
                    setDayMenuOpen(false);
                  }}
                  style={{ paddingVertical: 12, paddingHorizontal: 14 }}
                >
                  <Text style={{ fontSize: fs(14), color: colors.ink, textAlign: 'center' }}>
                    {day.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Success */}
      <Modal visible={successOpen} transparent animationType="fade" onRequestClose={closeSuccess}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.38)',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: s(22),
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingHorizontal: s(18),
              paddingTop: s(20),
              paddingBottom: s(16),
              alignItems: 'center',
            }}
          >
            <Pressable
              accessibilityLabel="Close"
              onPress={closeSuccess}
              style={{ position: 'absolute', right: s(12), top: s(10), padding: s(4) }}
            >
              <Ionicons name="close" size={s(16)} color={colors.muted} />
            </Pressable>
            <View
              style={{
                width: s(36),
                height: s(36),
                borderRadius: s(18),
                backgroundColor: '#0BAA0B',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: s(12),
              }}
            >
              <Ionicons name="checkmark" size={s(20)} color={colors.white} />
            </View>
            <Text
              style={{
                color: colors.brand,
                fontSize: fs(14),
                fontWeight: '600',
                textAlign: 'center',
              }}
            >
              Your Message Delivered
            </Text>
            <Text
              style={{
                color: colors.desc,
                fontSize: fs(11),
                textAlign: 'center',
                marginTop: s(8),
                marginBottom: s(16),
                lineHeight: fs(16),
              }}
            >
              The Approval Decision has been Recorded Successfully
            </Text>
            <PrimaryButton
              label="Back To Appointments"
              onPress={closeSuccess}
              size="sm"
              style={{ width: '100%' }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
