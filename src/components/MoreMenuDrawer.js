import { useCallback, useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Text from './AppText';
import { scale as s, fs } from '../utils/responsive';

export const MORE_MENU_ITEMS = [
  { key: 'alerts', label: 'Alerts', route: 'ManagerAlerts' },
  { key: 'patients', label: 'Patients', route: 'ManagerPatients' },
  { key: 'profile', label: 'Profile', route: 'ManagerProfile' },
];


export default function MoreMenuDrawer({ visible, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.max(width * 0.58, 240), 300);
  const closingRef = useRef(false);
  const afterCloseRef = useRef(null);
  const progress = useSharedValue(0);

  const finishClose = useCallback(() => {
    closingRef.current = false;
    const next = afterCloseRef.current;
    afterCloseRef.current = null;
    if (typeof next === 'function') next();
    else if (typeof onClose === 'function') onClose();
  }, [onClose]);

  const animateClose = useCallback(
    (afterClose) => {
      if (closingRef.current) return;
      closingRef.current = true;
      afterCloseRef.current = typeof afterClose === 'function' ? afterClose : null;
      progress.value = withTiming(
        0,
        { duration: 190, easing: Easing.in(Easing.cubic) },
        (done) => {
          if (done) runOnJS(finishClose)();
        }
      );
    },
    [finishClose, progress]
  );

  useEffect(() => {
    if (visible) {
      closingRef.current = false;
      afterCloseRef.current = null;
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      progress.value = 0;
      closingRef.current = false;
    }
  }, [visible, progress]);

  function handleBackdropClose() {
    animateClose(() => {
      if (typeof onClose === 'function') onClose();
    });
  }

  function handleSelect(route) {
    animateClose(() => {
      if (typeof onClose === 'function') onClose();
      if (typeof onSelect === 'function') onSelect(route);
    });
  }

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [drawerWidth + 8, 0]) }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleBackdropClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Pressable style={{ flex: 1 }} onPress={handleBackdropClose}>
          <Animated.View
            pointerEvents="none"
            style={[
              {
                flex: 1,
                backgroundColor: 'rgba(90, 72, 55, 0.38)',
              },
              backdropStyle,
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            {
              width: drawerWidth,
              height: '100%',
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: s(20),
              borderBottomLeftRadius: s(20),
              paddingTop: Math.max(insets.top, 18) + s(10),
              paddingBottom: Math.max(insets.bottom, 18),
              paddingHorizontal: s(22),
            },
            panelStyle,
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingBottom: s(16),
              marginBottom: s(4),
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: fs(17),
                fontWeight: '700',
                color: '#1F1B16',
              }}
            >
              More
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close more menu"
              onPress={handleBackdropClose}
              hitSlop={12}
              style={{
                width: s(28),
                height: s(28),
                borderRadius: s(14),
                backgroundColor: '#F2EDE7',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={s(14)} color="#9A928A" />
            </Pressable>
          </View>

          {MORE_MENU_ITEMS.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => handleSelect(item.route)}
              style={({ pressed }) => ({
                paddingVertical: s(22),
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: '#E8E1DA',
                opacity: pressed ? 0.45 : 1,
              })}
            >
              <Text
                style={{
                  fontSize: fs(15),
                  fontWeight: '500',
                  color: '#1F1B16',
                  lineHeight: fs(22),
                }}
              >
                {item.label}
              </Text>
            </Pressable>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}
