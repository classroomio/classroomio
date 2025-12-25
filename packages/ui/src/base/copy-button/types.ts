/*
	Installed from @ieedan/shadcn-svelte-extras
*/

import type { WithChildren, WithoutChildren } from 'bits-ui';

import type { ButtonPropsWithoutHTML } from '../button';
import type { HTMLAttributes } from 'svelte/elements';
import type { Snippet } from 'svelte';
import type { UseClipboard } from '../../hooks/use-clipboard.svelte';

export type CopyButtonPropsWithoutHTML = WithChildren<
  Pick<ButtonPropsWithoutHTML, 'size' | 'variant'> & {
    ref?: HTMLButtonElement | null;
    text: string;
    icon?: Snippet<[]>;
    animationDuration?: number;
    onCopy?: (status: UseClipboard['status']) => void;
  }
>;

export type CopyButtonProps = CopyButtonPropsWithoutHTML & WithoutChildren<HTMLAttributes<HTMLButtonElement>>;
