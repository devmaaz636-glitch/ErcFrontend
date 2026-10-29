import { useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useNotifications } from '../../context/NotificationsContext';
import { colors } from '../../theme';
import { scale as s } from '../../utils/responsive';

/**
 * Shared header bell — always shows the same live unread count
 * from NotificationsContext on every screen (tabs + nested).
 */
export default function NotificationBellButton({
  color = colors.brand,
  backgroundColor = colors.card,
  size = 36,
  iconSize,
  onPress,
}) {
  const navigation = useNavigation();
  const { unreadCount, refresh } = useNotifications();
  const dim = s(size);
  const count = Number(unreadCount) || 0;
  const badgeSize = Math.max(s(18), 16);

  // Re-sync when this screen/tab is focused so the badge never goes stale.
  useFocusEffect(
    useCallback(() => {
      refresh?.().catch(() => {});
    }, [refresh])
  );

  return (
    <View style={{ width: dim, height: dim, overflow: 'visible' }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          count > 0 ? `Notifications, ${count} unread` : 'Notifications'
        }
        hitSlop={8}
        onPress={onPress || (() => navigation.navigate('Notifications'))}
        style={{
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          backgroundColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="notifications-outline" size={iconSize ?? s(18)} color={color} />
      </Pressable>
      {count > 0 ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
            backgroundColor: colors.danger,
            borderWidth: 1.5,
            borderColor: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
            zIndex: 10,
            elevation: 4,
          }}
        >
          <Text
            style={{
              color: '#fff',
              fontSize: s(9),
              fontWeight: '800',
              lineHeight: s(11),
              includeFontPadding: false,
            }}
          >
            {count > 9 ? '9+' : String(count)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
