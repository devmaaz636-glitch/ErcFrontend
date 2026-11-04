import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { colors } from '../theme';
import { scale as s, fs } from '../utils/responsive';

const BRAND = colors.brand || '#BF824F';
const HEADING = colors.heading || '#353535';

const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function toDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export function formatScheduleDate(value, options = {}) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    weekday: options.weekday || 'short',
    month: options.month || 'short',
    day: 'numeric',
    year: options.year || 'numeric',
    ...options,
  });
}

export function formatAppointmentWhen(item = {}) {
  const rawDate = item.date || item.requestedDate || item.scheduleDate || item.bookingDate || '';
  const time = item.time || item.requestedTime || item.timeRange || '';
  if (!rawDate && !time) return { day: '—', date: '—', time: '—', label: 'Time pending' };

  const parsed = rawDate ? new Date(`${rawDate}T00:00:00`) : null;
  const valid = parsed && !Number.isNaN(parsed.getTime());
  const day = valid
    ? parsed.toLocaleDateString('en-US', { weekday: 'long' })
    : item.day || item.dayLabel || '—';
  const date = valid
    ? parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : rawDate || '—';
  const label = [day !== '—' ? day : null, date !== '—' ? date : null, time || null]
    .filter(Boolean)
    .join(' · ');

  return { day, date, time: time || '—', label: label || 'Time pending', dateKey: rawDate || null };
}

function buildMonthCells(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/**
 * Shared booking calendar for patients / managers / admins.
 */
export default function BookingCalendar({
  selectedDate,
  onSelect,
  minDate,
  title = 'Select Date',
  compact = false,
  readOnly = false,
}) {
  const selected = selectedDate ? new Date(`${selectedDate}T00:00:00`) : new Date();
  const [cursor, setCursor] = useState(
    () => new Date(selected.getFullYear(), selected.getMonth(), 1)
  );

  useEffect(() => {
    if (!selectedDate) return;
    const next = new Date(`${selectedDate}T00:00:00`);
    if (!Number.isNaN(next.getTime())) {
      setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }, [selectedDate]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const cells = useMemo(() => buildMonthCells(year, month), [year, month]);
  const todayKey = toDateKey(new Date());
  const minKey = minDate ? toDateKey(minDate) : null;

  function shiftMonth(delta) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => shiftMonth(-1)}
          hitSlop={8}
          style={({ pressed }) => [styles.nav, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-back" size={18} color={HEADING} />
        </Pressable>
        <Text style={styles.month}>
          {MONTH_NAMES[month]} {year}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => shiftMonth(1)}
          hitSlop={8}
          style={({ pressed }) => [styles.nav, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="chevron-forward" size={18} color={HEADING} />
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_SHORT.map((label) => (
          <Text key={label} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (!day) return <View key={`empty-${index}`} style={styles.cell} />;
          const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const selectedDay = key === selectedDate;
          const isToday = key === todayKey;
          const disabled = readOnly || Boolean(minKey && key < minKey);
          return (
            <Pressable
              key={key}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedDay, disabled }}
              onPress={() => {
                if (readOnly) return;
                onSelect?.(key);
              }}
              style={styles.cell}
            >
              <View
                style={[
                  styles.pill,
                  isToday && !selectedDay && styles.today,
                  selectedDay && styles.selected,
                  disabled && styles.disabled,
                ]}
              >
                <Text
                  style={[
                    styles.dayNum,
                    selectedDay && styles.dayNumSelected,
                    isToday && !selectedDay && styles.dayNumToday,
                    disabled && styles.dayNumDisabled,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Selected: {formatScheduleDate(selectedDate) || 'Pick a date'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF8F1',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE8E1',
    padding: s(12),
  },
  cardCompact: {
    padding: s(10),
  },
  title: {
    fontSize: fs(13),
    fontWeight: '700',
    color: HEADING,
    marginBottom: s(10),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(10),
  },
  nav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  month: {
    flex: 1,
    textAlign: 'center',
    fontSize: fs(15),
    fontWeight: '700',
    color: HEADING,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: s(6),
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: fs(10),
    fontWeight: '600',
    color: colors.muted,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: s(4),
  },
  pill: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 1,
    borderColor: BRAND,
  },
  selected: {
    backgroundColor: BRAND,
  },
  disabled: {
    opacity: 0.35,
  },
  dayNum: {
    fontSize: fs(12),
    fontWeight: '600',
    color: HEADING,
  },
  dayNumToday: {
    color: BRAND,
  },
  dayNumSelected: {
    color: '#FFFFFF',
  },
  dayNumDisabled: {
    color: colors.muted,
  },
  hint: {
    marginTop: s(8),
    fontSize: fs(11),
    color: colors.muted,
    textAlign: 'center',
  },
});
