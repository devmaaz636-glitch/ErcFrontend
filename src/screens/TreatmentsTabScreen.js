import { useCallback, useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { ActivityIndicator, Platform, Pressable, ScrollView, View } from 'react-native';
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
        backgroundColor: active ? colors.brand : colors.brandSoft,
        borderRadius: s(12),
        paddingHorizontal: s(12),
        paddingVertical: s(7),
        marginRight: s(8),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: fs(11),
          fontWeight: '600',
          color: active ? colors.white : colors.desc,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function TreatmentCard({ item, onView }) {
  const imageSource = item.imageUri
    ? { uri: item.imageUri }
    : item.custom
      ? treatmentDetailImage
      : treatmentImage;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View details for ${item.name}`}
      onPress={onView}
      style={({ pressed }) => ({
        width: '48.5%',
        height: s(270),
        borderRadius: s(16),
        overflow: 'hidden',
        backgroundColor: theme.colors.card,
        marginBottom: s(12),
        padding: s(7),
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.82)',
        opacity: pressed ? 0.92 : 1,
      })}
    >
      <Image
        source={imageSource}
        contentFit="cover"
        style={{ position: 'absolute', left: s(7), top: s(7), right: s(7), bottom: s(7), borderRadius: s(13) }}
      />
      <View
        style={{
          position: 'absolute',
          right: s(10),
          top: s(10),
          alignItems: 'center',
          borderRadius: s(9),
          width: s(38),
          height: s(38),
          justifyContent: 'center',
          backgroundColor: 'rgba(191,130,79,0.88)',
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
        }}
      >
        {Platform.OS === 'web' ? (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.82)', paddingVertical: s(10), paddingHorizontal: s(10) }}>
            <View style={{ flex: 1, marginRight: s(6) }}>
              <Text style={{ color: colors.brand, fontSize: fs(13), fontWeight: '700' }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: '#666666', fontSize: fs(10), lineHeight: fs(13), marginTop: s(4) }} numberOfLines={2}>
                {item.description || `${item.category || item.department || 'Treatment'} care by our specialists.`}
              </Text>
            </View>
          </View>
        ) : (
          <BlurView
            intensity={38}
            tint="light"
            style={{
              backgroundColor: 'rgba(255,255,255,0.82)',
              paddingVertical: s(10),
              paddingHorizontal: s(10),
            }}
          >
            <View style={{ flex: 1, marginRight: s(6) }}>
              <Text style={{ color: colors.brand, fontSize: fs(13), fontWeight: '700' }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: '#666666', fontSize: fs(10), lineHeight: fs(13), marginTop: s(4) }} numberOfLines={2}>
                {item.description || `${item.category || item.department || 'Treatment'} care by our specialists.`}
              </Text>
            </View>
          </BlurView>
        )}
      </View>
    </Pressable>
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
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
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
      return data.items || [];
    } catch (err) {
      setError(clinicErrorMessage(err));
      return null;
    } finally {
      setLoading(false);
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
            <Pressable accessibilityRole="button" onPress={load} style={{ marginTop: s(12) }}>
              <Text style={{ fontSize: fs(12), color: colors.danger, textAlign: 'center' }}>
                {error}
              </Text>
              <Text style={{ fontSize: fs(12), color: colors.brand, marginTop: 4, textAlign: 'center' }}>
                Tap to retry
              </Text>
            </Pressable>
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

          {loading && items.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(36) }}>
              <ActivityIndicator color={colors.brand} />
              <Text style={{ fontSize: fs(12), color: colors.desc, marginTop: 10 }}>Loading treatments…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(36) }}>
              <Ionicons name="sparkles-outline" size={s(28)} color={colors.muted} />
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>
                No treatments found
              </Text>
            </View>
          ) : (
            <View
              style={{
                width: '100%',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}
            >
              {filtered.map((item) => (
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
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
