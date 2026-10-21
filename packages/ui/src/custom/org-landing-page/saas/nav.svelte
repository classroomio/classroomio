<script lang="ts">
  import type { LandingNavAuthAction, NavItem, OrgLandingPageProps } from '../types';
  import { safeHref } from '../safe-href';
  import EditableLandingSection from '../editable-section.svelte';
  import LearnerMenu from '../learner-menu.svelte';
  import LandingNavCta from '../landing-nav-cta.svelte';

  interface Props {
    orgName: string;
    logoUrl?: string;
    navItems: NavItem[];
    authAction?: LandingNavAuthAction;
    learnerAccount?: OrgLandingPageProps['learnerAccount'];
  }

  let { orgName, logoUrl, navItems, authAction, learnerAccount }: Props = $props();
</script>

<EditableLandingSection sectionKey="navigation" capPlacement="inside">
  <header
    class="ui:flex ui:items-center ui:justify-between ui:gap-4 ui:py-2 ui:pl-5 ui:pr-2 ui:rounded-full ui:border ui:border-[var(--landing-border)] ui:bg-[var(--landing-bg)]/85 ui:backdrop-blur-md ui:shadow-[0_4px_24px_-8px_rgba(14,14,16,0.08)]"
  >
    <a
      href="/"
      class="ui:flex ui:items-center ui:gap-2 ui:font-semibold ui:text-[15px] ui:tracking-tight ui:text-[var(--landing-fg)] ui:no-underline ui:cursor-pointer"
    >
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-6 ui:w-auto" />
      {/if}
      {orgName}
    </a>

    {#if navItems.length > 0}
      <nav class="ui:hidden ui:md:flex ui:gap-1">
        {#each navItems as item (item.href + item.label)}
          <a
            href={safeHref(item.href)}
            class="ui:px-3.5 ui:py-1.5 ui:text-sm ui:font-medium ui:text-[var(--landing-fg)]/80 ui:hover:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-card-soft)]/60 ui:rounded-full ui:transition-colors ui:no-underline ui:cursor-pointer"
          >
            {item.label}
          </a>
        {/each}
      </nav>
    {/if}

    {#if authAction || learnerAccount}
      <div class="ui:flex ui:items-center ui:gap-3">
        {#if authAction}
          <LandingNavCta {authAction} theme="saas" />
        {/if}
        {#if learnerAccount}
          <LearnerMenu account={learnerAccount} {authAction} theme="saas" />
        {/if}
      </div>
    {/if}
  </header>
</EditableLandingSection>
