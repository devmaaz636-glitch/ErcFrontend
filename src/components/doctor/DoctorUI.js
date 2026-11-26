import { ActivityIndicator, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../AppText';
import { colors, shadows } from '../../theme';
import { fs, scale as s } from '../../utils/responsive';

export const STATUS_CHIPS = {
  pending: { label: 'Pending', bg: colors.warningBg, color: colors.brand },
  upcoming: { label: 'Confirmed', bg: '#EDE8F8', color: '#6B5CA5' },
  completed: { label: 'Completed', bg: colors.successBg, color: colors.success },
  canceled: { label: 'Canceled', bg: colors.dangerBg, color: colors.danger },
  due: { label: 'Due', bg: '#FBE8D8', color: '#E39B4B' },
};

export const cardStyle = {
  backgroundColor: colors.card,
  borderRadius: 16,
  padding: s(14),
  ...shadows.card,
};

export function StatusChip({ status }) {
  const tone = STATUS_CHIPS[status] || STATUS_CHIPS.pending;
  return (
    <View style={{ backgroundColor: tone.bg, borderRadius: 999, paddingHorizontal: s(10), paddingVertical: s(4) }}>
      <Text style={{ color: tone.color, fontSize: fs(10), fontWeight: '600' }}>{tone.label}</Text>
    </View>
  );
}

export function Avatar({ size = 44 }) {
  return (
    <View
      style={{
        width: s(size),
        height: s(size),
        borderRadius: s(size) / 2,
        backgroundColor: '#F6E6D6',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name="person-outline" size={s(size * 0.46)} color={colors.brand} />
    </View>
  );
}

/** Loading, error and empty states in one place so no screen invents data. */
export function StateNotice({ loading, error, empty, onRetry }) {
  if (loading) return <ActivityIndicator color={colors.brand} style={{ marginTop: s(24) }} />;
  if (!error && !empty) return null;
  return (
    <View style={[cardStyle, { marginTop: s(12), alignItems: 'center' }]}>
      <Text style={{ fontSize: fs(12), color: error ? colors.danger : colors.desc, textAlign: 'center' }}>
        {error || empty}
      </Text>
      {error && onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} hitSlop={8} style={{ marginTop: s(10) }}>
          <Text style={{ fontSize: fs(12), fontWeight: '700', color: colors.brand }}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PersonCard({ name, line, subline, status, onPress, children }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[cardStyle, { marginTop: s(12) }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Avatar />
        <View style={{ flex: 1, marginLeft: s(10), marginRight: s(8) }}>
          <Text style={{ fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
            {name}
          </Text>
          <Text style={{ marginTop: 2, fontSize: fs(11), color: colors.desc }} numberOfLines={1}>
            {line}
          </Text>
          {subline ? (
            <Text style={{ marginTop: 2, fontSize: fs(10), color: colors.muted }} numberOfLines={1}>
              {subline}
            </Text>
          ) : null}
        </View>
        {status ? <StatusChip status={status} /> : null}
      </View>
      {children}
    </Pressable>
  );
}

export function FilterChips({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: s(8), marginTop: s(14) }}>
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.key)}
            style={{
              paddingHorizontal: s(14),
              paddingVertical: s(8),
              borderRadius: 999,
              backgroundColor: active ? colors.brand : colors.card,
            }}
          >
            <Text style={{ fontSize: fs(11), fontWeight: '600', color: active ? colors.white : colors.ink }}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
