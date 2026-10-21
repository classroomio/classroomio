<script lang="ts">
  import type { OrgLandingPageFooterConfig } from '../types';
  import { safeHref } from '../safe-href';
  import FooterSocialIcon from '../footer-social-icon.svelte';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import EditableLandingSection from '../editable-section.svelte';

  interface Props {
    orgName: string;
    logoUrl?: string;
    footer: OrgLandingPageFooterConfig;
  }

  let { orgName, logoUrl, footer }: Props = $props();

  const tagline = $derived((footer.brand.tagline ?? '').trim());
  const copyright = $derived((footer.brand.copyright ?? '').trim());
  const bottomText = $derived((footer.bottom?.text ?? '').trim());
  const bottomLinks = $derived(footer.bottom?.links ?? []);

  function hasCta(column: OrgLandingPageFooterConfig['columns'][number]): boolean {
    const cta = column.cta;
    if (!cta) return false;

    return Boolean(cta.label.trim() && cta.href.trim());
  }
</script>

<EditableLandingSection sectionKey="footer">
  <footer class="ui:bg-[var(--landing-card)] ui:border-t ui:border-[var(--landing-border)]">
    <!-- The frame's side rules continue through the footer. -->
    <div
      class="ui:max-w-[1200px] ui:mx-auto ui:border-x ui:border-[var(--landing-border)] ui:px-5 ui:md:px-8 ui:pt-14 ui:pb-9"
    >
      <!--
        Brand keeps a fixed track and the columns wrap beside it, so any number of columns lays out
        without collapsing the brand — the shared footer's auto-fit grid cannot do this.
      -->
      <div class="ui:flex ui:flex-wrap ui:gap-x-12 ui:gap-y-10">
        <div class="ui:w-full ui:md:w-[240px] ui:shrink-0">
          <a
            href="/"
            class="ui:flex ui:items-center ui:gap-2.5 ui:no-underline ui:text-[var(--landing-fg)] ui:cursor-pointer"
          >
            {#if logoUrl}
              <img src={logoUrl} alt="" class="ui:h-7 ui:w-auto ui:max-w-[150px] ui:object-contain" />
            {:else}
              <span class="ui:h-5 ui:w-5 ui:shrink-0 ui:rounded-[6px] ui:bg-[var(--landing-fg)] ui:relative">
                <span class="ui:absolute ui:inset-[5px] ui:rounded-[3px] ui:bg-[var(--landing-card)]"></span>
              </span>
            {/if}
            <span class="ui:font-semibold ui:text-[15px] ui:tracking-[-0.022em] ui:break-words">{orgName}</span>
          </a>

          {#if tagline}
            <p
              class="ui:m-0 ui:mt-3.5 ui:max-w-[32ch] ui:text-[13.5px] ui:leading-relaxed ui:text-[var(--landing-fg-muted)]"
            >
              {tagline}
            </p>
          {/if}

          {#if footer.brand.socials.length > 0}
            <ul class="ui:m-0 ui:mt-5 ui:p-0 ui:list-none ui:flex ui:flex-wrap ui:gap-3.5">
              {#each footer.brand.socials as social (social.href + social.platform)}
                <li class="ui:list-none">
                  <a
                    href={safeHref(social.href)}
                    class="ui:inline-flex ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:transition-colors ui:no-underline ui:cursor-pointer"
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={social.platform}
                  >
                    <FooterSocialIcon platform={social.platform} class="ui:size-[1.125rem]" />
                  </a>
                </li>
              {/each}
            </ul>
          {/if}

          {#if copyright}
            <p class="ui:m-0 ui:mt-4 ui:text-[13px] ui:text-[var(--landing-fg-faint)]">{copyright}</p>
          {/if}
        </div>

        {#if footer.columns.length > 0}
          <div
            class="ui:flex-1 ui:min-w-0 ui:grid ui:grid-cols-2 ui:sm:grid-cols-3 ui:lg:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] ui:gap-x-8 ui:gap-y-10"
          >
            {#each footer.columns as column (column.id)}
              <div class="ui:min-w-0">
                <p class="ui:m-0 ui:mb-3.5 ui:text-[13.5px] ui:font-semibold ui:text-[var(--landing-fg)]">
                  {column.heading}
                </p>
                <ul class="ui:m-0 ui:p-0 ui:list-none">
                  {#each column.links as link (link.id)}
                    <li class="ui:list-none">
                      <a
                        href={safeHref(link.href)}
                        class="ui:block ui:py-1 ui:text-[13.5px] ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:transition-colors ui:no-underline ui:break-words"
                      >
                        {link.label}
                      </a>
                    </li>
                  {/each}
                </ul>
                {#if hasCta(column)}
                  <a
                    href={safeHref(column.cta?.href)}
                    class="ui:inline-flex ui:items-center ui:gap-1.5 ui:mt-3.5 ui:text-[13.5px] ui:font-medium ui:text-[var(--landing-fg)] ui:no-underline ui:hover:underline"
                  >
                    {column.cta?.label}
                    <ArrowRightIcon class="ui:size-3.5" />
                  </a>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>

      {#if bottomText || bottomLinks.length > 0}
        <div
          class="ui:mt-12 ui:pt-6 ui:border-t ui:border-dashed ui:border-[var(--landing-border)] ui:flex ui:flex-col ui:gap-3 ui:sm:flex-row ui:sm:items-center ui:sm:justify-between ui:text-[13px] ui:text-[var(--landing-fg-faint)]"
        >
          {#if bottomText}
            <span class="ui:break-words">{bottomText}</span>
          {/if}
          {#if bottomLinks.length > 0}
            <div class="ui:flex ui:flex-wrap ui:gap-x-6 ui:gap-y-2 ui:sm:justify-end">
              {#each bottomLinks as link (link.id)}
                <a
                  href={safeHref(link.href)}
                  class="ui:text-[13px] ui:text-[var(--landing-fg-muted)] ui:hover:text-[var(--landing-fg)] ui:transition-colors ui:no-underline"
                >
                  {link.label}
                </a>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </footer>
</EditableLandingSection>
