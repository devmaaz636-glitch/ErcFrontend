import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, SearchField } from '../components/ui';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { clinicErrorMessage, fetchManagerPatients } from '../lib/clinic';
import { colors, spacing, managerDashboard as theme } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/userprofile.png');

const FALLBACK_CATEGORIES = ['All', 'Laser Treatment', 'Acne', 'Mummy Makeover', 'Hair Transplant'];

function CategoryChip({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        height: s(32),
        paddingHorizontal: s(14),
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

function PatientRow({ item, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: s(14),
        paddingVertical: s(12),
        paddingHorizontal: s(12),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Image
        source={patientImage}
        contentFit="cover"
        style={{
          width: s(44),
          height: s(44),
          borderRadius: s(22),
          backgroundColor: colors.brandSoft,
          marginRight: s(12),
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: fs(13), fontWeight: '700' }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(10), marginTop: 3 }} numberOfLines={1}>
          {item.category || item.treatment || 'Treatment'} · {item.consults ?? 0} Consults
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={s(16)} color={theme.colors.tertiaryText} />
    </Pressable>
  );
}

export default function ManagerPatientsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchManagerPatients();
      setCategories(data.categories?.length ? data.categories : FALLBACK_CATEGORIES);
      setItems(Array.isArray(data.items) ? data.items : []);
      setError('');
    } catch (err) {
      setError(clinicErrorMessage(err));
    }
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useRefreshOnFocus(load);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const catOk =
        category === 'All' ||
        item.category === category ||
        String(item.treatment || '')
          .toLowerCase()
          .includes(String(category).toLowerCase());
      if (!catOk) return false;
      if (!q) return true;
      return `${item.name || ''} ${item.category || ''} ${item.treatment || ''}`.toLowerCase().includes(q);
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
          paddingBottom: insets.bottom + s(28),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: spacing.maxContent }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1 }} />
            <NotificationBellButton color={colors.brand} />
          </View>

          <Text style={{ marginTop: s(16), fontSize: fs(22), fontWeight: '700', color: theme.colors.text }}>
            Patients
          </Text>
          <Text style={{ marginTop: 4, fontSize: fs(11), color: theme.colors.secondaryText }}>
            Manage your branch's Patients
          </Text>

          <View style={{ marginTop: s(16) }}>
            <SearchField value={query} onChangeText={setQuery} showButton />
          </View>

          {error ? (
            <Text style={{ marginTop: s(12), color: colors.danger, fontSize: fs(11), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          <Text
            style={{
              marginTop: s(22),
              marginBottom: s(10),
              fontSize: fs(14),
              fontWeight: '700',
              color: theme.colors.text,
            }}
          >
            Patients Categories
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((label) => (
              <CategoryChip
                key={label}
                label={label}
                active={category === label}
                onPress={() => setCategory(label)}
              />
            ))}
          </ScrollView>

          <Text
            style={{
              marginTop: s(22),
              marginBottom: s(12),
              fontSize: fs(16),
              fontWeight: '700',
              color: theme.colors.text,
            }}
          >
            All Patients
          </Text>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(36) }}>
              <Ionicons name="people-outline" size={s(28)} color={colors.muted} />
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>No patients found</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <PatientRow
                key={item.id}
                item={item}
                onPress={() => {}}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
