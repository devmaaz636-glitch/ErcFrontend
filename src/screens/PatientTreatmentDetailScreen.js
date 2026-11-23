import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { treatmentDoctorImage } from '../lib/doctorMedia';
import { colors, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const HERO_IMAGE = require('../../assets/treatmentdetail.png');
const BRAND = '#BF824F';

const DEFAULT_DOCTORS = [
  { id: 'ahmed-khan-1', name: 'Dr. Ahmed Khan', specialty: 'Laser Treatment', department: 'Laser' },
  { id: 'sarah-malik-1', name: 'Dr. Sarah Malik', specialty: 'Laser Treatment', department: 'Laser' },
];

function doctorsForTreatment(item) {
  const text = `${item.title || ''} ${item.name || ''} ${item.category || ''} ${item.department || ''}`.toLowerCase();
  const isHair = text.includes('hair') || text.includes('prp');
  const isInjectables = text.includes('fill') || text.includes('inject');
  const isPlastic = text.includes('face') || text.includes('plastic');
  if (isHair) {
    return [{ id: 'yusuf-alharbi', name: 'Dr. Yusuf Alharbi', specialty: 'Hair Specialist', department: 'Hair' }];
  }
  if (isInjectables) {
    return [{ id: 'maya-quinn', name: 'Dr. Maya Quinn', specialty: 'Injectables Specialist', department: 'Injectables' }];
  }
  if (isPlastic) {
    return [{ id: 'hana-farouk', name: 'Dr. Hana Farouk', specialty: 'Plastic Surgeon', department: 'Plastic Surgery' }];
  }
  return DEFAULT_DOCTORS;
}

function InfoTile({ icon, value, label }) {
  return (
    <View
      style={{
        width: '48.5%',
        minHeight: s(112),
        borderRadius: s(14),
        backgroundColor: '#FFFFFF',
        paddingTop: s(12),
        paddingBottom: s(10),
        paddingHorizontal: s(10),
        marginBottom: s(12),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: s(32),
          height: s(32),
          borderRadius: s(16),
          backgroundColor: '#F4E5D8',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: s(8),
        }}
      >
        <Ionicons name={icon} size={s(16)} color={BRAND} />
      </View>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{ color: '#171717', fontSize: fs(12), fontWeight: '700', textAlign: 'center' }}
      >
        {value}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{ marginTop: s(4), color: '#777777', fontSize: fs(9), textAlign: 'center' }}
      >
        {label}
      </Text>
    </View>
  );
}

function DoctorCard({ doctor, onPress }) {
  return (
    <View
      style={{
        width: '48.5%',
        minHeight: s(178),
        borderRadius: s(14),
        backgroundColor: '#FFFFFF',
        paddingTop: s(12),
        paddingBottom: s(12),
        paddingHorizontal: s(10),
        alignItems: 'center',
        marginBottom: s(12),
      }}
    >
      <Image
        source={treatmentDoctorImage}
        contentFit="cover"
        style={{
          width: s(76),
          height: s(76),
          borderRadius: s(38),
          backgroundColor: '#E7D7C8',
        }}
      />
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{ marginTop: s(8), color: '#171717', fontSize: fs(10), fontWeight: '700', textAlign: 'center' }}
      >
        {doctor.name}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{ marginTop: s(3), color: '#777777', fontSize: fs(9), textAlign: 'center' }}
      >
        {doctor.specialty}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View details for ${doctor.name}`}
        onPress={onPress}
        style={{
          marginTop: s(10),
          height: s(32),
          minWidth: s(112),
          borderRadius: 999,
          backgroundColor: '#CE9A72',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: fs(9), fontWeight: '700' }}>
          View Details
        </Text>
      </Pressable>
    </View>
  );
}

export default function PatientTreatmentDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const item = route.params?.treatment || {};
  const title = item.title || item.name || 'Laser Hair Removal';
  const description =
    item.description ||
    'Laser Treatment Uses Advanced Laser Technology To Improve Skin Textures, Reduce Unwanted Hair, Treat Pigmentation, And Address Various Skin Concerns. It Offers A Safe, Effective, And Precise Solution Tailored To Your Skin Type And Needs.';
  const doctors = doctorsForTreatment(item);

  function openDoctor(doctor) {
    navigation.navigate('DoctorDetail', {
      doctor: {
        ...doctor,
        photo: null,
        photoKey: 'treatmentdocotor',
      },
      doctorId: doctor.id,
      treatment: item,
    });
  }

  function bookNow() {
    navigation.navigate('PatientBookAppointment', {
      treatment: title,
      department: doctors[0]?.department || 'Laser',
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F3EF' }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(20),
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              style={{
                flex: 1,
                marginLeft: s(12),
                color: '#171717',
                fontSize: fs(15),
                fontWeight: '700',
              }}
            >
              Treatment Detail
            </Text>
            <NotificationBellButton color={BRAND} />
          </View>

          <View
            style={{
              marginTop: s(20),
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1, paddingRight: s(12) }}>
              <Text allowFontScaling={false} style={{ color: '#171717', fontSize: fs(15), fontWeight: '700' }}>
                {title}
              </Text>
              <Text allowFontScaling={false} style={{ marginTop: s(4), color: '#777777', fontSize: fs(9) }}>
                Laser Department
              </Text>
            </View>
            <View
              style={{
                borderRadius: 999,
                backgroundColor: '#DCF2E4',
                paddingHorizontal: s(10),
                paddingVertical: s(5),
              }}
            >
              <Text allowFontScaling={false} style={{ color: '#4A8A62', fontSize: fs(9), fontWeight: '700' }}>
                Active
              </Text>
            </View>
          </View>

          <Image
            source={HERO_IMAGE}
            contentFit="cover"
            style={{
              width: '100%',
              height: s(210),
              borderRadius: s(14),
              marginTop: s(14),
              backgroundColor: '#EAE1D8',
            }}
          />

          <Text
            allowFontScaling={false}
            style={{ marginTop: s(18), color: '#171717', fontSize: fs(14), fontWeight: '700' }}
          >
            About Treatment
          </Text>
          <Text
            allowFontScaling={false}
            style={{ marginTop: s(8), color: '#777777', fontSize: fs(10), lineHeight: fs(15) }}
          >
            {description}
          </Text>

          <Text
            allowFontScaling={false}
            style={{ marginTop: s(20), color: '#171717', fontSize: fs(14), fontWeight: '700' }}
          >
            Treatment Information
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(12),
            }}
          >
            <InfoTile icon="cash-outline" value="AED 500" label="Price Per Session" />
            <InfoTile icon="time-outline" value="30 min" label="Duration" />
            <InfoTile icon="people-outline" value="12" label="Sessions" />
            <InfoTile icon="business-outline" value="Laser" label="Department" />
          </View>

          <Text
            allowFontScaling={false}
            style={{ marginTop: s(8), color: '#171717', fontSize: fs(14), fontWeight: '700' }}
          >
            Doctors Providing This Treatment
          </Text>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(12),
            }}
          >
            {doctors.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} onPress={() => openDoctor(doctor)} />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Book now"
            onPress={bookNow}
            style={{
              height: s(52),
              borderRadius: 999,
              backgroundColor: BRAND,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: s(10),
              marginBottom: s(4),
            }}
          >
            <Text allowFontScaling={false} style={{ color: '#FFFFFF', fontSize: fs(14), fontWeight: '700' }}>
              Book Now
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
