/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#17181D',
    tint: '#6157E8',
    background: '#F6F6F9',
    foreground: '#17181D',
    card: '#FFFFFF',
    cardForeground: '#17181D',
    primary: '#6157E8',
    primaryForeground: '#FFFFFF',
    secondary: '#ECECF4',
    secondaryForeground: '#373747',
    muted: '#EEEFF4',
    mutedForeground: '#737586',
    accent: '#E8E7FF',
    accentForeground: '#4F46C8',
    destructive: '#D94A52',
    destructiveForeground: '#FFFFFF',
    border: '#E4E5EC',
    input: '#E4E5EC',
    success: '#21865B',
    warning: '#A86A09',
    warningSurface: '#FFF3D8',
  },
  dark: {
    text: '#F2F3F7',
    tint: '#8B83FF',
    background: '#0E0F13',
    foreground: '#F2F3F7',
    card: '#17181D',
    cardForeground: '#F2F3F7',
    primary: '#8B83FF',
    primaryForeground: '#101117',
    secondary: '#1F2128',
    secondaryForeground: '#E4E5ED',
    muted: '#1F2128',
    mutedForeground: '#9A9DAB',
    accent: '#282644',
    accentForeground: '#B6B1FF',
    destructive: '#FF656B',
    destructiveForeground: '#1A0D0E',
    border: '#2A2C35',
    input: '#2A2C35',
    success: '#54C98A',
    warning: '#F5A524',
    warningSurface: '#302719',
  },
  radius: 18,
};

export default colors;
