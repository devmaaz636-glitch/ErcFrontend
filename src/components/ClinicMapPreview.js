import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import Text from './AppText';
import {
  clinicMapEmbedHtml,
  clinicMapImageUrl,
  clinicMapsUrl,
} from '../lib/patientClinic';
import { colors } from '../theme';
import { fs, scale as s } from '../utils/responsive';

const BRAND = '#BF824F';
const USE_WEB_MAP = Platform.OS !== 'web';

/**
 * Live clinic map — Leaflet/OSM in a WebView for the selected region coords.
 * Falls back to a static map image if the web map fails to load.
 */
export default function ClinicMapPreview({ clinic, height = s(168), onPress }) {
  const [webFailed, setWebFailed] = useState(!USE_WEB_MAP);
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(USE_WEB_MAP);

  const html = useMemo(() => clinicMapEmbedHtml(clinic), [clinic?.id, clinic?.lat, clinic?.lng]);
  const staticUri = clinicMapImageUrl(clinic, 900, Math.round(height * 2.4));

  useEffect(() => {
    setWebFailed(!USE_WEB_MAP);
    setImageFailed(false);
    setLoading(USE_WEB_MAP);
  }, [clinic?.id, clinic?.lat, clinic?.lng]);

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
      {!webFailed ? (
        <WebView
          key={`${clinic?.id || 'clinic'}-${clinic?.lat}-${clinic?.lng}`}
          originWhitelist={['*']}
          source={{ html }}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          onLoadEnd={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setWebFailed(true);
          }}
          onHttpError={() => {
            setLoading(false);
            setWebFailed(true);
          }}
          setSupportMultipleWindows={false}
        />
      ) : !imageFailed ? (
        <Image
          key={staticUri}
          source={{ uri: staticUri }}
          contentFit="cover"
          style={{ width: '100%', height }}
          onError={() => setImageFailed(true)}
          transition={180}
        />
      ) : (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: s(16) }}>
          <Ionicons name="map-outline" size={s(28)} color={BRAND} />
          <Text style={{ marginTop: s(8), fontSize: fs(12), fontWeight: '700', color: colors.ink }}>
            {clinic?.city || 'Clinic location'}
          </Text>
          <Text
            style={{ marginTop: 4, fontSize: fs(10), color: colors.desc, textAlign: 'center' }}
            numberOfLines={2}
          >
            {clinic?.shortAddress || clinic?.address}
          </Text>
        </View>
      )}

      {loading && !webFailed ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(232,239,232,0.55)',
          }}
        >
          <ActivityIndicator color={BRAND} />
        </View>
      ) : null}

      {/* Soft pin + open maps chip */}
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
          <View style={{ marginLeft: s(8), flex: 1 }}>
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
