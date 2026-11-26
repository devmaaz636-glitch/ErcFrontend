import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, TextInput, View, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Text from '../components/AppText';
import { IconCircleButton, NotificationBellButton, PrimaryButton } from '../components/ui';
import { navigateRoot, navigateToTab, TAB_ROUTES } from '../navigation/tabRoutes';
import { colors, shadows, spacing } from '../theme';
import { fs, scale as s, useTopPadding } from '../utils/responsive';
import { usePatientData } from '../context/PatientDataContext';
import { useSession } from '../context/SessionContext';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

const TAB_EASE = Easing.out(Easing.quad);
const TAB_DURATION = 160;

const PATIENT_AVATAR = require('../../assets/patientimage.png');
const CARD_BG = '#BF824F';

const TABS = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'past', label: 'Past' },
];

const STATUS_STYLE = {
  upcoming: { label: 'Confirmed', color: '#6B5CA5', bg: '#EDE8F8' },
  pending: { label: 'Pending', color: '#C9A227', bg: '#F7F0D4' },
  completed: { label: 'Completed', color: colors.success, bg: colors.successBg },
  canceled: { label: 'Canceled', color: colors.danger, bg: colors.dangerBg },
};

function SearchBar({ value, onChangeText }) {
  return (
    <View
      style={{
        marginTop: s(16),
        height: s(44),
        borderRadius: 999,
        backgroundColor: colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: s(14),
        ...shadows.card,
      }}
    >
      <Ionicons name="search-outline" size={s(18)} color={colors.muted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Search Here..."
        placeholderTextColor={colors.muted}
        allowFontScaling={false}
        style={{
          flex: 1,
          marginLeft: s(10),
          fontSize: fs(13),
          color: colors.ink,
          paddingVertical: 0,
        }}
      />
    </View>
  );
}

function FilterTab({ label, active, onPress, onLayout }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      onLayout={onLayout}
      style={{
        flex: 1,
        height: s(40),
        paddingHorizontal: s(8),
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}
    >
      <Text
        style={{
          fontSize: fs(13),
          fontWeight: active ? '700' : '600',
          color: active ? CARD_BG : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function FilterBar({ tab, onChange }) {
  const [layouts, setLayouts] = useState({});
  const activeIndex = Math.max(
    0,
    TABS.findIndex((item) => item.key === tab)
  );
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);
  const ready = useSharedValue(0);

  useEffect(() => {
    const layout = layouts[activeIndex];
    if (!layout) return;
    const animate = ready.value === 1;
    indicatorX.value = animate
      ? withTiming(layout.x, { duration: TAB_DURATION, easing: TAB_EASE })
      : layout.x;
    indicatorW.value = animate
      ? withTiming(layout.width, { duration: TAB_DURATION, easing: TAB_EASE })
      : layout.width;
    ready.value = 1;
  }, [activeIndex, layouts, indicatorW, indicatorX, ready]);

  const indicatorStyle = useAnimatedStyle(() => ({
    opacity: indicatorW.value > 0 ? 1 : 0,
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  return (
    <View
      style={{
        marginTop: s(20),
        marginBottom: s(4),
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 999,
        paddingHorizontal: s(8),
        paddingVertical: s(6),
        ...shadows.card,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            left: 0,
            top: s(6),
            bottom: s(6),
            borderRadius: 999,
            backgroundColor: '#F6E6D6',
          },
          indicatorStyle,
        ]}
      />
      {TABS.map((item, index) => (
        <FilterTab
          key={item.key}
          label={item.label}
          active={tab === item.key}
          onPress={() => onChange(item.key)}
          onLayout={(event) => {
            const { x, width } = event.nativeEvent.layout;
            setLayouts((prev) => {
              const next = prev[index];
              if (next && next.x === x && next.width === width) return prev;
              return { ...prev, [index]: { x, width } };
            });
          }}
        />
      ))}
    </View>
  );
}

function StatusChip({ status }) {
  const tone = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <View
      style={{
        backgroundColor: tone.bg,
        borderRadius: 999,
        paddingHorizontal: s(10),
        paddingVertical: s(5),
      }}
    >
      <Text style={{ color: tone.color, fontSize: fs(10), fontWeight: '600' }}>{tone.label}</Text>
    </View>
  );
}

function AppointmentCard({ item, onView, photoUrl }) {
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 18,
        padding: s(14),
        marginBottom: s(12),
        ...shadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Image
          source={photoUrl ? { uri: photoUrl } : PATIENT_AVATAR}
          contentFit="cover"
          style={{
            width: s(46),
            height: s(46),
            borderRadius: s(23),
            backgroundColor: colors.fieldAlt,
          }}
        />
        <View style={{ flex: 1, marginLeft: s(10), marginRight: s(8) }}>
          <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.ink }}>{item.patientName || item.name || 'My appointment'}</Text>
          <Text style={{ marginTop: 3, fontSize: fs(11), color: colors.desc }}>
            Request ID: {item.requestId || item.patientId || 'Pending'}
          </Text>
        </View>
        <StatusChip status={item.status} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: s(12) }}>
        <Text style={{ fontSize: fs(12), fontWeight: '600', color: colors.ink }}>
          {item.treatment}
        </Text>
        <Ionicons
          name="time-outline"
          size={s(13)}
          color={colors.desc}
          style={{ marginLeft: s(10) }}
        />
        <Text style={{ marginLeft: 4, fontSize: fs(11), color: colors.desc }}>{item.time}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => onView?.(item)}
        style={{
          marginTop: s(12),
          height: s(32),
          borderRadius: 999,
          backgroundColor: '#F6E6D6',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: CARD_BG, fontSize: fs(12), fontWeight: '700' }}>View Details</Text>
      </Pressable>
    </View>
  );
}

