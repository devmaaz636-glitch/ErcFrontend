import { useCallback, useRef, useState } from 'react';
import { Modal, Pressable, Text as RNText, TouchableOpacity, View, useWindowDimensions } from 'react-native';
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

const TEXT_COLOR = colors.heading || '#353535';
const DIVIDER_COLOR = '#EEEEEE';
const ICON_BG = '#F5F5F5';

const MENU_ITEMS = [
  { key: 'alerts', label: 'Alerts', route: 'ManagerAlerts', icon: 'notifications-outline' },
  { key: 'patients', label: 'Patients', route: 'ManagerPatients', icon: 'people-outline' },
  { key: 'profile', label: 'Profile', route: 'ManagerProfile', icon: 'person-outline' },
];

export default function MoreTabScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const drawerWidth = Math.min(Math.max(width * 0.68, 240), 300);
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

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        <View style={{ flex: 1, flexDirection: 'row' }}>
          {/* Backdrop */}
          <Pressable style={{ flex: 1 }} onPress={onClose}>
            <Animated.View
              pointerEvents="none"
              style={[{ flex: 1, backgroundColor: '#1A1614' }, backdropStyle]}
            />
          </Pressable>

          {/* Drawer */}
          <Animated.View
            style={[
              {
                width: drawerWidth,
                backgroundColor: '#FFFFFF',
                borderTopLeftRadius: s(20),
                borderBottomLeftRadius: s(20),
                paddingTop: Math.max(insets.top, 14) + s(6),
                paddingBottom: Math.max(insets.bottom, 14),
                paddingHorizontal: s(20),
                shadowColor: '#000',
                shadowOffset: { width: -4, height: 0 },
                shadowOpacity: 0.12,
                shadowRadius: 12,
                elevation: 16,
              },
              panelStyle,
            ]}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingBottom: s(14),
                marginBottom: s(6),
                borderBottomWidth: 1,
                borderBottomColor: DIVIDER_COLOR,
              }}
            >
              <Text
                style={{
                  flex: 1,
                  fontSize: fs(18),
                  fontWeight: '700',
                  color: TEXT_COLOR,
                  letterSpacing: 0.2,
                }}
              >
                More
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close more menu"
                onPress={onClose}
                hitSlop={10}
                style={({ pressed }) => ({
                  width: s(30),
                  height: s(30),
                  borderRadius: s(15),
                  backgroundColor: ICON_BG,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.6 : 1,
                })}
              >
                <Ionicons name="close" size={s(16)} color={TEXT_COLOR} />
              </Pressable>
            </View>

            {/* Menu items */}
            <View style={{ marginTop: 12 }}>
              {MENU_ITEMS.map((item) => (
                <TouchableOpacity
                  key={item.key}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => onSelect(item.route)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    minHeight: 54,
                    marginBottom: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: '#F4F4F4',
                  }}
                >
                  <Ionicons
                    name={item.icon}
                    size={20}
                    color={TEXT_COLOR}
                    style={{ width: 28 }}
                  />
                  <RNText
                    numberOfLines={1}
                    style={{
                      flexGrow: 1,
                      flexShrink: 1,
                      fontSize: 15,
                      lineHeight: 20,
                      fontWeight: '600',
                      color: TEXT_COLOR,
                      includeFontPadding: false,
                    }}
                  >
                    {item.label}
                  </RNText>
                  <Ionicons name="chevron-forward" size={16} color="#8A8A8A" />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}