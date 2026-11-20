export type BlockStackTone = 'muted' | 'primary' | 'solid' | 'sand' | 'tint' | 'soft' | 'blue' | 'ink' | 'empty';
export type BlockStackWidth = 'sm' | 'md' | 'lg' | 'full';
export type BlockStackVariant = 'list' | 'notch';
export type BlockStackAnimation = 'drop' | 'settle';
export type BlockStackSize = 'md' | 'lg';

export interface BlockStackBlock {
  id?: string;
  kind: string;
  label: string;
  tone?: BlockStackTone;
  /** A named width, or a width in pixels (the `notch` variant caps it at the stack width). */
  width?: BlockStackWidth | number;
}
