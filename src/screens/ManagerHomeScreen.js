import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Text from '../components/AppText';
import UserAvatar from '../components/UserAvatar';
import { NotificationBellButton, PrimaryButton, SearchField } from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { useSession } from '../context/SessionContext';
import { createManagerSeedDashboard } from '../lib/managerSeed';
import { colors, managerDashboard as theme, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';

const treatmentImage = require('../../assets/brachtabimage.png');
const doctorImage = require('../../assets/doctor.png');

function pickList(live, seedList) {
  return Array.isArray(live) && live.length > 0 ? live : seedList;
}

function StatCard({ item }) {
  return (
    <View
      style={{
        width: '48%',
        height: s(96),
        borderRadius: s(theme.radius.stat),
        padding: s(12),
        marginBottom: s(theme.layout.statsGap),
        backgroundColor: theme.colors.primary,
      }}
    >
      <Ionicons name={item.icon || 'ellipse-outline'} size={s(15)} color="#fff" />
      <Text style={{ color: '#fff', fontSize: fs(17), fontWeight: '700', marginTop: s(7), lineHeight: fs(18) }}>
        {item.value || '00'}
      </Text>
      <Text style={{ color: '#fff', fontSize: fs(9, 8), marginTop: s(2) }} numberOfLines={1}>
        {item.label}
      </Text>
    </View>
  );
}

function SectionHeader({ title, onPress }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(10) }}>
      <Text style={{ flex: 1, color: theme.colors.text, fontSize: fs(14), fontWeight: '700' }}>{title}</Text>
      <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button">
        <Text style={{ color: theme.colors.primary, fontSize: fs(8, 8) }}>See All</Text>
      </Pressable>
    </View>
  );
}

function RequestCard({ request, onReview }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: s(theme.radius.card),
        padding: s(10),
        marginBottom: s(10),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={doctorImage}
          contentFit="cover"
          style={{ width: s(34), height: s(34), borderRadius: s(17), marginRight: s(8) }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontSize: fs(9, 8), fontWeight: '600' }}>
            {request.patient || 'Patient'}
          </Text>
          <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 8), marginTop: 1 }}>
            {request.treatment || 'Treatment'}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: theme.colors.pendingSoft,
            borderRadius: s(8),
            paddingHorizontal: s(8),
            paddingVertical: s(3),
          }}
        >
          <Text style={{ color: theme.colors.pending, fontSize: fs(7, 7), fontWeight: '600' }}>Pending</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(9) }}>
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 8), flex: 1 }}>
          {request.doctor || 'Doctor'}
        </Text>
        <Ionicons name="time-outline" size={s(10)} color={theme.colors.secondaryText} />
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 8), marginLeft: s(3) }}>
          {request.requestedTime || 'Time pending'}
        </Text>
      </View>
      <PrimaryButton
        label="Review Request"
        onPress={onReview}
        size="sm"
        style={{ marginTop: s(11), width: '100%' }}
      />
    </View>
  );
}

function TreatmentCard({ item, onPress }) {
  const percent = Math.max(0, Math.min(100, Math.round((item.progress || 0) * 100)));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: s(theme.radius.card),
        padding: s(10),
        marginBottom: s(9),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Image
          source={treatmentImage}
          contentFit="cover"
          style={{ width: s(28), height: s(28), borderRadius: s(14), marginRight: s(8) }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontSize: fs(9, 8), fontWeight: '600' }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 8), marginTop: 1 }}>
            {item.period || 'Current month'}
          </Text>
        </View>
        <Text style={{ color: theme.colors.primary, fontSize: fs(9, 8), fontWeight: '600' }}>
          {item.sessions || 0}
        </Text>
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 8), marginLeft: s(3) }}>
          {item.quota ? `(of ${item.quota} Sessions)` : '(Quota pending)'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(7) }}>
        <View
          style={{
            flex: 1,
            height: s(4),
            borderRadius: s(2),
            backgroundColor: theme.colors.track,
            overflow: 'hidden',
          }}
        >
          <View style={{ width: `${percent}%`, height: '100%', backgroundColor: theme.colors.primaryLight }} />
        </View>
        <Text style={{ color: theme.colors.success, fontSize: fs(7, 7), fontWeight: '600', marginLeft: s(8) }}>
          {percent}% of Quota
        </Text>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: s(6) }}>
        <Text style={{ color: theme.colors.tertiaryText, fontSize: fs(7, 7) }}>
          {item.quotaConfigured ? `${item.remaining} sessions remaining` : 'Quota not configured'}
        </Text>
        <Text style={{ color: theme.colors.primary, fontSize: fs(7, 7) }}>View Details</Text>
      </View>
    </Pressable>
  );
}

function DoctorCard({ doctor, onPress }) {
  const score = Math.max(0, Math.min(100, Number(doctor.score) || 0));
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: s(theme.radius.card),
        height: s(58),
        paddingHorizontal: s(10),
        marginBottom: s(9),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Image source={doctorImage} contentFit="contain" style={{ width: s(40), height: s(42), marginRight: s(8) }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontSize: fs(9, 8), fontWeight: '600' }}>{doctor.name}</Text>
        <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 8), marginTop: 2 }}>
          {doctor.specialty} · {doctor.consults || 0} Consults
        </Text>
      </View>
      <View
        style={{
          width: s(24),
          height: s(24),
          borderRadius: s(12),
          borderWidth: 1.5,
          borderColor: theme.colors.success,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: theme.colors.success, fontSize: fs(7, 7), fontWeight: '700' }}>{score}%</Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={s(14)}
        color={theme.colors.tertiaryText}
        style={{ marginLeft: s(8) }}
      />
    </Pressable>
  );
}

