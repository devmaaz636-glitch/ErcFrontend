import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import IconCircleButton from './ui/IconCircleButton';
import { useSession } from '../context/SessionContext';
import { colors } from '../theme';
import { scale as s, fs } from '../utils/responsive';

export const ADMIN_REGIONS = [
  { id: 'usa', name: 'USA', code: '78690', flag: '🇺🇸', short: 'USA' },
  { id: 'uae', name: 'United Arab Emirates', code: '97100', flag: '🇦🇪', short: 'UAE' },
  { id: 'ksa', name: 'Saudi Arabia', code: '96600', flag: '🇸🇦', short: 'KSA' },
  { id: 'om', name: 'Oman', code: '96800', flag: '🇴🇲', short: 'Oman' },
  { id: 'pk', name: 'Pakistan', code: '92000', flag: '🇵🇰', short: 'Pakistan' },
];

function matchRegion(label) {
  const value = String(label || '').trim().toLowerCase();
  if (!value) return ADMIN_REGIONS[1];
  return (
    ADMIN_REGIONS.find(
      (item) =>
        item.short.toLowerCase() === value ||
        item.name.toLowerCase() === value ||
        item.id === value ||
        item.name.toLowerCase().includes(value) ||
        value.includes(item.short.toLowerCase()) ||
        value.includes(item.id)
    ) || null
  );
}

function RegionMenu({ open, active, onSelect, align = 'left' }) {
  if (!open) return null;
  return (
    <View
      style={{
        position: 'absolute',
        top: s(40),
        ...(align === 'right' ? { right: 0 } : { left: 0 }),
        width: s(220),
        zIndex: 60,
        backgroundColor: colors.card,
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#1A1410',
        shadowOpacity: 0.12,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }}
    >
      {ADMIN_REGIONS.map((item, index) => {
        const selected = active?.id === item.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(item)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: s(12),
              paddingVertical: s(11),
              backgroundColor: selected ? colors.brandSoft : colors.card,
              borderTopWidth: index === 0 ? 0 : 1,
              borderTopColor: 'rgba(26,20,16,0.06)',
            }}
          >
            <Text style={{ fontSize: fs(15), marginRight: s(10) }}>{item.flag}</Text>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: fs(12),
                  fontWeight: selected ? '700' : '600',
                  color: colors.ink,
                }}
                numberOfLines={1}
              >
                {item.short}
              </Text>
              <Text style={{ fontSize: fs(9), color: colors.mutedBrand, marginTop: 2 }} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            {selected ? <Ionicons name="checkmark-circle" size={s(16)} color={colors.brand} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * Home-style region chip (flag + short name) with dropdown.
 */
export function RegionLabelButton({ color = colors.brand, compact = false }) {
  const { displayRegion, setRegion } = useSession();
  const [open, setOpen] = useState(false);
  const active = useMemo(() => matchRegion(displayRegion), [displayRegion]);
  const label = active?.short || displayRegion || 'Region';

  async function selectRegion(next) {
    setOpen(false);
    if (!next || active?.id === next.id) return;
    await setRegion({ ...next, name: next.short });
  }

  return (
    <View style={{ position: 'relative', zIndex: 40 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Switch region"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        hitSlop={6}
        style={{ flexDirection: 'row', alignItems: 'center' }}
      >
        <Ionicons name="location-sharp" size={s(compact ? 10 : 11)} color={color} />
        <Text
          style={{
            fontSize: fs(compact ? 9 : 11),
            color: colors.mutedBrand,
            marginLeft: 2,
            fontWeight: '600',
          }}
          numberOfLines={1}
        >
          {active?.flag ? `${active.flag} ` : ''}
          {label}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={s(compact ? 10 : 11)}
          color={colors.mutedBrand}
          style={{ marginLeft: 2 }}
        />
      </Pressable>
      <RegionMenu open={open} active={active} onSelect={selectRegion} align="left" />
    </View>
  );
}

/**
 * Globe icon button with region dropdown — use beside NotificationBellButton on admin tabs.
 */
export function RegionGlobeButton({ color = colors.brand }) {
  const { displayRegion, setRegion } = useSession();
  const [open, setOpen] = useState(false);
  const active = useMemo(() => matchRegion(displayRegion), [displayRegion]);

  async function selectRegion(next) {
    setOpen(false);
    if (!next || active?.id === next.id) return;
    await setRegion({ ...next, name: next.short });
  }

  return (
    <View style={{ position: 'relative', zIndex: 40 }}>
      <IconCircleButton
        name="globe-outline"
        color={color}
        size={36}
        iconSize={s(17)}
        accessibilityLabel="Switch region"
        onPress={() => setOpen((v) => !v)}
      />
      <RegionMenu open={open} active={active} onSelect={selectRegion} align="right" />
    </View>
  );
}

export function useActiveRegionLabel() {
  const { displayRegion } = useSession();
  const active = useMemo(() => matchRegion(displayRegion), [displayRegion]);
  return active?.short || displayRegion || 'Region';
}
