import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton } from '../components/ui';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { clinicErrorMessage, fetchManagerAlert, updateManagerAlert } from '../lib/clinic';
import { BRAND_BG, brandButtonBg, brandButtonText, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const C = {
  bg: '#FFF8F1',
  brand: BRAND_BG,
  white: '#FFFFFF',
  ink: '#2B2420',
  muted: '#8D8680',
  label: '#6B6560',
  danger: '#E57373',
  card: '#FFFFFF',
};

export default function InvestigateAlertScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(14);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width - s(40), spacing.maxContent);
  const alertId = route.params?.alertId;
  const passed = route.params?.alert;

  const [item, setItem] = useState(passed || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!passed);

  const load = useCallback(async () => {
    if (!alertId) return null;
    try {
      const next = await fetchManagerAlert(alertId);
      setItem(next);
      setError('');
      return next;
    } catch (err) {
      setError(clinicErrorMessage(err) || 'Could not load alert.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    if (!passed && alertId) {
      setLoading(true);
      load().catch(() => {});
    }
  }, [alertId, passed, load]);

  useRefreshOnFocus(load);

  useEffect(() => {
    if (!alertId) return undefined;
    let cancelled = false;
    updateManagerAlert(alertId, { action: 'investigate' })
      .then((next) => {
        if (!cancelled) setItem(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [alertId]);

  const inv = item?.investigation || {};
  const perf = inv.performance || {};
  const branchName = item?.branchName || inv.branchName || 'Branch';
  const related = Array.isArray(inv.related) && inv.related.length
    ? inv.related
    : ['Recent Booking requests', 'Recent booking activity'];
  const statusLabel = inv.statusLabel || 'Needs Investigation';
  const detected =
    item?.detectedLabel ||
    [item?.time || 'Today', item?.clock || '10:32 AM'].filter(Boolean).join(', ');

  function openDetails() {
    navigation.navigate('AlertRequestDetail', {
      alertId: item?.id || alertId,
      alert: item,
    });
  }

  function goHome() {
    navigation.navigate('ManagerTabs', { screen: 'Home' });
  }

  if (loading && !item) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator color={C.brand} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: s(20),
          paddingBottom: Math.max(insets.bottom, 18) + s(16),
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
            <Text style={styles.headerTitle}>Investigate Alert</Text>
          </View>
          <NotificationBellButton color={BRAND_BG} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Hero — tan card */}
        <View style={[styles.hero, brandButtonBg]}>
          <View style={styles.heroTop}>
            <View style={styles.heroTitleRow}>
              <Ionicons name="warning-outline" size={s(18)} color={C.white} />
              <Text style={styles.heroTitle} numberOfLines={1}>
                {inv.headline || item?.title || 'Booking Drop'}
              </Text>
            </View>
            <View style={styles.branchPill}>
              <Text style={styles.branchPillText} numberOfLines={1}>
                {branchName}
              </Text>
            </View>
          </View>
          <Text style={styles.heroSubtitle}>
            {inv.subtitle || item?.body || 'Unusual Booking Drop activity detected'}
          </Text>
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>
                {inv.metricLabel || item?.title || 'Booking Drop'}
              </Text>
              <Text style={styles.heroMetricValue}>{inv.metricValue ?? 18}</Text>
            </View>
            <View style={styles.heroMetricCol}>
              <Text style={styles.heroMetricLabel}>{inv.paceLabel || 'Normal pace'}</Text>
              <Text style={styles.heroMetricValue}>{inv.paceValue || '3.8x'}</Text>
            </View>
          </View>
        </View>

        {/* Alert information */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>ALERT INFORMATION</Text>
          <InfoRow label="Branch" value={branchName} />
          <InfoRow label="Detected" value={detected} />
          <InfoRow label="Current Status" value={statusLabel} valueColor={C.danger} />
        </View>

        {/* Performance + View Details inside card (exact mock) */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>PERFORMANCE</Text>
          <View style={styles.perfRow}>
            <PerfCol label={perf.normalLabel || 'Normal Booking'} value={perf.normal ?? 5} />
            <PerfCol label={perf.currentLabel || 'Current Booking'} value={perf.current ?? 18} />
            <PerfCol
              label={perf.changeLabel || 'Increase'}
              value={perf.change || '+260%'}
              valueColor={C.danger}
            />
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={openDetails}
            style={({ pressed }) => [styles.viewDetailsBtn, brandButtonBg, pressed && { opacity: 0.9 }]}
          >
            <Text style={[styles.viewDetailsText, brandButtonText]}>View Details {'>'}</Text>
          </Pressable>
        </View>

        <Text style={styles.relatedHeading}>RELATED ACTIVITY</Text>
        {related.map((label) => (
          <Pressable
            key={label}
            onPress={openDetails}
            style={({ pressed }) => [styles.relatedRow, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.relatedText}>{label}</Text>
          </Pressable>
        ))}

        <Pressable
          accessibilityRole="button"
          onPress={goHome}
          style={({ pressed }) => [styles.homeBtn, brandButtonBg, pressed && { opacity: 0.9 }]}
        >
          <Text style={[styles.homeBtnText, brandButtonText]}>Back To Home</Text>
        </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, valueColor }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function PerfCol({ label, value, valueColor }) {
  return (
    <View style={styles.perfCol}>
      <Text style={styles.perfLabel}>{label}</Text>
      <Text style={[styles.perfValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: C.bg,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  headerTitle: {
    fontSize: fs(17),
    fontWeight: '700',
    color: C.ink,
    textAlign: 'left',
  },
  error: {
    color: C.danger,
    fontSize: fs(11),
    textAlign: 'center',
    marginBottom: s(10),
  },
  hero: {
    backgroundColor: BRAND_BG,
    borderRadius: s(18),
    padding: s(16),
    marginBottom: s(14),
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: s(8),
  },
  heroTitle: {
    color: C.white,
    fontSize: fs(16),
    fontWeight: '700',
    marginLeft: s(8),
  },
  branchPill: {
    backgroundColor: C.white,
    borderRadius: 999,
    paddingHorizontal: s(10),
    paddingVertical: s(5),
    maxWidth: s(120),
  },
  branchPillText: {
    color: C.label,
    fontSize: fs(10),
    fontWeight: '600',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: fs(12),
    marginTop: s(10),
  },
  heroMetrics: {
    flexDirection: 'row',
    marginTop: s(18),
  },
  heroMetricCol: {
    flex: 1,
  },
  heroMetricLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: fs(11),
  },
  heroMetricValue: {
    color: C.white,
    fontSize: fs(30),
    fontWeight: '700',
    marginTop: 4,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: s(16),
    padding: s(16),
    marginBottom: s(14),
  },
  sectionTitle: {
    fontSize: fs(11),
    fontWeight: '700',
    color: C.ink,
    letterSpacing: 0.5,
    marginBottom: s(12),
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: s(8),
  },
  infoLabel: {
    fontSize: fs(13),
    color: C.muted,
  },
  infoValue: {
    fontSize: fs(13),
    fontWeight: '600',
    color: C.ink,
    maxWidth: '60%',
    textAlign: 'right',
  },
  perfRow: {
    flexDirection: 'row',
    marginBottom: s(16),
  },
  perfCol: {
    flex: 1,
    alignItems: 'center',
  },
  perfLabel: {
    fontSize: fs(10),
    color: C.muted,
    textAlign: 'center',
  },
  perfValue: {
    fontSize: fs(18),
    fontWeight: '700',
    color: C.ink,
    marginTop: 6,
  },
  viewDetailsBtn: {
    height: s(48),
    borderRadius: 999,
    backgroundColor: BRAND_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: fs(14),
    fontWeight: '600',
  },
  relatedHeading: {
    fontSize: fs(11),
    fontWeight: '700',
    color: C.ink,
    letterSpacing: 0.5,
    marginBottom: s(10),
  },
  relatedRow: {
    backgroundColor: C.white,
    borderRadius: 999,
    paddingVertical: s(15),
    paddingHorizontal: s(18),
    marginBottom: s(10),
  },
  relatedText: {
    color: C.label,
    fontSize: fs(13),
  },
  homeBtn: {
    marginTop: s(16),
    height: s(52),
    borderRadius: 999,
    backgroundColor: BRAND_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: fs(15),
    fontWeight: '700',
  },
});
