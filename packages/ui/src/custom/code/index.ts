import { tv, type VariantProps } from 'tailwind-variants';
import Root from './code.svelte';
import Overflow from './code-overflow.svelte';
import CopyButton from './code-copy-button.svelte';
import FileName from './code-file-header.svelte';
import Block from './code-block.svelte';
import type { CodeCopyButtonProps, CodeOverflowProps, CodeRootProps } from './types';

export { langFromFilename } from './lang-from-filename';

export const codeVariants = tv({
  base: 'ui:not-prose ui:relative ui:h-full ui:overflow-auto ui:rounded-lg ui:border',
  variants: {
    variant: {
      default: 'ui:border-border ui:bg-card',
      secondary: 'ui:bg-secondary/50 ui:border-transparent'
    }
  }
});

export type CodeVariant = VariantProps<typeof codeVariants>['variant'];

export {
  Root,
  CopyButton,
  Overflow,
  FileName,
  Block,
  type CodeRootProps as RootProps,
  type CodeCopyButtonProps as CopyButtonProps,
  type CodeOverflowProps as OverflowProps
};
