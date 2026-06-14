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
    class="ui:sticky ui:top-0 ui:z-50 ui:bg-[var(--landing-bg)]/75 ui:backdrop-blur-md ui:border-b ui:border-[var(--landing-border)]"
  >
    <div class="ui:max-w-[1080px] ui:mx-auto ui:px-6">
      <div class="ui:grid ui:grid-cols-[1fr_auto_1fr] ui:items-center ui:h-14">
        <a
          href="/"
          class="ui:flex ui:items-center ui:gap-2 ui:font-semibold ui:text-[14px] ui:tracking-tight ui:text-[var(--landing-fg)] ui:no-underline ui:cursor-pointer"
        >
          {#if logoUrl}
            <img src={logoUrl} alt={orgName} class="ui:h-5 ui:w-auto" />
          {/if}
          {orgName}
        </a>

        {#if navItems.length > 0}
          <nav class="ui:hidden ui:md:flex ui:gap-0.5 ui:justify-self-center">
            {#each navItems as item (item.href + item.label)}
              <a
                href={item.href}
                class="ui:px-3 ui:py-1.5 ui:text-[13px] ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:hover:bg-[var(--landing-card-soft)] ui:rounded-md ui:transition-colors ui:no-underline ui:cursor-pointer"
              >
                {item.label}
              </a>
            {/each}
          </nav>
        {:else}
          <span></span>
        {/if}

        <div class="ui:justify-self-end ui:flex ui:items-center ui:gap-1">
          {#if authAction}
            <Button
              href={authAction.href}
              loading={authAction.loading}
              disabled={authAction.disabled}
              size="sm"
              class="ui:rounded-md ui:px-3.5"
            >
              {authAction.label}
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </header>
</EditableLandingSection>
