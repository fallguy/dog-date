export const colors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1F1F1F',
  surfaceHover: '#262626',
  text: '#F8F8F8',
  textSoft: '#A8A8A8',
  textMute: '#5C5C5C',
  divider: '#2A2A2A',
  dividerSoft: '#1A1A1A',
  accent: '#F7E14C',
  accentInk: '#0A0A0A',
  accentSoft: '#28220A',
  like: '#9CFF6F',
  pass: '#FF6B6B',
  scrim: 'rgba(0, 0, 0, 0.88)',
  photoTint: 'rgba(10, 10, 10, 0.0)',
} as const;

export const fonts = {
  display: 'PlusJakartaSans_700Bold',
  displayHeavy: 'PlusJakartaSans_800ExtraBold',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodyBold: 'PlusJakartaSans_600SemiBold',
  mono: 'JetBrainsMono_500Medium',
  monoBold: 'JetBrainsMono_600SemiBold',
} as const;

export const tracking = {
  tightDisplay: -0.6,
  display: -0.3,
  body: 0,
  loose: 0.4,
  monoLoose: 1.6,
  mono: 1.0,
  monoTight: 0.5,
} as const;

export const radii = {
  card: 20,
  cardLarge: 28,
  pill: 999,
  frame: 4,
  bubble: 20,
  small: 10,
  tile: 14,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;
