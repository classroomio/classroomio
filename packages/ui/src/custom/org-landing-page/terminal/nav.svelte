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
  <header class="ui:relative ui:z-50 ui:px-6 ui:bg-transparent">
    <div class="ui:max-w-[1120px] ui:mx-auto">
      <div class="ui:flex ui:items-center ui:justify-between ui:h-16">
        <div class="ui:flex ui:items-center ui:gap-8">
          <a
            href="/"
            aria-label={orgName}
            class="ui:flex ui:items-center ui:gap-2 ui:no-underline ui:text-[var(--landing-fg)] ui:cursor-pointer"
          >
            {#if logoUrl}
              <img src={logoUrl} alt={orgName} class="ui:h-6 ui:w-auto" />
            {:else}
              <svg viewBox="0 0 16 16" fill="none" class="ui:size-5">
                <path
                  d="M2 2 L8 8 L2 14 M14 2 L8 8 L14 14"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {/if}
          </a>

          {#if navItems.length > 0}
            <nav class="ui:hidden ui:md:flex ui:items-center ui:gap-6">
              {#each navItems as item (item.href + item.label)}
                <a
                  href={item.href}
                  class="ui:text-[11px] ui:font-medium ui:tracking-[0.12em] ui:uppercase ui:no-underline ui:transition-colors ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:cursor-pointer"
                >
                  {item.label}
                </a>
              {/each}
              <span class="ui:select-none ui:text-[var(--landing-fg-faint)]" aria-hidden="true">/</span>
            </nav>
          {/if}
        </div>

        <div class="ui:flex ui:items-center ui:gap-3">
          {#if authAction}
            <Button
              href={authAction.href}
              size="sm"
              variant="outline"
              class="ui:rounded-full ui:px-4 ui:font-medium ui:bg-transparent ui:border-[var(--landing-border)] ui:text-[var(--landing-fg)] ui:hover:bg-white/5"
            >
              {authAction.label}
            </Button>
          {/if}
        </div>
      </div>
    </div>
  </header>
</EditableLandingSection>
