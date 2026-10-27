import { colors } from './colors';
import { radius, spacing } from './spacing';
import { typography } from './typography';

export const managerDashboard = {
  colors: {
    page: colors.background,
    card: colors.card,
    primary: colors.brand,
    primaryLight: colors.brandLight,
    primarySoft: colors.brandSoft,
    brandButton: '#DFA16C',
    text: colors.ink,
    secondaryText: colors.desc,
    tertiaryText: colors.muted,
    success: colors.success,
    successSoft: colors.successBg,
    pending: '#D5B244',
    pendingSoft: '#FFF8DC',
    requestIcon: '#D79357',
    requestIconSoft: '#F6E7D7',
    track: '#F0E7DF',
    border: '#F3ECE5',
  },
  layout: {
    pageGutter: spacing.lg,
    sectionGap: spacing.xl,
    cardGap: spacing.sm,
    statsGap: spacing.sm,
    maxWidth: spacing.maxContent,
  },
  radius: {
    card: radius.md,
    stat: radius.md,
    search: radius.round,
    button: radius.round,
    requestCard: 10,
  },
  typography: {
    greeting: typography.subtitle,
    section: typography.subtitle,
    cardTitle: typography.label,
    body: typography.meta,
    caption: typography.tiny,
    micro: typography.micro,
  },
};

export default managerDashboard;
