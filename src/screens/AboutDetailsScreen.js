import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { IconCircleButton } from '../components/ui';
import { colors, radius, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const REASONS = [
  'Experienced medical professionals',
  'Personalized treatment plans',
  'Advanced technology and modern facilities',
  'Patient-focused care',
  'Comfortable and welcoming environment',
];

const CONTACT_DETAILS = [
  { id: 'address', icon: 'location-outline', title: 'Address', value: 'Dubai street 39030 Al Hsnokns' },
  { id: 'phone', icon: 'call-outline', title: 'Phone', value: '+923318555546' },
  { id: 'email', icon: 'mail-outline', title: 'Email', value: 'info@erc.pk' },
];

function ReasonRow({ label, isLast }) {
  return (
    <View
      style={{
        minHeight: s(34),
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: colors.fieldAlt,
        borderStyle: 'dashed',
      }}
    >
      <View
        style={{
          width: s(12),
          height: s(12),
          borderWidth: 2,
          borderColor: colors.brandLight,
          borderRadius: s(6),
          marginRight: s(12),
        }}
      />
      <Text style={{ flex: 1, fontSize: fs(10), color: colors.desc }}>{label}</Text>
    </View>
  );
}

function ContactCard({ icon, title, value }) {
  const circle = s(39);
  return (
    <View style={{ marginTop: s(28), alignItems: 'center' }}>
      <View
        style={{
          position: 'absolute',
          top: -s(19),
          zIndex: 2,
          width: circle,
          height: circle,
          borderRadius: circle / 2,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.brandLight,
        }}
      >
        <Ionicons name={icon} size={s(21)} color={colors.white} />
      </View>
      <View
        style={{
          width: '92%',
          minHeight: s(95),
          borderRadius: radius.sm,
          backgroundColor: colors.card,
          alignItems: 'center',
          justifyContent: 'center',
          paddingTop: s(20),
          paddingHorizontal: s(12),
          paddingBottom: s(12),
        }}
      >
        <Text style={{ fontSize: fs(13), fontWeight: '500', color: colors.ink }}>{title}</Text>
        <Text style={{ marginTop: s(10), fontSize: fs(11), color: colors.desc, textAlign: 'center' }}>{value}</Text>
      </View>
    </View>
  );
}

export default function AboutDetailsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(16);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(28),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton name="chevron-back" accessibilityLabel="Go back" onPress={() => navigation.goBack()} />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}>About Us</Text>
              <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.muted }}>Patient</Text>
            </View>
          </View>

          <Image
            source={require('../../assets/clinic-interior.png')}
            contentFit="cover"
            contentPosition="center"
            transition={180}
            accessibilityLabel="Enfield Royal Clinic interior"
            style={{
              width: '100%',
              aspectRatio: 1.88,
              marginTop: s(20),
              borderRadius: radius.md,
              backgroundColor: colors.fieldAlt,
            }}
          />

          <Text style={{ marginTop: s(13), fontSize: fs(14), fontWeight: '700', color: colors.brand }}>
            Enfield Royal Clinic
          </Text>
          <Text style={{ marginTop: s(8), fontSize: fs(10), color: colors.desc, lineHeight: fs(14) }}>
            At our clinic, we believe everyone deserves to feel confident, healthy, and cared for. We bring together
            experienced medical professionals, advanced treatments, and personalized care to provide a comfortable and
            trusted healthcare experience.
          </Text>

          <Text style={{ marginTop: s(21), fontSize: fs(15), fontWeight: '700', color: colors.heading }}>
            Why Choose Us
          </Text>
          <View style={{ marginTop: s(12), paddingHorizontal: s(12), borderRadius: radius.md, backgroundColor: colors.card }}>
            {REASONS.map((reason, index) => (
              <ReasonRow key={reason} label={reason} isLast={index === REASONS.length - 1} />
            ))}
          </View>

          <Text
            style={{
              marginTop: s(24),
              fontSize: fs(15),
              fontWeight: '700',
              color: colors.heading,
              textAlign: 'center',
            }}
          >
            Our Contact Details
          </Text>

          <View style={{ marginTop: s(8), paddingBottom: s(8) }}>
            {CONTACT_DETAILS.map((contact) => (
              <ContactCard key={contact.id} {...contact} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
