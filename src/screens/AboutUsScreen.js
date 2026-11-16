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

const LOCATIONS = [
  {
    id: 'enfield-royal-dubai',
    name: 'Enfield Royal Clinic',
    city: 'Dubai',
    phone: '+971 50 XXX XXXX',
    description: 'Discover exclusive offers and experience the beauty you deserve.',
  },
];

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
        source={require('../../assets/signin-bg.png')}
        contentFit="cover"
        contentPosition="center"
        transition={180}
        accessibilityLabel="Enfield Royal Clinic interior"
        style={{ width: '100%', aspectRatio: 2.18, backgroundColor: colors.fieldAlt }}
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

  const locations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return LOCATIONS;
    return LOCATIONS.filter((location) =>
      `${location.name} ${location.city} ${location.description}`.toLowerCase().includes(normalized)
    );
  }, [query]);

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
                onPress={() => navigation.navigate('AboutDetails')}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
