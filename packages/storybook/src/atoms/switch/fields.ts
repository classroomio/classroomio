import { type ComponentProps } from 'svelte';
import { Switch } from '@cio/ui/base/switch';

export const FIELDS: (keyof ComponentProps<typeof Switch>)[] = [
  'checked',
  'onCheckedChange',
  'disabled',
  'name',
  'required',
  'value'
];
