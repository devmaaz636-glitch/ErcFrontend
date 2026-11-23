import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Line, Path } from 'react-native-svg';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, SearchField } from '../components/ui';
import { navigateRoot, navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, shadows, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const TREATMENT_IMAGE = require('../../assets/treamntpateint.png');
const BRAND = colors.brand;
const TITLE_COLOR = '#C19A7B';
const DESC_COLOR = '#555555';
const BLURB = 'Discover exclusive offers and experience the beauty you deserve.';
const CARD_PAD = 8;
const CARD_RADIUS = 26;
const MEDIA_RADIUS = 20;
const CARD_SHADOW = {
  shadowColor: '#8B7355',
  shadowOpacity: 0.14,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 6 },
  elevation: 5,
};

function LaserIcon({ color, size = 22 }) {
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

function HairIcon({ color, size = 22 }) {
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

function FillersIcon({ color, size = 22 }) {
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

function FaceliftIcon({ color, size = 22 }) {
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

const CATEGORIES = [
  { id: 'laser', label: 'Laser\nTreatments', Icon: LaserIcon, section: 'Laser Treatments' },
  { id: 'hair', label: 'Hair Prp', Icon: HairIcon, section: 'Hair PRP' },
  { id: 'fillers', label: 'Dermal\nFillers', Icon: FillersIcon, section: 'Dermal Fillers' },
  { id: 'facelift', label: 'Facelift', Icon: FaceliftIcon, section: 'Facelift' },
];

const TREATMENTS = [
  { id: 'laser-1', category: 'laser', title: 'Laser Treatment', description: BLURB },
  { id: 'laser-2', category: 'laser', title: 'Laser Treatment', description: BLURB },
  { id: 'laser-3', category: 'laser', title: 'Laser Treatment', description: BLURB },
  { id: 'laser-4', category: 'laser', title: 'Laser Treatment', description: BLURB },
  { id: 'hair-1', category: 'hair', title: 'Hair PRP', description: 'Restore healthier, fuller-looking hair with specialist care.' },
  { id: 'hair-2', category: 'hair', title: 'Hair PRP', description: 'Restore healthier, fuller-looking hair with specialist care.' },
  { id: 'hair-3', category: 'hair', title: 'Hair PRP', description: 'Restore healthier, fuller-looking hair with specialist care.' },
  { id: 'hair-4', category: 'hair', title: 'Hair PRP', description: 'Restore healthier, fuller-looking hair with specialist care.' },
  { id: 'fillers-1', category: 'fillers', title: 'Dermal Fillers', description: 'Refresh your natural features with tailored treatments.' },
  { id: 'fillers-2', category: 'fillers', title: 'Dermal Fillers', description: 'Refresh your natural features with tailored treatments.' },
  { id: 'fillers-3', category: 'fillers', title: 'Dermal Fillers', description: 'Refresh your natural features with tailored treatments.' },
  { id: 'fillers-4', category: 'fillers', title: 'Dermal Fillers', description: 'Refresh your natural features with tailored treatments.' },
  { id: 'facelift-1', category: 'facelift', title: 'Facelift', description: 'Explore advanced rejuvenation treatments for lasting confidence.' },
  { id: 'facelift-2', category: 'facelift', title: 'Facelift', description: 'Explore advanced rejuvenation treatments for lasting confidence.' },
  { id: 'facelift-3', category: 'facelift', title: 'Facelift', description: 'Explore advanced rejuvenation treatments for lasting confidence.' },
  { id: 'facelift-4', category: 'facelift', title: 'Facelift', description: 'Explore advanced rejuvenation treatments for lasting confidence.' },
];

const POPULAR = [
  { id: 'popular-1', category: 'laser', title: 'Laser Treatment', description: BLURB },
  { id: 'popular-2', category: 'laser', title: 'Laser Treatment', description: BLURB },
];

function CategoryChip({ item, active, size, onPress }) {
  const tone = active ? colors.white : BRAND;
  const Icon = item.Icon;
  const iconSize = Math.round(size * 0.28);
  const labelSize = Math.max(8, Math.round(size * 0.11));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: active ? BRAND : colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        ...shadows.card,
      }}
    >
      <Icon color={tone} size={iconSize} />
      <Text
        allowFontScaling={false}
        numberOfLines={2}
        style={{
          marginTop: 2,
          textAlign: 'center',
          fontSize: labelSize,
          lineHeight: labelSize + 2,
          fontWeight: '600',
          color: tone,
          width: size - 8,
        }}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

function GlassCaption({ title, description }) {
  const body = (
    <>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          color: TITLE_COLOR,
          fontSize: fs(13, 12),
          fontWeight: '600',
          letterSpacing: 0.1,
        }}
      >
        {title}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={2}
        style={{
          color: DESC_COLOR,
          fontSize: fs(10, 9),
          lineHeight: fs(13, 12),
          marginTop: 5,
          fontWeight: '400',
          opacity: 0.92,
        }}
      >
        {description}
      </Text>
    </>
  );

  // Frosted glass: photo stays visible through the caption (design card).
  const panelStyle = {
    borderRadius: s(16),
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.95)',
    paddingTop: s(11),
    paddingBottom: s(12),
    paddingHorizontal: s(12),
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.62)',
  };

  if (Platform.OS === 'web' || Platform.OS === 'ios') {
    return (
      <BlurView intensity={Platform.OS === 'ios' ? 55 : 40} tint="light" style={panelStyle}>
        {body}
      </BlurView>
    );
  }

  // Android: soft layered glass (BlurView is weak; keep image readable).
  return (
    <View style={panelStyle}>
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(255,255,255,0.18)',
        }}
      />
      {body}
    </View>
  );
}

