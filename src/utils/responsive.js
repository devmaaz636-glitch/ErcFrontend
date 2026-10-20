import { Dimensions, PixelRatio } from 'react-native';

const BASE_WIDTH = 375;
const { width } = Dimensions.get('window');
const clamped = Math.min(Math.max(width, 320), 480);

export const scale = (size) =>
  PixelRatio.roundToNearestPixel((clamped / BASE_WIDTH) * size);

export const fs = (size, min = 10) =>
  Math.round(Math.max(size + (scale(size) - size) * 0.5, min));