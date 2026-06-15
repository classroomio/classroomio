<script lang="ts">
  import type { NavItem } from '../types';
  import { Button } from '../../../base/button';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    orgName: string;
    logoUrl?: string;
    navItems: NavItem[];
    authAction?: {
      label: string;
      href: string;
      loading?: boolean;
      disabled?: boolean;
    };
  }

  let { orgName, logoUrl, navItems, authAction }: Props = $props();
</script>

<EditableLandingSection sectionKey="navigation">
  <header
    class="ui:sticky ui:top-0 ui:z-50 ui:bg-[var(--landing-bg)]/95 ui:backdrop-blur-md ui:border-b ui:border-[var(--landing-border)]"
  >
    <div class="ui:max-w-[1120px] ui:mx-auto ui:px-6">
      <div class="ui:flex ui:items-center ui:justify-between ui:h-14">
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
          <nav class="ui:hidden ui:md:flex ui:gap-7">
            {#each navItems as item (item.href + item.label)}
              <a
                href={item.href}
                class="ui:text-sm ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:transition-colors ui:no-underline ui:cursor-pointer"
              >
                {item.label}
              </a>
            {/each}
          </nav>
        {/if}

        <div class="ui:flex ui:items-center ui:gap-3">
          {#if authAction}
            <Button
              href={authAction.href}
              loading={authAction.loading}
              disabled={authAction.disabled}
              size="sm"
              class="ui:rounded-none ui:px-4 ui:font-medium"
            >
              {authAction.label}
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </header>
</EditableLandingSection>
