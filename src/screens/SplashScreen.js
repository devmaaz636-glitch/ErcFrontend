import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cssInterop } from 'nativewind';

cssInterop(Image, { className: 'style' });

const WORDMARK = 'ENFIELD ROYAL CLINICS';

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

function ArchedWordmark({ layout }) {
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
        x,
        y,
        deg: (theta * 180) / Math.PI,
      };
    });
  }, [layout]);

  const box = layout.fontSize * 1.7;

  return letters.map((letter) => {
    if (letter.char === ' ') {
      return null;
    }

    return (
      <View
        key={letter.key}
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no"
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
  });
}

export default function SplashScreen() {
  const navigation = useNavigation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const layout = useMemo(
    () => getSplashLayout(width, height, insets),
    [width, height, insets]
  );

  useEffect(() => {
    let unsubscribe = () => {};
    const timeout = setTimeout(() => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        navigation.replace(user ? 'Home' : 'SignIn');
      });
    }, 2000);

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, [navigation]);

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
        <Image
          source={require('../../assets/splashlogo.png')}
          contentFit="contain"
          accessibilityLabel="Enfield Royal Clinics"
          className="self-center"
          style={{ width: layout.logoSize, height: layout.logoSize }}
        />
      </View>
      <ArchedWordmark layout={layout} />
    </View>
  );
}
