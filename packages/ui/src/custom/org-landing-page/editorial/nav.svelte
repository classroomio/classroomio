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
    };
  }

  let { orgName, logoUrl, navItems, authAction }: Props = $props();
</script>

<EditableLandingSection sectionKey="navigation">
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
                href={item.href}
                class="ui:text-sm ui:transition-colors ui:no-underline ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:cursor-pointer"
              >
                {item.label}
              </a>
            {/each}
          </nav>
        {/if}

        <div class="ui:flex ui:items-center ui:gap-2.5">
          {#if authAction}
            <Button
              href={authAction.href}
              size="sm"
              class="ui:rounded-full ui:px-4 ui:font-medium ui:bg-[var(--landing-fg)] ui:text-[var(--landing-bg)] ui:hover:opacity-90"
            >
              {authAction.label}
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </header>
</EditableLandingSection>
