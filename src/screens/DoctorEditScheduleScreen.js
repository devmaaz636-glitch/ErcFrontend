import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Modal, Pressable, ScrollView, Switch, TextInput, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import BookingCalendar, { toDateKey } from '../components/BookingCalendar';
import { WEEK_DAYS, createDefaultWeeklySchedule } from '../components/SelectScheduleModal';
import { cardStyle } from '../components/doctor/DoctorUI';
import { IconCircleButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { clinicErrorMessage, createDoctorScheduleRequest } from '../lib/clinic';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const TIME_OPTIONS = [
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
];

const minutes = (value) => {
  const [, hour, minute, period] = value.match(/^(\d{1,2}):(\d{2}) (AM|PM)$/);
  return ((Number(hour) % 12) + (period === 'PM' ? 12 : 0)) * 60 + Number(minute);
};

/** Request new weekly hours, or leave. Both take effect only after manager approval. */
export default function DoctorEditScheduleScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();
  const mode = route.params?.mode === 'leave' ? 'leave' : 'hours';

  const [schedule, setSchedule] = useState(() => route.params?.schedule || createDefaultWeeklySchedule());
  const [picker, setPicker] = useState(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (day, patch) => setSchedule((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));

  const enabledDays = WEEK_DAYS.filter((day) => schedule[day.key]?.enabled);
  const hoursValid =
    enabledDays.length > 0 &&
    enabledDays.every((day) => minutes(schedule[day.key].start) < minutes(schedule[day.key].end));
  const canSend = reason.trim() && (mode === 'leave' ? from && to && to >= from : hoursValid);

  async function submit() {
    if (!canSend || saving) return;
    setSaving(true);
    setError('');
    try {
      await createDoctorScheduleRequest({
        mode,
        branchId: user?.branchId,
        reason: reason.trim(),
        leaveFrom: mode === 'leave' ? from : null,
        leaveTo: mode === 'leave' ? to : null,
        weeklySchedule: mode === 'hours' ? schedule : null,
      });
      Alert.alert('Request sent', 'The clinic manager will review it. Nothing changes until it is approved.');
      navigation.goBack();
    } catch (submitError) {
      setError(clinicErrorMessage(submitError) || 'Could not send the request.');
    } finally {
      setSaving(false);
    }
  }

  const timeButton = (day, field) => (
    <Pressable
      accessibilityRole="button"
      onPress={() => setPicker({ day, field })}
      style={{ backgroundColor: '#F6E6D6', borderRadius: 999, paddingHorizontal: s(12), paddingVertical: s(7) }}
    >
      <Text style={{ fontSize: fs(11), color: colors.ink }}>{schedule[day][field]}</Text>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
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
              {mode === 'leave' ? 'Request Leave' : 'Request New Hours'}
            </Text>
          </View>

          {mode === 'leave' ? (
            <>
              <View style={[cardStyle, { marginTop: s(16) }]}>
                <BookingCalendar
                  compact
                  title="First day of leave"
                  selectedDate={from || undefined}
                  minDate={new Date()}
                  onSelect={(value) => {
                    const key = toDateKey(value);
                    setFrom(key);
                    if (!to || to < key) setTo(key);
                  }}
                />
              </View>
              <View style={[cardStyle, { marginTop: s(12) }]}>
                <BookingCalendar
                  compact
                  title="Last day of leave"
                  selectedDate={to || undefined}
                  minDate={from || new Date()}
                  onSelect={(value) => setTo(toDateKey(value))}
                />
              </View>
            </>
          ) : (
            WEEK_DAYS.map((day) => (
              <View key={day.key} style={[cardStyle, { marginTop: s(10) }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, fontSize: fs(13), fontWeight: '700', color: colors.ink }}>{day.label}</Text>
                  <Switch
                    value={Boolean(schedule[day.key]?.enabled)}
                    onValueChange={(enabled) => update(day.key, { enabled })}
                    trackColor={{ true: colors.brand }}
                  />
                </View>
                {schedule[day.key]?.enabled ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: s(10), marginTop: s(8) }}>
                    {timeButton(day.key, 'start')}
                    <Text style={{ fontSize: fs(11), color: colors.desc }}>to</Text>
                    {timeButton(day.key, 'end')}
                  </View>
                ) : null}
              </View>
            ))
          )}

          <TextInput
            value={reason}
            onChangeText={setReason}
            multiline
            placeholder="Reason for the clinic manager (required)"
            placeholderTextColor={colors.muted}
            style={[cardStyle, { marginTop: s(14), minHeight: s(84), textAlignVertical: 'top', color: colors.ink }]}
          />
          {mode === 'hours' && !hoursValid ? (
            <Text style={{ marginTop: s(8), fontSize: fs(11), color: colors.danger }}>
              Pick at least one day, with an end time after the start time.
            </Text>
          ) : null}
          {error ? <Text style={{ marginTop: s(8), fontSize: fs(11), color: colors.danger }}>{error}</Text> : null}
          <PrimaryButton
            label="Send to Manager"
            loading={saving}
            disabled={!canSend}
            onPress={submit}
            style={{ marginTop: s(16), width: '100%' }}
          />
        </View>
      </ScrollView>

      <Modal visible={Boolean(picker)} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable
          onPress={() => setPicker(null)}
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: s(30) }}
        >
          <View style={cardStyle}>
            {TIME_OPTIONS.map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                onPress={() => {
                  update(picker.day, { [picker.field]: option });
                  setPicker(null);
                }}
                style={{ paddingVertical: s(9), alignItems: 'center' }}
              >
                <Text style={{ fontSize: fs(13), color: colors.ink }}>{option}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
