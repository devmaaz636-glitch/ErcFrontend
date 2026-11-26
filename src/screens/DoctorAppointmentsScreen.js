import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Text from '../components/AppText';
import { FilterChips, PersonCard, StateNotice } from '../components/doctor/DoctorUI';
import { NotificationBellButton, PrimaryButton, SearchField } from '../components/ui';
import { useDoctorQuery } from '../hooks/useDoctorQuery';
import { fetchDoctorAppointments, updateDoctorAppointment } from '../lib/doctorPortal';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'upcoming', label: 'Confirmed' },
  { key: 'completed', label: 'Completed' },
  { key: 'canceled', label: 'Canceled' },
];

export default function DoctorAppointmentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const [filter, setFilter] = useState('pending');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState('');
  const { data, error, loading, reload } = useDoctorQuery(fetchDoctorAppointments);

  const items = data || [];
  const q = query.trim().toLowerCase();
  const visible = items.filter(
    (item) =>
      item.status === filter &&
      (!q || `${item.patientName} ${item.treatment} ${item.requestId}`.toLowerCase().includes(q))
  );
  // History reads newest first; open work reads soonest first.
  if (filter === 'completed' || filter === 'canceled') visible.reverse();

  async function confirm(id) {
    if (busyId) return;
    setBusyId(id);
    try {
      await updateDoctorAppointment(id, { action: 'confirm' });
      await reload();
    } catch (confirmError) {
      Alert.alert('Could not confirm', confirmError.message);
    } finally {
      setBusyId('');
    }
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
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: fs(18), fontWeight: '700', color: colors.ink }}>Appointments</Text>
            <NotificationBellButton color={colors.brand} />
          </View>
          <View style={{ marginTop: s(16) }}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search patient or request ID" />
          </View>
          <FilterChips
            options={FILTERS.map((option) => ({
              ...option,
              label: `${option.label} (${items.filter((item) => item.status === option.key).length})`,
            }))}
            value={filter}
            onChange={setFilter}
          />

          <StateNotice
            loading={loading && !data}
            error={error}
            onRetry={reload}
            empty={data && !visible.length ? 'No appointments in this list.' : ''}
          />

          {visible.map((item) => (
            <PersonCard
              key={item.id}
              name={item.patientName}
              line={item.treatment}
              subline={`${item.dateLabel} · ${item.time} · ${item.requestId}`}
              status={item.status}
              onPress={() => navigation.navigate('DoctorReviewHistory', { appointmentId: item.id })}
            >
              {item.status === 'pending' ? (
                <PrimaryButton
                  label="Confirm Booking"
                  size="sm"
                  loading={busyId === item.id}
                  onPress={() => confirm(item.id)}
                  style={{ marginTop: s(12), width: '100%' }}
                />
              ) : null}
            </PersonCard>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
