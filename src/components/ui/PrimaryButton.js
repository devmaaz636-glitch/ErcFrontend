import { ActivityIndicator, Pressable } from 'react-native';
import Text from '../AppText';
import { colors, radius } from '../../theme';
import { BRAND_BG } from '../../theme/brandButton';
import { scale as s, fs } from '../../utils/responsive';

const SIZES = {
  md: { height: s(48), fontSize: fs(14) },
  /** Card CTAs (Review Request / Review History, View Patient Record, etc.) */
  sm: { height: s(34), fontSize: fs(11) },
};

/** Global primary CTA — always #BF824F fill, white centered label, pill radius. */
export default function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  size = 'md',
  style,
}) {
  const preset = SIZES[size] || SIZES.md;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          height: preset.height,
          borderRadius: radius.round,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
        // Force global brand last so section CTAs never lose #BF824F.
        { backgroundColor: BRAND_BG },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text
          style={{
            fontSize: preset.fontSize,
            fontWeight: '600',
            color: colors.white,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
