import { View } from 'react-native';
import Text from '../AppText';
import { colors } from '../../theme';
import { scale as s, fs } from '../../utils/responsive';

const PRESETS = {
  upcoming: { label: 'Upcoming', color: colors.white, bg: colors.brand },
  confirmed: { label: 'Confirmed', color: colors.success, bg: colors.successBg },
  completed: { label: 'Completed', color: colors.brand, bg: colors.warningBg },
  canceled: { label: 'Canceled', color: colors.danger, bg: colors.dangerBg },
  paid: { label: 'Paid', color: colors.success, bg: colors.successBg },
  pending: { label: 'Pending', color: colors.brand, bg: colors.warningBg },
  refunded: { label: 'Refunded', color: colors.danger, bg: colors.dangerBg },
  active: { label: 'Active', color: colors.success, bg: colors.successBg },
  inactive: { label: 'Inactive', color: colors.danger, bg: colors.dangerBg },
  booked: { label: 'Booked', color: colors.success, bg: colors.successBg },
  invited: { label: 'Invited', color: colors.brand, bg: colors.warningBg },
};

export default function StatusBadge({ status, label, color, bg, featured }) {
  const preset = PRESETS[String(status || '').toLowerCase()] || {};
  const text = label || preset.label || status || '—';
  const textColor = featured ? colors.white : color || preset.color || colors.ink;
  const background = featured ? 'rgba(255,255,255,0.25)' : bg || preset.bg || colors.fieldAlt;

  return (
    <View
      style={{
        backgroundColor: background,
        borderRadius: 10,
        paddingHorizontal: s(10),
        height: s(20),
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: fs(8, 8), fontWeight: '600', color: textColor }}>{text}</Text>
    </View>
  );
}

export { PRESETS as STATUS_PRESETS };
