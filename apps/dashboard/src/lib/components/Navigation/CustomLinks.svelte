<script lang="ts">
  import type { TCustomLinks } from './types';

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
    {#each customLinks.links as link}
      <li>
        <a
          href={link.url}
          target={link.openInNewTab ? '_blank' : '_self'}
          rel={link.openInNewTab ? 'noopener noreferrer' : ''}
          class={isMobile
            ? 'hover:text-primary-600 block rounded-md px-3 py-2 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50'
            : 'hover:text-primary-600 rounded-md px-4 py-2 font-medium text-gray-700 no-underline transition-all duration-200 ease-in-out hover:bg-gray-100'}
          onclick={handleLinkClick}
        >
          {link.label}
        </a>
      </li>
    {/each}
  </div>
{/if}
