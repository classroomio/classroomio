<script lang="ts">
  import type { OrgLandingPageFooterConfig, OrgLandingPageTheme } from './types';
  import { getFooterTokens } from './landing-page-footer.tokens';
  import FooterSocialIcon from './footer-social-icon.svelte';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import EditableLandingSection from './editable-section.svelte';

  interface Props {
    orgName: string;
    logoUrl?: string;
    footer: OrgLandingPageFooterConfig;
    variant: OrgLandingPageTheme;
  }

  let { orgName, logoUrl, footer, variant }: Props = $props();

  const tokens = $derived(getFooterTokens(variant));

  const bottom = $derived(footer.bottom);
  const bottomLinks = $derived(bottom?.links ?? []);
  const bottomText = $derived((bottom?.text ?? '').trim());

  function isGridMode(config: OrgLandingPageFooterConfig): boolean {
    const tagline = (config.brand.tagline ?? '').trim();
    const copyright = (config.brand.copyright ?? '').trim();

    return config.columns.length > 0 || config.brand.socials.length > 0 || Boolean(tagline) || Boolean(copyright);
  }

  const showGrid = $derived(isGridMode(footer));

  const showBottomRowInGrid = $derived(bottomText.length > 0 || bottomLinks.length > 0);

  function hasCta(column: OrgLandingPageFooterConfig['columns'][number]): boolean {
    const cta = column.cta;
    if (!cta) {
      return false;
    }

    return Boolean(cta.label.trim() && cta.href.trim());
  }
</script>

<EditableLandingSection sectionKey="footer">
  <footer class={tokens.root}>
    {#if variant === 'terminal'}
      <div
        class="ui:pointer-events-none ui:absolute ui:inset-x-[-10%] ui:bottom-[-50%] ui:h-[380px]"
        style="
        background:
          radial-gradient(ellipse 60% 80% at 30% 50%, color-mix(in oklab, #f59e0b 35%, transparent) 0%, transparent 60%),
          radial-gradient(ellipse 50% 60% at 70% 60%, color-mix(in oklab, #ef4444 30%, transparent) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 50% 80%, color-mix(in oklab, #c026d3 22%, transparent) 0%, transparent 60%);
        filter: blur(40px);
      "
        aria-hidden="true"
      ></div>
    {/if}
    <div class="ui:relative {tokens.container}">
      {#if showGrid}
        {#snippet gridInner()}
          <div
            class="ui:grid ui:grid-cols-1 ui:gap-y-10 ui:gap-x-8 ui:sm:grid-cols-2 ui:md:gap-x-12 ui:md:gap-y-12 ui:md:grid-cols-[minmax(0,1.4fr)_repeat(auto-fit,minmax(140px,1fr))]"
          >
            <div class="ui:sm:col-span-2 ui:md:col-span-1 ui:min-w-0">
              <a href="/" class="{tokens.brandName} ui:cursor-pointer">
                {#if logoUrl}
                  <img src={logoUrl} alt="" class={tokens.logoImg} />
                {/if}
                <span class="ui:break-words">{orgName}</span>
              </a>
              {#if footer.brand.tagline?.trim()}
                <p class={tokens.brandTagline}>{footer.brand.tagline}</p>
              {/if}
              {#if footer.brand.socials.length > 0}
                <ul class={tokens.socialWrap}>
                  {#each footer.brand.socials as social (social.href + social.platform)}
                    <li class="ui:list-none">
                      <a
                        href={social.href}
                        class="{tokens.socialIcon} ui:cursor-pointer"
                        target="_blank"
                        rel="noreferrer noopener"
                        aria-label={social.platform}
                      >
                        <FooterSocialIcon platform={social.platform} class="ui:size-4 ui:md:size-[1.125rem]" />
                      </a>
                    </li>
                  {/each}
                </ul>
              {/if}
              {#if footer.brand.copyright?.trim()}
                <p class="{tokens.brandTagline} ui:mt-3">{footer.brand.copyright}</p>
              {/if}
            </div>

            {#each footer.columns as column (column.id)}
              <div class="ui:min-w-0">
                {#if column.heading.trim()}
                  <h3 class={tokens.columnHeading}>{column.heading}</h3>
                {/if}
                <ul class="ui:list-none ui:m-0 ui:p-0 ui:space-y-1">
                  {#each column.links as link (link.id)}
                    <li>
                      <a href={link.href} class="{tokens.columnLink} ui:cursor-pointer">{link.label}</a>
                    </li>
                  {/each}
                </ul>
                {#if hasCta(column)}
                  <a href={column.cta!.href} class="{tokens.columnCta} ui:cursor-pointer">
                    {column.cta!.label}
                    <ArrowRightIcon class="ui:size-4 ui:shrink-0" aria-hidden="true" />
                  </a>
                {/if}
              </div>
            {/each}
          </div>
        {/snippet}

        {@render gridInner()}

        {#if showBottomRowInGrid}
          {#if variant === 'classic' && tokens.bottomHairline}
            <div class={tokens.bottomHairline} aria-hidden="true"></div>
          {/if}
          <div class={tokens.bottomRow}>
            {#if bottomText}
              <p class={tokens.bottomText}>{bottomText}</p>
            {/if}
            {#if bottomLinks.length > 0}
              <div class={tokens.bottomLinksWrap}>
                {#each bottomLinks as link (link.id)}
                  <a href={link.href} class="{tokens.bottomLink} ui:cursor-pointer">{link.label}</a>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {:else}
        <div class={tokens.compactRow}>
          <a href="/" class="{tokens.brandName} ui:cursor-pointer">
            {#if logoUrl}
              <img src={logoUrl} alt="" class={tokens.logoImg} />
            {/if}
            <span class="ui:break-words">{orgName}</span>
          </a>
          {#if bottomLinks.length > 0}
            <div
              class="ui:flex ui:flex-wrap ui:justify-start ui:gap-6 ui:md:justify-center ui:md:gap-8 ui:w-full ui:md:w-auto"
            >
              {#each bottomLinks as link (link.id)}
                <a href={link.href} class="{tokens.bottomLink} ui:cursor-pointer">{link.label}</a>
              {/each}
            </div>
          {/if}
          {#if bottomText}
            <p class="{tokens.bottomText} ui:w-full ui:md:w-auto ui:text-left ui:md:text-right">{bottomText}</p>
          {/if}
        </div>
      {/if}
    </div>
  </footer>
</EditableLandingSection>
