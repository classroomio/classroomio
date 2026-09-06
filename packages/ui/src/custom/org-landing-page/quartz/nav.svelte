<script lang="ts">
  import type { OrgLandingPageProps } from '../types';
  import LandingButton from '../landing-button.svelte';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

  type Props = {
    orgName?: string;
    logoUrl?: string;
    navItems?: OrgLandingPageProps['navItems'];
    authAction?: OrgLandingPageProps['authAction'];
  };

  let { orgName = '', logoUrl, navItems = [], authAction }: Props = $props();
</script>

<nav
  class="ui:sticky ui:top-0 ui:z-50 ui:bg-[var(--landing-bg)]/85 ui:backdrop-blur-md ui:border-b ui:border-[var(--landing-border-soft)]"
>
  <div
    class="ui:max-w-[1200px] ui:mx-auto ui:px-5 ui:md:px-8 ui:h-[58px] ui:flex ui:items-center ui:justify-between ui:gap-6"
  >
    <a href="/" class="ui:flex ui:items-center ui:gap-2.5 ui:no-underline ui:text-[var(--landing-fg)] ui:min-w-0">
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-6 ui:w-auto" />
      {:else}
        <span class="ui:h-5 ui:w-5 ui:shrink-0 ui:rounded-[6px] ui:bg-[var(--landing-fg)] ui:relative">
          <span class="ui:absolute ui:inset-[5px] ui:rounded-[3px] ui:bg-[var(--landing-bg)]"></span>
        </span>
      {/if}
      <span class="ui:font-semibold ui:text-[15px] ui:tracking-[-0.022em] ui:truncate">{orgName}</span>
    </a>

    {#if navItems.length > 0}
      <div class="ui:hidden ui:md:flex ui:items-center ui:gap-7">
        {#each navItems as item (item.href + item.label)}
          <a
            href={item.href}
            class="ui:text-sm ui:no-underline ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:transition-colors"
          >
            {item.label}
          </a>
        {/each}
      </div>
    {/if}

    {#if authAction}
      <LandingButton variant="primary" size="sm" href={authAction.href} disabled={authAction.disabled}>
        {authAction.label}
        <ArrowRightIcon class="ui:size-3.5" aria-hidden="true" />
      </LandingButton>
    {/if}
  </div>
</nav>
