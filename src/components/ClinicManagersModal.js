import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { StatusBadge } from './ui';
import { clinicErrorMessage, fetchManager } from '../lib/clinic';
import { colors } from '../theme';
import { scale as s, fs } from '../utils/responsive';

function initials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return 'CM';
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function DetailRow({ icon, label, value, last }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: s(12),
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: 'rgba(26,20,16,0.06)',
      }}
    >
      <View
        style={{
          width: s(34),
          height: s(34),
          borderRadius: 10,
          backgroundColor: colors.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(12),
        }}
      >
        <Ionicons name={icon} size={s(15)} color={colors.brand} />
      </View>
      <View style={{ flex: 1, marginRight: s(8) }}>
        <Text style={{ fontSize: fs(9), color: colors.desc }}>{label}</Text>
        <Text
          style={{ fontSize: fs(12), fontWeight: '600', color: colors.ink, marginTop: 2 }}
          numberOfLines={2}
        >
          {value || '—'}
        </Text>
      </View>
    </View>
  );
}

function MetricTile({ icon, label, value }) {
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: colors.background,
        borderRadius: 14,
        padding: s(12),
        marginBottom: s(10),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Ionicons name={icon} size={s(13)} color={colors.brand} />
        <Text style={{ fontSize: fs(8), color: colors.desc, marginLeft: 5 }} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text style={{ fontSize: fs(18), fontWeight: '700', color: colors.ink, marginTop: s(8) }}>
        {value}
      </Text>
    </View>
  );
}

function ManagerListRow({ item, onPress }) {
  const location =
    [item.clinic?.city, item.clinic?.region].filter(Boolean).join(', ') ||
    item.clinic?.name ||
    'Unassigned clinic';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: pressed ? colors.brandSoft : colors.card,
        borderRadius: 16,
        padding: s(14),
        marginBottom: s(10),
        borderWidth: 1,
        borderColor: 'rgba(191,130,79,0.12)',
      })}
    >
      <View
        style={{
          width: s(48),
          height: s(48),
          borderRadius: s(24),
          backgroundColor: colors.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(12),
        }}
      >
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.brand }}>
          {initials(item.name)}
        </Text>
      </View>
      <View style={{ flex: 1, marginRight: s(8) }}>
        <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={{ fontSize: fs(9), color: colors.desc, marginTop: 3 }} numberOfLines={1}>
          {location}
        </Text>
        <Text style={{ fontSize: fs(9), color: colors.brand, marginTop: 3, fontWeight: '600' }}>
          {item.appointmentsToday ?? 0} appointments today
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <StatusBadge status={item.status || 'active'} />
        <Ionicons
          name="chevron-forward"
          size={s(16)}
          color={colors.mutedBrand}
          style={{ marginTop: s(8) }}
        />
      </View>
    </Pressable>
  );
}

/**
 * Bottom-sheet style modal for clinic managers directory + detail.
 * mode: 'list' | 'detail'
 */
