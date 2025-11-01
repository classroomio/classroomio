import { type ComponentProps } from 'svelte';
import { Button } from '@cio/ui/base/button';

export const FIELDS: (keyof ComponentProps<typeof Button>)[] = ['variant', 'size', 'disabled', 'class', 'type', 'href'];
