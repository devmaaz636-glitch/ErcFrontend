import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;
const { width } = Dimensions.get('window');
const clamped = Math.min(Math.max(width, 320), 480);

export const scale = (size) =>
  PixelRatio.roundToNearestPixel((clamped / BASE_WIDTH) * size);

export const fs = (size, min = 10) =>
  Math.round(Math.max(size + (scale(size) - size) * 0.5, min));

// Top padding for every screen: status bar / notch height plus extra breathing room
export const useTopPadding = (extra = 24) => {
  const insets = useSafeAreaInsets();
  const androidBar = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;
  const statusBar = Math.max(insets.top, androidBar, 20); // 20 = old iPhones without a notch
  return statusBar + scale(extra);
};