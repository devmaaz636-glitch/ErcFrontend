import { useEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path, Line } from 'react-native-svg';
import Text from '../components/AppText';
import PatientRegionPickerModal from '../components/PatientRegionPickerModal';
import UserAvatar from '../components/UserAvatar';
import { NotificationBellButton, PrimaryButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { patientBranchMeta } from '../lib/patientClinic';
import { colors, shadows, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const PROMO_CARD = require('../../assets/patientcard.png');
const TREATMENT_IMAGE = require('../../assets/treamntpateint.png');
const PATIENT_AVATAR = require('../../assets/patientimage.png');
const DOCTOR_AVATAR = require('../../assets/treatmentdocotor.png');
const CARD_BG = '#BF824F';

const PROMO_SLIDES = [
  {
    id: 'promo-1',
    eyebrow: 'Exclusive Beauty Deals',
    title: 'Save Up To 40%',
    body: 'Discover exclusive offers and experience the beauty you deserve.',
    cta: 'Book Now',
    image: PROMO_CARD,
  },
  {
    id: 'promo-2',
    eyebrow: 'New Season Offers',
    title: 'Glow With Confidence',
    body: 'Book premium skincare treatments with specialists at your clinic.',
    cta: 'Book Now',
    image: PROMO_CARD,
  },
  {
    id: 'promo-3',
    eyebrow: 'Member Privileges',
    title: 'Priority Booking',
    body: 'Reserve preferred slots faster and manage follow-ups in one place.',
    cta: 'Book Now',
    image: PROMO_CARD,
  },
];

function LaserTreatmentIcon({ color, size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Ellipse cx="24" cy="20" rx="10" ry="12" stroke={color} strokeWidth={1.7} />
      <Path d="M16 30 C18 36 30 36 32 30" stroke={color} strokeWidth={1.7} fill="none" />
      <Path d="M18 18 H22 M26 16 H30" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M30 12 L38 8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M36 6 L40 10 M38 5 L38 11" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Circle cx="14" cy="12" r="1.2" fill={color} />
      <Circle cx="34" cy="26" r="1.2" fill={color} />
    </Svg>
  );
}

function HairPrpIcon({ color, size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M18 34 C18 24 22 14 30 12 C28 20 30 28 34 34"
        stroke={color}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M22 16 C24 12 28 10 32 11" stroke={color} strokeWidth={1.5} fill="none" />
      <Path d="M12 18 L20 22" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
      <Path d="M10 16 L14 20" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M20 22 L18 28" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="20" cy="22" r="1.4" fill={color} />
    </Svg>
  );
}

function DermalFillersIcon({ color, size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Ellipse cx="24" cy="22" rx="11" ry="13" stroke={color} strokeWidth={1.7} />
      <Line x1="24" y1="10" x2="24" y2="34" stroke={color} strokeWidth={1.5} />
      <Path d="M18 18 C20 16 22 16 24 18" stroke={color} strokeWidth={1.4} fill="none" />
      <Path d="M24 18 C26 16 28 16 30 18" stroke={color} strokeWidth={1.4} fill="none" />
      <Path d="M19 26 C21 28 27 28 29 26" stroke={color} strokeWidth={1.4} fill="none" />
      <Path d="M33 14 L37 11 M35 10 L37 14" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
      <Circle cx="14" cy="28" r="1.1" fill={color} />
    </Svg>
  );
}

function FaceliftIcon({ color, size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <Path
        d="M16 34 C16 22 20 12 30 10 C28 18 29 26 32 34"
        stroke={color}
        strokeWidth={1.7}
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M22 20 C24 18 27 18 29 20" stroke={color} strokeWidth={1.4} fill="none" />
      <Path d="M20 30 C24 28 28 29 31 32" stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M26 36 L30 30 L34 36"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="30" y1="30" x2="30" y2="38" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

// Inline Svg icons only — asset `.svg` requires fail on iOS/Android Image.
const CATEGORIES = [
  { key: 'laser', label: 'Laser\nTreatment', Icon: LaserTreatmentIcon },
  { key: 'prp', label: 'Hair Prp', Icon: HairPrpIcon },
  { key: 'fillers', label: 'Dermal\nFillers', Icon: DermalFillersIcon },
  { key: 'facelift', label: 'Facelift', Icon: FaceliftIcon },
  { key: 'plastic', label: 'Plastic\nSurgery', iconName: 'body-outline' },
  { key: 'skincare', label: 'Skin\nCare', iconName: 'flower-outline' },
  { key: 'dental', label: 'Dental\nCare', iconName: 'medical-outline' },
  { key: 'weight', label: 'Weight\nLoss', iconName: 'fitness-outline' },
];

function SearchBar({ value, onChangeText }) {
  return (
    <View
      style={{
        marginTop: s(16),
        height: s(48),
        borderRadius: 999,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(16),
        ...shadows.card,
      }}
    >
      <Ionicons name="search-outline" size={s(18)} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search Here..."
        placeholderTextColor={colors.muted}
        allowFontScaling={false}
        style={{
          flex: 1,
          marginLeft: s(10),
          fontSize: fs(13),
          color: colors.ink,
          paddingVertical: 0,
        }}
      />
    </View>
  );
}

function PromoCard({ item, width }) {
  const height = s(176);
  return (
    <View
      style={{
        width,
        height,
        borderRadius: 24,
        overflow: 'hidden',
      }}
    >
      {/* Combined card asset — no extra bg / image / glow effects */}
      <Image
        source={item.image || PROMO_CARD}
        contentFit="cover"
        contentPosition="center"
        style={{ position: 'absolute', top: 0, left: 0, width, height }}
      />

      <View
        style={{
          flex: 1,
          paddingVertical: s(18),
          paddingLeft: s(18),
          paddingRight: s(120),
          justifyContent: 'center',
        }}
      >
        <Text
          allowFontScaling={false}
          style={{
            color: '#FFFFFF',
            fontFamily: 'Manrope_400Regular',
            fontSize: 24,
            lineHeight: 24,
            letterSpacing: 24 * -0.05,
            textTransform: 'capitalize',
          }}
        >
          {item.eyebrow}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            color: '#FFFFFF',
            fontFamily: 'Manrope_700Bold',
            fontSize: 24,
            marginTop: 4,
            lineHeight: 24,
            letterSpacing: 24 * -0.05,
            textTransform: 'capitalize',
          }}
        >
          {item.title}
        </Text>
        <Text
          allowFontScaling={false}
          style={{
            color: '#FFFFFF',
            fontFamily: 'Manrope_400Regular',
            fontSize: 12,
            lineHeight: 12,
            letterSpacing: 0,
            marginTop: 8,
          }}
          numberOfLines={3}
        >
          {item.body}
        </Text>
        <Pressable
          accessibilityRole="button"
          style={{
            marginTop: s(14),
            alignSelf: 'flex-start',
            borderWidth: 1.5,
            borderColor: '#FFFFFF',
            borderRadius: 999,
            paddingHorizontal: s(16),
            paddingVertical: s(8),
            backgroundColor: 'transparent',
          }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: fs(12), fontWeight: '700' }}>
            {item.cta || 'Book Now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FrostedTreatmentPanel({ children }) {
  const panelStyle = {
    position: 'absolute',
    left: s(10),
    right: s(10),
    bottom: s(10),
    minHeight: s(78),
    borderRadius: s(16),
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.95)',
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.62)',
    paddingVertical: s(11),
    paddingHorizontal: s(12),
    flexDirection: 'row',
    alignItems: 'center',
  };

  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return (
      <BlurView intensity={Platform.OS === 'ios' ? 55 : 40} tint="light" style={panelStyle}>
        {children}
      </BlurView>
    );
  }

  return <View style={panelStyle}>{children}</View>;
}

