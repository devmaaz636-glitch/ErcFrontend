import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, View, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
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
import Text from '../components/AppText';
import { colors } from '../theme';
import { scale as s, fs } from '../utils/responsive';

const MENU_ITEMS = [
  { key: 'alerts', label: 'Alerts', route: 'ManagerAlerts' },
  { key: 'patients', label: 'Patients', route: 'ManagerPatients' },
  { key: 'profile', label: 'Profile', route: 'ManagerProfile' },
];

export default function MoreTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.max(width * 0.62, 220), 280);
  const [visible, setVisible] = useState(false);
  const closingRef = useRef(false);
  const afterCloseRef = useRef(null);
  const progress = useSharedValue(0);

  const handleClosed = useCallback(() => {
    setVisible(false);
    closingRef.current = false;
    const next = afterCloseRef.current;
    afterCloseRef.current = null;
    if (typeof next === 'function') next();
  }, []);

  const openDrawer = useCallback(() => {
    closingRef.current = false;
    afterCloseRef.current = null;
    setVisible(true);
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const closeDrawer = useCallback(
    (afterClose) => {
      if (closingRef.current) return;
      closingRef.current = true;
      afterCloseRef.current = typeof afterClose === 'function' ? afterClose : null;
      progress.value = withTiming(
        0,
        { duration: 180, easing: Easing.in(Easing.cubic) },
        (done) => {
          if (done) runOnJS(handleClosed)();
        }
      );
    },
    [handleClosed, progress]
  );

  useFocusEffect(
    useCallback(() => {
      openDrawer();
      return () => {
        progress.value = 0;
        setVisible(false);
        closingRef.current = false;
        afterCloseRef.current = null;
      };
    }, [openDrawer, progress])
  );

  function onSelect(route) {
    closeDrawer(() => {
      navigation.navigate(route);
    });
  }

  function onClose() {
    closeDrawer(() => {
      navigation.navigate('Home');
    });
  }

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 0.35]),
  }));

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [drawerWidth, 0]) }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />

      <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
        <View style={{ flex: 1, flexDirection: 'row' }}>
          <Pressable style={{ flex: 1 }} onPress={onClose}>
            <Animated.View
              pointerEvents="none"
              style={[{ flex: 1, backgroundColor: '#1A1614' }, backdropStyle]}
            />
          </Pressable>

          <Animated.View
            style={[
              {
                width: drawerWidth,
                backgroundColor: '#fff',
                borderTopLeftRadius: s(16),
                borderBottomLeftRadius: s(16),
                paddingTop: Math.max(insets.top, 14) + s(6),
                paddingBottom: Math.max(insets.bottom, 14),
                paddingHorizontal: s(20),
              },
              panelStyle,
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: s(8) }}>
              <Text style={{ flex: 1, fontSize: fs(16), fontWeight: '700', color: colors.ink }}>
                More
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close more menu"
                onPress={onClose}
                hitSlop={10}
                style={{
                  width: s(28),
                  height: s(28),
                  borderRadius: s(14),
                  borderWidth: 1,
                  borderColor: '#E6DED6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={s(14)} color={colors.muted} />
              </Pressable>
            </View>

            {MENU_ITEMS.map((item, index) => (
              <Pressable
                key={item.key}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                onPress={() => onSelect(item.route)}
                style={({ pressed }) => ({
                  paddingVertical: s(16),
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: '#EFE8E1',
                  opacity: pressed ? 0.55 : 1,
                })}
              >
                <Text style={{ fontSize: fs(14), fontWeight: '500', color: colors.ink }}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}
