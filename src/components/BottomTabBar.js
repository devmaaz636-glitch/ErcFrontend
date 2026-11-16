import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
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
  TreatmentsTab: { label: 'Treatments', icon: 'sparkles-outline', activeIcon: 'sparkles' },
  DoctorsTab: { label: 'Doctors', icon: 'medkit-outline', activeIcon: 'medkit' },
  PatientsTab: { label: 'Patients', icon: 'people-outline', activeIcon: 'people' },
  AboutTab: { label: 'About Us', icon: 'information-circle-outline', activeIcon: 'information-circle' },
  ScheduleTab: {
    label: 'Schedule',
    icon: 'calendar-outline',
    activeIcon: 'calendar',
  },
  MoreTab: { label: 'More', icon: 'menu-outline', activeIcon: 'menu' },
};

const spring = { damping: 16, stiffness: 200, mass: 0.8 };

function PatientTabIcon({ routeName, color, size }) {
  const strokeWidth = 1.55;
  const common = { stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };

  if (routeName === 'Home') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path {...common} d="m3 10 9-7 9 7" />
        <Path {...common} d="M5.5 9.5V21h4.8v-6h3.4v6h4.8V9.5" />
      </Svg>
    );
  }

  if (routeName === 'AppointmentsTab') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect {...common} x="2" y="4" width="20" height="18" rx="4" />
        <Path {...common} d="M8 2v4M16 2v4M2 10h20" />
      </Svg>
    );
  }

  if (routeName === 'TreatmentsTab') {
    return (
      <Svg width={size} height={size} viewBox="0 0 19 18" fill="none">
        <Circle {...common} cx="6.65" cy="4.15" r="3.75" />
        <Path {...common} d="M1.15 16.65h11c.41 0 .75-.34.75-.75 0-3-2.8-5.25-6.25-5.25S.4 12.9.4 15.9c0 .41.34.75.75.75Z" />
        <Path {...common} d="M14.8 4.4H16c.22 0 .4.18.4.4v.95c0 .22.18.4.4.4h.95c.22 0 .4.18.4.4v1.2c0 .22-.18.4-.4.4h-.95c-.22 0-.4.18-.4.4v.95c0 .22-.18.4-.4.4h-1.2c-.22 0-.4-.18-.4-.4v-.95c0-.22-.18-.4-.4-.4h-.95c-.22 0-.4-.18-.4-.4v-1.2c0-.22.18-.4.4-.4H14c.22 0 .4-.18.4-.4V4.8c0-.22.18-.4.4-.4Z" />
      </Svg>
    );
  }

  if (routeName === 'AboutTab') {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path {...common} d="M4 10h16v11H4zM2.5 21h19M6.5 10V6.5h11V10M9 6.5V3h6v3.5" />
        <Path {...common} d="M11 3v3.5M9.25 4.75h3.5M7.5 13.5v5M11 13.5v5M14.5 13.5v5M17.5 13.5v5" />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle {...common} cx="12" cy="7" r="4" />
      <Path {...common} d="M4.5 21v-1.5C4.5 15.9 7.86 13 12 13s7.5 2.9 7.5 6.5V21" />
    </Svg>
  );
}

function TabItem({ routeName, isFocused, onPress, onLongPress, onLayout, variant }) {
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
          {variant === 'patient' ? (
            <PatientTabIcon
              routeName={routeName}
              size={isFocused ? 20 : 24}
              color={isFocused ? '#fff' : MUTED}
            />
          ) : (
            <Ionicons
              name={isFocused ? meta.activeIcon : meta.icon}
              size={isFocused ? 18 : 22}
              color={isFocused ? '#fff' : MUTED}
            />
          )}
        </Animated.View>
        {isFocused ? (
          <Animated.View style={[labelStyle, { marginLeft: 6 }]}>
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
export default function BottomTabBar({ state, navigation, moreOpen = false, onMorePress, variant }) {
  const insets = useSafeAreaInsets();
  const [layouts, setLayouts] = useState({});

  const pillX = useSharedValue(PAD_X);
  const pillW = useSharedValue(44);
  const pillOpacity = useSharedValue(0);

  const moreRoute = state.routes.find((route) => route.name === 'MoreTab');
  const activeRoute = moreOpen && moreRoute ? moreRoute : state.routes[state.index];
  const activeKey = activeRoute?.key;
  const activeLayout = activeKey ? layouts[activeKey] : null;

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
          const isMore = route.name === 'MoreTab';
          const isFocused = isMore ? moreOpen : !moreOpen && state.index === index;

          const onPress = () => {
            if (isMore) {
              if (typeof onMorePress === 'function') onMorePress();
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!event.defaultPrevented) {
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
              variant={variant}
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
