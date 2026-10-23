import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { colors } from '../../theme';
import { scale as s } from '../../utils/responsive';

/** Soft pulse bone — used while data hydrates (no blocking spinner). */
export function SkeletonBone({
  height = 14,
  width = '100%',
  radius = 8,
  style,
}) {
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      style={[
        {
          height: typeof height === 'number' ? s(height) : height,
          width,
          borderRadius: radius,
          backgroundColor: colors.brandMuted,
          opacity: pulse,
        },
        style,
      ]}
    />
  );
}

export function SkeletonRow({ lines = 2, avatar = false, style }) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.card,
          borderRadius: 14,
          padding: s(12),
          marginBottom: s(10),
        },
        style,
      ]}
    >
      {avatar ? (
        <SkeletonBone height={40} width={s(40)} radius={s(20)} style={{ marginRight: s(12) }} />
      ) : null}
      <View style={{ flex: 1 }}>
        <SkeletonBone height={12} width="72%" />
        {lines > 1 ? <SkeletonBone height={10} width="48%" style={{ marginTop: s(8) }} /> : null}
        {lines > 2 ? <SkeletonBone height={10} width="60%" style={{ marginTop: s(8) }} /> : null}
      </View>
    </View>
  );
}

export function SkeletonStatGrid({ count = 4 }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginTop: s(22),
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBone
          key={`stat-${i}`}
          height={104}
          width="48%"
          radius={16}
          style={{ marginBottom: s(12) }}
        />
      ))}
    </View>
  );
}

export default SkeletonBone;
