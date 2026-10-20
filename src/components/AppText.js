import { Text } from 'react-native';

export default function AppText({ style, ...props }) {
  return (
    <Text
      maxFontSizeMultiplier={1.2}
      {...props}
      style={[{ includeFontPadding: false }, style]}
    />
  );
}