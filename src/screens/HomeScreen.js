import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Text from '../components/AppText';
import ClinicManagersModal from '../components/ClinicManagersModal';
import { RegionGlobeButton, RegionLabelButton } from '../components/RegionSwitcher';
import UserAvatar from '../components/UserAvatar';
import {
  SearchField,
  SectionHeader,
  NotificationBellButton,
} from '../components/ui';
import { useClinicData } from '../context/ClinicDataContext';
import { useSession } from '../context/SessionContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';
import { doctorPhotoSource } from '../lib/doctorMedia';
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

function StatCard({ item }) {
  return (
    <View
      style={{
        width: '48%',
        minHeight: s(104),
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: s(12),
        // A native surface remains visible while the screen is being restored.
        // react-native-svg gradient fills can be dropped by Android after navigation.
        backgroundColor: colors.brand,
      }}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[colors.brand, colors.brandLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
      />

      <View style={{ flex: 1, padding: s(14), justifyContent: 'space-between' }}>
        <Ionicons name={item.icon} size={s(18)} color={colors.white} />
        <View style={{ marginTop: s(10) }}>
          <Text style={{ fontSize: fs(22), fontWeight: '700', color: colors.white }}>{item.value}</Text>
          <Text style={{ fontSize: fs(11), color: colors.white, marginTop: 2 }} numberOfLines={2}>
            {item.label}
          </Text>
        </View>
      </View>
    </View>
  );
}

function AttentionCard({ item }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: s(12),
        marginBottom: s(10),
        flexDirection: 'row',
      }}
    >
      <View
        style={{
          width: s(32),
          height: s(32),
          borderRadius: 8,
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(10),
        }}
      >
        <Ionicons name="alert-circle-outline" size={s(18)} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: fs(12), fontWeight: '700', color: colors.ink }}>{item.title}</Text>
          <Text style={{ fontSize: fs(9), color: colors.mutedBrand, marginLeft: 6 }}>{item.time}</Text>
        </View>
        <Text style={{ fontSize: fs(9), lineHeight: fs(9) * 1.45, color: colors.desc, marginTop: 4 }}>
          {item.body}
        </Text>
      </View>
    </View>
  );
}

function BranchRow({ item, rank }) {
  const rankSize = s(24);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(14),
        marginBottom: s(14),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: rankSize,
            height: rankSize,
            borderRadius: rankSize / 2,
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: s(12),
          backgroundColor: colors.brand,
          }}
        >
          <LinearGradient
            pointerEvents="none"
            colors={[colors.brand, colors.brandLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          />
          <Text style={{ fontSize: fs(11), fontWeight: '700', color: colors.white }}>{rank}</Text>
        </View>

        <View style={{ flex: 1, marginRight: s(8) }}>
          <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={{ fontSize: fs(10), color: colors.desc, marginTop: 2 }} numberOfLines={1}>
            {item.address}
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.brand }}>{item.value}</Text>
          <Text style={{ fontSize: fs(7, 7), color: colors.success, marginTop: 2 }}>{item.quota}% of Quota</Text>
        </View>
      </View>

      <View
        style={{
          height: 6,
          borderRadius: 3,
          backgroundColor: colors.barTrack,
          marginTop: s(10),
          overflow: 'hidden',
        }}
      >
        <LinearGradient
          colors={[colors.brand, colors.brandLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ width: `${(item.progress || 0) * 100}%`, height: 6 }}
        />
      </View>
    </View>
  );
}

function DoctorRow({ item, onPress }) {
  const branchName =
    item.branchName ||
    item.branch ||
    (typeof item.clinic === 'string' ? item.clinic : item.clinic?.name) ||
    '';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(14),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Image
        source={doctorPhotoSource(item, { preferTreatmentAsset: true })}
        contentFit="cover"
        contentPosition="top"
        style={{ width: s(48), height: s(48), borderRadius: s(24), backgroundColor: colors.fieldAlt }}
      />
      <View style={{ flex: 1, marginLeft: s(12), marginRight: 8 }}>
        <Text style={{ fontSize: fs(14), fontWeight: '600', color: colors.ink }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: fs(9), color: colors.mutedBrand, marginTop: 3 }} numberOfLines={1}>
          {item.specialty} • {item.consults ?? 0} Consults
          {branchName ? ` • ${branchName}` : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={s(16)} color={colors.mutedBrand} style={{ marginLeft: s(10) }} />
    </Pressable>
  );
}

