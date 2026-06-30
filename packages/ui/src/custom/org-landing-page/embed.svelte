<script lang="ts">
  import type { OrgLandingPageLabels, OrgLandingPageTheme, LandingPageEmbed } from './types';
  import SecondaryActionButton from './secondary-action-button.svelte';
  import EditableLandingSection from './editable-section.svelte';
  import { sanitizeEmbedHtml } from '../../tools/sanitize';

  let {
    embed,
    variant = 'minimal',
    labels
  }: {
    embed?: LandingPageEmbed;
    variant?: OrgLandingPageTheme;
    labels?: OrgLandingPageLabels;
  } = $props();
</script>

{#if embed}
  <EditableLandingSection sectionKey="embed">
    {#if variant === 'terminal'}
      <section class="ui:py-24 ui:px-6" style="border-top: 1px solid #1c1f28; background: #06070a;">
        <div class="ui:mx-auto ui:max-w-[1120px]">
          <p
            class="ui:font-mono ui:text-[11px] ui:tracking-[0.12em] ui:uppercase ui:mb-3 ui:inline-flex ui:items-center ui:gap-2"
            style="color: var(--landing-accent);"
          >
            <span
              class="ui:size-1.5 ui:rounded-full"
              style="background: var(--landing-accent); box-shadow: 0 0 12px var(--landing-accent);"
            ></span>
            {labels?.embedEyebrow ?? 'Embed'}
          </p>
          <h3
            class="ui:text-[36px] ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-4"
            style="color: #e9eaed; line-height: 1.1; letter-spacing: -0.025em;"
          >
            {embed.title}
          </h3>
          {#if embed.description?.trim()}
            <p class="ui:max-w-xl ui:m-0 ui:mb-6 ui:text-[15px]" style="color: #9da1ab;">
              {embed.description}
            </p>
          {/if}
          {#if embed.secondaryAction?.label && embed.secondaryAction?.href}
            <div class="ui:mb-8">
              <SecondaryActionButton href={embed.secondaryAction.href} label={embed.secondaryAction.label} {variant} />
            </div>
          {/if}
          {#if embed.code}
            <div
              class="ui:rounded-xl ui:overflow-hidden ui:max-w-[820px]"
              style="border: 1px solid #262a35; background: #0f1218; box-shadow: 0 30px 90px -30px rgba(0,0,0,0.7);"
            >
              <div class="ui:p-5 ui:overflow-x-auto" style="color: #e9eaed;">
                {@html sanitizeEmbedHtml(embed.code)}
              </div>
            </div>
          {/if}
        </div>
      </section>
    {:else if variant === 'editorial'}
      <section class="ui:py-24 ui:md:py-28 ui:px-6 ui:md:px-8 ui:bg-[#f4f3ed]">
        <div class="ui:mx-auto ui:max-w-[1240px] ui:flex ui:flex-col ui:items-center ui:gap-6 ui:text-center">
          <h3
            class="ui:text-3xl ui:md:text-[40px] ui:font-medium ui:tracking-tight ui:m-0 ui:text-[#1a1a1a]"
            style="line-height: 1.1; letter-spacing: -0.025em;"
          >
            {embed.title}
          </h3>
          {#if embed.description?.trim()}
            <p class="ui:max-w-xl ui:text-center ui:text-base ui:leading-relaxed ui:text-[#76746c] ui:m-0">
              {embed.description}
            </p>
          {/if}
          {#if embed.secondaryAction?.label && embed.secondaryAction?.href}
            <SecondaryActionButton href={embed.secondaryAction.href} label={embed.secondaryAction.label} {variant} />
          {/if}
          {#if embed.code}
            <div class="ui:flex ui:w-full ui:justify-center">
              {@html sanitizeEmbedHtml(embed.code)}
            </div>
          {/if}
        </div>
      </section>
    {:else}
      <section class="ui:py-12 ui:px-6 ui:md:px-8">
        <div class="ui:mx-auto ui:flex ui:max-w-7xl ui:flex-col ui:items-center ui:gap-6 ui:text-center">
          <h3 class="ui:text-center ui:text-2xl ui:font-semibold ui:tracking-tight">{embed.title}</h3>
          {#if embed.description?.trim()}
            <p class="ui:max-w-3xl ui:text-center ui:text-base ui:leading-7 ui:text-[var(--landing-fg-muted)]">
              {embed.description}
            </p>
          {/if}
          {#if embed.secondaryAction?.label && embed.secondaryAction?.href}
            <SecondaryActionButton href={embed.secondaryAction.href} label={embed.secondaryAction.label} {variant} />
          {/if}
          {#if embed.code}
            <div class="ui:flex ui:w-full ui:justify-center">
              {@html sanitizeEmbedHtml(embed.code)}
            </div>
          {/if}
        </div>
      </section>
    {/if}
  </EditableLandingSection>
{/if}
