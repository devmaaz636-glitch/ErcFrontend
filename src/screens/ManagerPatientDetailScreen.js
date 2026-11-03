import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { clinicErrorMessage, fetchManagerPatient } from '../lib/clinic';
import {
  localizeAppointmentForRegion,
  normalizeRegionKey,
  REGION_CURRENCY,
} from '../lib/regionPricing';
import { BRAND_BG, brandButtonBg, brandButtonText, colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const patientImage = require('../../assets/userprofile.png');
const treatmentImage = require('../../assets/treatmentimage.png');

const C = {
  bg: '#FFF8F0',
  brand: BRAND_BG,
  white: '#FFFFFF',
  ink: colors.inkDeep,
  muted: colors.muted,
  upcomingBg: '#EDE8F8',
  upcomingFg: '#7B6BA8',
  completedBg: colors.successBg,
  completedFg: colors.success,
  registeredBg: colors.successBg,
  registeredFg: colors.success,
};

function StatCard({ label, value }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: '#F8E9DC' }]}>
        <Ionicons name={icon} size={s(16)} color={BRAND_BG} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function AppointmentCard({ item, currency = 'AED', onPress }) {
  const upcoming = String(item.status || '').toLowerCase() === 'upcoming';
  return (
    <View style={styles.aptCard}>
      <View style={styles.aptTop}>
        <Image source={treatmentImage} contentFit="cover" style={styles.aptThumb} />
        <View style={styles.aptCopy}>
          <Text style={styles.aptTitle} numberOfLines={1}>
            {item.treatment || 'Treatment'}
          </Text>
          <Text style={styles.aptMeta} numberOfLines={1}>
            {item.department || 'Clinic'} - {item.duration || '30 Minutes'}
          </Text>
          <Text style={[styles.aptPrice, brandButtonText, { color: BRAND_BG }]}>
            {item.priceLabel || `${currency} 500 Per Session`}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: upcoming ? C.upcomingBg : C.completedBg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: upcoming ? C.upcomingFg : C.completedFg },
            ]}
          >
            {upcoming ? 'Upcoming' : 'Completed'}
          </Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.viewBtnOuter, pressed && { opacity: 0.9 }]}
      >
        <View style={[styles.viewBtnInner, brandButtonBg, { backgroundColor: BRAND_BG }]}>
          <Text style={[styles.viewBtnText, brandButtonText]}>View Details</Text>
        </View>
      </Pressable>
    </View>
  );
}