function ManagerRow({ item, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingVertical: s(12),
        paddingHorizontal: s(14),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          width: s(48),
          height: s(48),
          borderRadius: s(24),
          backgroundColor: colors.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="person" size={s(22)} color={colors.brand} />
      </View>
      <View style={{ flex: 1, marginLeft: s(12), marginRight: 8 }}>
        <Text style={{ fontSize: fs(14), fontWeight: '600', color: colors.ink }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: fs(9), color: colors.mutedBrand, marginTop: 3 }} numberOfLines={1}>
          {[item.clinic?.city, item.clinic?.region].filter(Boolean).join(', ') ||
            item.clinic?.name ||
            'Clinic'}
          {' · '}
          {item.appointmentsToday ?? 0} appts today
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={s(16)} color={colors.mutedBrand} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { user, displayRegion } = useSession();
  const { dashboard, managers: managersPayload, error, refresh, activeRegion } = useClinicData();
  const [managersModal, setManagersModal] = useState({
    open: false,
    mode: 'list',
    manager: null,
  });

  useRefreshOnFocus(refresh);

  // Region key forces a clean section paint on first switch (avoids mixed leftover rows).
  const regionKey = String(activeRegion || displayRegion || user.region || 'UAE');

  const stats = dashboard?.stats || [];
  const attention = dashboard?.attention || [];
  const branches = dashboard?.branches || [];
  const doctors = useMemo(
    () =>
      [...(dashboard?.doctors || [])].sort(
        (a, b) =>
          Number(b.consults || 0) - Number(a.consults || 0) ||
          String(a.name || '').localeCompare(String(b.name || ''))
      ),
    [dashboard?.doctors]
  );
  const managers = dashboard?.managerPreview || [];
  const allManagers = useMemo(() => {
    const items = managersPayload?.items?.length ? managersPayload.items : managers;
    return items || [];
  }, [managersPayload?.items, managers]);
  const showHardError = Boolean(error) && stats.length === 0;

  function openManagersList() {
    setManagersModal({ open: true, mode: 'list', manager: null });
  }

  function openManagerDetail(item) {
    setManagersModal({ open: true, mode: 'detail', manager: item });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
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
          <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 30 }}>
            <UserAvatar uri={user.photoUrl} size={s(40)} />
            <View style={{ flex: 1, marginLeft: s(10), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                Hi, {user.name || 'there'} 👋
              </Text>
              <View style={{ marginTop: 2 }}>
                <RegionLabelButton color={colors.brand} />
              </View>
            </View>
            {/* Two header icons: region + notifications */}
            <RegionGlobeButton color={colors.brand} />
            <View style={{ width: s(8) }} />
            <NotificationBellButton color={colors.brand} />
          </View>

          <View style={{ marginTop: s(18) }}>
            <SearchField />
          </View>

          {showHardError ? (
            <View style={{ marginTop: s(12), alignItems: 'center' }}>
              <Text style={{ fontSize: fs(11), color: colors.danger, textAlign: 'center' }}>
                {error}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Retry loading clinic data"
                onPress={() => refresh({ force: true, silent: false })}
                style={{ marginTop: s(8), paddingHorizontal: s(14), paddingVertical: s(7) }}
              >
                <Text style={{ fontSize: fs(11), fontWeight: '700', color: colors.brand }}>
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : null}

          <View
            key={`stats-${regionKey}`}
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(22),
            }}
          >
            {stats.map((item) => (
              <StatCard key={`${regionKey}-${item.id}`} item={item} />
            ))}
          </View>

          <SectionHeader title="Need Attention" />
          {attention.map((item) => (
            <AttentionCard key={`${regionKey}-${item.id}`} item={item} />
          ))}

          <SectionHeader
            title="Branch Leaderboard"
            large
            onAction={() => navigateToTab(navigation, TAB_ROUTES.Branches)}
          />
          {branches.map((item, i) => (
            <BranchRow key={`${regionKey}-${item.id}`} item={item} rank={i + 1} />
          ))}

          <SectionHeader title="Clinic Managers" onAction={openManagersList} />
          {managers.map((item) => (
            <ManagerRow
              key={`${regionKey}-${item.id}`}
              item={item}
              onPress={() => openManagerDetail(item)}
            />
          ))}

          <SectionHeader title="Doctors Performance" />
          {doctors.map((item) => (
            <DoctorRow
              key={`${regionKey}-${item.id}`}
              item={item}
              onPress={() =>
                navigation.navigate('DoctorConsultation', {
                  doctorId: item.id,
                  doctor: item,
                })
              }
            />
          ))}
        </View>
      </ScrollView>

      <ClinicManagersModal
        visible={managersModal.open}
        mode={managersModal.mode}
        selectedManager={managersModal.manager}
        managers={allManagers}
        stats={managersPayload?.stats || null}
        onClose={() => setManagersModal({ open: false, mode: 'list', manager: null })}
      />
    </View>
  );
}
