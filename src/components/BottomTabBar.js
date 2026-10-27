import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { colors, shadows } from '../theme';

const BROWN = colors.brand;
const MUTED = colors.muted;
const BAR_H = 58;
const PILL_H = 44;
const PAD_X = 8;

const TAB_META = {
  Home: { label: 'Home', icon: 'home-outline', activeIcon: 'home' },
  AppointmentsTab: {
    label: 'Appointments',
    icon: 'calendar-number-outline',
    activeIcon: 'calendar-number',
  },
  BranchesTab: { label: 'Branches', icon: 'storefront-outline', activeIcon: 'storefront' },
  ProfileTab: { label: 'Profile', icon: 'person-circle-outline', activeIcon: 'person-circle' },
  TreatmentsTab: { label: 'Treatments', icon: 'people-outline', activeIcon: 'people' },
  DoctorsTab: { label: 'Doctors', icon: 'medkit-outline', activeIcon: 'medkit' },
  MoreTab: { label: 'More', icon: 'menu-outline', activeIcon: 'menu' },
};

const spring = { damping: 16, stiffness: 200, mass: 0.8 };

function TabItem({ routeName, isFocused, onPress, onLongPress, onLayout }) {
  const meta = TAB_META[routeName] || {
    label: routeName,
    icon: 'ellipse-outline',
    activeIcon: 'ellipse',
  };
  const progress = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(isFocused ? 1 : 0, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [isFocused, progress]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.94 + progress.value * 0.08 }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateX: (1 - progress.value) * -6 }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={meta.label}
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={onLayout}
      style={{
        height: PILL_H,
        minWidth: 44,
        paddingHorizontal: isFocused ? 16 : 10,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Animated.View style={iconStyle}>
          <Ionicons
            name={isFocused ? meta.activeIcon : meta.icon}
            size={isFocused ? 18 : 22}
            color={isFocused ? '#fff' : MUTED}
          />
        </Animated.View>
        {isFocused ? (
          <Animated.View style={labelStyle}>
            <Text numberOfLines={1} style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
              {meta.label}
            </Text>
          </Animated.View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Floating tab bar with a spring-sliding brand pill + fade tab scenes.
 * Wired as React Navigation `tabBar` for MainTabs.
 */
export default function BottomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const [layouts, setLayouts] = useState({});

  const pillX = useSharedValue(PAD_X);
  const pillW = useSharedValue(44);
  const pillOpacity = useSharedValue(0);

  const activeKey = state.routes[state.index]?.key;
  const activeLayout = layouts[activeKey];

  useEffect(() => {
    if (!activeLayout) return;
    pillX.value = withSpring(activeLayout.x, spring);
    pillW.value = withSpring(Math.max(activeLayout.width, 44), spring);
    pillOpacity.value = withTiming(1, { duration: 160 });
  }, [activeLayout, activeKey, pillX, pillW, pillOpacity]);

  const pillStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: (BAR_H - PILL_H) / 2,
    left: pillX.value,
    width: pillW.value,
    height: PILL_H,
    borderRadius: PILL_H / 2,
    backgroundColor: BROWN,
    opacity: pillOpacity.value,
    zIndex: 1,
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        paddingBottom: Math.max(insets.bottom, 12),
        paddingHorizontal: 20,
      }}
    >
      <View
        style={{
          width: '100%',
          maxWidth: 440,
          height: BAR_H,
          borderRadius: BAR_H / 2,
          backgroundColor: '#fff',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: PAD_X,
          ...shadows.tabBar,
        }}
      >
        <Animated.View style={pillStyle} />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              routeName={route.name}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setLayouts((prev) => {
                  const cur = prev[route.key];
                  if (cur && cur.x === x && cur.width === width) return prev;
                  return { ...prev, [route.key]: { x, width } };
                });
              }}
            />
          );
        })}
      </View>
    </View>
  );
}
