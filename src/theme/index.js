/**
 * Global ERC theme — single import for teammates:
 *
 *   import { colors, spacing, radius, typography, shadows, theme } from '../theme';
 *
 * NativeWind: use classes splash | card | ink | muted | field | peach
 * (see frontend/tailwind.config.js — kept in sync with colors.js).
 */
export { colors, default as colorTokens } from './colors';
export { spacing, radius } from './spacing';
export { typography } from './typography';
export { shadows } from './shadows';

import { colors } from './colors';
import { spacing, radius } from './spacing';
import { typography } from './typography';
import { shadows } from './shadows';

export const theme = {
  colors,
  spacing,
  radius,
  typography,
  shadows,
};

export default theme;
