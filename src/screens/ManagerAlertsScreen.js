import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { useSession } from '../context/SessionContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import {
  clinicErrorMessage,
  fetchManagerAlerts,
  fetchManagerAppointmentRequests,
  updateManagerAlert,
} from '../lib/clinic';
import { colors, spacing, managerDashboard as theme } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

function computeStats(list) {
  return {
    all: list.length,
    unread: list.filter((item) => item.status === 'unread').length,
    actionNeeded: list.filter((item) => item.actionNeeded).length,
  };
}

function StatCard({ label, value }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.card,
        borderRadius: s(14),
        paddingVertical: s(14),
        paddingHorizontal: s(10),
        alignItems: 'center',
        marginHorizontal: s(4),
      }}
    >
      <Text style={{ fontSize: fs(18), fontWeight: '700', color: theme.colors.text }}>{value}</Text>
      <Text style={{ fontSize: fs(9), color: theme.colors.secondaryText, marginTop: 4, textAlign: 'center' }}>
        {label}
      </Text>
    </View>
  );
}

function FilterChip({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={{
        height: s(34),
        paddingHorizontal: s(14),
        borderRadius: 999,
        backgroundColor: active ? theme.colors.brandButton || colors.brand : theme.colors.card,
        borderWidth: active ? 0 : 1,
        borderColor: theme.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: s(8),
      }}
    >
      <Text
        style={{
          fontSize: fs(11),
          fontWeight: '600',
          color: active ? '#fff' : theme.colors.text,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function statusLabel(status) {
  if (status === 'unread') return 'Unread';
  if (status === 'action') return 'Action Needed';
  if (status === 'acknowledged') return 'Investigating';
  if (status === 'reviewed') return 'Reviewed';
  if (status === 'declined') return 'Declined';
  return 'Read';
}

function statusTone(status) {
  if (status === 'declined') return { bg: colors.dangerBg, color: colors.danger };
  if (status === 'reviewed' || status === 'acknowledged') {
    return { bg: colors.successBg, color: colors.success };
  }
  if (status === 'unread' || status === 'action') {
    return { bg: colors.brandSoft, color: colors.brand };
  }
  return { bg: '#F3EFEA', color: theme.colors.secondaryText };
}

function resolvedCopy(item) {
  if (item.resolvedAction === 'investigate') return 'Marked as investigating';
  if (item.resolvedAction === 'decline') return 'Request declined';
  if (item.resolvedAction === 'review') return 'Request reviewed';
  return null;
}

function AlertCard({ item, busyId, onInvestigate, onDecline, onReview }) {
  const icon =
    item.type === 'refund'
      ? 'refresh-outline'
      : item.type === 'booking'
        ? 'trending-down-outline'
        : item.type === 'accountRequests'
          ? 'person-add-outline'
          : 'alert-circle-outline';
  const busy = busyId === item.id;
  const tone = statusTone(item.status);
  const resolved = resolvedCopy(item);
  const showActions = item.actionNeeded && !item.resolvedAction;

  return (
    <View
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: s(14),
        padding: s(14),
        marginBottom: s(12),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <View
          style={{
            width: s(36),
            height: s(36),
            borderRadius: s(18),
            backgroundColor: '#F3E6DA',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: s(10),
          }}
        >
          <Ionicons name={icon} size={s(16)} color={theme.colors.brandButton || colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: fs(13), fontWeight: '700', color: theme.colors.text }}>
              {item.title}
            </Text>
            <View
              style={{
                backgroundColor: tone.bg,
                borderRadius: 999,
                paddingHorizontal: s(8),
                paddingVertical: s(3),
              }}
            >
              <Text style={{ fontSize: fs(8), fontWeight: '700', color: tone.color }}>
                {statusLabel(item.status)}
              </Text>
            </View>
          </View>
          <Text style={{ marginTop: 4, fontSize: fs(10), color: theme.colors.secondaryText }}>
            {item.branchName || 'Branch'} · {item.clock || item.time || ''}
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontSize: fs(10),
              color: theme.colors.secondaryText,
              lineHeight: fs(14),
            }}
          >
            {item.body || item.detail}
          </Text>
        </View>
      </View>

      {resolved ? (
        <View
          style={{
            marginTop: s(12),
            borderRadius: s(12),
            backgroundColor: colors.successBg,
            paddingVertical: s(10),
            paddingHorizontal: s(12),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Ionicons name="checkmark-circle" size={s(16)} color={colors.success} />
          <Text
            style={{
              marginLeft: s(8),
              color: colors.success,
              fontSize: fs(11),
              fontWeight: '600',
              flex: 1,
            }}
          >
            {resolved}
          </Text>
        </View>
      ) : null}

      {showActions && item.primaryAction ? (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => onReview(item)}
          style={{
            marginTop: s(12),
            height: s(38),
            borderRadius: 999,
            backgroundColor: theme.colors.brandButton || colors.brand,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy ? 0.7 : 1,
          }}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: fs(11), fontWeight: '600' }}>
              {item.primaryAction} {'>'}
            </Text>
          )}
        </Pressable>
      ) : null}

      {showActions && !item.primaryAction ? (
        <View style={{ flexDirection: 'row', marginTop: s(12) }}>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onInvestigate(item)}
            style={{
              flex: 1,
              height: s(36),
              borderRadius: 999,
              backgroundColor: theme.colors.brandButton || colors.brand,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: s(8),
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: fs(11), fontWeight: '600' }}>Investigate</Text>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => onDecline(item)}
            style={{
              flex: 1,
              height: s(36),
              borderRadius: 999,
              backgroundColor: theme.colors.card,
              borderWidth: 1,
              borderColor: theme.colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: busy ? 0.7 : 1,
            }}
          >
            {busy ? (
              <ActivityIndicator color={theme.colors.text} />
            ) : (
              <Text style={{ color: theme.colors.text, fontSize: fs(11), fontWeight: '600' }}>Decline</Text>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export default function ManagerAlertsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const { displayRegion, user } = useSession();
  const [stats, setStats] = useState({ all: 0, unread: 0, actionNeeded: 0 });
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('All');
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busyId, setBusyId] = useState(null);
  const toastTimer = useRef(null);
  const itemsRef = useRef([]);

  const showToast = useCallback((message) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1800);
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const applyList = useCallback((nextItems) => {
    itemsRef.current = nextItems;
    setItems(nextItems);
    setStats(computeStats(nextItems));
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await fetchManagerAlerts();
      const nextItems = Array.isArray(data.items) ? data.items : [];
      applyList(nextItems);
      if (data.stats) setStats(data.stats);
      setError('');
      return nextItems;
    } catch (err) {
      setError(clinicErrorMessage(err));
      return null;
    }
  }, [applyList]);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  useRefreshOnFocus(load);

  const filtered = useMemo(() => {
    if (filter === 'Unread') return items.filter((item) => item.status === 'unread');
    if (filter === 'Action Required') return items.filter((item) => item.actionNeeded);
    return items;
  }, [items, filter]);

  const openInvestigate = useCallback(
    (item) => {
      if (!item?.id) return;
      // Booking / refund alerts open the full Investigate → Request Details flow.
      if (item.investigation || item.type === 'booking' || item.type === 'refund') {
        navigation.navigate('InvestigateAlert', { alertId: item.id, alert: item });
        return;
      }
      // Fallback: mark investigating for other alert types.
      (async () => {
        if (busyId) return;
        setBusyId(item.id);
        try {
          const next = await updateManagerAlert(item.id, { action: 'investigate' });
          applyList(itemsRef.current.map((row) => (row.id === next.id ? { ...row, ...next } : row)));
          showToast('Alert marked for investigation');
        } catch (err) {
          setError(clinicErrorMessage(err) || 'Could not update alert.');
        } finally {
          setBusyId(null);
        }
      })();
    },
    [applyList, busyId, navigation, showToast]
  );

  const openDeclineFlow = useCallback(
    (item) => {
      if (!item?.id) return;
      if (item.requestDetail || item.type === 'booking' || item.type === 'refund') {
        navigation.navigate('AlertRequestDetail', { alertId: item.id, alert: item });
        return;
      }
      (async () => {
        if (busyId) return;
        setBusyId(item.id);
        try {
          const next = await updateManagerAlert(item.id, { action: 'decline' });
          applyList(itemsRef.current.map((row) => (row.id === next.id ? { ...row, ...next } : row)));
          showToast('Alert declined');
        } catch (err) {
          setError(clinicErrorMessage(err) || 'Could not update alert.');
        } finally {
          setBusyId(null);
        }
      })();
    },
    [applyList, busyId, navigation, showToast]
  );

  const openAppointmentRequestReview = useCallback(
    async (alertItem) => {
      if (!alertItem?.id || busyId) return;
      setBusyId(alertItem.id);
      setError('');
      try {
        // Same destination as Appointments tab → request detail.
        let requestId = alertItem.requestId || null;
        if (!requestId) {
          const data = await fetchManagerAppointmentRequests();
          const pending = (data.items || []).find(
            (row) => String(row.status || '').toLowerCase() === 'pending'
          );
          requestId = pending?.id || data.items?.[0]?.id || null;
        }
        if (!requestId) {
          setError('No appointment request available to review.');
          return;
        }
        // Mark alert reviewed in the background; detail screen is the source of truth.
        updateManagerAlert(alertItem.id, { action: 'review' }).catch(() => {});
        setItems((prev) => {
          const next = prev.map((row) =>
            row.id === alertItem.id
              ? {
                  ...row,
                  actionNeeded: false,
                  primaryAction: null,
                  resolvedAction: 'review',
                  status: 'reviewed',
                }
              : row
          );
          itemsRef.current = next;
          setStats(computeStats(next));
          return next;
        });
        navigation.navigate('AppointmentRequestDetail', { requestId });
      } catch (err) {
        setError(clinicErrorMessage(err) || 'Could not open appointment request.');
      } finally {
        setBusyId(null);
      }
    },
    [busyId, navigation]
  );

  const subtitle =
    user?.role === 'clinic_manager'
      ? `${displayRegion || 'Region'} · Clinic Manager`
      : `${displayRegion || 'Region'} · Regional Manager`;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.page }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
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
            <View style={{ flex: 1, marginLeft: s(12) }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: theme.colors.text }}>Alerts</Text>
              <Text style={{ fontSize: fs(10), color: theme.colors.secondaryText, marginTop: 2 }}>
                {subtitle}
              </Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <View style={{ flexDirection: 'row', marginTop: s(18), marginHorizontal: -s(4) }}>
            <StatCard label="All Alerts" value={stats.all ?? 0} />
            <StatCard label="Unread" value={stats.unread ?? 0} />
            <StatCard label="Action Needed" value={stats.actionNeeded ?? 0} />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: s(16) }}
            contentContainerStyle={{ paddingRight: s(8) }}
          >
            {['All', 'Unread', 'Action Required'].map((label) => (
              <FilterChip
                key={label}
                label={label === 'All' ? 'All Read' : label}
                active={filter === label}
                onPress={() => setFilter(label)}
              />
            ))}
          </ScrollView>

          {toast ? (
            <View
              style={{
                marginTop: s(12),
                backgroundColor: colors.successBg,
                borderRadius: s(12),
                paddingVertical: s(10),
                paddingHorizontal: s(12),
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <Ionicons name="checkmark-circle" size={s(16)} color={colors.success} />
              <Text style={{ marginLeft: s(8), color: colors.success, fontSize: fs(11), fontWeight: '600' }}>
                {toast}
              </Text>
            </View>
          ) : null}

          {error ? (
            <Text style={{ marginTop: s(12), color: colors.danger, fontSize: fs(11), textAlign: 'center' }}>
              {error}
            </Text>
          ) : null}

          <View
            style={{
              marginTop: s(18),
              marginBottom: s(10),
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text style={{ flex: 1, fontSize: fs(13), fontWeight: '700', color: theme.colors.text }}>
              Today
            </Text>
            <Text style={{ fontSize: fs(10), color: theme.colors.secondaryText }}>Newest first</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(36) }}>
              <Ionicons name="notifications-outline" size={s(28)} color={colors.muted} />
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 8 }}>No alerts found</Text>
            </View>
          ) : (
            filtered.map((item) => (
              <AlertCard
                key={item.id}
                item={item}
                busyId={busyId}
                onInvestigate={openInvestigate}
                onDecline={openDeclineFlow}
                onReview={openAppointmentRequestReview}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
