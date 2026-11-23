import { useEffect, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import Text from './AppText';
import { clinicMapImageUrl, clinicMapsUrl } from '../lib/patientClinic';
import { colors } from '../theme';
import { fs, scale as s } from '../utils/responsive';

const BRAND = '#BF824F';

function MapFallback({ clinic, height }) {
  return (
    <View style={{ width: '100%', height, overflow: 'hidden', backgroundColor: '#E8F0E9' }}>
      <LinearGradient
        colors={['#DCE8DF', '#EAF1EA', '#F3F0E8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <Svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="none">
        <Line x1="0" y1="40" x2="360" y2="48" stroke="#C9D5C8" strokeWidth="6" />
        <Line x1="0" y1="92" x2="360" y2="86" stroke="#C5D2C6" strokeWidth="8" />
        <Line x1="0" y1="130" x2="360" y2="138" stroke="#CBD7CA" strokeWidth="5" />
        <Line x1="70" y1="0" x2="90" y2="160" stroke="#C7D4C8" strokeWidth="7" />
        <Line x1="180" y1="0" x2="168" y2="160" stroke="#BFCDBF" strokeWidth="10" />
        <Line x1="280" y1="0" x2="300" y2="160" stroke="#C9D5C8" strokeWidth="6" />
        <Path
          d="M40 20 H120 V70 H40 Z M210 50 H300 V110 H210 Z M100 100 H170 V150 H100 Z"
          fill="#D5E0D4"
          stroke="#B7C6B8"
          strokeWidth="1"
        />
        <Circle cx="180" cy="78" r="18" fill="rgba(191,130,79,0.18)" />
        <Circle cx="180" cy="78" r="8" fill={BRAND} />
      </Svg>
    </View>
  );
}

/**
 * Clinic map — same UI on iOS & Android.
 * Uses a static map image (no WebView) so the screen never hangs on load.
 */
export default function ClinicMapPreview({ clinic, height = s(168), onPress }) {
  const [failed, setFailed] = useState(false);
  const uri = clinicMapImageUrl(clinic, 900, Math.round(height * 2.4));

  useEffect(() => {
    setFailed(false);
  }, [clinic?.id, clinic?.lat, clinic?.lng, uri]);

  const openExternal = () => {
    if (typeof onPress === 'function') {
      onPress();
      return;
    }
    const url = clinicMapsUrl(clinic);
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={{ width: '100%', height, backgroundColor: '#E8EFE8', overflow: 'hidden' }}>
      {!failed && uri ? (
        <Image
          key={uri}
          source={{ uri }}
          contentFit="cover"
          cachePolicy="memory-disk"
          style={{ width: '100%', height }}
          onError={() => setFailed(true)}
          transition={120}
        />
      ) : (
        <MapFallback clinic={clinic} height={height} />
      )}

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: s(34),
            height: s(34),
            borderRadius: s(17),
            backgroundColor: 'rgba(191,130,79,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="location" size={s(18)} color={BRAND} />
        </View>
      </View>

      <View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: s(10),
          right: s(10),
          bottom: s(10),
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(255,255,255,0.94)',
            borderRadius: 14,
            paddingHorizontal: s(10),
            paddingVertical: s(8),
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: s(28),
              height: s(28),
              borderRadius: s(14),
              backgroundColor: '#F6E6D6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="location" size={s(14)} color={BRAND} />
          </View>
          <View style={{ marginLeft: s(8), flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: fs(11), fontWeight: '700', color: colors.ink }} numberOfLines={1}>
              {clinic?.city || 'Clinic'}
              {clinic?.region ? ` · ${clinic.region}` : ''}
            </Text>
            <Text style={{ marginTop: 2, fontSize: fs(9), color: colors.desc }} numberOfLines={1}>
              {clinic?.shortAddress || clinic?.address}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open in Maps"
          onPress={openExternal}
          style={{
            marginLeft: s(8),
            width: s(36),
            height: s(36),
            borderRadius: s(18),
            backgroundColor: BRAND,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="navigate" size={s(16)} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}
