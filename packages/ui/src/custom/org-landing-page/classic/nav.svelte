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
  <header class="ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)]">
    <div class="ui:flex ui:items-center ui:justify-between ui:px-6 ui:lg:px-8 ui:h-20 ui:max-w-7xl ui:mx-auto">
      <a
        href="/"
        class="ui:flex ui:items-center ui:gap-3 ui:text-xl ui:font-bold ui:tracking-wide ui:no-underline ui:cursor-pointer"
      >
        {#if logoUrl}
          <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto" />
        {/if}
        {orgName}
      </a>
      <div class="ui:flex ui:items-center ui:gap-4">
        <nav class="ui:hidden ui:md:flex ui:space-x-8">
          {#each navItems as item}
            <a
              href={safeHref(item.href)}
              class="ui:text-sm ui:font-medium ui:text-[var(--landing-bg)]/70 ui:hover:text-[var(--landing-bg)] ui:transition-colors ui:cursor-pointer"
              >{item.label}</a
            >
          {/each}
        </nav>
        {#if authAction || learnerAccount}
          {#if authAction}
            <LandingNavCta {authAction} theme="classic" />
          {/if}
          {#if learnerAccount}
            <LearnerMenu account={learnerAccount} {authAction} theme="classic" />
          {/if}
        {/if}
      </div>
    </div>
  </header>
</EditableLandingSection>
