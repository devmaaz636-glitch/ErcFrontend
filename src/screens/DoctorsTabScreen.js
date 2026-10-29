import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { IconCircleButton, SearchField, SkeletonRow } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { useNotifications } from '../context/NotificationsContext';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const doctorImage = require('../../assets/doctor.png');
const categories = ['All', 'Laser Treatment', 'Acne', 'Mummy Makeover', 'Hair Transplant'];

export default function DoctorsTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { unreadCount } = useNotifications();
  const { dashboard, loading, error } = useClinicData();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const doctors = dashboard?.doctors || [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesQuery = !q || `${doctor.name} ${doctor.specialty}`.toLowerCase().includes(q);
      const matchesCategory =
        category === 'All' ||
        doctor.specialty.toLowerCase().includes(category.replace(' Treatment', '').toLowerCase());
      return matchesQuery && matchesCategory;
    });
  }, [category, doctors, query]);

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
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconCircleButton name="chevron-back" accessibilityLabel="Go back" onPress={() => navigation.navigate('Home')} />
          <View style={{ flex: 1, marginLeft: s(12) }}>
            <Text style={{ color: colors.ink, fontSize: fs(16), fontWeight: '700' }}>Doctors</Text>
            <Text style={{ color: colors.desc, fontSize: fs(9), marginTop: 1 }}>Manage your branch's Doctors</Text>
          </View>
          <IconCircleButton
            name="notifications-outline"
            color={colors.brand}
            accessibilityLabel="Notifications"
            badgeCount={unreadCount}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>

        <View style={{ marginTop: s(18) }}>
          <SearchField value={query} onChangeText={setQuery} />
        </View>
        <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600', marginTop: s(18) }}>
          Doctors Categories
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: s(8) }}>
          {categories.map((item) => (
            <Pressable
              key={item}
              onPress={() => setCategory(item)}
              style={{
                backgroundColor: category === item ? colors.brand : colors.brandSoft,
                borderRadius: s(12),
                paddingHorizontal: s(10),
                paddingVertical: s(5),
                marginRight: s(8),
              }}
            >
              <Text style={{ color: category === item ? colors.white : colors.desc, fontSize: fs(8, 8) }}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: s(18) }}>
          <Text style={{ color: colors.ink, fontSize: fs(12), fontWeight: '600' }}>All Doctors</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('DoctorForm', { mode: 'create' })}
            style={{ backgroundColor: colors.brand, borderRadius: s(14), paddingHorizontal: s(10), paddingVertical: s(6) }}
          >
            <Text style={{ color: colors.white, fontSize: fs(8), fontWeight: '600' }}>Add New Doctor +</Text>
          </Pressable>
        </View>

        {error ? <Text style={{ color: colors.danger, textAlign: 'center', marginTop: s(16), fontSize: fs(10) }}>{error}</Text> : null}
        {loading && doctors.length === 0 ? <SkeletonRow lines={2} avatar style={{ marginTop: s(14) }} /> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: s(14) }}>
          {filtered.map((doctor) => (
            <Pressable
              key={doctor.id}
              onPress={() => navigation.navigate('DoctorDetail', { doctorId: doctor.id })}
              style={{ width: '48%', backgroundColor: colors.card, borderRadius: s(8), padding: s(10), marginBottom: s(10), alignItems: 'center' }}
            >
              <Image source={doctor.photo ? { uri: doctor.photo } : doctorImage} style={{ width: s(56), height: s(56), borderRadius: s(28) }} />
              <Text numberOfLines={1} style={{ color: colors.ink, fontSize: fs(9, 8), marginTop: s(8), textAlign: 'center' }}>{doctor.name}</Text>
              <Text numberOfLines={1} style={{ color: colors.desc, fontSize: fs(8, 7), marginTop: 3 }}>{doctor.specialty}</Text>
              <View style={{ width: '100%', backgroundColor: colors.brand, borderRadius: s(12), paddingVertical: s(5), marginTop: s(8), alignItems: 'center' }}>
                <Text style={{ color: colors.white, fontSize: fs(8, 7) }}>View Details</Text>
              </View>
            </Pressable>
          ))}
        </View>
        {!loading && filtered.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: s(40) }}>
            <Ionicons name="medical-outline" size={s(28)} color={colors.muted} />
            <Text style={{ color: colors.desc, fontSize: fs(11), marginTop: s(10) }}>No doctors found</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
