import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import {
  IconCircleButton,
  NotificationBellButton,
  SearchField,
} from '../components/ui';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { clinicErrorMessage, fetchManagerTreatments } from '../lib/clinic';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing, managerDashboard as theme } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const BUTTON_BG = theme.colors.brandButton || colors.brand || '#B8754A';

const treatmentImage = require('../../assets/treatmentimage.png');
const treatmentDetailImage = require('../../assets/treatmentdetail.png');

const FALLBACK_CATEGORIES = [
  'All',
  'Plastic Surgery',
  'Cosmetic Injectables',
  'Laser Treatments',
  'Skincare',
  'Dermatologists',
  'Hair Transplant',
  'Dental Treatments',
  'Weight Loss',
  'Gynecology',
  'Regenerative',
  'Physiotherapist',
  'Home Healthcare',
  'Intimate Surgery',
];

function CategoryChip({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        height: s(34),
        paddingHorizontal: s(16),
        borderRadius: 999,
        backgroundColor: active ? BUTTON_BG : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: s(8),
      }}
    >
      <Text
        style={{
          fontSize: fs(11),
          fontWeight: '600',
          color: active ? colors.white : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TreatmentCard({ item, onView }) {
  const active = String(item.status || 'active').toLowerCase() === 'active';
  const imageSource = item.imageUri
    ? { uri: item.imageUri }
    : item.custom
      ? treatmentDetailImage
      : treatmentImage;
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: s(16),
        padding: s(14),
        marginBottom: s(12),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: s(56),
            height: s(56),
            borderRadius: s(28),
            marginRight: s(12),
            backgroundColor: '#EFE7DF',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={imageSource}
            contentFit={item.imageUri || item.custom ? 'cover' : 'contain'}
            style={{ width: s(56), height: s(56) }}
          />
        </View>
        <View style={{ flex: 1, marginRight: s(8) }}>
          <Text
            style={{ color: theme.colors.text, fontSize: fs(13), fontWeight: '700' }}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          <Text
            style={{ color: theme.colors.secondaryText, fontSize: fs(10), marginTop: 4 }}
            numberOfLines={1}
          >
            {item.category || item.department || 'Treatment'} · {item.duration || '—'}
          </Text>
          {item.description ? (
            <Text
              style={{ color: theme.colors.tertiaryText, fontSize: fs(9), marginTop: 4, lineHeight: fs(13) }}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: s(8) }}>
            <Text style={{ color: colors.brand, fontSize: fs(14), fontWeight: '700' }}>
              {item.priceLabel || `${item.currency || 'AED'} ${item.price ?? '—'}`}
            </Text>
            <Text style={{ color: theme.colors.tertiaryText, fontSize: fs(9), marginLeft: 6 }}>
              {item.unit || item.session || 'Per Session'}
            </Text>
          </View>
        </View>
        <View
          style={{
            backgroundColor: active ? colors.successBg : colors.warningBg,
            borderRadius: s(8),
            paddingHorizontal: s(8),
            paddingVertical: s(4),
          }}
        >
          <Text
            style={{
              color: active ? colors.success : colors.brand,
              fontSize: fs(8),
              fontWeight: '700',
            }}
          >
            {active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      <View style={{ width: '100%', marginTop: s(14) }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View details for ${item.name}`}
          onPress={onView}
          android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false }}
          style={({ pressed }) => ({
            width: '100%',
            borderRadius: 999,
            overflow: 'hidden',
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <View
            style={{
              width: '100%',
              height: s(34),
              borderRadius: 999,
              backgroundColor: BUTTON_BG,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: fs(10), fontWeight: '600' }}>
              View Details
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

export default function TreatmentsTabScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [departments, setDepartments] = useState(FALLBACK_CATEGORIES.slice(1));
  const [currency, setCurrency] = useState('AED');
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loadedOnce, setLoadedOnce] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await fetchManagerTreatments();
      setCategories(data.categories?.length ? data.categories : FALLBACK_CATEGORIES);
      setDepartments(
        data.departments?.length
          ? data.departments
          : (data.categories || FALLBACK_CATEGORIES).filter((label) => label !== 'All')
      );
      if (data.currency) setCurrency(data.currency);
      setItems(Array.isArray(data.items) ? data.items : []);
      setError('');
      setLoadedOnce(true);
      return data.items || [];
    } catch (err) {
      setCategories((prev) => (prev?.length ? prev : FALLBACK_CATEGORIES));
      setLoadedOnce(true);
      setError((prev) => prev || clinicErrorMessage(err));
      return null;
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useRefreshOnFocus(load);

  useEffect(() => {
    const created = route.params?.newlyCreated;
    const refreshedAt = route.params?.refreshedAt;
    if (!created?.id && !refreshedAt) return undefined;
    if (created?.id) {
      setItems((prev) => {
        const without = prev.filter((item) => item.id !== created.id);
        return [created, ...without];
      });
      setCategory('All');
      setQuery('');
      setError('');
    }
    load().catch(() => {});
    navigation.setParams?.({ newlyCreated: undefined, refreshedAt: undefined });
    return undefined;
  }, [route.params?.newlyCreated, route.params?.refreshedAt, load, navigation]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const catOk = category === 'All' || item.category === category || item.department === category;
      if (!catOk) return false;
      if (!q) return true;
      const hay = `${item.name || ''} ${item.category || ''} ${item.department || ''} ${item.description || ''} ${item.duration || ''} ${item.priceLabel || ''}`;
      return hay.toLowerCase().includes(q);
    });
  }, [items, category, query]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.page }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentInsetAdjustmentBehavior="never"
        overScrollMode="never"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          {/* Header: back icon + title + notification bell in one row */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                marginLeft: s(12),
                fontSize: fs(20),
                fontWeight: '700',
                color: theme.colors.text,
                letterSpacing: -0.3,
              }}
            >
              Treatments
            </Text>
            <NotificationBellButton color={colors.brand} />
          </View>

          <Text
            style={{
              marginTop: s(10),
              fontSize: fs(11),
              color: theme.colors.secondaryText,
            }}
          >
            Manage your branch's treatments.
          </Text>

          <View style={{ marginTop: s(16) }}>
            <SearchField value={query} onChangeText={setQuery} showButton />
          </View>

          {error && items.length === 0 ? (
            <Text style={{ fontSize: fs(11), color: colors.danger, marginTop: s(12), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          <Text
            style={{
              marginTop: s(22),
              marginBottom: s(12),
              fontSize: fs(16),
              fontWeight: '700',
              color: theme.colors.text,
            }}
          >
            Categories
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            contentContainerStyle={{ paddingRight: s(8) }}
          >
            {categories.map((label) => (
              <CategoryChip
                key={label}
                label={label}
                active={category === label}
                onPress={() => setCategory(label)}
              />
            ))}
          </ScrollView>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: s(22),
              marginBottom: s(12),
            }}
          >
            <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: theme.colors.text }}>
              All Treatments
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add new treatment"
              onPress={() =>
                navigation.navigate('AddTreatment', {
                  departments,
                  currency,
                })
              }
              style={{
                height: s(32),
                paddingHorizontal: s(12),
                borderRadius: 999,
                backgroundColor: BUTTON_BG,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: fs(10), fontWeight: '600' }}>
                Add New Treatment +
              </Text>
            </Pressable>
          </View>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(36) }}>
              <Ionicons name="sparkles-outline" size={s(28)} color={colors.muted} />
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>
                No treatments found
              </Text>
            </View>
          ) : (
            filtered.map((item) => (
              <TreatmentCard
                key={item.id}
                item={item}
                onView={() =>
                  navigation.navigate('TreatmentDetail', {
                    treatmentId: item.id,
                    treatment: item,
                    departments,
                    currency,
                  })
                }
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}