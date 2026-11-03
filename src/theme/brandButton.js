/**
 * Forced brand CTA styles.
 * NativeWind can strip StyleSheet backgroundColor on Pressable —
 * always merge `brandButtonBg` last in the style array.
 */
export const BRAND_BG = '#BF824F';

export const brandButtonBg = {
  backgroundColor: BRAND_BG,
};

export const brandButtonText = {
  color: '#FFFFFF',
};

export function brandPressableStyle(base, pressed) {
  // Force #BF824F last — NativeWind can strip earlier StyleSheet backgrounds on Pressable.
  return [base, brandButtonBg, { backgroundColor: BRAND_BG }, pressed ? { opacity: 0.9 } : null];
}

export default BRAND_BG;
