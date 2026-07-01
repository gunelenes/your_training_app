import { Platform } from 'react-native';

/**
 * "Neon strength" palette — flat dark surfaces + single lime accent.
 * Use `theme.color.accent` everywhere instead of hardcoding hex values.
 */
export const theme = {
  color: {
    // Surfaces
    bg: '#0A0B0D',
    surface: '#141618',
    surfaceElevated: '#1A1D20',
    surfaceMuted: '#0F1113',
    border: '#22262A',

    // Text
    text: '#F5F5F5',
    textMuted: '#8B9096',
    textDim: '#5C6167',

    // Accent (neon lime — single accent hero color)
    accent: '#C6FF00',
    accentSoft: 'rgba(198, 255, 0, 0.15)',
    accentPressed: '#A8DC00',

    // Status
    success: '#4ADE80',
    danger: '#FF453A',
    warning: '#FFB020',
    info: '#5AC8FA',
  },

  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },

  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  font: {
    size: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 17,
      xl: 20,
      xxl: 24,
      display: 32,
      hero: 40,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
};

export const Colors = {
  light: {
    text: theme.color.text,
    background: theme.color.bg,
    tint: theme.color.accent,
    icon: theme.color.textMuted,
    tabIconDefault: theme.color.textMuted,
    tabIconSelected: theme.color.accent,
  },
  dark: {
    text: theme.color.text,
    background: theme.color.bg,
    tint: theme.color.accent,
    icon: theme.color.textMuted,
    tabIconDefault: theme.color.textMuted,
    tabIconSelected: theme.color.accent,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
