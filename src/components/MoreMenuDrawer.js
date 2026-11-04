import { useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text as RNText,
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
import { colors } from '../theme';
import { scale as s, fs } from '../utils/responsive';

export const MORE_MENU_ITEMS = [
  { key: 'alerts', label: 'Alerts', route: 'ManagerAlerts', icon: 'notifications-outline' },
  { key: 'patients', label: 'Patients', route: 'ManagerPatients', icon: 'people-outline' },
  { key: 'profile', label: 'Profile', route: 'ManagerProfile', icon: 'person-outline' },
];

const HEADING = colors.heading || '#353535';
const BRAND = colors.brand || '#BF824F';
const DIVIDER = '#EEEEEE';
const ICON_BG = '#F5F5F5';
const ICON_SOFT = colors.brandSoft || '#FBEFE3';
const CHEVRON = '#8A8A8A';

export default function MoreMenuDrawer({ visible, onClose, onSelect }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.max(width * 0.68, 240), 300);
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
    opacity: interpolate(progress.value, [0, 1], [0, 0.35]),
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
                paddingTop: Math.max(insets.top, 14) + s(6),
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
          >
            <View style={styles.header}>
              <RNText style={styles.headerTitle}>More</RNText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close more menu"
                onPress={handleBackdropClose}
                hitSlop={12}
                style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.55 }]}
              >
                <Ionicons name="close" size={s(16)} color={HEADING} />
              </Pressable>
            </View>

            <View style={styles.list}>
              {MORE_MENU_ITEMS.map((item) => (
                <Pressable
                  key={item.key}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => handleSelect(item.route)}
                  style={({ pressed }) => ({
                    marginBottom: 10,
                    borderRadius: 12,
                    backgroundColor: '#F4F4F4',
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 54,
                      paddingHorizontal: 12,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        backgroundColor: ICON_SOFT,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                      }}
                    >
                      <Ionicons name={item.icon} size={18} color={BRAND} />
                    </View>
                    <RNText
                      numberOfLines={1}
                      style={{
                        flex: 1,
                        fontSize: 15,
                        lineHeight: 20,
                        fontWeight: '600',
                        color: HEADING,
                        includeFontPadding: false,
                      }}
                    >
                      {item.label}
                    </RNText>
                    <Ionicons name="chevron-forward" size={16} color={CHEVRON} />
                  </View>
                </Pressable>
              ))}
            </View>
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
    backgroundColor: '#1A1614',
  },
  panelShell: {
    height: '100%',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: s(20),
    borderBottomLeftRadius: s(20),
    paddingHorizontal: s(20),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: s(14),
    marginBottom: s(6),
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  headerTitle: {
    flex: 1,
    fontSize: fs(18),
    lineHeight: fs(24),
    fontWeight: '700',
    color: HEADING,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  closeBtn: {
    width: s(30),
    height: s(30),
    borderRadius: s(15),
    backgroundColor: ICON_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    marginTop: s(12),
  },
});
