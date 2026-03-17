const palette = {
  forestGreen: '#1A3B2E',
  deepGreen: '#0F2820',
  sageGreen: '#4A7C59',
  mintGreen: '#7AB893',
  softMint: '#A8D5B5',
  creamWhite: '#F5F0E8',
  warmWhite: '#FAF7F2',
  mutedCream: '#E8E2D6',
  goldenAmber: '#C8A86B',
  warmAmber: '#E8C17A',
  softGold: '#F0D49A',
  charcoal: '#2D3748',
  mediumGray: '#718096',
  lightGray: '#E2E8F0',
  errorRed: '#E53E3E',
  warningOrange: '#DD6B20',
  white: '#FFFFFF',
  black: '#000000',
  overlayDark: 'rgba(15, 40, 32, 0.85)',
  overlayLight: 'rgba(245, 240, 232, 0.9)',
  cardBackground: 'rgba(255, 255, 255, 0.08)',
  cardBorder: 'rgba(255, 255, 255, 0.12)',
};

export const Colors = {
  primary: palette.sageGreen,
  primaryDark: palette.forestGreen,
  primaryDeep: palette.deepGreen,
  primaryLight: palette.mintGreen,
  primarySoft: palette.softMint,

  accent: palette.goldenAmber,
  accentWarm: palette.warmAmber,
  accentSoft: palette.softGold,

  background: palette.deepGreen,
  surface: palette.forestGreen,
  surfaceLight: 'rgba(74, 124, 89, 0.2)',

  text: palette.creamWhite,
  textSecondary: palette.softMint,
  textMuted: 'rgba(168, 213, 181, 0.6)',
  textDark: palette.charcoal,

  cream: palette.creamWhite,
  warmWhite: palette.warmWhite,
  mutedCream: palette.mutedCream,

  error: palette.errorRed,
  warning: palette.warningOrange,

  cardBg: palette.cardBackground,
  cardBorder: palette.cardBorder,
  overlay: palette.overlayDark,

  tabBar: palette.deepGreen,
  tabBarBorder: 'rgba(74, 124, 89, 0.3)',
  tabIconActive: palette.mintGreen,
  tabIconInactive: 'rgba(168, 213, 181, 0.4)',

  tint: palette.mintGreen,
  tabIconDefault: 'rgba(168, 213, 181, 0.4)',
  tabIconSelected: palette.mintGreen,
};

export default Colors;