function CategoryItem({ item, active, onPress }) {
  const tone = active ? '#FFFFFF' : CARD_BG;
  const Icon = item.Icon;
  const size = s(62);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: active ? CARD_BG : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: s(6),
        paddingTop: s(7),
        paddingBottom: s(6),
      }}
    >
      {item.iconName ? (
        <Ionicons name={item.iconName} size={s(30)} color={tone} />
      ) : (
        <Icon color={tone} size={s(30)} />
      )}
      <Text
        allowFontScaling={false}
        numberOfLines={2}
        style={{
          marginTop: s(2),
          textAlign: 'center',
          fontSize: fs(9, 8),
          fontWeight: '600',
          color: tone,
          lineHeight: fs(11, 10),
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

export default function PatientHomeScreen() {
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const { width } = useWindowDimensions();
  const { user, setRegion, updateUser } = useSession();
  const [search, setSearch] = useState('');
  const [promoIndex, setPromoIndex] = useState(0);
  const [category, setCategory] = useState('laser');
  const [regionOpen, setRegionOpen] = useState(false);
  const carouselRef = useRef(null);
  const contentWidth = Math.min(width - spacing.screen * 2, spacing.maxContent);
  const displayName = user?.name?.trim() || 'Mona Lisa';
  const branchMeta = useMemo(
    () => patientBranchMeta(user),
    [user?.region, user?.branchId, user?.clinicId, user?.city, user?.branchName]
  );

  async function handleSelectClinic(clinic) {
    if (!clinic) return;
    setRegionOpen(false);
    await setRegion(clinic.region);
    await updateUser({
      region: clinic.region,
      branchId: clinic.branchId,
      clinicId: clinic.branchId,
      branchName: `${clinic.city} Branch`,
      city: clinic.city,
      clinicName: clinic.name,
    });
  }

  const slides = useMemo(() => PROMO_SLIDES, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setPromoIndex((prev) => {
        const next = (prev + 1) % slides.length;
        carouselRef.current?.scrollTo({
          x: next * (contentWidth + s(12)),
          animated: true,
        });
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [contentWidth, slides.length]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
        }}
      >
        <View style={{ width: contentWidth, alignSelf: 'center' }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: s(10) }}>
              {user?.photoUrl ? (
                <UserAvatar uri={user.photoUrl} size={s(46)} />
              ) : (
                <Image
                  source={PATIENT_AVATAR}
                  contentFit="cover"
                  style={{
                    width: s(46),
                    height: s(46),
                    borderRadius: s(23),
                    backgroundColor: colors.fieldAlt,
                  }}
                />
              )}
              <View style={{ marginLeft: s(10), flex: 1, minWidth: 0 }}>
                <Text
                  style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Change clinic region"
                  onPress={() => setRegionOpen(true)}
                  hitSlop={8}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginTop: 3,
                    alignSelf: 'flex-start',
                    maxWidth: '100%',
                  }}
                >
                  <Ionicons name="location-outline" size={s(12)} color={colors.desc} />
                  <Text
                    style={{
                      marginLeft: 4,
                      marginRight: 2,
                      fontSize: fs(11),
                      color: colors.desc,
                      flexShrink: 1,
                    }}
                    numberOfLines={1}
                  >
                    {branchMeta.label}
                  </Text>
                  <Ionicons name="chevron-down" size={s(11)} color={colors.muted} />
                </Pressable>
              </View>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <SearchBar value={search} onChangeText={setSearch} />

          {/* Promo carousel — auto-slide every 4s */}
          <ScrollView
            ref={carouselRef}
            horizontal
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: s(18) }}
            snapToInterval={contentWidth + s(12)}
            snapToAlignment="start"
            disableIntervalMomentum
            scrollEventThrottle={16}
            onMomentumScrollEnd={(event) => {
              const x = event.nativeEvent.contentOffset.x;
              const next = Math.round(x / (contentWidth + s(12)));
              setPromoIndex(Math.max(0, Math.min(next, slides.length - 1)));
            }}
          >
            {slides.map((item, index) => (
              <View
                key={item.id}
                style={{ width: contentWidth, marginRight: index === slides.length - 1 ? 0 : s(12) }}
              >
                <PromoCard item={item} width={contentWidth} />
              </View>
            ))}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: s(12),
              gap: s(6),
            }}
          >
            {slides.map((item, index) => {
              const active = index === promoIndex;
              return (
                <View
                  key={item.id}
                  style={{
                    width: active ? s(18) : s(7),
                    height: s(7),
                    borderRadius: 999,
                    backgroundColor: active ? CARD_BG : '#E8D9C8',
                  }}
                />
              );
            })}
          </View>

          {/* Popular Treatments */}
          <View
            style={{
              marginTop: s(22),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: colors.ink }}>
              Popular Treatments
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Text style={{ fontSize: fs(12), fontWeight: '600', color: CARD_BG }}>See All</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={s(80)}
            decelerationRate="fast"
            overScrollMode="never"
            contentContainerStyle={{
              marginTop: s(14),
              paddingHorizontal: s(2),
              paddingRight: s(18),
            }}
          >
            {CATEGORIES.map((item) => (
              <View key={item.key} style={{ marginRight: s(18) }}>
                <CategoryItem
                  item={item}
                  active={category === item.key}
                  onPress={() => setCategory(item.key)}
                />
              </View>
            ))}
          </ScrollView>

          {/* Featured treatment — frosted glass content panel */}
          <View
            style={{
              marginTop: s(18),
              padding: s(8),
              borderRadius: s(16),
              overflow: 'hidden',
              backgroundColor: colors.card,
              ...shadows.card,
            }}
          >
            <Image
              source={TREATMENT_IMAGE}
              contentFit="cover"
              style={{ width: '100%', height: s(240), borderRadius: s(10) }}
            />
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.18)', 'rgba(255,255,255,0.55)']}
              locations={[0.35, 0.7, 1]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: s(110),
              }}
              pointerEvents="none"
            />
            <FrostedTreatmentPanel>
              <View style={{ flex: 1, marginRight: s(10) }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Manrope_600SemiBold',
                    fontSize: 14,
                    color: '#C19A7B',
                    lineHeight: 18,
                  }}
                >
                  Laser Treatment
                </Text>
                <Text
                  allowFontScaling={false}
                  style={{
                    marginTop: 4,
                    fontFamily: 'Manrope_400Regular',
                    fontSize: 11,
                    color: '#555555',
                    lineHeight: 15,
                  }}
                  numberOfLines={2}
                >
                  Discover exclusive offers and experience the beauty you deserve.
                </Text>
              </View>
              <View
                style={{
                  width: s(38),
                  height: s(38),
                  borderRadius: s(19),
                  backgroundColor: 'rgba(191,130,79,0.88)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="arrow-up-outline"
                  size={s(16)}
                  color={colors.white}
                  style={{ transform: [{ rotate: '45deg' }] }}
                />
              </View>
            </FrostedTreatmentPanel>
          </View>

          {/* Follow Up Reminder */}
          <View
            style={{
              marginTop: s(22),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={{ fontSize: fs(15), fontWeight: '700', color: colors.ink }}>
              Follow Up Reminder
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8}>
              <Text style={{ fontSize: fs(12), fontWeight: '600', color: CARD_BG }}>See All</Text>
            </Pressable>
          </View>

          <View
            style={{
              marginTop: s(12),
              backgroundColor: colors.card,
              borderRadius: 18,
              padding: s(14),
              ...shadows.card,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={DOCTOR_AVATAR}
                contentFit="cover"
                style={{
                  width: s(44),
                  height: s(44),
                  borderRadius: s(22),
                  backgroundColor: colors.fieldAlt,
                }}
              />
              <View style={{ flex: 1, marginLeft: s(10), marginRight: s(8) }}>
                <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                  Sarah Ahmed
                </Text>
                <Text style={{ marginTop: 2, fontSize: fs(10), color: colors.desc }}>
                  Laser Hair Removal
                </Text>
              </View>
              <View
                style={{
                  backgroundColor: '#F6E6D6',
                  borderRadius: 999,
                  paddingHorizontal: s(10),
                  paddingVertical: s(4),
                }}
              >
                <Text style={{ fontSize: fs(10), fontWeight: '600', color: CARD_BG }}>Due</Text>
              </View>
            </View>

            <Text style={{ marginTop: s(12), fontSize: fs(11), color: colors.desc }}>
              3 of 6 sessions completed
            </Text>

            <PrimaryButton
              label="Check Now"
              size="sm"
              onPress={() => {}}
              style={{ marginTop: s(12), width: '100%' }}
            />
          </View>
        </View>
      </ScrollView>

      <PatientRegionPickerModal
        visible={regionOpen}
        user={user}
        onClose={() => setRegionOpen(false)}
        onSelect={handleSelectClinic}
      />
    </View>
  );
}
