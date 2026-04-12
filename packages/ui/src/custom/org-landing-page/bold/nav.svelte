<script lang="ts">
  import type { NavItem } from '../types';
  import { Button } from '../../../base/button';

  interface Props {
    orgName: string;
    logoUrl?: string;
    navItems: NavItem[];
    authAction?: {
      label: string;
      href: string;
    };
  }

  let { orgName, logoUrl, navItems, authAction }: Props = $props();
</script>

<header class="ui:sticky ui:top-0 ui:z-10 ui:bg-background/90 ui:backdrop-blur-xl ui:border-b ui:border-border/40">
  <div class="ui:flex ui:items-center ui:justify-between ui:px-6 ui:py-5 ui:max-w-7xl ui:mx-auto">
    <a href="/" class="ui:font-black ui:text-2xl ui:tracking-tighter ui:flex ui:items-center ui:gap-3 ui:no-underline">
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto" />
      {/if}
      {orgName}
    </a>
    <div class="ui:flex ui:items-center ui:gap-4">
      <nav class="ui:hidden ui:md:flex ui:gap-8 ui:items-center">
        {#each navItems as item}
          <a
            href={item.href}
            class="ui:text-sm ui:font-bold ui:uppercase ui:tracking-widest ui:hover:text-primary ui:transition-colors"
            >{item.label}</a
          >
        {/each}
      </nav>
      {#if authAction}
        <Button href={authAction.href} variant="outline" class="ui:rounded-xl ui:font-bold">
          {authAction.label}
        </Button>
      {/if}
    </div>
  </div>
</header>
