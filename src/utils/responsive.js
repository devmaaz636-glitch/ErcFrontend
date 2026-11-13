import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;
const { width } = Dimensions.get('window');
const clamped = Math.min(Math.max(width, 320), 480);

export const scale = (size) =>
  PixelRatio.roundToNearestPixel((clamped / BASE_WIDTH) * size);

// Body copy must remain readable on a phone.  A number of the early manager
// mockups passed 7–10 here; honouring those values made labels and actions
// inaccessible on real devices.
const MIN_READABLE_FONT_SIZE = 12;

export const fs = (size, min = MIN_READABLE_FONT_SIZE) =>
  Math.round(
    Math.max(size + (scale(size) - size) * 0.5, MIN_READABLE_FONT_SIZE, min)
  );

export const useTopPadding = (extra = 24) => {
  const insets = useSafeAreaInsets();
  const androidBar = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;
  const statusBar = Math.max(insets.top, androidBar, 20); // 20 = old iPhones without a notch
  return statusBar + scale(extra);
};
