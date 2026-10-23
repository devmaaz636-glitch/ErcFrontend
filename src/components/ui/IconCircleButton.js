import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { scale as s } from '../../utils/responsive';

export default function IconCircleButton({
  name = 'chevron-back',
  onPress,
  color = colors.ink,
  backgroundColor = colors.card,
  size = 36,
  iconSize,
  accessibilityLabel,
}) {
  const dim = s(size);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={{
        width: dim,
        height: dim,
        borderRadius: dim / 2,
        backgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={name} size={iconSize ?? s(18)} color={color} />
    </Pressable>
  );
}
