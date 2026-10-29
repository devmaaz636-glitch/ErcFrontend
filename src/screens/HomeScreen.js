import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import Text from '../components/AppText';
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
import { navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, spacing } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

function StatCard({ item }) {
  const gradId = `grad-${item.id}`;
  return (
    <View
      style={{
        width: '48%',
        minHeight: s(104),
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: s(12),
      }}
    >
      <Svg width="100%" height="100%" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} />
            <Stop offset="1" stopColor={colors.brandLight} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
      </Svg>

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
  const rankGrad = `rank-${item.id}`;
  const barGrad = `bar-${item.id}`;
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
          }}
        >
          <Svg width={rankSize} height={rankSize} style={{ position: 'absolute' }}>
            <Defs>
              <LinearGradient id={rankGrad} x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor={colors.brand} />
                <Stop offset="1" stopColor={colors.brandLight} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={rankSize} height={rankSize} fill={`url(#${rankGrad})`} />
          </Svg>
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
        <View style={{ width: `${(item.progress || 0) * 100}%`, height: 6 }}>
          <Svg width="100%" height="6">
            <Defs>
              <LinearGradient id={barGrad} x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={colors.brand} />
                <Stop offset="1" stopColor={colors.brandLight} />
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="6" fill={`url(#${barGrad})`} />
          </Svg>
        </View>
      </View>
    </View>
  );
}

function ScoreRing({ value, size = s(34) }) {
  const stroke = 3;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));
  const offset = c * (1 - safeValue / 100);
  const svgSize = String(size);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={svgSize} height={svgSize} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#DDF3E2" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.success}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: fs(8, 8), fontWeight: '700', color: colors.ink }}>{value}%</Text>
    </View>
  );
}

function DoctorRow({ item }) {
  return (
    <View
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
        source={require('../../assets/doctor.png')}
        contentFit="cover"
        contentPosition="top"
        style={{ width: s(48), height: s(48), borderRadius: s(24), backgroundColor: colors.fieldAlt }}
      />
      <View style={{ flex: 1, marginLeft: s(12), marginRight: 8 }}>
        <Text style={{ fontSize: fs(14), fontWeight: '600', color: colors.ink }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: fs(9), color: colors.mutedBrand, marginTop: 3 }} numberOfLines={1}>
          {item.specialty} • {item.consults} Consults
        </Text>
      </View>
      <ScoreRing value={item.score} />
      <Ionicons name="chevron-forward" size={s(16)} color={colors.mutedBrand} style={{ marginLeft: s(10) }} />
    </View>
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
          {item.clinic?.name || 'Clinic'} · {item.appointmentsToday ?? 0} appts today
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
  const { user } = useSession();
  const { dashboard, error, refresh } = useClinicData();

  useRefreshOnFocus(refresh);

  const stats = dashboard?.stats || [];
  const attention = dashboard?.attention || [];
  const branches = dashboard?.branches || [];
  const doctors = dashboard?.doctors || [];
  const managers = dashboard?.managerPreview || [];
  const showHardError = Boolean(error) && stats.length === 0;

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
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              marginTop: s(22),
            }}
          >
            {stats.map((item) => (
              <StatCard key={item.id} item={item} />
            ))}
          </View>

          <SectionHeader title="Need Attention" />
          {attention.map((item) => (
            <AttentionCard key={item.id} item={item} />
          ))}

          <SectionHeader
            title="Branch Leaderboard"
            large
            onAction={() => navigateToTab(navigation, TAB_ROUTES.Branches)}
          />
          {branches.map((item, i) => (
            <BranchRow key={item.id} item={item} rank={i + 1} />
          ))}

          <SectionHeader
            title="Clinic Managers"
            onAction={() => navigation.navigate('ClinicManagers')}
          />
          {managers.map((item) => (
            <ManagerRow
              key={item.id}
              item={item}
              onPress={() =>
                navigation.navigate('ClinicManagerDetail', { managerId: item.id, manager: item })
              }
            />
          ))}

          <SectionHeader title="Doctors Performance" />
          {doctors.map((item) => (
            <DoctorRow key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

    </View>
  );
}
