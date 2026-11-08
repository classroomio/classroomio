import { NOTE_BLOCK_STYLES, type TNoteBlockStyle } from '@cio/utils/validation/block';

export function noteStyleLabelKey(style: TNoteBlockStyle): string {
  return `course.navItem.lessons.materials.blocks.styles.${style}`;
}

export const NOTE_STYLE_OPTIONS = NOTE_BLOCK_STYLES.map((style) => ({
  value: style,
  labelKey: noteStyleLabelKey(style)
}));
