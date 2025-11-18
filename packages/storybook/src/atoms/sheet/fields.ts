import { type ComponentProps } from 'svelte';
import { Sheet } from '@cio/ui/base/sheet';

export const FIELDS: (keyof ComponentProps<typeof Sheet>)[] = ['open', 'onOpenChange'];
