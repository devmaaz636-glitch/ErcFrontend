import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Text from '../components/AppText';
import UserAvatar from '../components/UserAvatar';
import { Avatar, PersonCard, StateNotice, cardStyle } from '../components/doctor/DoctorUI';
import { NotificationBellButton, SearchField, SectionHeader } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useDoctorQuery } from '../hooks/useDoctorQuery';
import { fetchDoctorDashboard } from '../lib/doctorPortal';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

export default function DoctorHomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const { data, error, loading, reload } = useDoctorQuery(fetchDoctorDashboard);

  const open = (appointmentId) => navigation.navigate('DoctorReviewHistory', { appointmentId });
  const q = query.trim().toLowerCase();
  const matches = (item) =>
    !q || `${item.patientName} ${item.treatment} ${item.requestId || ''}`.toLowerCase().includes(q);

  const stats = [
    { id: 'today', icon: 'calendar-outline', value: data?.stats.today, label: "Today's Appointments" },
    { id: 'upcoming', icon: 'time-outline', value: data?.stats.upcoming, label: 'Confirmed Upcoming' },
    { id: 'pending', icon: 'calendar-number-outline', value: data?.stats.pending, label: 'Awaiting Confirmation' },
    { id: 'canceled', icon: 'close-circle-outline', value: data?.stats.canceledToday, label: "Today's Cancellations" },
  ];

  const card = (item) => (
    <PersonCard
      key={item.id}
      name={item.patientName}
      line={item.treatment}
      subline={`${item.dateLabel} · ${item.time}`}
      status={item.status}
      onPress={() => open(item.id)}
    />
  );

  const section = (title, items, empty) => (
    <View style={{ marginTop: s(20) }}>
      <SectionHeader title={title} onAction={() => navigation.navigate('AppointmentsTab')} />
      {items.length ? items.map(card) : <StateNotice empty={empty} />}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {user?.photoUrl ? <UserAvatar uri={user.photoUrl} size={s(46)} /> : <Avatar size={46} />}
            <View style={{ flex: 1, marginLeft: s(10), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                Hi, {user?.name || 'Doctor'}
              </Text>
              {user?.branchName ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                  <Ionicons name="location-sharp" size={s(11)} color={colors.brand} />
                  <Text style={{ marginLeft: 4, fontSize: fs(11), color: colors.desc }} numberOfLines={1}>
                    {user.branchName}
                  </Text>
                </View>
              ) : null}
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <View style={{ marginTop: s(16) }}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search patient or treatment" />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: s(16) }}>
            {stats.map((item) => (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => navigation.navigate('AppointmentsTab')}
                style={{
                  width: '48%',
                  marginBottom: s(10),
                  backgroundColor: colors.brand,
                  borderRadius: 16,
                  padding: s(12),
                }}
              >
                <Ionicons name={item.icon} size={s(18)} color={colors.white} />
                <Text style={{ marginTop: s(8), fontSize: fs(20), fontWeight: '700', color: colors.white }}>
                  {item.value ?? '—'}
                </Text>
                <Text style={{ marginTop: 2, fontSize: fs(10), color: colors.white }}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <StateNotice loading={loading && !data} error={error} onRetry={reload} />

          {data ? (
            <>
              {section(
                'Awaiting Your Confirmation',
                data.pending.filter(matches).slice(0, 3),
                'No new booking requests.'
              )}
              {section('Next Appointment', [data.next].filter(Boolean).filter(matches), 'No confirmed appointment yet.')}
              {section("Today's Appointments", data.today.filter(matches), 'Nothing booked for today.')}

              <View style={{ marginTop: s(20) }}>
                <SectionHeader title="Follow Up Reminder" onAction={() => navigation.navigate('PatientsTab')} />
                {data.followUps.length ? (
                  data.followUps.map((plan) => (
                    <PersonCard
                      key={`${plan.patientUid}-${plan.treatmentId}`}
                      name={plan.patientName}
                      line={plan.treatment}
                      subline={`${plan.completed} of ${plan.sessions} sessions completed`}
                      status="due"
                      onPress={() => open(plan.appointmentId)}
                    />
                  ))
                ) : (
                  <View style={[cardStyle, { marginTop: s(12), alignItems: 'center' }]}>
                    <Text style={{ fontSize: fs(12), color: colors.desc }}>No patients are due for follow-up.</Text>
                  </View>
                )}
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
