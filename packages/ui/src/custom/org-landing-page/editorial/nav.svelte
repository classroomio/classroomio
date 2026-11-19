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
    class="ui:sticky ui:top-0 ui:z-50 ui:backdrop-blur-md"
    style="background: color-mix(in srgb, var(--landing-bg) 85%, transparent); border-bottom: 1px solid var(--landing-border-soft);"
  >
    <div class="ui:max-w-[1240px] ui:mx-auto ui:px-6 ui:md:px-8">
      <div class="ui:flex ui:items-center ui:justify-between ui:h-16">
        <a
          href="/"
          class="ui:flex ui:items-center ui:gap-2.5 ui:font-semibold ui:text-[15px] ui:tracking-tight ui:no-underline ui:text-[var(--landing-fg)] ui:cursor-pointer"
        >
          {#if logoUrl}
            <img src={logoUrl} alt={orgName} class="ui:h-6 ui:w-auto" />
          {/if}
          <span>{orgName}</span>
        </a>

        {#if navItems.length > 0}
          <nav class="ui:hidden ui:md:flex ui:gap-8">
            {#each navItems as item (item.href + item.label)}
              <a
                href={safeHref(item.href)}
                class="ui:text-sm ui:transition-colors ui:no-underline ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:cursor-pointer"
              >
                {item.label}
              </a>
            {/each}
          </nav>
        {/if}

        {#if authAction || learnerAccount}
          <div class="ui:flex ui:items-center ui:gap-3">
            {#if authAction}
              <LandingNavCta {authAction} theme="editorial" />
            {/if}
            {#if learnerAccount}
              <LearnerMenu account={learnerAccount} {authAction} theme="editorial" />
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </header>
</EditableLandingSection>
