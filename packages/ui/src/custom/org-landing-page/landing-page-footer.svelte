<script lang="ts">
  import type { OrgLandingPageProps, OrgLandingPageTheme } from './types';

  interface Props {
    orgName: string;
    logoUrl?: string;
    footerLinks: OrgLandingPageProps['footerLinks'];
    footerText: string;
    variant: OrgLandingPageTheme;
  }

  let { orgName, logoUrl, footerLinks, footerText, variant }: Props = $props();
</script>

{#if variant === 'minimal'}
  <footer
    class="ui:py-12 ui:px-8 ui:max-w-[1200px] ui:mx-auto ui:border-t ui:border-border/50 ui:flex ui:flex-col ui:md:flex-row ui:items-center ui:justify-between ui:gap-4 ui:text-sm ui:text-muted-foreground"
  >
    <a href="/" class="ui:font-semibold ui:text-xl ui:text-foreground ui:flex ui:items-center ui:gap-2 ui:no-underline">
      {#if logoUrl}
        <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto" />
      {/if}
      {orgName}
    </a>
    <div class="ui:flex ui:flex-wrap ui:justify-center ui:gap-8">
      {#each footerLinks as link}
        <a href={link.href} class="ui:hover:text-foreground ui:transition-colors">{link.label}</a>
      {/each}
    </div>
    <p>{footerText}</p>
  </footer>
{:else}
  <footer class="ui:bg-foreground ui:text-background/60 ui:py-16 ui:px-6">
    <div class="ui:max-w-7xl ui:mx-auto ui:flex ui:flex-col ui:md:flex-row ui:items-center ui:justify-between ui:gap-8">
      <a
        href="/"
        class="ui:font-black ui:text-2xl ui:text-background ui:tracking-tighter ui:flex ui:items-center ui:gap-3 ui:no-underline"
      >
        {#if logoUrl}
          <img src={logoUrl} alt={orgName} class="ui:h-8 ui:w-auto ui:grayscale ui:brightness-200" />
        {/if}
        {orgName}
      </a>
      <div class="ui:flex ui:flex-wrap ui:justify-center ui:gap-8">
        {#each footerLinks as link}
          <a href={link.href} class="ui:hover:text-background ui:font-medium ui:transition-colors">{link.label}</a>
        {/each}
      </div>
      <p class="ui:text-sm">{footerText}</p>
    </div>
  </footer>
{/if}
