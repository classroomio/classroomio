<!-- CustomLinks.svelte -->
<script lang="ts">
  import type CustomLinks from './types';

  export let customLinks: CustomLinks;
  export let isMobile = false;
  export let onMobileClick: (() => void) | undefined = undefined;

  function handleLinkClick() {
    if (onMobileClick) onMobileClick();
  }
</script>

<div class="custom-nav {isMobile ? 'space-y-4' : 'mr-4 hidden items-center space-x-6 lg:flex'}">
  {#each customLinks.links as link}
    <li>
      <a
        href={link.url}
        target={link.openInNewTab ? '_blank' : '_self'}
        rel={link.openInNewTab ? 'noopener noreferrer' : ''}
        class={isMobile
          ? 'hover:text-primary-600 block rounded-md px-3 py-2 font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50'
          : ''}
        on:click={handleLinkClick}
      >
        {link.label}
      </a>
    </li>
  {/each}
</div>

<style>
  /* Custom navigation styles */
  .custom-nav a {
    padding: 0.5rem 1rem;
    font-weight: 500;
    color: #374151;
    text-decoration: none;
    border-radius: 0.375rem;
    transition: all 0.2s ease-in-out;
  }

  .custom-nav a:hover {
    color: var(--main-primary-color);
    background-color: #f3f4f6;
  }
</style>
