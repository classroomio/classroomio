import { type ComponentProps } from 'svelte';
import * as Dialog from '@cio/ui/base/dialog';

export const FIELDS: (keyof ComponentProps<typeof Dialog.Root>)[] = ['open', 'onOpenChange'];
