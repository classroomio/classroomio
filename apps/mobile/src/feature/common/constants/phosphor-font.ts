import createIconSet from '@expo/vector-icons/createIconSet';

export const TAB_ICON_SIZE = 28;

export const TAB_GLYPHS = {
  house: 58050,
  'book-open': 57574,
  'shield-check': 58380,
  'chalkboard-teacher': 58880,
  'chats-circle': 57726,
  'user-circle': 58564
} as const;

export type TabGlyph = keyof typeof TAB_GLYPHS;

// Font names must match each file's family name: expo-font looks the font up by family when rendering a glyph to an image.
export const PhosphorRegular = createIconSet(
  TAB_GLYPHS,
  'Phosphor',
  require('../../../../assets/fonts/phosphor-regular.ttf')
);

export const PhosphorFill = createIconSet(
  TAB_GLYPHS,
  'Phosphor-Fill',
  require('../../../../assets/fonts/phosphor-fill.ttf')
);
