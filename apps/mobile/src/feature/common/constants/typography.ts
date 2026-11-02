import type { TextStyle } from 'react-native';

export const FONT_FAMILY = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  extrabold: 'Geist_800ExtraBold'
} as const;

export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'bodyStrong'
  | 'label'
  | 'caption'
  | 'captionStrong'
  | 'micro';

export const TEXT_VARIANTS: Record<TextVariant, TextStyle> = {
  display: { fontFamily: FONT_FAMILY.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.9 },
  title: { fontFamily: FONT_FAMILY.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.55 },
  heading: { fontFamily: FONT_FAMILY.semibold, fontSize: 17, lineHeight: 23, letterSpacing: -0.25 },
  subheading: { fontFamily: FONT_FAMILY.semibold, fontSize: 15, lineHeight: 20, letterSpacing: -0.15 },
  body: { fontFamily: FONT_FAMILY.regular, fontSize: 16, lineHeight: 24 },
  bodyStrong: { fontFamily: FONT_FAMILY.medium, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: FONT_FAMILY.semibold, fontSize: 15, lineHeight: 20, letterSpacing: -0.1 },
  caption: { fontFamily: FONT_FAMILY.regular, fontSize: 13.5, lineHeight: 19 },
  captionStrong: { fontFamily: FONT_FAMILY.medium, fontSize: 13.5, lineHeight: 19 },
  micro: { fontFamily: FONT_FAMILY.medium, fontSize: 12, lineHeight: 16 }
};
