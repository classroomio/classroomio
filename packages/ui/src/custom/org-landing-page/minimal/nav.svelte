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

  const navigationGradientBackground = `
    linear-gradient(
      135deg,
      color-mix(in oklab, var(--landing-accent) 16%, var(--landing-bg)) 0%,
      color-mix(in oklab, var(--landing-accent) 8%, var(--landing-bg)) 100%
    )
  `;
</script>

<EditableLandingSection sectionKey="navigation" capPlacement="inside">
  <header
    class="ui:flex ui:items-center ui:justify-between ui:gap-6 ui:px-6 ui:py-4 ui:rounded-full ui:border ui:border-[var(--landing-border)]/60 ui:backdrop-blur-sm"
    style={`background: ${navigationGradientBackground};`}
  >
    <a href="/" class="ui:font-semibold ui:text-xl ui:flex ui:items-center ui:gap-2 ui:no-underline ui:cursor-pointer">
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto" />
      {/if}
      {orgName}
    </a>
    <div class="ui:flex ui:items-center ui:gap-4">
      <nav class="ui:hidden ui:md:flex ui:gap-8">
        {#each navItems as item}
          <a
            href={safeHref(item.href)}
            class="ui:text-sm ui:text-[var(--landing-fg)]/70 ui:hover:text-[var(--landing-fg)] ui:transition-colors ui:cursor-pointer"
            >{item.label}</a
          >
        {/each}
      </nav>
      {#if authAction || learnerAccount}
        <div class="ui:flex ui:items-center ui:gap-3">
          {#if authAction}
            <LandingNavCta {authAction} theme="minimal" />
          {/if}
          {#if learnerAccount}
            <LearnerMenu account={learnerAccount} {authAction} theme="minimal" />
          {/if}
        </div>
      {/if}
    </div>
  </header>
</EditableLandingSection>
