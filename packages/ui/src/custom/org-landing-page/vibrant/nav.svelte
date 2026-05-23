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
  <header class="ui:sticky ui:top-0 ui:z-50 ui:bg-[var(--landing-bg)]">
    <div class="ui:max-w-[1320px] ui:mx-auto ui:px-6 ui:md:px-8">
      <div class="ui:flex ui:items-center ui:justify-between ui:h-[72px] ui:gap-6">
        <div class="ui:flex ui:items-center ui:gap-8">
          <a
            href="/"
            class="ui:inline-flex ui:items-center ui:gap-2 ui:font-semibold ui:text-[22px] ui:tracking-tight ui:text-[var(--landing-fg)] ui:no-underline ui:cursor-pointer"
          >
            {#if logoUrl}
              <img src={logoUrl} alt={orgName} class="ui:h-7 ui:w-auto" />
            {:else}
              <span class="ui:relative ui:inline-block ui:size-[22px]" aria-hidden="true">
                <span
                  class="ui:absolute ui:left-0 ui:top-0 ui:w-[10px] ui:h-[22px] ui:rounded-[3px] ui:bg-[var(--landing-accent)]"
                ></span>
                <span
                  class="ui:absolute ui:right-0 ui:top-[6px] ui:w-[10px] ui:h-[10px] ui:rounded-[3px] ui:bg-[var(--landing-accent)]"
                ></span>
              </span>
            {/if}
            <span>{orgName}</span>
          </a>

          {#if navItems.length > 0}
            <nav class="ui:hidden ui:md:flex ui:gap-1 ui:items-center">
              {#each navItems as item (item.href + item.label)}
                <a
                  href={item.href}
                  class="ui:inline-flex ui:items-center ui:gap-1 ui:px-3.5 ui:py-2 ui:text-[15px] ui:font-medium ui:text-[var(--landing-fg)] ui:rounded-md ui:transition-colors ui:hover:bg-[var(--landing-card-soft)] ui:no-underline ui:cursor-pointer"
                >
                  {item.label}
                </a>
              {/each}
            </nav>
          {/if}
        </div>

        {#if authAction}
          <div class="ui:flex ui:items-center ui:gap-4">
            <Button
              href={authAction.href}
              size="sm"
              class="ui:rounded-md ui:px-4 ui:font-medium ui:bg-[var(--landing-accent)] ui:text-[var(--landing-accent-fg)] ui:hover:opacity-90"
            >
              {authAction.label}
            </Button>
          </div>
        {/if}
      </div>
    </div>
  </header>
</EditableLandingSection>
