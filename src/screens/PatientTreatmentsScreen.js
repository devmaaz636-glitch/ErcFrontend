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
import { IconCircleButton, NotificationBellButton, SearchField, SkeletonBone } from '../components/ui';
import { navigateRoot, navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, shadows, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';
import { usePatientData } from '../context/PatientDataContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

const TREATMENT_IMAGE = require('../../assets/treamntpateint.png');
const BRAND = colors.brand;
const TITLE_COLOR = '#C19A7B';
const DESC_COLOR = '#555555';
const CARD_PAD = 6;
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

const CATEGORY_ICONS = {
  laser: LaserIcon,
  hair: HairIcon,
  fillers: FillersIcon,
  facelift: FaceliftIcon,
};

function categoryKeyFromTreatment(item) {
  if (item?.category) return String(item.category);
  const text = String(item?.department || item?.name || '').toLowerCase();
  if (text.includes('laser')) return 'laser';
  if (text.includes('hair') || text.includes('prp')) return 'hair';
  if (text.includes('fill') || text.includes('inject')) return 'fillers';
  if (text.includes('face') || text.includes('plastic')) return 'facelift';
  return String(item?.department || 'other').toLowerCase();
}

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
      accessibilityLabel={`View ${item.title || item.name}`}
      onPress={onPress}
      style={({ pressed }) => ({
        width,
        height,
        marginBottom: 0,
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
          <GlassCaption title={item.title || item.name} description={item.description} />
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
        rowGap: s(14),
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
  const {
    treatments: portalTreatments,
    categories: portalCategories,
    popular: portalPopular,
    initialLoading,
    error,
    refreshSilent,
  } = usePatientData();
  useRefreshOnFocus(refreshSilent);

  const pageWidth = Math.min(Math.max(windowW - s(32), 280), spacing.maxContent);
  const gap = s(4);
  // Preserve equal columns all the way to the right content edge on mobile.
  const cardWidth = (pageWidth - gap) / 2;
  const cardHeight = Math.round(cardWidth * 1.58);
  const categoryGap = s(10);
  const categorySize = Math.floor((pageWidth - categoryGap * 3) / 4);

  const categories = useMemo(() => {
    if (portalCategories?.length) {
      return portalCategories.map((item) => ({
        ...item,
        Icon: CATEGORY_ICONS[item.id] || LaserIcon,
        section: item.section || item.label?.replace('\n', ' ') || item.id,
      }));
    }
    // Derive from live treatments only — no hardcoded seed categories.
    const seen = new Map();
    portalTreatments.forEach((item) => {
      const id = categoryKeyFromTreatment(item);
      if (!id || seen.has(id)) return;
      seen.set(id, {
        id,
        label: item.department || id,
        section: item.department || id,
        Icon: CATEGORY_ICONS[id] || LaserIcon,
      });
    });
    return [...seen.values()];
  }, [portalCategories, portalTreatments]);

  const activeMeta = categories.find((c) => c.id === category) || categories[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return portalTreatments.filter((item) => {
      if (item.category !== category) return false;
      if (!q) return true;
      return `${item.title || item.name} ${item.description}`.toLowerCase().includes(q);
    });
  }, [category, portalTreatments, search]);

  const popularAll = useMemo(() => {
    const source = portalPopular?.length ? portalPopular : portalTreatments;
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter((item) =>
      `${item.title || item.name} ${item.description}`.toLowerCase().includes(q)
    );
  }, [portalPopular, portalTreatments, search]);

  // Preview row: the two most-booked treatments.
  const popular = useMemo(() => popularAll.slice(0, 2), [popularAll]);

  function openTreatment(item) {
    navigateRoot(navigation, 'PatientTreatmentDetail', {
      treatment: { ...item, title: item.title || item.name },
    });
  }

  function openAllPopular() {
    navigateRoot(navigation, 'PatientSearch', { mode: 'popular' });
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
          paddingHorizontal: s(12),
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
              showButton
              iconPosition="right"
              onSubmit={() =>
                navigateRoot(navigation, 'PatientSearch', {
                  query: search.trim(),
                  ts: Date.now(),
                })
              }
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
            {categories.map((item) => (
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

          {initialLoading ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[0, 1, 2, 3].map((key) => (
                <SkeletonBone
                  key={key}
                  height={cardHeight}
                  width={cardWidth}
                  radius={s(16)}
                  style={{ marginBottom: s(12) }}
                />
              ))}
            </View>
          ) : error && !portalTreatments.length ? (
            <View style={{ backgroundColor: colors.card, borderRadius: s(14), padding: s(16), marginBottom: s(12) }}>
              <Text style={{ fontSize: fs(12), color: colors.desc }}>{error}</Text>
              <Pressable onPress={() => refreshSilent().catch(() => {})} style={{ marginTop: s(10) }}>
                <Text style={{ color: BRAND, fontSize: fs(12), fontWeight: '700' }}>Try again</Text>
              </Pressable>
            </View>
          ) : filtered.length ? (
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
              onPress={openAllPopular}
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
