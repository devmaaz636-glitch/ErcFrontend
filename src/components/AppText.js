import { StyleSheet, Text } from 'react-native';
import { manropeFontFamily } from '../theme/fonts';

export default function AppText({ style, ...props }) {
  const flattened = StyleSheet.flatten(style) || {};
  const fontFamily = manropeFontFamily(flattened.fontWeight);
  return (
    <Text
      {...props}
      style={[{ includeFontPadding: false, fontFamily }, style]}
    />
  );
}
