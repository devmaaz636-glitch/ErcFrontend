import { Pressable, Text, View } from 'react-native';
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
  badgeCount = 0,
}) {
  const dim = s(size);
  const count = Number(badgeCount) || 0;
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          count > 0 ? `${accessibilityLabel || name}, ${count} unread` : accessibilityLabel
        }
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
      {count > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            minWidth: s(16),
            height: s(16),
            borderRadius: s(8),
            backgroundColor: colors.danger,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ color: '#fff', fontSize: s(8), fontWeight: '700', lineHeight: s(10) }}>
            {count > 9 ? '9+' : String(count)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