export default function ManagerHomeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const topPad = useTopPadding(10);
  const { user } = useSession();
  const { dashboard, error, refresh, ensureManagerHomeReady } = useClinicData();
  const [query, setQuery] = useState('');
  const [pulling, setPulling] = useState(false);
  const [reviewHint, setReviewHint] = useState(false);

  // Instant paint by this manager's branch — works for new managers too.
  const homeSeed = useMemo(
    () => createManagerSeedDashboard(user.branchId || user.clinicId, user.region),
    [user.branchId, user.clinicId, user.region]
  );
  const stats = pickList(dashboard?.stats, homeSeed.stats);
  const requests = pickList(dashboard?.appointmentRequests, homeSeed.appointmentRequests);
  const treatments = pickList(dashboard?.treatments, homeSeed.treatments);
  const doctors = pickList(dashboard?.doctors, homeSeed.doctors);
  const greetingName =
    user.name &&
    user.name !== 'Regional Admin' &&
    user.name !== 'Admin' &&
    user.name !== 'Manager' &&
    user.name !== 'Clinic Manager'
      ? user.name
      : user.email?.split('@')[0] || 'Manager';
  const clinicName = dashboard?.clinic?.name || homeSeed.clinic.name || 'Assigned clinic';

  // Prime shell as soon as this tab mounts (covers race before context hydrate).
  useEffect(() => {
    ensureManagerHomeReady?.().catch(() => {});
  }, [ensureManagerHomeReady]);

  useEffect(() => {
    if (!route.params?.fromAlertReview) return undefined;
    setReviewHint(true);
    navigation.setParams?.({ fromAlertReview: undefined });
    const timer = setTimeout(() => setReviewHint(false), 5000);
    return () => clearTimeout(timer);
  }, [route.params?.fromAlertReview, route.params?.refreshedAt, navigation]);

  const filteredTreatments = useMemo(() => {
    const text = query.trim().toLowerCase();
    return treatments.filter((item) => !text || String(item.name || '').toLowerCase().includes(text));
  }, [query, treatments]);

  async function onPullRefresh() {
    setPulling(true);
    try {
      await refresh({ force: true, silent: true });
    } finally {
      setPulling(false);
    }
  }

  // Full design always — data is primed before navigation (zero loading UI).
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.page }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pulling}
            onRefresh={onPullRefresh}
            tintColor={theme.colors.primary}
          />
        }
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: theme.layout.pageGutter,
          paddingBottom: spacing.tabBarClearance,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: theme.layout.maxWidth }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(14) }}>
            <UserAvatar uri={user.photoUrl} size={s(38)} />
            <View style={{ flex: 1, marginLeft: s(9) }}>
              <Text style={{ color: theme.colors.text, fontSize: fs(13), fontWeight: '700' }}>
                Hi, {greetingName} 👋
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="location" size={s(10)} color={theme.colors.secondaryText} />
                <Text style={{ color: theme.colors.secondaryText, fontSize: fs(8, 8), marginLeft: 2 }}>
                  {clinicName}
                </Text>
              </View>
            </View>
            <NotificationBellButton color={theme.colors.primary} />
          </View>

          <SearchField value={query} onChangeText={setQuery} placeholder="Search Here" />

          {error && !dashboard ? (
            <Pressable onPress={() => refresh({ force: true, silent: true })} style={{ paddingVertical: s(10) }}>
              <Text style={{ color: theme.colors.danger || '#E5484D', fontSize: fs(10), textAlign: 'center' }}>
                {error}
              </Text>
              <Text style={{ color: theme.colors.primary, fontSize: fs(10), textAlign: 'center', marginTop: 5 }}>
                Tap to retry
              </Text>
            </Pressable>
          ) : null}

          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(16),
            }}
          >
            {stats.slice(0, 4).map((item) => (
              <StatCard key={item.id} item={item} />
            ))}
          </View>

          {reviewHint ? (
            <View
              style={{
                marginBottom: s(12),
                backgroundColor: colors.brandSoft,
                borderRadius: s(12),
                paddingVertical: s(10),
                paddingHorizontal: s(12),
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="information-circle-outline" size={s(16)} color={theme.colors.primary} />
              <Text
                style={{
                  flex: 1,
                  marginLeft: s(8),
                  color: theme.colors.text,
                  fontSize: fs(10),
                  lineHeight: fs(14),
                }}
              >
                Review module is under development. Use Appointment Requests below to continue.
              </Text>
            </View>
          ) : null}

          <SectionHeader title="Appointment Requests" onPress={() => navigation.navigate('AppointmentsTab')} />
          {requests.slice(0, 3).map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onReview={() =>
                navigation.navigate('AppointmentRequestDetail', { requestId: request.id })
              }
            />
          ))}

          <SectionHeader title="Treatments Leaderboard" onPress={() => navigation.navigate('TreatmentsTab')} />
          {filteredTreatments.slice(0, 3).map((item) => (
            <TreatmentCard
              key={item.id}
              item={item}
              onPress={() => navigation.navigate('TreatmentsTab')}
            />
          ))}

          <SectionHeader title="Doctors Performance" onPress={() => navigation.navigate('DoctorsTab')} />
          {doctors.slice(0, 3).map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              onPress={() =>
                navigation.navigate('DoctorConsultation', {
                  doctorId: doctor.id,
                  doctor,
                })
              }
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
