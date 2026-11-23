import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, SearchField } from '../components/ui';
import { navigateRoot, navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const COPY = {
  AppointmentsTab: {
    title: 'Appointments',
    body: 'Your upcoming and past appointments will appear here.',
  },
  TreatmentsTab: {
    title: 'All Treatments',
    body: 'Browse laser treatment options and request bookings from this tab.',
  },
  AboutTab: {
    title: 'About Us',
    body: 'Learn about Enfield Royal Clinics, branches, and care standards.',
  },
};

const TREATMENT_IMAGE = require('../../assets/treamntpateint.png');
const BRAND = '#BF824F';

// Ionicons only — SVG asset requires break on iOS/Android (web-only).
const PATIENT_CATEGORIES = [
  { id: 'laser', label: 'Laser\nTreatment', icon: 'flash-outline' },
  { id: 'hair', label: 'Hair Prp', icon: 'leaf-outline' },
  { id: 'fillers', label: 'Dermal\nFillers', icon: 'water-outline' },
  { id: 'facelift', label: 'Facelift', icon: 'person-outline' },
  { id: 'plastic', label: 'Plastic\nSurgery', icon: 'body-outline' },
  { id: 'skincare', label: 'Skin\nCare', icon: 'flower-outline' },
  { id: 'dental', label: 'Dental\nCare', icon: 'medical-outline' },
  { id: 'weight', label: 'Weight\nLoss', icon: 'fitness-outline' },
];

const TREATMENTS = [
  { id: 'laser', title: 'Laser Treatment', description: 'Discover exclusive offers and experience the beauty you deserve.' },
  { id: 'hair', title: 'Hair PRP', description: 'Restore healthier, fuller-looking hair with specialist care.' },
  { id: 'fillers', title: 'Dermal Fillers', description: 'Refresh your natural features with tailored treatments.' },
  { id: 'facelift', title: 'Facelift', description: 'Explore advanced rejuvenation treatments for lasting confidence.' },
];

function PatientTreatmentCard({ item, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => ({
        width: '48.5%',
        height: s(238),
        borderRadius: s(16),
        overflow: 'hidden',
        backgroundColor: colors.card,
        marginBottom: s(12),
        padding: s(7),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.82)',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Image
        source={TREATMENT_IMAGE}
        contentFit="cover"
        style={{
          position: 'absolute',
          left: s(7),
          top: s(7),
          right: s(7),
          bottom: s(7),
          borderRadius: s(13),
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: s(10),
          top: s(10),
          width: s(38),
          height: s(38),
          borderRadius: s(19),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(191,130,79,0.88)',
          zIndex: 2,
        }}
      >
        <Ionicons name="arrow-up" size={s(16)} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
      </View>
      <View
        style={{
          position: 'absolute',
          left: s(10),
          right: s(10),
          bottom: s(10),
          borderRadius: s(13),
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.72)',
          zIndex: 2,
        }}
      >
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.92)',
            minHeight: s(70),
            paddingVertical: s(10),
            paddingHorizontal: s(10),
          }}
        >
          <View style={{ flex: 1, marginRight: s(6) }}>
            <Text style={{ color: BRAND, fontSize: fs(13), fontWeight: '700' }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text
              style={{ color: '#666666', fontSize: fs(10), lineHeight: fs(13), marginTop: s(4) }}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function PatientPlaceholderScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { width } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('laser');
  const categorySize = Math.min(s(78), (Math.min(width - spacing.screen * 2, spacing.maxContent) - s(18)) / 4);
  const meta = COPY[route.name] || {
    title: route.name,
    body: 'Patient content for this tab will be designed next.',
  };

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
            {route.name === 'TreatmentsTab' ? (
              <IconCircleButton
                name="chevron-back"
                accessibilityLabel="Go back"
                onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
              />
            ) : null}
            <View style={{ flex: 1, marginLeft: route.name === 'TreatmentsTab' ? s(12) : 0 }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}>
                {meta.title}
              </Text>
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 3 }}>
                Patient
              </Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          {route.name === 'TreatmentsTab' ? (
            <>
              <View style={{ marginTop: s(16) }}>
                <SearchField
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Search Here..."
                  showButton={false}
                  iconPosition="left"
                />
              </View>

              <Text
                style={{
                  marginTop: s(18),
                  marginBottom: s(12),
                  fontSize: fs(16),
                  fontWeight: '700',
                  color: colors.ink,
                }}
              >
                All Treatments
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                overScrollMode="never"
                contentContainerStyle={{
                  paddingRight: s(10),
                  marginBottom: s(22),
                }}
              >
                {PATIENT_CATEGORIES.map((item) => {
                  const active = category === item.id;
                  const tone = active ? colors.white : BRAND;
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: active }}
                      onPress={() => setCategory(item.id)}
                      style={{
                        width: categorySize,
                        height: categorySize,
                        borderRadius: categorySize / 2,
                        backgroundColor: active ? BRAND : colors.card,
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: s(4),
                        marginRight: s(12),
                      }}
                    >
                      <Ionicons name={item.icon} size={s(25)} color={tone} />
                      <Text
                        style={{
                          marginTop: s(4),
                          textAlign: 'center',
                          fontSize: fs(9),
                          lineHeight: fs(11),
                          fontWeight: '600',
                          color: tone,
                        }}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Text
                style={{
                  marginBottom: s(12),
                  fontSize: fs(16),
                  fontWeight: '700',
                  color: colors.ink,
                }}
              >
                Laser Treatments
              </Text>

              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}
              >
                {TREATMENTS.filter((item) =>
                  `${item.title} ${item.description}`.toLowerCase().includes(search.trim().toLowerCase())
                ).map((item) => (
                  <PatientTreatmentCard
                    key={item.id}
                    item={item}
                    onPress={() =>
                      navigateRoot(navigation, 'PatientTreatmentDetail', {
                        treatment: item,
                      })
                    }
                  />
                ))}
              </View>
            </>
          ) : (
            <View
              style={{
                marginTop: s(22),
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: s(16),
              }}
            >
              <Text style={{ fontSize: fs(13), color: colors.desc, lineHeight: 18 }}>{meta.body}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
