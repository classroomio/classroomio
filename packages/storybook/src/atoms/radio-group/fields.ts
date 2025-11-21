import { type ComponentProps } from 'svelte';
import { RadioGroup } from '@cio/ui/base/radio-group';

export const FIELDS: (keyof ComponentProps<typeof RadioGroup>)[] = [
  'value',
  'onValueChange',
  'disabled',
  'required',
  'name',
  'loop',
  'orientation'
];
