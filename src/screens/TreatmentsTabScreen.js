import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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

const treatmentImage = require('../../assets/treatmentimage.png');

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
        backgroundColor: active ? theme.colors.brandButton || colors.brand : 'transparent',
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
  const imageSource = item.imageUri ? { uri: item.imageUri } : treatmentImage;
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
        <Image
          source={imageSource}
          contentFit="cover"
          style={{
            width: s(52),
            height: s(52),
            borderRadius: s(26),
            marginRight: s(12),
            backgroundColor: colors.brandSoft,
          }}
        />
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
              {item.unit || 'Per Session'}
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View details for ${item.name}`}
        onPress={onView}
        style={{
          height: s(36),
          borderRadius: 999,
          backgroundColor: theme.colors.brandButton || colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: s(14),
        }}
      >
        <Text style={{ color: '#fff', fontSize: fs(11), fontWeight: '600' }}>View Details</Text>
      </Pressable>
    </View>
  );
}

export default function TreatmentsTabScreen() {
  const navigation = useNavigation();
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
    } catch (err) {
      // Keep categories painted; show soft error only when list is empty.
      setCategories((prev) => (prev?.length ? prev : FALLBACK_CATEGORIES));
      if (!items.length) setError(clinicErrorMessage(err));
      setLoadedOnce(true);
    }
  }, [items.length]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useRefreshOnFocus(load);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const catOk = category === 'All' || item.category === category;
      if (!catOk) return false;
      if (!q) return true;
      const hay = `${item.name || ''} ${item.category || ''} ${item.duration || ''} ${item.priceLabel || ''}`;
      return hay.toLowerCase().includes(q);
    });
  }, [items, category, query]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.page }}>
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
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <View style={{ flex: 1 }} />
            <NotificationBellButton color={colors.brand} />
          </View>

          <Text
            style={{
              marginTop: s(18),
              fontSize: fs(22),
              fontWeight: '700',
              color: theme.colors.text,
              letterSpacing: -0.3,
            }}
          >
            Treatments
          </Text>
          <Text style={{ marginTop: 4, fontSize: fs(11), color: theme.colors.secondaryText }}>
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
                backgroundColor: theme.colors.brandButton || colors.brand,
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
