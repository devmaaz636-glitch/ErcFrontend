import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from '../components/AppText';
import { IconCircleButton } from '../components/ui';
import { usePatientData } from '../context/PatientDataContext';
import { navigateRoot, navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, shadows, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const TREATMENT_IMAGE = require('../../assets/treamntpateint.png');
const DOCTOR_IMAGE = require('../../assets/treatmentdocotor.png');
const BRAND = colors.brand;

function matchesQuery(text, q) {
  return String(text || '')
    .toLowerCase()
    .includes(q);
}

function SectionTitle({ title, count }) {
  return (
    <Text
      style={{
        marginTop: s(16),
        marginBottom: s(10),
        fontSize: fs(14),
        fontWeight: '700',
        color: colors.ink,
      }}
    >
      {title}
      {typeof count === 'number' ? ` (${count})` : ''}
    </Text>
  );
}

function ResultRow({ title, subtitle, meta, image, onPress, badge }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: s(14),
        padding: s(10),
        marginBottom: s(10),
        ...shadows.card,
        opacity: pressed ? 0.94 : 1,
      })}
    >
      <Image
        source={image}
        contentFit="cover"
        style={{ width: s(64), height: s(64), borderRadius: s(12), backgroundColor: colors.fieldAlt }}
      />
      <View style={{ flex: 1, marginLeft: s(12) }}>
        {badge ? (
          <Text style={{ fontSize: fs(9, 8), fontWeight: '700', color: BRAND, marginBottom: 2 }}>
            {badge}
          </Text>
        ) : null}
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{ marginTop: 3, fontSize: fs(11), color: colors.desc, lineHeight: fs(14) }}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text style={{ marginTop: 4, fontSize: fs(10, 9), color: BRAND, fontWeight: '600' }}>
            {meta}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={s(16)} color={colors.muted} />
    </Pressable>
  );
}

