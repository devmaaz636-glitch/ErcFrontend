import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { colors, radius, spacing } from '../theme';
import { scale as s, fs } from '../utils/responsive';

const BRAND = '#BF824F';
const BRAND_LIGHT = '#D3A57A';

export const WEEK_DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
];

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

export function createDefaultWeeklySchedule() {
  return WEEK_DAYS.reduce((acc, day, index) => {
    acc[day.key] = {
      enabled: index < 3,
      start: '09:00 AM',
      end: '05:00 PM',
    };
    return acc;
  }, {});
}

export function summarizeWeeklySchedule(schedule) {
  if (!schedule) return '';
  const enabled = WEEK_DAYS.filter((day) => schedule[day.key]?.enabled);
  if (!enabled.length) return '';
  const first = schedule[enabled[0].key];
  const labels = enabled.map((day) => day.label.slice(0, 3));
  let range = labels[0];
  if (labels.length > 1) {
    const consecutive = enabled.every((day, i) => {
      if (i === 0) return true;
      const prevIdx = WEEK_DAYS.findIndex((d) => d.key === enabled[i - 1].key);
      const curIdx = WEEK_DAYS.findIndex((d) => d.key === day.key);
      return curIdx === prevIdx + 1;
    });
    range = consecutive
      ? `${labels[0]}–${labels[labels.length - 1]}`
      : labels.join(', ');
  }
  return `${range} · ${first.start}–${first.end}`;
}

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

function TimeField({ label, value, onPress }) {
  return (
    <View style={styles.timeCol}>
      <Text style={styles.timeLabel}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
        onPress={onPress}
        style={({ pressed }) => [styles.timeInput, pressed && { opacity: 0.75 }]}
      >
        <Text style={styles.timeValue}>{value}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.muted} />
      </Pressable>
    </View>
  );
}

/**
 * Weekly hours only (no calendar). Booking dates use BookingCalendar elsewhere.
 */
export default function SelectScheduleModal({
  visible,
  initialSchedule,
  onClose,
  onChange,
  onSave,
}) {
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState(() => normalizeSchedule(initialSchedule));
  const [picker, setPicker] = useState(null);

  useEffect(() => {
    if (visible) {
      setSchedule(normalizeSchedule(initialSchedule));
      setPicker(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pickerOptions = useMemo(() => TIME_OPTIONS, []);

  function update(next) {
    setSchedule(next);
    onChange?.(next);
  }

  function toggleDay(key) {
    update({
      ...schedule,
      [key]: { ...schedule[key], enabled: !schedule[key].enabled },
    });
  }

  function openPicker(dayKey, field) {
    setPicker({ dayKey, field });
  }

  function pickTime(time) {
    if (!picker) return;
    update({
      ...schedule,
      [picker.dayKey]: {
        ...schedule[picker.dayKey],
        [picker.field]: time,
      },
    });
    setPicker(null);
  }

  function handleSave() {
    const enabled = WEEK_DAYS.filter((day) => schedule[day.key]?.enabled);
    if (!enabled.length) return;
    onSave?.(schedule);
  }

  const canSave = WEEK_DAYS.some((day) => schedule[day.key]?.enabled);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Schedule</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close schedule"
              onPress={onClose}
              hitSlop={12}
              style={({ pressed }) => ({ opacity: pressed ? 0.5 : 1 })}
            >
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
          >
            {WEEK_DAYS.map((day) => {
              const item = schedule[day.key];
              const enabled = item.enabled;
              return (
                <View key={day.key} style={styles.dayBlock}>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: enabled }}
                    onPress={() => toggleDay(day.key)}
                    style={styles.dayHeader}
                  >
                    <View style={[styles.checkbox, enabled && styles.checkboxOn]}>
                      {enabled ? <Ionicons name="checkmark" size={12} color="#fff" /> : null}
                    </View>
                    <Text style={[styles.dayLabel, enabled && styles.dayLabelOn]}>{day.label}</Text>
                  </Pressable>

                  <View style={[styles.timesRow, !enabled && styles.timesDisabled]}>
                    <TimeField
                      label="Start Time"
                      value={item.start}
                      onPress={() => enabled && openPicker(day.key, 'start')}
                    />
                    <View style={{ width: s(12) }} />
                    <TimeField
                      label="End Time"
                      value={item.end}
                      onPress={() => enabled && openPicker(day.key, 'end')}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={handleSave}
            style={({ pressed }) => [
              styles.saveWrap,
              (!canSave || pressed) && { opacity: canSave ? 0.85 : 0.45 },
            ]}
          >
            <LinearGradient
              colors={[BRAND_LIGHT, BRAND]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.saveBtn}
            >
              <Text style={styles.saveText}>Save</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      <Modal visible={Boolean(picker)} transparent animationType="fade" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.pickerOverlay} onPress={() => setPicker(null)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {picker?.field === 'end' ? 'End Time' : 'Start Time'}
            </Text>
            <ScrollView style={{ maxHeight: s(280) }} showsVerticalScrollIndicator={false}>
              {pickerOptions.map((time) => (
                <Pressable
                  key={time}
                  onPress={() => pickTime(time)}
                  style={({ pressed }) => [styles.pickerRow, pressed && { backgroundColor: colors.brandSoft }]}
                >
                  <Text style={styles.pickerRowText}>{time}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 20, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '92%',
    paddingTop: 18,
    paddingHorizontal: spacing.screen,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: fs(18),
    fontWeight: '700',
    color: colors.inkDeep,
  },
  list: {
    paddingBottom: 12,
  },
  dayBlock: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EFE8E1',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#C9C1B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: colors.card,
  },
  checkboxOn: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  dayLabel: {
    fontSize: fs(15),
    fontWeight: '500',
    color: colors.muted,
  },
  dayLabelOn: {
    fontWeight: '700',
    color: colors.inkDeep,
  },
  timesRow: {
    flexDirection: 'row',
    paddingLeft: 32,
  },
  timesDisabled: {
    opacity: 0.45,
  },
  timeCol: {
    flex: 1,
  },
  timeLabel: {
    fontSize: fs(11),
    color: colors.muted,
    marginBottom: 6,
  },
  timeInput: {
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.field,
    borderWidth: 1,
    borderColor: '#E8E1D9',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeValue: {
    flex: 1,
    fontSize: fs(13),
    color: colors.ink,
  },
  saveWrap: {
    alignSelf: 'stretch',
    borderRadius: radius.round,
    marginTop: 8,
    marginBottom: 4,
    shadowColor: BRAND,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  saveBtn: {
    alignSelf: 'stretch',
    height: 50,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: colors.white,
    fontSize: fs(15),
    fontWeight: '700',
    textAlign: 'center',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 20, 0.4)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  pickerSheet: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    maxHeight: '70%',
  },
  pickerTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  pickerRow: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  pickerRowText: {
    fontSize: fs(14),
    color: colors.ink,
    textAlign: 'center',
  },
});
