export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
};

export function manropeFontFamily(fontWeight) {
  if (fontWeight === 'bold') return fontFamily.bold;
  if (fontWeight === 'normal') return fontFamily.regular;
  const weight = Number(fontWeight);
  if (weight >= 800) return fontFamily.extraBold;
  if (weight >= 700) return fontFamily.bold;
  if (weight >= 600) return fontFamily.semibold;
  if (weight >= 500) return fontFamily.medium;
  return fontFamily.regular;
}