export default function ManagerPatientDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(14);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - s(40), spacing.maxContent);
  const { displayRegion } = useSession();
  const activeRegion = displayRegion ? normalizeRegionKey(displayRegion) : null;

  const patientId = route.params?.patientId;
  const passed = route.params?.patient;

  const [item, setItem] = useState(passed || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!passed?.stats);

  const load = useCallback(async () => {
    if (!patientId) return null;
    try {
      const next = await fetchManagerPatient(patientId, {
        region: activeRegion || undefined,
      });
      setItem(next);
      setError('');
      return next;
    } catch (err) {
      setError(clinicErrorMessage(err) || 'Could not load patient.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [patientId, activeRegion]);

  useEffect(() => {
    setLoading(true);
    load().catch(() => {});
  }, [load]);

  useRefreshOnFocus(load);

  const localized = useMemo(() => {
    const region = normalizeRegionKey(activeRegion || item?.region || 'UAE');
    const currency = REGION_CURRENCY[region] || item?.currency || 'AED';
    const upcoming = (item?.upcoming || []).map((apt) => localizeAppointmentForRegion(apt, region));
    const completed = (item?.completed || []).map((apt) => localizeAppointmentForRegion(apt, region));
    return {
      region,
      currency,
      branchName: item?.branchName || `${region} Clinic`,
      upcoming,
      completed,
    };
  }, [item, activeRegion]);

  function openAppointment(apt) {
    if (!apt?.id) return;
    const localizedApt = localizeAppointmentForRegion(apt, localized.region);
    navigation.navigate('AppointmentDetail', {
      appointmentId: apt.id,
      appointment: {
        ...localizedApt,
        patient: localizedApt.patient || item?.name,
        patientId: localizedApt.patientId || item?.id,
        clinic: localizedApt.clinic || localized.branchName,
        branch: localizedApt.branch || localized.branchName,
        contactLabel: localizedApt.contactLabel || item?.phone,
      },
      returnTo: 'patients',
    });
  }

  if (loading && !item) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={C.brand} />
      </View>
    );
  }

  const stats = item?.stats || { total: 0, completed: 0, upcoming: 0 };
  const upcoming = localized.upcoming;
  const completed = localized.completed;

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: s(20),
          paddingBottom: Math.max(insets.bottom, 16) + s(24),
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: contentWidth }}>
          <View style={styles.header}>
            <IconCircleButton
              name="chevron-back"
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <View style={styles.headerLeft}>
              <Text style={styles.title} numberOfLines={1}>
                Patient Detail Screen
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                Manage your branch's Patient
              </Text>
            </View>
            <NotificationBellButton color={BRAND_BG} />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.profileCard}>
            <Image
              source={item?.photo ? { uri: item.photo } : patientImage}
              contentFit="cover"
              style={styles.avatar}
            />
            <View style={{ flex: 1, marginRight: s(8) }}>
              <Text style={styles.name} numberOfLines={1}>
                {item?.name || 'Patient'}
              </Text>
              <Text style={styles.patientId}>
                Patient ID: {item?.id || 'PT-0000'}
              </Text>
            </View>
            <View style={styles.registeredBadge}>
              <Text style={styles.registeredText}>
                {item?.status || 'Registered Patient'}
              </Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <StatCard label="Total Appointments" value={stats.total ?? 0} />
            <StatCard label="Completed" value={stats.completed ?? 0} />
            <StatCard label="Upcoming" value={stats.upcoming ?? 0} />
          </View>

          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.card}>
            <InfoRow icon="call-outline" label="Phone Number" value={item?.phone || '—'} />
            <InfoRow icon="mail-outline" label="Email Address" value={item?.email || '—'} />
            <InfoRow
              icon="calendar-outline"
              label="Date of Birth"
              value={item?.dateOfBirth || '—'}
            />
            <InfoRow
              icon="business-outline"
              label="Branch"
              value={
                localized.branchName
                  ? `${localized.branchName}${localized.region ? ` · ${localized.region}` : ''}`
                  : localized.region || '—'
              }
            />
          </View>

          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          {upcoming.length ? (
            upcoming.map((apt) => (
              <AppointmentCard
                key={apt.id}
                item={apt}
                currency={localized.currency}
                onPress={() => openAppointment(apt)}
              />
            ))
          ) : (
            <Text style={styles.empty}>No upcoming appointments</Text>
          )}

          <Text style={styles.sectionTitle}>Completed Appointments</Text>
          {completed.length ? (
            completed.map((apt) => (
              <AppointmentCard
                key={apt.id}
                item={apt}
                currency={localized.currency}
                onPress={() => openAppointment(apt)}
              />
            ))
          ) : (
            <Text style={styles.empty}>No completed appointments</Text>
          )}

          <Pressable
            accessibilityRole="button"
            onPress={() => navigation.navigate('ManagerPatients')}
            style={({ pressed }) => [styles.backBtnOuter, pressed && { opacity: 0.9 }]}
          >
            <View style={[styles.backBtnInner, brandButtonBg, { backgroundColor: BRAND_BG }]}>
              <Text style={[styles.backBtnText, brandButtonText]}>Back To Patients</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(16),
  },
  headerLeft: {
    flex: 1,
    marginLeft: s(12),
    marginRight: s(8),
  },
  title: {
    fontSize: fs(16),
    fontWeight: '700',
    color: C.ink,
    textAlign: 'left',
  },
  subtitle: {
    marginTop: 2,
    fontSize: fs(10),
    color: C.muted,
    textAlign: 'left',
  },
  error: {
    color: colors.danger,
    fontSize: fs(11),
    textAlign: 'center',
    marginBottom: s(10),
  },
  profileCard: {
    backgroundColor: C.white,
    borderRadius: s(16),
    padding: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: s(12),
  },
  avatar: {
    width: s(52),
    height: s(52),
    borderRadius: s(26),
    marginRight: s(12),
    backgroundColor: colors.brandSoft,
  },
  name: {
    fontSize: fs(15),
    fontWeight: '700',
    color: C.ink,
  },
  patientId: {
    marginTop: 3,
    fontSize: fs(12),
    color: C.muted,
  },
  registeredBadge: {
    backgroundColor: C.registeredBg,
    borderRadius: 999,
    paddingHorizontal: s(8),
    paddingVertical: s(4),
    alignSelf: 'flex-start',
  },
  registeredText: {
    color: C.registeredFg,
    fontSize: fs(9),
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: s(16),
    gap: s(8),
  },
  statCard: {
    flex: 1,
    backgroundColor: C.white,
    borderRadius: s(14),
    paddingVertical: s(12),
    paddingHorizontal: s(8),
    alignItems: 'center',
  },
  statLabel: {
    fontSize: fs(9),
    color: C.muted,
    textAlign: 'center',
  },
  statValue: {
    marginTop: 6,
    fontSize: fs(18),
    fontWeight: '700',
    color: C.ink,
  },
  sectionTitle: {
    fontSize: fs(15),
    fontWeight: '700',
    color: C.ink,
    marginBottom: s(12),
    marginTop: s(8),
  },
  card: {
    backgroundColor: C.white,
    borderRadius: s(16),
    padding: s(12),
    marginBottom: s(16),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: s(10),
  },
  infoIcon: {
    width: s(34),
    height: s(34),
    borderRadius: s(17),
    backgroundColor: '#F8E9DC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: s(12),
  },
  infoLabel: {
    fontSize: fs(11),
    color: C.muted,
  },
  infoValue: {
    marginTop: 2,
    fontSize: fs(13),
    fontWeight: '600',
    color: C.ink,
  },
  aptCard: {
    backgroundColor: C.white,
    borderRadius: s(16),
    paddingVertical: s(14),
    paddingHorizontal: s(16),
    marginBottom: s(18),
  },
  aptTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aptThumb: {
    width: s(44),
    height: s(44),
    borderRadius: s(22),
    marginRight: s(14),
    backgroundColor: colors.brandSoft,
  },
  aptCopy: {
    flex: 1,
    marginRight: s(12),
    paddingTop: s(2),
    alignItems: 'flex-start',
  },
  aptTitle: {
    fontSize: fs(13),
    fontWeight: '700',
    color: C.ink,
    lineHeight: fs(18),
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  aptMeta: {
    marginTop: s(5),
    fontSize: fs(10),
    color: C.muted,
    lineHeight: fs(14),
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  aptPrice: {
    marginTop: s(5),
    fontSize: fs(11),
    fontWeight: '600',
    color: BRAND_BG,
    lineHeight: fs(15),
    textAlign: 'left',
    alignSelf: 'stretch',
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    marginLeft: s(2),
  },
  badgeText: {
    fontSize: fs(9),
    fontWeight: '600',
  },
  viewBtnOuter: {
    marginTop: s(34),
    alignSelf: 'stretch',
    borderRadius: 999,
    overflow: 'hidden',
  },
  viewBtnInner: {
    height: s(30),
    borderRadius: 999,
    backgroundColor: BRAND_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: s(16),
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: fs(11),
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  empty: {
    color: C.muted,
    fontSize: fs(12),
    marginBottom: s(18),
  },
  backBtnOuter: {
    marginTop: s(16),
    alignSelf: 'stretch',
    width: '100%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  backBtnInner: {
    height: s(52),
    borderRadius: 999,
    backgroundColor: BRAND_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '700',
    textAlign: 'center',
  },
});
