import { type ComponentProps } from 'svelte';
import { Input } from '@cio/ui/base/input';

export const FIELDS: (keyof ComponentProps<typeof Input>)[] = [
  'value',
  'type',
  'placeholder',
  'disabled',
  'class',
  'id',
  'name',
  'required',
  'readonly'
];
