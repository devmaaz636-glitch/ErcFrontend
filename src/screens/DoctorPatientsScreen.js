import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Text from '../components/AppText';
import { FilterChips, PersonCard, StateNotice } from '../components/doctor/DoctorUI';
import { IconCircleButton, NotificationBellButton, SearchField } from '../components/ui';
import { useDoctorQuery } from '../hooks/useDoctorQuery';
import { fetchDoctorPatients } from '../lib/doctorPortal';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
];

const isActive = (patient) => patient.status === 'pending' || patient.status === 'upcoming';

export default function DoctorPatientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const { data, error, loading, reload } = useDoctorQuery(fetchDoctorPatients);

  const q = query.trim().toLowerCase();
  const visible = (data || []).filter(
    (patient) =>
      (filter === 'all' || (filter === 'active') === isActive(patient)) &&
      (!q || `${patient.name} ${patient.treatment}`.toLowerCase().includes(q))
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
            <IconCircleButton name="chevron-back" accessibilityLabel="Go to home" onPress={() => navigation.navigate('Home')} />
            <Text style={{ flex: 1, marginLeft: s(12), fontSize: fs(18), fontWeight: '700', color: colors.ink }}>
              Patients
            </Text>
            <NotificationBellButton color={colors.brand} />
          </View>
          <View style={{ marginTop: s(16) }}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search Here" />
          </View>
          <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

          <StateNotice
            loading={loading && !data}
            error={error}
            onRetry={reload}
            empty={data && !visible.length ? 'No patients yet. They appear here once they book with you.' : ''}
          />

          {visible.map((patient) => (
            <PersonCard
              key={patient.uid}
              name={patient.name}
              line={`${patient.treatment} · ${patient.visits} completed visit${patient.visits === 1 ? '' : 's'}`}
              subline={`${isActive(patient) ? 'Next' : 'Last'}: ${patient.dateLabel} · ${patient.time}`}
              status={patient.status}
              onPress={() => navigation.navigate('DoctorReviewHistory', { appointmentId: patient.appointmentId })}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
