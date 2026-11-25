import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, SearchField } from '../components/ui';
import { colors, radius, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';
import { useSession } from '../context/SessionContext';
import { usePatientData } from '../context/PatientDataContext';
import { PATIENT_CLINIC_CATALOG, resolvePatientRegion } from '../lib/patientClinic';


function LocationCard({ location, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View details for ${location.name}`}
      onPress={onPress}
      style={{
        overflow: 'hidden',
        borderRadius: radius.xl,
        backgroundColor: colors.card,
      }}
    >
      <Image
        source={require('../../assets/clinic-interior.png')}
        contentFit="cover"
        contentPosition="center"
        transition={180}
        accessibilityLabel="Enfield Royal Clinic interior"
        style={{ width: '100%', aspectRatio: 2.153, backgroundColor: colors.fieldAlt }}
      />

      <View style={{ paddingHorizontal: s(12), paddingTop: s(13), paddingBottom: s(10) }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: fs(14), fontWeight: '700', color: colors.brand }}>
            {location.name}
          </Text>
          <View
            style={{
              width: s(21),
              height: s(21),
              borderRadius: s(11),
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.brand,
            }}
          >
            <Ionicons name="arrow-up-outline" size={s(12)} color={colors.white} style={{ transform: [{ rotate: '45deg' }] }} />
          </View>
        </View>

        <Text style={{ marginTop: s(9), fontSize: fs(11), color: colors.desc, lineHeight: fs(16) }}>
          {location.description}
        </Text>

        <View
          style={{
            height: 1,
            marginTop: s(11),
            backgroundColor: colors.fieldAlt,
          }}
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(10) }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="location-outline" size={s(17)} color={colors.brandLight} />
            <Text style={{ marginLeft: s(7), fontSize: fs(10), color: colors.muted }}>{location.city}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="call-outline" size={s(16)} color={colors.brandLight} />
            <Text style={{ marginLeft: s(6), fontSize: fs(10), color: colors.muted }}>{location.phone}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function AboutUsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(16);
  const [query, setQuery] = useState('');
  // Each card decodes a large photo, so start with the patient's own region only.
  const [showAll, setShowAll] = useState(false);
  const { user } = useSession();
  // Re-render when the live clinic list arrives from the backend.
  const { clinics } = usePatientData();
  const region = resolvePatientRegion(user);

  const locations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    // The patient's own region first, then the rest.
    const all = PATIENT_CLINIC_CATALOG.map((clinic) => ({
      ...clinic,
      description: clinic.tagline || clinic.shortAddress,
    })).sort((a, b) => Number(b.region === region) - Number(a.region === region));
    if (!normalized) {
      if (showAll) return all;
      const own = all.filter((item) => item.region === region);
      return own.length ? own : all.slice(0, 1);
    }
    return all.filter((location) =>
      `${location.name} ${location.city} ${location.address} ${location.region}`.toLowerCase().includes(normalized)
    );
  }, [query, clinics, region, showAll]);
  const hiddenCount = Math.max(PATIENT_CLINIC_CATALOG.length - locations.length, 0);

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
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go to home"
              onPress={() => navigation.navigate('Home')}
            />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}>About Us</Text>
              <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.muted }}>Patient</Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <View style={{ marginTop: s(20) }}>
            <SearchField
              value={query}
              onChangeText={setQuery}
              placeholder="Search Here..."
              showButton={false}
            />
          </View>

          <Text style={{ marginTop: s(22), fontSize: fs(16), fontWeight: '700', color: colors.heading }}>
            Across Global Locations
          </Text>

          <View style={{ marginTop: s(12), gap: s(14) }}>
            {locations.map((location) => (
              <LocationCard
                key={location.id}
                location={location}
                onPress={() => navigation.navigate('AboutDetails', { clinic: location })}
              />
            ))}
          </View>

          {!query.trim() && !showAll && hiddenCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAll(true)}
              style={{
                marginTop: s(16),
                height: s(44),
                borderRadius: 999,
                borderWidth: 1,
                borderColor: colors.brand,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: fs(13), fontWeight: '600', color: colors.brand }}>
                Show all locations ({hiddenCount} more)
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
