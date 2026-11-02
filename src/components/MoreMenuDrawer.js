import { useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
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

export const MORE_MENU_ITEMS = [
  { key: 'alerts', label: 'Alerts', route: 'ManagerAlerts', icon: 'notifications-outline' },
  { key: 'patients', label: 'Patients', route: 'ManagerPatients', icon: 'people-outline' },
  { key: 'profile', label: 'Profile', route: 'ManagerProfile', icon: 'person-outline' },
];

const ACCENT = '#C17F45';
const ACCENT_SOFT = '#FBF1E6';
const INK = '#1A1614';
const MUTED = '#8D8680';
const DIVIDER = '#EFE8E1';
const CHEVRON = '#C9C1B8';

export default function MoreMenuDrawer({ visible, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.max(width * 0.62, 260), 310);
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
      <View style={styles.root}>
        <Pressable style={styles.backdropHit} onPress={handleBackdropClose}>
          <Animated.View pointerEvents="none" style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <Animated.View style={[{ width: drawerWidth }, styles.panelShell, panelStyle]}>
          <View
            style={[
              styles.panel,
              {
                paddingTop: Math.max(insets.top, 18) + 12,
                paddingBottom: Math.max(insets.bottom, 18),
              },
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.headerTitle}>More</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close more menu"
                onPress={handleBackdropClose}
                hitSlop={12}
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="close" size={16} color={MUTED} />
              </Pressable>
            </View>

            {MORE_MENU_ITEMS.map((item) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => handleSelect(item.route)}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name={item.icon} size={18} color={ACCENT} />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={CHEVRON} />
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
  },
  backdropHit: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 22, 20, 0.35)',
  },
  panelShell: {
    height: '100%',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    paddingHorizontal: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 14,
    marginBottom: 2,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: INK,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3EFEA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  rowPressed: {
    backgroundColor: '#FAF7F3',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: ACCENT_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '500',
    color: INK,
  },
});
