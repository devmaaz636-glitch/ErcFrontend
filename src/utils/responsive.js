import { Dimensions, PixelRatio, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BASE_WIDTH = 375;

function windowWidth() {
  // Read live — iOS can report a stale width if this is cached at import time.
  const { width } = Dimensions.get('window');
  return Math.min(Math.max(width || BASE_WIDTH, 320), 480);
}

export const scale = (size) =>
  PixelRatio.roundToNearestPixel((windowWidth() / BASE_WIDTH) * size);

// Body copy must remain readable on a phone.  A number of the early manager
// mockups passed 7–10 here; honouring those values made labels and actions
// inaccessible on real devices.
const MIN_READABLE_FONT_SIZE = 12;

export const fs = (size, min = MIN_READABLE_FONT_SIZE) =>
  Math.round(Math.max(size + (scale(size) - size) * 0.5, min));

/** Shared line height — same multiplier on iOS and Android for identical UI. */
export const lh = (fontSize, mult = 1.25) => Math.round(Number(fontSize) * mult);

export const useTopPadding = (extra = 24) => {
  const insets = useSafeAreaInsets();
  const androidBar = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 0;
  // Safe-area first; floor keeps older devices consistent.
  const statusBar = Math.max(insets.top, androidBar, 20);
  return statusBar + scale(extra);
};

/** Snap interval helper — fractional pixels break iOS carousel snapping. */
export const snapInterval = (value) => PixelRatio.roundToNearestPixel(value);
