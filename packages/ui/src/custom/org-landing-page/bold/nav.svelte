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
    class="ui:sticky ui:top-0 ui:z-10 ui:bg-[var(--landing-bg)]/90 ui:backdrop-blur-xl ui:border-b ui:border-[var(--landing-border)]/40"
  >
    <div class="ui:flex ui:items-center ui:justify-between ui:px-6 ui:py-5 ui:max-w-7xl ui:mx-auto">
      <a
        href="/"
        class="ui:font-black ui:text-2xl ui:tracking-tighter ui:flex ui:items-center ui:gap-3 ui:no-underline ui:cursor-pointer"
      >
        {#if logoUrl}
          <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto" />
        {/if}
        {orgName}
      </a>
      <div class="ui:flex ui:items-center ui:gap-4">
        <nav class="ui:hidden ui:md:flex ui:gap-8 ui:items-center">
          {#each navItems as item}
            <a
              href={safeHref(item.href)}
              class="ui:text-sm ui:font-bold ui:uppercase ui:tracking-widest ui:hover:text-[var(--landing-accent)] ui:transition-colors ui:cursor-pointer"
              >{item.label}</a
            >
          {/each}
        </nav>
        {#if authAction || learnerAccount}
          {#if authAction}
            <LandingNavCta {authAction} theme="bold" />
          {/if}
          {#if learnerAccount}
            <LearnerMenu account={learnerAccount} {authAction} theme="bold" />
          {/if}
        {/if}
      </div>
    </div>
  </header>
</EditableLandingSection>