function TreatmentCard({ item, width, height, onPress }) {
  const arrow = s(38);
  const mediaW = width - CARD_PAD * 2;
  const mediaH = height - CARD_PAD * 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title}`}
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        height,
        marginBottom: s(14),
        borderRadius: s(CARD_RADIUS),
        backgroundColor: '#FFFFFF',
        padding: CARD_PAD,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,1)',
        ...CARD_SHADOW,
        opacity: pressed ? 0.97 : 1,
      })}
    >
      {/* Clip media only — elevation stays on outer white frame. */}
      <View
        style={{
          width: mediaW,
          height: mediaH,
          borderRadius: s(MEDIA_RADIUS),
          overflow: 'hidden',
          backgroundColor: colors.fieldAlt,
        }}
      >
        <Image
          source={TREATMENT_IMAGE}
          contentFit="cover"
          style={{ width: mediaW, height: mediaH }}
        />

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: s(12),
            top: s(12),
            width: arrow,
            height: arrow,
            borderRadius: arrow / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(193,154,123,0.9)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.35)',
          }}
        >
          <Ionicons
            name="arrow-up-outline"
            size={s(16)}
            color={colors.white}
            style={{ transform: [{ rotate: '45deg' }] }}
          />
        </View>

        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: s(10),
            right: s(10),
            bottom: s(10),
          }}
        >
          <GlassCaption title={item.title} description={item.description} />
        </View>
      </View>
    </Pressable>
  );
}

function TreatmentGrid({ items, cardWidth, cardHeight, onOpen }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
      }}
    >
      {items.map((item) => (
        <TreatmentCard
          key={item.id}
          item={item}
          width={cardWidth}
          height={cardHeight}
          onPress={() => onOpen(item)}
        />
      ))}
    </View>
  );
}

export default function PatientTreatmentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { width: windowW } = useWindowDimensions();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('laser');

  const pageWidth = Math.min(Math.max(windowW - spacing.screen * 2, 280), spacing.maxContent);
  const gap = s(12);
  const cardWidth = Math.floor((pageWidth - gap) / 2);
  const cardHeight = Math.round(cardWidth * 1.52);
  const categoryGap = s(10);
  const categorySize = Math.floor((pageWidth - categoryGap * 3) / 4);
  const activeMeta = CATEGORIES.find((c) => c.id === category) || CATEGORIES[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TREATMENTS.filter((item) => {
      if (item.category !== category) return false;
      if (!q) return true;
      return `${item.title} ${item.description}`.toLowerCase().includes(q);
    });
  }, [category, search]);

  const popular = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return POPULAR;
    return POPULAR.filter((item) =>
      `${item.title} ${item.description}`.toLowerCase().includes(q)
    );
  }, [search]);

  function openTreatment(item) {
    navigateRoot(navigation, 'PatientTreatmentDetail', { treatment: item });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          paddingHorizontal: spacing.screen,
        }}
      >
        <View style={{ width: pageWidth, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text
                allowFontScaling={false}
                style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}
              >
                All Treatments
              </Text>
              <Text
                allowFontScaling={false}
                style={{ fontSize: fs(11, 10), color: colors.desc, marginTop: 3 }}
              >
                Patient
              </Text>
            </View>
            <NotificationBellButton color={BRAND} />
          </View>

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
            allowFontScaling={false}
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

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: s(20),
            }}
          >
            {CATEGORIES.map((item) => (
              <CategoryChip
                key={item.id}
                item={item}
                size={categorySize}
                active={category === item.id}
                onPress={() => setCategory(item.id)}
              />
            ))}
          </View>

          <Text
            allowFontScaling={false}
            style={{
              marginBottom: s(12),
              fontSize: fs(16),
              fontWeight: '700',
              color: colors.ink,
            }}
          >
            {activeMeta.section}
          </Text>

          {filtered.length ? (
            <TreatmentGrid
              items={filtered}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              onOpen={openTreatment}
            />
          ) : (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: s(14),
                padding: s(16),
                marginBottom: s(12),
              }}
            >
              <Text style={{ fontSize: fs(12), color: colors.desc }}>
                No treatments match your search.
              </Text>
            </View>
          )}

          <View
            style={{
              marginTop: s(8),
              marginBottom: s(12),
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text
              allowFontScaling={false}
              style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }}
            >
              Popular Treatments
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all popular treatments"
              onPress={() => setCategory('laser')}
              hitSlop={8}
            >
              <Text
                allowFontScaling={false}
                style={{ fontSize: fs(12), fontWeight: '600', color: BRAND }}
              >
                See All
              </Text>
            </Pressable>
          </View>

          <TreatmentGrid
            items={popular}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            onOpen={openTreatment}
          />
        </View>
      </ScrollView>
    </View>
  );
}
