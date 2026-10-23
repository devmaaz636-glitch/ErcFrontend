import { useCallback, useMemo } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../components/AppText';
import { IconCircleButton, SkeletonRow } from '../components/ui';
import { useNotifications } from '../context/NotificationsContext';
import { colors } from '../theme';
import { scale as s, fs, useTopPadding } from '../utils/responsive';

const TYPE_ICON = {
  profileChanges: 'person-outline',
  passwordChanges: 'lock-closed-outline',
  bookingUpdates: 'calendar-outline',
  refund: 'cash-outline',
  accountRequests: 'person-add-outline',
  appointmentsThreshold: 'alert-circle-outline',
  revenueThreshold: 'trending-up-outline',
  capacityThreshold: 'people-outline',
  booking: 'calendar-outline',
  push: 'notifications-outline',
};

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function NotificationCard({ item, onPress }) {
  const unread = !item.read;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${unread ? 'Unread. ' : ''}Tap to dismiss.`}
      style={{
        backgroundColor: colors.card,
        borderRadius: 14,
        paddingVertical: s(12),
        paddingHorizontal: s(12),
        marginBottom: s(10),
        flexDirection: 'row',
        alignItems: 'flex-start',
        opacity: unread ? 1 : 0.55,
        borderWidth: unread ? 1 : 0,
        borderColor: unread ? colors.brandMuted : 'transparent',
      }}
    >
      <View
        style={{
          width: s(36),
          height: s(36),
          borderRadius: s(18),
          backgroundColor: unread ? colors.brand : colors.brandSoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: s(12),
        }}
      >
        <Ionicons
          name={TYPE_ICON[item.type] || 'notifications-outline'}
          size={s(16)}
          color={unread ? '#fff' : colors.brand}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ flex: 1, fontSize: fs(13), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
            {item.title}
          </Text>
          {unread ? (
            <View
              style={{
                width: s(8),
                height: s(8),
                borderRadius: s(4),
                backgroundColor: colors.danger,
                marginLeft: s(8),
              }}
            />
          ) : null}
        </View>
        {item.body ? (
          <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 4, lineHeight: 16 }} numberOfLines={3}>
            {item.body}
          </Text>
        ) : null}
        <Text style={{ fontSize: fs(10), color: colors.muted, marginTop: 6 }}>
          {formatWhen(item.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const topPad = useTopPadding(24);
  const { feed, unreadCount, ready, markRead, markAllRead, refresh, live } = useNotifications();

  useFocusEffect(
    useCallback(() => {
      refresh?.().catch(() => {});
    }, [refresh])
  );

  // Only unread — tapping a row marks it read and hides it from this list.
  const visible = useMemo(() => feed.filter((i) => !i.read), [feed]);

  const showSkeleton = !ready && feed.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: s(20),
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          alignItems: 'center',
        }}
      >
        <View style={{ width: '100%', maxWidth: 480 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconCircleButton
              name="chevron-back"
              color={colors.ink}
              accessibilityLabel="Go back"
              onPress={() => navigation.goBack()}
            />
            <Text
              style={{
                flex: 1,
                textAlign: 'center',
                marginHorizontal: s(8),
                fontSize: fs(16),
                fontWeight: '700',
                color: colors.ink,
              }}
              numberOfLines={1}
            >
              Notifications
            </Text>
            <IconCircleButton
              name="notifications-outline"
              color={colors.brand}
              accessibilityLabel="Notifications"
              badgeCount={unreadCount}
            />
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: s(22),
              marginBottom: s(12),
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: fs(15), fontWeight: '700', color: colors.ink }}>
                Recent Activity
              </Text>
              <Text style={{ fontSize: fs(11), color: colors.desc, marginTop: 4 }}>
                {live ? '● Live' : 'Updates sync in the background'}
                {unreadCount > 0 ? ` · ${unreadCount} unread` : ''}
              </Text>
            </View>
            {unreadCount > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => markAllRead()}
                hitSlop={8}
                style={{
                  paddingHorizontal: s(12),
                  paddingVertical: s(8),
                  borderRadius: 999,
                  backgroundColor: colors.brandSoft,
                }}
              >
                <Text style={{ fontSize: fs(11), fontWeight: '600', color: colors.brand }}>
                  Clear all
                </Text>
              </Pressable>
            ) : null}
          </View>

          {showSkeleton ? (
            <>
              <SkeletonRow lines={2} avatar />
              <SkeletonRow lines={2} avatar />
              <SkeletonRow lines={2} avatar />
            </>
          ) : null}

          {!showSkeleton && visible.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: s(48) }}>
              <View
                style={{
                  width: s(56),
                  height: s(56),
                  borderRadius: s(28),
                  backgroundColor: colors.brandSoft,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: s(12),
                }}
              >
                <Ionicons name="notifications-off-outline" size={s(24)} color={colors.brand} />
              </View>
              <Text style={{ fontSize: fs(14), fontWeight: '600', color: colors.ink }}>
                You're all caught up
              </Text>
              <Text
                style={{
                  fontSize: fs(11),
                  color: colors.desc,
                  marginTop: 6,
                  textAlign: 'center',
                  lineHeight: 16,
                  paddingHorizontal: s(24),
                }}
              >
                New admin alerts will appear here in real time when In-App notifications are on.
              </Text>
            </View>
          ) : null}

          {visible.map((item) => (
            <NotificationCard
              key={item.id}
              item={item}
              onPress={() => {
                if (!item.read) markRead([item.id]);
              }}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
