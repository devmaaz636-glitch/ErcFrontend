import { ActivityIndicator, Pressable } from 'react-native';
import Text from '../AppText';
import { colors, radius } from '../../theme';
import { BRAND_BG } from '../../theme/brandButton';
import { scale as s, fs } from '../../utils/responsive';

/** Global primary CTA — always #BF824F fill, white centered label, pill radius. */
export default function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  style,
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          height: s(48),
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
            fontSize: fs(14),
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