export default function PatientSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const { width: windowW } = useWindowDimensions();
  const pageWidth = Math.min(windowW - spacing.screen * 2, spacing.maxContent);
  const { treatments, doctors, popular, appointments, categories } = usePatientData();
  const popularMode = route.params?.mode === 'popular';
  const [query, setQuery] = useState(String(route.params?.query || ''));

  // Keep field in sync when navigating here again with a new query.
  useEffect(() => {
    if (route.params?.query != null) {
      setQuery(String(route.params.query));
    }
  }, [route.params?.query, route.params?.ts]);

  const q = query.trim().toLowerCase();

  const treatmentSource = useMemo(() => {
    if (!popularMode) return treatments || [];
    return popular?.length ? popular : treatments || [];
  }, [popular, popularMode, treatments]);

  const treatmentResults = useMemo(() => {
    if (!q) return popularMode ? treatmentSource : [];
    return treatmentSource.filter((item) =>
      matchesQuery(
        `${item.name || ''} ${item.title || ''} ${item.description || ''} ${item.category || ''} ${item.department || ''}`,
        q
      )
    );
  }, [q, popularMode, treatmentSource]);

  const doctorResults = useMemo(() => {
    if (popularMode || !q) return [];
    return (doctors || []).filter((item) =>
      matchesQuery(`${item.name || ''} ${item.specialty || ''} ${item.department || ''}`, q)
    );
  }, [doctors, popularMode, q]);

  const appointmentResults = useMemo(() => {
    if (popularMode || !q) return [];
    return (appointments || []).filter((item) =>
      matchesQuery(
        `${item.treatment || ''} ${item.doctorName || ''} ${item.requestId || ''} ${item.status || ''} ${item.dateLabel || ''} ${item.date || ''}`,
        q
      )
    );
  }, [appointments, popularMode, q]);

  const categoryResults = useMemo(() => {
    if (popularMode || !q) return [];
    return (categories || []).filter((item) =>
      matchesQuery(`${item.label || ''} ${item.section || ''} ${item.id || ''}`, q)
    );
  }, [categories, popularMode, q]);

  const totalCount = popularMode
    ? treatmentResults.length
    : treatmentResults.length + doctorResults.length + appointmentResults.length + categoryResults.length;

  const showEmptyHint = !popularMode && !q;
  const showNoMatches = !showEmptyHint && totalCount === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(28),
        }}
      >
        <View style={{ width: pageWidth, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}>
                {popularMode ? 'Popular Treatments' : 'Search Results'}
              </Text>
              <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.desc }}>
                {popularMode ? 'Most booked by patients' : 'Treatments, doctors & appointments'}
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: s(16),
              height: s(48),
              borderRadius: 999,
              backgroundColor: colors.card,
              flexDirection: 'row',
              alignItems: 'center',
              paddingLeft: s(16),
              paddingRight: s(8),
              ...shadows.card,
            }}
          >
            <Ionicons name="search-outline" size={s(18)} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={
                popularMode ? 'Search popular treatments...' : 'Search treatments, doctors…'
              }
              placeholderTextColor={colors.muted}
              autoFocus={!popularMode}
              returnKeyType="search"
              clearButtonMode="never"
              style={{
                flex: 1,
                marginLeft: s(10),
                fontSize: fs(12),
                color: colors.ink,
                paddingVertical: 0,
              }}
            />
            {query ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                hitSlop={8}
                onPress={() => setQuery('')}
                style={{
                  width: s(32),
                  height: s(32),
                  borderRadius: s(16),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close-circle" size={s(18)} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>

          {showEmptyHint ? (
            <View
              style={{
                marginTop: s(22),
                backgroundColor: colors.card,
                borderRadius: s(14),
                padding: s(16),
              }}
            >
              <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                Start typing to search
              </Text>
              <Text style={{ marginTop: 6, fontSize: fs(12), color: colors.desc, lineHeight: fs(16) }}>
                Find treatments, doctors, categories, and your appointments.
              </Text>
            </View>
          ) : null}

          {!showEmptyHint ? (
            <Text
              style={{
                marginTop: s(18),
                marginBottom: s(4),
                fontSize: fs(14),
                fontWeight: '700',
                color: colors.ink,
              }}
            >
              {totalCount} result{totalCount === 1 ? '' : 's'}
              {q ? ` for “${query.trim()}”` : ''}
            </Text>
          ) : null}

          {treatmentResults.length ? (
            <>
              <SectionTitle
                title={popularMode ? 'Popular Treatments' : 'Treatments'}
                count={treatmentResults.length}
              />
              {treatmentResults.map((item) => (
                <ResultRow
                  key={`t-${item.id}`}
                  badge={item.department || item.category}
                  title={item.title || item.name}
                  subtitle={item.description || item.department}
                  meta={
                    popularMode && item.bookingCount > 0
                      ? `${item.bookingCount} booking${item.bookingCount === 1 ? '' : 's'}`
                      : null
                  }
                  image={TREATMENT_IMAGE}
                  onPress={() =>
                    navigateRoot(navigation, 'PatientTreatmentDetail', {
                      treatment: { ...item, title: item.title || item.name },
                    })
                  }
                />
              ))}
            </>
          ) : null}

          {doctorResults.length ? (
            <>
              <SectionTitle title="Doctors" count={doctorResults.length} />
              {doctorResults.map((item) => (
                <ResultRow
                  key={`d-${item.id}`}
                  badge={item.department}
                  title={item.name}
                  subtitle={item.specialty || item.department}
                  image={DOCTOR_IMAGE}
                  onPress={() =>
                    navigateRoot(navigation, 'DoctorDetail', {
                      doctor: {
                        ...item,
                        photo: null,
                        photoKey: 'treatmentdocotor',
                      },
                      doctorId: item.id,
                    })
                  }
                />
              ))}
            </>
          ) : null}

          {categoryResults.length ? (
            <>
              <SectionTitle title="Categories" count={categoryResults.length} />
              {categoryResults.map((item) => (
                <Pressable
                  key={`c-${item.id}`}
                  accessibilityRole="button"
                  onPress={() => navigateToTab(navigation, TAB_ROUTES.Treatments)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.card,
                    borderRadius: s(14),
                    paddingVertical: s(14),
                    paddingHorizontal: s(14),
                    marginBottom: s(10),
                    ...shadows.card,
                    opacity: pressed ? 0.94 : 1,
                  })}
                >
                  <View
                    style={{
                      width: s(42),
                      height: s(42),
                      borderRadius: s(21),
                      backgroundColor: colors.brandSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="grid-outline" size={s(18)} color={BRAND} />
                  </View>
                  <View style={{ flex: 1, marginLeft: s(12) }}>
                    <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }}>
                      {(item.section || item.label || item.id || '').replace('\n', ' ')}
                    </Text>
                    <Text style={{ marginTop: 3, fontSize: fs(11), color: colors.desc }}>
                      Browse this category
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={s(16)} color={colors.muted} />
                </Pressable>
              ))}
            </>
          ) : null}

          {appointmentResults.length ? (
            <>
              <SectionTitle title="My Appointments" count={appointmentResults.length} />
              {appointmentResults.map((item) => (
                <ResultRow
                  key={`a-${item.id}`}
                  badge={item.status}
                  title={item.treatment || 'Appointment'}
                  subtitle={`${item.dateLabel || item.date || ''} · ${item.time || ''}`}
                  meta={item.doctorName || item.requestId}
                  image={TREATMENT_IMAGE}
                  onPress={() =>
                    navigateRoot(navigation, 'PatientAppointmentDetail', {
                      appointment: item,
                    })
                  }
                />
              ))}
            </>
          ) : null}

          {showNoMatches ? (
            <View
              style={{
                marginTop: s(12),
                backgroundColor: colors.card,
                borderRadius: s(14),
                padding: s(16),
              }}
            >
              <Text style={{ fontSize: fs(12), color: colors.desc }}>
                {popularMode
                  ? 'No popular treatments match your search.'
                  : `No results for “${query.trim()}”. Try another treatment, doctor, or appointment.`}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
