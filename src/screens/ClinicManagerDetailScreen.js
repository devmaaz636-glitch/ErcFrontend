import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, PrimaryButton, StatusBadge, SkeletonRow } from '../components/ui';
import { useNotifications } from '../context/NotificationsContext';
import { clinicErrorMessage, fetchManager } from '../lib/clinic';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

function Row({ label, value, valueColor }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: s(10),
        borderBottomWidth: 1,
        borderBottomColor: colors.fieldAlt,
      }}
    >
      <Text style={{ flex: 1, fontSize: fs(11), color: colors.desc }}>{label}</Text>
      <Text style={{ fontSize: fs(11), fontWeight: '600', color: valueColor || colors.ink }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function Metric({ label, value, icon }) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: s(12),
        marginBottom: s(12),
      }}
    >
      <View
        style={{
          width: s(28),
          height: s(28),
          borderRadius: s(14),
          backgroundColor: colors.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={s(14)} color={colors.brand} />
      </View>
      <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink, marginTop: s(10) }}>{value}</Text>
      <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function ClinicManagerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const initial = route.params?.manager || null;
  const managerId = route.params?.managerId || initial?.id;

  const [manager, setManager] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState('');
  const { unreadCount } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!managerId) return undefined;
      setLoading(true);
      fetchManager(managerId)
        .then((item) => {
          if (active) {
            setManager(item);
            setError('');
          }
        })
        .catch((err) => {
          if (active) setError(clinicErrorMessage(err));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [managerId])
  );

  const clinic = manager?.clinic;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + s(40),
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
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                {manager?.name || 'Clinic Manager'}
              </Text>
              <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 1 }}>
                {manager?.role || 'Clinic Manager'}
              </Text>
            </View>
            <IconCircleButton
              name="notifications-outline"
              color={colors.brand}
              accessibilityLabel="Notifications"
              badgeCount={unreadCount}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>

          {loading && !manager ? (
            <View style={{ marginTop: s(24) }}>
              <SkeletonRow lines={2} avatar />
              <SkeletonRow lines={3} />
              <SkeletonRow lines={2} />
            </View>
          ) : null}

          {error ? (
            <Text style={{ fontSize: fs(11), color: colors.danger, marginTop: s(16), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          {manager ? (
            <>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: s(16),
                  marginTop: s(20),
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: s(72),
                    height: s(72),
                    borderRadius: s(36),
                    backgroundColor: colors.brandSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="person" size={s(32)} color={colors.brand} />
                </View>
                <Text style={{ fontSize: fs(16), fontWeight: '700', color: colors.ink, marginTop: s(12) }}>
                  {manager.name}
                </Text>
                <Text style={{ fontSize: fs(10), color: colors.desc, marginTop: 4 }}>{manager.employeeId}</Text>
                <View style={{ marginTop: s(10) }}>
                  <StatusBadge status={manager.status} />
                </View>
              </View>

              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink, marginTop: s(20) }}>
                Performance
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  marginTop: s(10),
                }}
              >
                <Metric
                  icon="calendar-outline"
                  label="Appointments today"
                  value={String(manager.appointmentsToday ?? 0)}
                />
                <Metric
                  icon="people-outline"
                  label="Patients this month"
                  value={String(manager.patientsThisMonth ?? 0)}
                />
                <Metric icon="medkit-outline" label="Staff" value={String(manager.staffCount ?? 0)} />
                <Metric
                  icon="star-outline"
                  label="Rating"
                  value={manager.rating != null ? String(manager.rating) : '—'}
                />
              </View>

              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink, marginTop: s(8) }}>
                Contact
              </Text>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  paddingHorizontal: s(14),
                  marginTop: s(10),
                }}
              >
                <Row label="Email" value={manager.email || '—'} valueColor={colors.brand} />
                <Row label="Phone" value={manager.phone || '—'} />
                <Row label="Joined" value={manager.joinedAt || '—'} />
              </View>

              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink, marginTop: s(20) }}>
                Assigned Clinic
              </Text>
              <Pressable
                onPress={() => {
                  if (clinic?.id) {
                    navigation.navigate('BranchDetail', {
                      branch: {
                        id: clinic.id,
                        name: clinic.name,
                        city: clinic.city,
                        region: clinic.region,
                        address: clinic.address,
                      },
                    });
                  }
                }}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: s(14),
                  marginTop: s(10),
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: s(40),
                    height: s(40),
                    borderRadius: 10,
                    backgroundColor: colors.brandSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: s(12),
                  }}
                >
                  <Ionicons name="business-outline" size={s(18)} color={colors.brand} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                    {clinic?.name || 'Unassigned'}
                  </Text>
                  <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 2 }} numberOfLines={1}>
                    {[clinic?.city, clinic?.region, clinic?.address].filter(Boolean).join(' · ') || '—'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={s(16)} color={colors.muted} />
              </Pressable>

              <PrimaryButton
                label="Back To Managers"
                onPress={() => navigation.goBack()}
                style={{ marginTop: s(24) }}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
