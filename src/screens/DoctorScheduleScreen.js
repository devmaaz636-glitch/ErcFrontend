import { useCallback, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import {
  WEEK_DAYS,
  createDefaultWeeklySchedule,
} from '../components/SelectScheduleModal';
import { IconCircleButton, NotificationBellButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import {
  loadDoctorLeaveRequests,
  loadDoctorWeeklySchedule,
} from '../lib/doctorScheduleStorage';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

function buildWeekStrip(anchor = new Date()) {
  const start = new Date(anchor);
  const day = start.getDay(); // 0 Sun
  const diffToMon = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diffToMon);
  start.setHours(12, 0, 0, 0);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toISOString().slice(0, 10),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: String(date.getDate()).padStart(2, '0'),
      date,
    };
  });
}

function StatusPill({ label, tone = 'pending' }) {
  const styles =
    tone === 'working'
      ? { bg: colors.successBg, color: colors.success }
      : tone === 'off'
        ? { bg: '#EEEAE6', color: colors.muted }
        : { bg: colors.warningBg, color: colors.brand };

  return (
    <View
      style={{
        backgroundColor: styles.bg,
        borderRadius: 999,
        paddingHorizontal: s(10),
        paddingVertical: s(4),
      }}
    >
      <Text style={{ color: styles.color, fontSize: fs(9), fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

function HoursRow({ label, value, working, last }) {
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
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600' }}>{label}</Text>
        <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 3 }}>{value}</Text>
      </View>
      <StatusPill label={working ? 'Working' : 'Off'} tone={working ? 'working' : 'off'} />
    </View>
  );
}

export default function DoctorScheduleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();
  const week = useMemo(() => buildWeekStrip(new Date()), []);
  const [selectedDayKey, setSelectedDayKey] = useState(week[0]?.key);
  const [schedule, setSchedule] = useState(createDefaultWeeklySchedule);
  const [leaves, setLeaves] = useState([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const nextSchedule = await loadDoctorWeeklySchedule(user?.uid);
        const nextLeaves = await loadDoctorLeaveRequests(user?.uid);
        if (!active) return;
        setSchedule(nextSchedule);
        setLeaves(
          nextLeaves.length
            ? nextLeaves
            : [
                {
                  id: 'leave-seed-1',
                  title: 'Annual Leave',
                  status: 'Pending',
                  range: '12 November – 14 November 2026',
                  note: 'Leave request awaiting review',
                },
              ]
        );
      })();
      return () => {
        active = false;
      };
    }, [user?.uid])
  );

  const hoursRows = useMemo(
    () =>
      WEEK_DAYS.map((day) => {
        const item = schedule?.[day.key] || { enabled: false, start: '09:00 AM', end: '05:00 PM' };
        return {
          key: day.key,
          label: day.label,
          working: Boolean(item.enabled),
          value: item.enabled ? `${item.start} – ${item.end}` : 'Day Off',
        };
      }),
    [schedule]
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.brand}
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}>Schedule</Text>
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 2 }}>
                Manage your working hours and availability
              </Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <Text
            style={{
              marginTop: s(22),
              fontSize: fs(14),
              fontWeight: '700',
              color: colors.ink,
            }}
          >
            This Week
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: s(12), paddingBottom: s(4), gap: s(8) }}
          >
            {week.map((day) => {
              const active = day.key === selectedDayKey;
              return (
                <Pressable
                  key={day.key}
                  onPress={() => setSelectedDayKey(day.key)}
                  style={{
                    width: s(52),
                    borderRadius: 14,
                    paddingVertical: s(10),
                    alignItems: 'center',
                    backgroundColor: active ? colors.brand : colors.card,
                  }}
                >
                  <Text
                    style={{
                      color: active ? colors.white : colors.ink,
                      fontSize: fs(10),
                      fontWeight: '600',
                    }}
                  >
                    {day.label}
                  </Text>
                  <Text
                    style={{
                      color: active ? colors.white : colors.ink,
                      fontSize: fs(14),
                      fontWeight: '700',
                      marginTop: 4,
                    }}
                  >
                    {day.day}
                  </Text>
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      marginTop: 6,
                      backgroundColor: active ? colors.white : '#D9D2CB',
                    }}
                  />
                </Pressable>
              );
            })}
          </ScrollView>

          <View
            style={{
              marginTop: s(20),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, marginRight: s(10) }}>
              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }}>
                Weekly Working Hours
              </Text>
              <Text style={{ fontSize: fs(10), color: colors.desc, marginTop: 3 }}>
                Your regular availability
              </Text>
            </View>
            <StatusPill label="Pending" />
          </View>

          <View
            style={{
              marginTop: s(12),
              backgroundColor: colors.card,
              borderRadius: 16,
              paddingHorizontal: s(14),
              paddingVertical: s(4),
            }}
          >
            {hoursRows.map((row, index) => (
              <HoursRow
                key={row.key}
                label={row.label}
                value={row.value}
                working={row.working}
                last={index === hoursRows.length - 1}
              />
            ))}
          </View>

          <PrimaryButton
            label="Edit Working Hours"
            onPress={() =>
              navigation.navigate('DoctorEditSchedule', {
                schedule,
                mode: 'hours',
              })
            }
            size="sm"
            style={{ marginTop: s(14), width: '100%' }}
          />

          <Text
            style={{
              marginTop: s(22),
              fontSize: fs(14),
              fontWeight: '700',
              color: colors.ink,
            }}
          >
            Upcoming Leave
          </Text>
          <Text style={{ fontSize: fs(10), color: colors.desc, marginTop: 3 }}>
            Your regular availability
          </Text>

          {leaves.map((leave) => (
            <View
              key={leave.id}
              style={{
                marginTop: s(12),
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: s(14),
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ flex: 1, color: colors.ink, fontSize: fs(13), fontWeight: '700' }}>
                  {leave.title}
                </Text>
                <StatusPill label={leave.status || 'Pending'} />
              </View>
              <Text style={{ color: colors.ink, fontSize: fs(11), marginTop: s(10) }}>
                {leave.range}
              </Text>
              <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 4 }}>{leave.note}</Text>
            </View>
          ))}

          <PrimaryButton
            label="Request Leave"
            onPress={() =>
              navigation.navigate('DoctorEditSchedule', {
                schedule,
                mode: 'leave',
              })
            }
            size="sm"
            style={{ marginTop: s(14), width: '100%' }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
