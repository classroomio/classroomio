import { type ComponentProps } from 'svelte';
import * as Select from '@cio/ui/base/select';

export const FIELDS: (keyof ComponentProps<typeof Select.Root>)[] = [
  'value',
  'onValueChange',
  'disabled',
  'type',
  'open',
  'name',
  'required',
  'autocomplete',
  'allowDeselect'
];
