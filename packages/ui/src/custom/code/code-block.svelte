<script lang="ts">
  import { cn } from '../../tools';
  import Root from './code.svelte';
  import FileName from './code-file-header.svelte';
  import { langFromFilename } from './lang-from-filename';
  import type { SupportedLanguage } from './shiki';
  import type { CodeRootProps } from './types';

  type Props = {
    filename: string;
    code: string;
    /** Language for syntax highlighting. Default: derived from filename. */
    lang?: SupportedLanguage;
    /** Props forwarded to Code.Root (variant, hideLines, highlight, class, etc.). */
    rootProps?: Omit<CodeRootProps, 'code' | 'lang'>;
    /** Class for the outer wrapper. */
    class?: string;
  };

  let { filename, code, lang, rootProps = {}, class: className }: Props = $props();

  const resolvedLang = $derived(lang ?? langFromFilename(filename));
  const mergedRootClass = $derived(cn('ui:w-full ui:border-none', rootProps.class));
  const restRoot = $derived.by(() => {
    const { class: _c, ...rest } = rootProps;
    return rest;
  });
</script>

<div class={cn('ui:rounded-lg ui:border ui:border-border', className)}>
  <FileName {filename} />
  <Root {code} lang={resolvedLang} class={mergedRootClass} {...restRoot} />
</div>
