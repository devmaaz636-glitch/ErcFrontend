import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BottomTabBar from '../components/BottomTabBar';

const BROWN = '#BF824F';
const GREEN = '#00AD28';
const INK = '#1F1B16';
const MUTED = '#8D8680';
const BG = '#FFF8F1';

// one branch per region (static demo data)
// revenueUsd is only used for ranking, so branches in different currencies sort fairly
const BRANCHES = [
  { id: 'uae', name: 'Enfield Royal Clinic', city: 'Dubai',    region: 'UAE',      currency: 'AED', decimals: 2, revenue: 89000,   revenueUsd: 24230, bookings: 640, growth: 32.2, progress: 0.86, status: 'active' },
  { id: 'ksa', name: 'Enfield Royal Clinic', city: 'Riyadh',   region: 'KSA',      currency: 'SAR', decimals: 2, revenue: 84000,   revenueUsd: 22400, bookings: 598, growth: 28.4, progress: 0.78, status: 'active' },
  { id: 'om',  name: 'Enfield Royal Clinic', city: 'Muscat',   region: 'Oman',     currency: 'OMR', decimals: 3, revenue: 9200,    revenueUsd: 23900, bookings: 355, growth: 12.6, progress: 0.52, status: 'attention' },
  { id: 'pk',  name: 'Enfield Royal Clinic', city: 'Lahore',   region: 'Pakistan', currency: 'PKR', decimals: 2, revenue: 6800000, revenueUsd: 24400, bookings: 720, growth: 24.9, progress: 0.7,  status: 'active' },
  { id: 'usa', name: 'Enfield Royal Clinic', city: 'Houston',  region: 'USA',      currency: 'USD', decimals: 2, revenue: 31000,   revenueUsd: 31000, bookings: 810, growth: 35.1, progress: 0.94, status: 'active' },
];

// one helper for money; OMR needs 3 decimals
function formatMoney(amount, decimals, currency) {
  const fixed = amount.toFixed(decimals);
  const [whole, frac] = fixed.split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${withCommas}${frac ? '.' + frac : ''} ${currency}`;
}


function StatCard({ label, value, sub }) {
  return (
    <View style={{ flex: 1, backgroundColor: BROWN, borderRadius: 14, padding: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: '#fff' }}>{label}</Text>
        <Ionicons name="business-outline" size={12} color="#F5DFC8" />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: '#fff' }}>{value}</Text>
        <Text style={{ fontSize: 9, color: '#F5DFC8', marginLeft: 4, marginBottom: 4 }}>Clinics</Text>
      </View>
      <Text style={{ fontSize: 8, color: '#F5DFC8', marginTop: 4 }}>{sub}</Text>
    </View>
  );
}

function BranchCard({ item, mode }) {
  return (
    <View
      style={{
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 8,
        marginBottom: 12,
        flexDirection: 'row',
      }}
    >
      <Image
        source={require('../../assets/brachtabimage.png')}
        contentFit="cover"
        style={{ width: 78, height: 84, borderRadius: 10 }}
      />

      <View style={{ flex: 1, marginLeft: 10, paddingVertical: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: '700', color: INK }} numberOfLines={1}>
            {item.city} {item.name}
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#E6F7EA',
              borderRadius: 9,
              paddingHorizontal: 7,
              height: 18,
              marginLeft: 6,
            }}
          >
            <Text style={{ fontSize: 8, fontWeight: '600', color: GREEN, marginRight: 3 }}>{item.growth}%</Text>
            <Ionicons name="trending-up" size={9} color={GREEN} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
          <Ionicons name="location-outline" size={10} color={MUTED} />
          <Text style={{ fontSize: 9, color: MUTED, marginLeft: 3 }}>
            {item.city} · {item.region}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            {mode === 'revenue' ? (
              <View style={{ flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: BROWN }}>
                  {formatMoney(item.revenue, item.decimals, item.currency)}
                </Text>
                <Text style={{ fontSize: 7, color: MUTED, marginLeft: 4 }}>( This Month Revenue )</Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: BROWN }}>{item.bookings}</Text>
                <Text style={{ fontSize: 7, color: MUTED, marginLeft: 4 }}>( This Month Bookings )</Text>
              </View>
            )}
          </View>
          <View style={{ width: 64, alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 7, color: MUTED, marginBottom: 3 }}>{Math.round(item.progress * 100)}%</Text>
            <View style={{ width: '100%', height: 4, borderRadius: 2, backgroundColor: '#F1E7DD' }}>
              <View
                style={{ width: `${item.progress * 100}%`, height: 4, borderRadius: 2, backgroundColor: BROWN }}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

/* ---------- Screen ---------- */
export default function BranchesTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState('revenue'); // 'revenue' | 'bookings'
  const [query, setQuery] = useState('');

  const total = BRANCHES.length;
  const active = BRANCHES.filter((b) => b.status === 'active').length;
  const attention = BRANCHES.filter((b) => b.status === 'attention').length;

  const q = query.trim().toLowerCase();
  const list = BRANCHES.filter(
    (b) => !q || `${b.city} ${b.region} ${b.name}`.toLowerCase().includes(q)
  ).sort((a, b) => (mode === 'revenue' ? b.revenueUsd - a.revenueUsd : b.bookings - a.bookings));

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
            <Text style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '700', color: INK }}>Branches</Text>
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

          {/* Search */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 46,
              borderRadius: 23,
              backgroundColor: '#fff',
              paddingLeft: 18,
              paddingRight: 14,
              marginTop: 18,
            }}
          >
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search Here"
              placeholderTextColor={MUTED}
              style={{ flex: 1, fontSize: 12, color: INK }}
            />
            <Ionicons name="search" size={18} color={MUTED} />
          </View>

          {/* Stat cards */}
          <View style={{ flexDirection: 'row', marginTop: 16 }}>
            <StatCard label="Total" value={String(total).padStart(2, '0')} sub="100% Assigned" />
            <View style={{ width: 10 }} />
            <StatCard label="Active" value={String(active).padStart(2, '0')} sub="100% Assigned" />
            <View style={{ width: 10 }} />
            <StatCard label="Attention" value={String(attention).padStart(2, '0')} sub="100% Assigned" />
          </View>

          {/* Rank ledger */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 10 }}>
            <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: INK }}>Rank Ledger By</Text>
            <Text style={{ fontSize: 10, color: BROWN }}>See All</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              backgroundColor: '#fff',
              borderRadius: 22,
              padding: 4,
              marginBottom: 14,
            }}
          >
            {[
              { key: 'revenue', label: 'By Revenue' },
              { key: 'bookings', label: 'By Bookings' },
            ].map((t) => {
              const on = mode === t.key;
              return (
                <Pressable
                  key={t.key}
                  accessibilityRole="button"
                  onPress={() => setMode(t.key)}
                  style={{
                    flex: 1,
                    height: 32,
                    borderRadius: 16,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: on ? BROWN : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '600', color: on ? '#fff' : MUTED }}>{t.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Branch list */}
          {list.length === 0 ? (
            <Text style={{ textAlign: 'center', fontSize: 12, color: MUTED, marginTop: 30 }}>No branches found.</Text>
          ) : (
            list.map((item) => <BranchCard key={item.id} item={item} mode={mode} />)
          )}
        </View>
      </ScrollView>

      <BottomTabBar active="Branches" />
    </View>
  );
}