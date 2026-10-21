import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Animated, Easing, Text, useWindowDimensions, View } from 'react-native';
import { signOutUser } from '../lib/auth';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });

const WORDMARK = 'ENFIELD ROYAL CLINICS';
const START_ANGLE = -70; // degrees the arch starts rotated to the left
const LOGO_DURATION = 700;
const ARC_DELAY = 350;
const ARC_DURATION = 1500;
const SPLASH_TOTAL = 3200; // how long the splash stays before going to SignIn

function getSplashLayout(width, height, insets) {
  const bottomInset = Math.max(insets.bottom, 10);
  const sideInset = Math.max(insets.left, insets.right, 0);
  let layoutWidth = Math.max(width - sideInset * 2, 1);

  const measure = (span) => {
    const logoSize = span * 0.4;
    const fontSize = Math.max(span * 0.068, 12);
    const radius = span * 0.46;
    const sagitta = span * 0.3;
    const marginBottom = bottomInset + fontSize * 0.35;
    const endY = height - marginBottom;
    const centerY = endY - sagitta + radius;
    const half = Math.acos(
      Math.min(1, Math.max(-1, (radius - sagitta) / radius))
    );
    const glyphRadius = radius + fontSize * 0.32;
    const arcTop = centerY - glyphRadius - fontSize * 0.55;
    const logoBottom = height / 2 + logoSize / 2;
    return {
      logoSize,
      fontSize,
      glyphRadius,
      sweep: half * 2,
      centerX: width / 2,
      centerY,
      arcTop,
      logoBottom,
    };
  };

  let layout = measure(layoutWidth);
  let guard = 0;
  while (
    layout.arcTop < layout.logoBottom + layout.fontSize * 0.4 &&
    layoutWidth > 180 &&
    guard < 18
  ) {
    layoutWidth *= 0.92;
    layout = measure(layoutWidth);
    guard += 1;
  }

  return layout;
}

function ArchedWordmark({ layout, progress }) {
  const box = layout.fontSize * 1.7;

  // Square container centered on the arc's center, so rotating it
  // swings every letter around the arc like a wheel.
  const reach = layout.glyphRadius + box;
  const size = reach * 2;
  const originX = layout.centerX - reach;
  const originY = layout.centerY - reach;

  const letters = useMemo(() => {
    const chars = WORDMARK.split('');
    const weights = chars.map((char) => (char === ' ' ? 1.45 : 1));
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = 0;

    return chars.map((char, index) => {
      const start = -layout.sweep / 2;
      const centerWeight = cursor + weights[index] / 2;
      cursor += weights[index];
      const theta = start + layout.sweep * (centerWeight / total);
      const x = layout.centerX + layout.glyphRadius * Math.sin(theta);
      const y = layout.centerY - layout.glyphRadius * Math.cos(theta);
      return {
        key: `${char}-${index}`,
        char,
        x: x - originX,
        y: y - originY,
        deg: (theta * 180) / Math.PI,
      };
    });
  }, [layout, originX, originY]);

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [`${START_ANGLE}deg`, '0deg'],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{
        position: 'absolute',
        left: originX,
        top: originY,
        width: size,
        height: size,
        opacity,
        transform: [{ rotate }],
      }}
    >
      {letters.map((letter) => {
        if (letter.char === ' ') {
          return null;
        }

        return (
          <View
            key={letter.key}
            className="absolute items-center justify-center"
            style={{
              left: letter.x - box / 2,
              top: letter.y - box / 2,
              width: box,
              height: box,
              transform: [{ rotate: `${letter.deg}deg` }],
            }}
          >
            <Text
              allowFontScaling={false}
              className="text-center font-medium text-white"
              style={{
                fontSize: layout.fontSize,
                includeFontPadding: false,
                textAlignVertical: 'center',
              }}
            >
              {letter.char}
            </Text>
          </View>
        );
      })}
    </Animated.View>
  );
}

export default function SplashScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = useMemo(
    () => getSplashLayout(width, height, insets),
    [width, height, insets]
  );

  const logoAnim = useRef(new Animated.Value(0)).current;
  const arcAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.parallel([
      Animated.timing(logoAnim, {
        toValue: 1,
        duration: LOGO_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(arcAnim, {
        toValue: 1,
        delay: ARC_DELAY,
        duration: ARC_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animation.start();

    const timeout = setTimeout(() => {
      signOutUser()
        .catch(() => {})
        .finally(() => navigation.replace('SignIn'));
    }, SPLASH_TOTAL);

    return () => {
      animation.stop();
      clearTimeout(timeout);
    };
  }, [navigation, logoAnim, arcAnim]);

  const logoScale = logoAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
  });

  return (
    <View
      className="flex-1 overflow-hidden bg-splash"
      style={{ backgroundColor: '#BF824F' }}
      accessibilityLabel="Enfield Royal Clinics"
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        <Animated.View
          style={{ opacity: logoAnim, transform: [{ scale: logoScale }] }}
        >
          <Image
            source={require('../../assets/splashlogo.png')}
            contentFit="contain"
            accessibilityLabel="Enfield Royal Clinics"
            className="self-center"
            style={{ width: layout.logoSize, height: layout.logoSize }}
          />
        </Animated.View>
      </View>
      <ArchedWordmark layout={layout} progress={arcAnim} />
    </View>
  );
}