export default function ClinicManagersModal({
  visible,
  onClose,
  mode = 'list',
  managers = [],
  selectedManager = null,
  stats = null,
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [view, setView] = useState(mode === 'detail' ? 'detail' : 'list');
  const [active, setActive] = useState(selectedManager);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sheetMax = Math.min(height * 0.88, 720);

  useEffect(() => {
    if (!visible) return;
    setView(mode === 'detail' ? 'detail' : 'list');
    setActive(selectedManager);
    setError('');
  }, [visible, mode, selectedManager]);

  useEffect(() => {
    if (!visible || view !== 'detail' || !active?.id) return undefined;
    let alive = true;
    setLoading(true);
    fetchManager(active.id)
      .then((item) => {
        if (alive && item) {
          setActive((prev) => ({ ...prev, ...item }));
          setError('');
        }
      })
      .catch((err) => {
        if (alive) setError(clinicErrorMessage(err));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [visible, view, active?.id]);

  const directory = useMemo(() => {
    return [...(managers || [])].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''))
    );
  }, [managers]);

  function openDetail(item) {
    setActive(item);
    setView('detail');
    setError('');
  }

  function backToList() {
    if (mode === 'detail' && !directory.length) {
      onClose?.();
      return;
    }
    setView('list');
    setActive(null);
    setError('');
  }

  const clinic = active?.clinic;
  const location = [clinic?.city, clinic?.region].filter(Boolean).join(', ');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(26,20,16,0.45)' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Dismiss" />

        <View
          style={{
            maxHeight: sheetMax,
            backgroundColor: colors.card,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: Math.max(insets.bottom, 16),
            overflow: 'hidden',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: s(10), paddingBottom: s(6) }}>
            <View
              style={{
                width: s(42),
                height: 4,
                borderRadius: 2,
                backgroundColor: 'rgba(26,20,16,0.12)',
              }}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: s(18),
              paddingBottom: s(12),
            }}
          >
            {view === 'detail' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={backToList}
                hitSlop={10}
                style={{
                  width: s(36),
                  height: s(36),
                  borderRadius: s(18),
                  backgroundColor: colors.brandSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: s(10),
                }}
              >
                <Ionicons name="chevron-back" size={s(18)} color={colors.brand} />
              </Pressable>
            ) : null}

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(17), fontWeight: '700', color: colors.heading }}>
                {view === 'detail' ? 'Manager Profile' : 'Clinic Managers'}
              </Text>
              <Text style={{ fontSize: fs(10), color: colors.desc, marginTop: 2 }}>
                {view === 'detail'
                  ? active?.role || 'Clinic Manager'
                  : `${directory.length} regional clinic managers`}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              hitSlop={10}
              style={{
                width: s(36),
                height: s(36),
                borderRadius: s(18),
                backgroundColor: colors.fieldAlt,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={s(18)} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: s(18), paddingBottom: s(12) }}
          >
            {view === 'list' ? (
              <>
                {stats?.cards?.length ? (
                  <View style={{ flexDirection: 'row', marginBottom: s(14) }}>
                    {stats.cards.slice(0, 3).map((card, index) => (
                      <View
                        key={card.id}
                        style={{
                          flex: 1,
                          marginLeft: index === 0 ? 0 : s(8),
                          backgroundColor: colors.background,
                          borderRadius: 14,
                          padding: s(12),
                        }}
                      >
                        <Text style={{ fontSize: fs(9), color: colors.desc }} numberOfLines={1}>
                          {card.label}
                        </Text>
                        <Text
                          style={{
                            fontSize: fs(18),
                            fontWeight: '700',
                            color: colors.ink,
                            marginTop: 4,
                          }}
                        >
                          {card.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {directory.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: s(40) }}>
                    <Ionicons name="people-outline" size={s(32)} color={colors.muted} />
                    <Text style={{ fontSize: fs(12), color: colors.desc, marginTop: 10 }}>
                      No clinic managers found
                    </Text>
                  </View>
                ) : (
                  directory.map((item) => (
                    <ManagerListRow key={item.id} item={item} onPress={openDetail} />
                  ))
                )}
              </>
            ) : (
              <>
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 20,
                    padding: s(18),
                    alignItems: 'center',
                    marginBottom: s(14),
                  }}
                >
                  <View
                    style={{
                      width: s(76),
                      height: s(76),
                      borderRadius: s(38),
                      backgroundColor: colors.brandSoft,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 2,
                      borderColor: 'rgba(191,130,79,0.25)',
                    }}
                  >
                    <Text style={{ fontSize: fs(22), fontWeight: '700', color: colors.brand }}>
                      {initials(active?.name)}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: fs(17),
                      fontWeight: '700',
                      color: colors.ink,
                      marginTop: s(12),
                      textAlign: 'center',
                    }}
                  >
                    {active?.name || 'Clinic Manager'}
                  </Text>
                  <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 4 }}>
                    {active?.employeeId || '—'}
                    {location ? ` · ${location}` : ''}
                  </Text>
                  <View style={{ marginTop: s(10) }}>
                    <StatusBadge status={active?.status || 'active'} />
                  </View>
                  {loading ? (
                    <ActivityIndicator color={colors.brand} style={{ marginTop: s(12) }} />
                  ) : null}
                </View>

                {error ? (
                  <Text
                    style={{
                      fontSize: fs(11),
                      color: colors.danger,
                      textAlign: 'center',
                      marginBottom: s(10),
                    }}
                  >
                    {error}
                  </Text>
                ) : null}

                <Text
                  style={{
                    fontSize: fs(13),
                    fontWeight: '700',
                    color: colors.heading,
                    marginBottom: s(8),
                  }}
                >
                  Performance
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                  }}
                >
                  <MetricTile
                    icon="calendar-outline"
                    label="Appts today"
                    value={String(active?.appointmentsToday ?? 0)}
                  />
                  <MetricTile
                    icon="people-outline"
                    label="Patients / mo"
                    value={String(active?.patientsThisMonth ?? 0)}
                  />
                  <MetricTile
                    icon="medkit-outline"
                    label="Staff"
                    value={String(active?.staffCount ?? 0)}
                  />
                  <MetricTile
                    icon="star-outline"
                    label="Rating"
                    value={active?.rating != null ? String(active.rating) : '—'}
                  />
                </View>

                <Text
                  style={{
                    fontSize: fs(13),
                    fontWeight: '700',
                    color: colors.heading,
                    marginTop: s(6),
                    marginBottom: s(4),
                  }}
                >
                  Contact & Clinic
                </Text>
                <View
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: 16,
                    paddingHorizontal: s(12),
                    marginBottom: s(8),
                  }}
                >
                  <DetailRow icon="mail-outline" label="Email" value={active?.email} />
                  <DetailRow icon="call-outline" label="Phone" value={active?.phone} />
                  <DetailRow
                    icon="business-outline"
                    label="Assigned clinic"
                    value={clinic?.name || 'Unassigned'}
                  />
                  <DetailRow
                    icon="location-outline"
                    label="Region"
                    value={
                      [clinic?.city, clinic?.region, clinic?.address].filter(Boolean).join(' · ') ||
                      '—'
                    }
                  />
                  <DetailRow
                    icon="calendar-outline"
                    label="Joined"
                    value={active?.joinedAt}
                    last
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
