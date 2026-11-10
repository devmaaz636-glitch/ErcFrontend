import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, SearchField } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { createDoctorPatientsSeed } from '../lib/doctorSeed';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/patientimage.png');

const CATEGORY_TABS = [
  { key: 'all', label: 'All' },
  { key: 'completed', label: 'Completed' },
  { key: 'upcoming', label: 'Upcoming' },
];

function CategoryTabs({ active, onChange }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(12), gap: s(18) }}>
      {CATEGORY_TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            onPress={() => onChange(tab.key)}
            style={{
              height: s(32),
              paddingHorizontal: s(16),
              borderRadius: 999,
              backgroundColor: isActive ? colors.brand : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: fs(12),
                fontWeight: '600',
                color: isActive ? colors.white : colors.ink,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function PatientRow({ item, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(12),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Image
        source={patientImage}
        contentFit="cover"
        style={{
          width: s(44),
          height: s(44),
          borderRadius: s(22),
          backgroundColor: colors.fieldAlt,
        }}
      />
      <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
        <Text style={{ color: colors.ink, fontSize: fs(13), fontWeight: '700' }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ color: colors.desc, fontSize: fs(10), marginTop: 3 }} numberOfLines={1}>
          {item.treatment} • {item.consults} Consults
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={s(16)} color={colors.muted} />
    </Pressable>
  );
}

export default function DoctorPatientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user } = useSession();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const seed = useMemo(
    () =>
      createDoctorPatientsSeed({
        doctorName: user?.name || 'Dr Zeeshan Forward',
        branchName: user?.branchName || 'Dubai Branch',
      }),
    [user?.name, user?.branchName]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return seed.patients.filter((item) => {
      const categoryOk = category === 'all' || item.category === category;
      if (!categoryOk) return false;
      if (!q) return true;
      const hay = `${item.name} ${item.treatment} ${item.patientId} ${item.consults}`;
      return hay.toLowerCase().includes(q);
    });
  }, [seed.patients, category, query]);

  function openPatient(item) {
    navigation.navigate('DoctorReviewHistory', {
      item: {
        id: item.id,
        patient: item.name,
        patientId: item.patientId,
        appointmentId: item.appointmentId || item.patientId,
        treatment: item.treatment,
        department: item.department,
        doctor: item.doctor,
        specialty: item.specialty,
        status: item.status,
        requestedDate: item.requestedDate,
        requestedTime: item.requestedTime,
        time: item.requestedTime,
        durationMinutes: item.durationMinutes,
        duration: item.duration,
        price: item.price,
        branchName: item.branchName,
        phone: item.phone,
        ageGender: item.ageGender,
        allergy: item.allergy,
        medication: item.medication,
        previousVisits: item.previousVisits,
      },
    });
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
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 30 }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.brand}
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <View style={{ flex: 1 }} />
            <NotificationBellButton color={colors.brand} />
          </View>

          <Text style={{ marginTop: s(14), fontSize: fs(22), fontWeight: '700', color: colors.ink }}>
            Patients
          </Text>
          <Text style={{ marginTop: 4, fontSize: fs(12), color: colors.desc }}>
            Manage your Patients
          </Text>

          <View style={{ marginTop: s(16) }}>
            <SearchField value={query} onChangeText={setQuery} placeholder="Search Here" />
          </View>

          <Text
            style={{
              marginTop: s(20),
              fontSize: fs(14),
              fontWeight: '700',
              color: colors.ink,
            }}
          >
            Patients Categories
          </Text>
          <CategoryTabs active={category} onChange={setCategory} />

          <Text
            style={{
              marginTop: s(20),
              marginBottom: s(12),
              fontSize: fs(14),
              fontWeight: '700',
              color: colors.ink,
            }}
          >
            All Patients
          </Text>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(36) }}>
              <Ionicons name="people-outline" size={s(28)} color={colors.muted} />
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>
                No patients found
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <PatientRow key={item.id} item={item} onPress={() => openPatient(item)} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
