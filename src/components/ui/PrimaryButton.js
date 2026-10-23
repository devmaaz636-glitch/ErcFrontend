import { ActivityIndicator, Pressable } from 'react-native';
import Text from '../AppText';
import { colors, radius } from '../../theme';
import { scale as s, fs } from '../../utils/responsive';

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
          backgroundColor: colors.brand,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled || loading ? 0.6 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.white} />
      ) : (
        <Text style={{ fontSize: fs(14), fontWeight: '700', color: colors.white }}>{label}</Text>
      )}
    </Pressable>
  );
}
