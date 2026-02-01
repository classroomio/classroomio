<script lang="ts">
  import { resolve } from '$app/paths';
  import type { TCustomLinks } from './types';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    customLinks?: TCustomLinks | undefined;
    isMobile?: boolean;
    onMobileClick?: (() => void) | undefined;
  }

  let { customLinks = undefined, isMobile = false, onMobileClick = undefined }: Props = $props();

  function handleLinkClick() {
    if (onMobileClick) onMobileClick();
  }
</script>

{#if customLinks}
  <div class={isMobile ? 'space-y-4' : 'mr-4 hidden items-center space-x-6 lg:flex'}>
    {#each customLinks.links as link (link.url)}
      <li>
        <a
          href={resolve(link.url)}
          target={link.openInNewTab ? '_blank' : '_self'}
          rel={link.openInNewTab ? 'noopener noreferrer' : ''}
        >
          <Button size="sm" variant="ghost" onclick={handleLinkClick}>
            {link.label}
          </Button>
        </a>
      </li>
    {/each}
  </div>
{/if}
