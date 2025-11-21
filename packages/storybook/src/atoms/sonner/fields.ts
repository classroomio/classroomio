import { type ComponentProps } from 'svelte';
import { Toaster as Sonner } from '@cio/ui/base/sonner';

export const FIELDS: (keyof ComponentProps<typeof Sonner>)[] = ['types', 'position', 'expand'];
