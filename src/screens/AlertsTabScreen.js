import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../components/BottomTabBar';

const BROWN = '#BF824F';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';
const SOFT = '#F4EEE8';

const FILTERS = ['All', 'Unread', 'Action Required'];

// static demo data
const INITIAL_ALERTS = [
  {
    id: 1,
    icon: 'refresh-outline',
    title: 'Refund Spike',
    branch: 'Dubai Branch',
    detail: '3 refunds above normal · Detected 10:32 AM',
    body: 'Reviewed by Admin. The alert has been acknowledged. Individual refund requests remain under review.',
    status: 'Acknowledged',
    actionRequired: false,
    buttons: ['Investigate', 'Decline'],
  },
  {
    id: 2,
    icon: 'trending-down-outline',
    title: 'Booking Drop',
    branch: 'Abu Dhabi Branch',
    detail: 'Bookings decreased by 24%.',
    body: '35 minutes ago',
    status: 'Unread',
    actionRequired: false,
    buttons: ['Investigate >'],
  },
  {
    id: 3,
    icon: 'person-add-outline',
    title: 'Clinic Manager Request',
    branch: 'Dubai Branch',
    detail: 'New manager account awaiting approval.',
    body: 'Review the request and approve or decline.',
    status: 'Unread',
    actionRequired: true,
    buttons: ['Review Request >'],
  },
  {
    id: 4,
    icon: 'trending-down-outline',
    title: 'Booking Drop',
    branch: 'Abu Dhabi Branch',
    detail: 'Bookings decreased by 24%.',
    body: '35 minutes ago',
    status: 'Unread',
    actionRequired: false,
    buttons: ['Investigate >'],
  },
];

/* ---------- Pieces ---------- */
function StatCard({ label, value }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 }}>
      <Text style={{ fontSize: 10, color: MUTED }}>{label}</Text>
      <Text style={{ fontSize: 24, fontWeight: '700', color: INK, marginTop: 6 }}>{value}</Text>
    </View>
  );
}

function FilterPill({ label, active, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{
        height: 26,
        paddingHorizontal: 16,
        borderRadius: 13,
        justifyContent: 'center',
        marginRight: 8,
        backgroundColor: active ? BROWN : '#fff',
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#fff' : INK }}>{label}</Text>
    </Pressable>
  );
}

function StatusBadge({ status }) {
  return (
    <View
      style={{
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#E8C9AA',
        backgroundColor: '#FFF3E8',
        paddingHorizontal: 10,
        height: 20,
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 9, color: BROWN, fontWeight: '600' }}>{status}</Text>
    </View>
  );
}

function AlertCard({ item, onPrimary, onSecondary }) {
  const fullWidthButton = item.buttons.length === 1;
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row' }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: BROWN,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Ionicons name={item.icon} size={15} color="#fff" />
        </View>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: 13, fontWeight: '700', color: INK }}>{item.title}</Text>
            <StatusBadge status={item.status} />
          </View>
          <Text style={{ fontSize: 9, color: MUTED, marginTop: 3 }}>{item.branch}</Text>
          <Text style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{item.detail}</Text>
          <Text style={{ fontSize: 8, lineHeight: 12, color: MUTED, marginTop: 4 }}>{item.body}</Text>

          {!fullWidthButton ? (
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <Pressable
                onPress={onPrimary}
                style={{
                  backgroundColor: BROWN,
                  paddingHorizontal: 16,
                  height: 24,
                  borderRadius: 12,
                  justifyContent: 'center',
                  marginRight: 8,
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '600', color: '#fff' }}>{item.buttons[0]}</Text>
              </Pressable>
              <Pressable
                onPress={onSecondary}
                style={{
                  backgroundColor: SOFT,
                  paddingHorizontal: 16,
                  height: 24,
                  borderRadius: 12,
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '600', color: INK }}>{item.buttons[1]}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      {fullWidthButton ? (
        <Pressable
          onPress={onPrimary}
          style={{
            backgroundColor: BROWN,
            height: 28,
            borderRadius: 14,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 12,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{item.buttons[0]}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/* ---------- Screen ---------- */
export default function AlertsTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState('All');
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  // Tapping a card button marks the alert as acknowledged (read)
  function acknowledge(id) {
    setAlerts((current) =>
      current.map((a) => (a.id === id ? { ...a, status: 'Acknowledged', actionRequired: false } : a))
    );
  }

  const visible = alerts.filter((a) => {
    if (filter === 'Unread') return a.status === 'Unread';
    if (filter === 'Action Required') return a.actionRequired;
    return true;
  });

  const stats = [
    { label: 'All Alerts', value: String(alerts.length) },
    { label: 'Unread', value: String(alerts.filter((a) => a.status === 'Unread').length) },
    { label: 'Action Needed', value: String(alerts.filter((a) => a.actionRequired).length) },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 110,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => navigation.navigate('Home')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="chevron-back" size={18} color={INK} />
            </Pressable>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: INK }}>Alerts</Text>
              <Text style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>UAE Region · Regional Admin</Text>
            </View>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="notifications-outline" size={18} color={BROWN} />
            </View>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            {stats.map((s, i) => (
              <View key={s.label} style={{ flex: 1, marginRight: i < stats.length - 1 ? 10 : 0, flexDirection: 'row' }}>
                <StatCard label={s.label} value={s.value} />
              </View>
            ))}
          </View>

          {/* Filters */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            {FILTERS.map((f) => (
              <FilterPill key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
            ))}
          </View>

          {/* Today */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: INK }}>Today</Text>
            <Text style={{ fontSize: 10, color: MUTED }}>Newest first</Text>
          </View>

          {visible.length === 0 ? (
            <Text style={{ textAlign: 'center', fontSize: 12, color: MUTED, marginTop: 30 }}>No alerts to show.</Text>
          ) : (
            visible.map((item) => (
              <AlertCard
                key={item.id}
                item={item}
                onPrimary={() => acknowledge(item.id)}
                onSecondary={() => acknowledge(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <BottomTabBar active="Alerts" />
    </View>
  );
}