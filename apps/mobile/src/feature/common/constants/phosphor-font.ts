import createIconSet from '@expo/vector-icons/createIconSet';

export const TAB_ICON_SIZE = 28;

export const TAB_GLYPHS = {
  house: 58050,
  'book-open': 57574,
  compass: 57800,
  target: 58492,
  'users-three': 59022,
  books: 59224,
  student: 59198,
  tray: 58538,
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