export default function PatientAppointmentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(20);
  const { width: windowW } = useWindowDimensions();
  const pageWidth = Math.min(windowW - spacing.screen * 2, spacing.maxContent);
  const [tab, setTab] = useState('today');
  const [search, setSearch] = useState('');
  const { user } = useSession();
  const { appointments, refreshSilent } = usePatientData();
  useRefreshOnFocus(refreshSilent);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter((item) => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const itemDate = item.date || '';
      if (tab === 'today' && itemDate !== today) return false;
      if (tab === 'upcoming' && !(itemDate > today && item.status !== 'canceled')) return false;
      if (tab === 'past' && !(itemDate < today || item.status === 'canceled' || item.status === 'completed')) return false;
      if (!q) return true;
      return (
        String(item.patientName || item.name || '').toLowerCase().includes(q) ||
        String(item.requestId || item.patientId || '').toLowerCase().includes(q) ||
        String(item.treatment || '').toLowerCase().includes(q)
      );
    });
  }, [appointments, search, tab]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.screen,
          paddingBottom: insets.bottom + spacing.tabBarClearance + s(64),
        }}
      >
        <View style={{ width: pageWidth, alignSelf: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.brand}
              accessibilityLabel="Go back"
              onPress={() => navigateToTab(navigation, TAB_ROUTES.Home)}
            />
            <View style={{ flex: 1, marginLeft: s(12), marginRight: s(8) }}>
              <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink }}>
                My Appointments
              </Text>
              <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.desc }}>Patient</Text>
            </View>
            <NotificationBellButton color={colors.brand} />
          </View>

          <SearchBar value={search} onChangeText={setSearch} />

          <FilterBar tab={tab} onChange={setTab} />

          <View style={{ marginTop: s(16) }}>
            {filtered.length === 0 ? (
              <View
                style={{
                  alignItems: 'center',
                  paddingVertical: s(36),
                  backgroundColor: colors.card,
                  borderRadius: 18,
                }}
              >
                <Ionicons name="calendar-outline" size={s(28)} color={colors.muted} />
                <Text style={{ marginTop: 8, fontSize: fs(12), color: colors.desc }}>
                  No appointments in this list
                </Text>
              </View>
            ) : (
              filtered.map((item) => (
                <AppointmentCard
                  photoUrl={user?.photoUrl}
                  key={item.id}
                  item={item}
                  onView={(apt) =>
                    navigateRoot(navigation, 'PatientAppointmentDetail', { appointment: apt })
                  }
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: spacing.screen,
          right: spacing.screen,
          bottom: insets.bottom + spacing.tabBarClearance - s(8),
          alignItems: 'center',
        }}
      >
        <PrimaryButton
          label="Add New Appointment +"
          onPress={() => navigateRoot(navigation, 'PatientBookAppointment')}
          style={{ width: '100%', maxWidth: spacing.maxContent }}
        />
      </View>
    </View>
  );
}
