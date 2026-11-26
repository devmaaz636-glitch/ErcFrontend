import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { toDateKey } from '../components/BookingCalendar';
import { WEEK_DAYS } from '../components/SelectScheduleModal';
import { PersonCard, StateNotice, cardStyle } from '../components/doctor/DoctorUI';
import { IconCircleButton, NotificationBellButton, PrimaryButton } from '../components/ui';
import { useDoctorQuery } from '../hooks/useDoctorQuery';
import { fetchDoctorAppointments, fetchDoctorSchedule } from '../lib/doctorPortal';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const REQUEST_LABEL = {
  pending: { label: 'Awaiting manager', color: colors.brand },
  approved: { label: 'Approved', color: colors.success },
  declined: { label: 'Declined', color: colors.danger },
};

/** Monday-to-Sunday of the current week. */
function weekDays() {
  const start = new Date();
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: toDateKey(date),
      label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      day: date.getDate(),
    };
  });
}

const niceDate = (key) =>
  new Date(`${key}T00:00:00`).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

async function loadSchedule() {
  const [schedule, appointments] = await Promise.all([fetchDoctorSchedule(), fetchDoctorAppointments()]);
  return { ...schedule, appointments };
}

function RequestTag({ status }) {
  const tone = REQUEST_LABEL[status] || REQUEST_LABEL.pending;
  return <Text style={{ fontSize: fs(11), fontWeight: '700', color: tone.color }}>{tone.label}</Text>;
}

export default function DoctorScheduleScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const [selected, setSelected] = useState(() => toDateKey(new Date()));
  const loader = useCallback(loadSchedule, []);
  const { data, error, loading, reload } = useDoctorQuery(loader);

  const week = weekDays();
  const open = (data?.appointments || []).filter((item) => item.status !== 'canceled');
  const onSelectedDay = open.filter((item) => item.date === selected);
  const edit = (mode) => navigation.navigate('DoctorEditSchedule', { mode, schedule: data?.weeklySchedule });

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
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <Text style={{ flex: 1, marginLeft: s(12), fontSize: fs(18), fontWeight: '700', color: colors.ink }}>
              Schedule
            </Text>
            <NotificationBellButton color={colors.brand} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: s(18) }}>
            {week.map((day) => {
              const active = day.key === selected;
              const busy = open.some((item) => item.date === day.key);
              return (
                <Pressable
                  key={day.key}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelected(day.key)}
                  style={{
                    width: '13%',
                    borderRadius: 12,
                    paddingVertical: s(8),
                    alignItems: 'center',
                    backgroundColor: active ? colors.brand : colors.card,
                  }}
                >
                  <Text style={{ fontSize: fs(9), color: active ? colors.white : colors.ink }}>{day.label}</Text>
                  <Text style={{ fontSize: fs(13), fontWeight: '700', color: active ? colors.white : colors.ink }}>
                    {day.day}
                  </Text>
                  <View
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 3,
                      marginTop: 4,
                      backgroundColor: busy ? (active ? colors.white : colors.brand) : 'transparent',
                    }}
                  />
                </Pressable>
              );
            })}
          </View>

          <StateNotice loading={loading && !data} error={error} onRetry={reload} />

          {data ? (
            <>
              {onSelectedDay.length ? (
                onSelectedDay.map((item) => (
                  <PersonCard
                    key={item.id}
                    name={item.patientName}
                    line={item.treatment}
                    subline={`${item.time} - ${item.endTime}`}
                    status={item.status}
                    onPress={() => navigation.navigate('DoctorReviewHistory', { appointmentId: item.id })}
                  />
                ))
              ) : (
                <StateNotice empty={`No appointments on ${niceDate(selected)}.`} />
              )}

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(22) }}>
                <Text style={{ flex: 1, fontSize: fs(14), fontWeight: '700', color: colors.ink }}>
                  Weekly Working Hours
                </Text>
                {data.latestHoursRequest ? <RequestTag status={data.latestHoursRequest.status} /> : null}
              </View>
              <View style={[cardStyle, { marginTop: s(10) }]}>
                {WEEK_DAYS.map((day) => {
                  const hours = data.weeklySchedule[day.key];
                  return (
                    <View key={day.key} style={{ flexDirection: 'row', paddingVertical: s(6) }}>
                      <Text style={{ flex: 1, fontSize: fs(12), color: colors.ink }}>{day.label}</Text>
                      <Text style={{ fontSize: fs(12), color: hours?.enabled ? colors.ink : colors.muted }}>
                        {hours?.enabled ? `${hours.start} – ${hours.end}` : 'Day off'}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <PrimaryButton
                label="Request New Hours"
                size="sm"
                onPress={() => edit('hours')}
                style={{ marginTop: s(12), width: '100%' }}
              />

              <Text style={{ marginTop: s(22), fontSize: fs(14), fontWeight: '700', color: colors.ink }}>Leave</Text>
              {data.leaves.length ? (
                data.leaves.map((leave) => (
                  <View key={leave.id} style={[cardStyle, { marginTop: s(10) }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ flex: 1, fontSize: fs(12), fontWeight: '700', color: colors.ink }}>
                        {leave.leaveFrom
                          ? leave.leaveTo && leave.leaveTo !== leave.leaveFrom
                            ? `${niceDate(leave.leaveFrom)} – ${niceDate(leave.leaveTo)}`
                            : niceDate(leave.leaveFrom)
                          : 'Leave request'}
                      </Text>
                      <RequestTag status={leave.status} />
                    </View>
                    {leave.reason ? (
                      <Text style={{ marginTop: s(6), fontSize: fs(11), color: colors.desc }}>{leave.reason}</Text>
                    ) : null}
                    {leave.decisionNote ? (
                      <Text style={{ marginTop: s(4), fontSize: fs(11), color: colors.desc }}>
                        Manager: {leave.decisionNote}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <StateNotice empty="No leave requested." />
              )}
              <PrimaryButton
                label="Request Leave"
                size="sm"
                onPress={() => edit('leave')}
                style={{ marginTop: s(12), width: '100%' }}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
