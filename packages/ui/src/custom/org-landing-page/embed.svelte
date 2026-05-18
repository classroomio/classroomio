<script lang="ts">
  import type { OrgLandingPageTheme, LandingPageEmbed } from './types';
  import SecondaryActionButton from './secondary-action-button.svelte';
  import { BlurFade } from '../animation/blurfade';
  import EditableLandingSection from './editable-section.svelte';

  let { embed, variant = 'minimal' }: { embed?: LandingPageEmbed; variant?: OrgLandingPageTheme } = $props();
</script>

{#if embed}
  <EditableLandingSection sectionKey="embed">
    {#if variant === 'terminal'}
      <section class="ui:py-24 ui:px-6" style="border-top: 1px solid #1c1f28; background: #06070a;">
        <div class="ui:mx-auto ui:max-w-[1120px]">
          <BlurFade delay={0} once={true}>
            <p
              class="ui:font-mono ui:text-[11px] ui:tracking-[0.12em] ui:uppercase ui:mb-3 ui:inline-flex ui:items-center ui:gap-2"
              style="color: var(--primary);"
            >
              <span
                class="ui:size-1.5 ui:rounded-full"
                style="background: var(--primary); box-shadow: 0 0 12px var(--primary);"
              ></span>
              Embed
            </p>
          </BlurFade>
          <BlurFade delay={0.08} once={true}>
            <h3
              class="ui:text-[36px] ui:font-semibold ui:tracking-tight ui:m-0 ui:mb-4"
              style="color: #e9eaed; line-height: 1.1; letter-spacing: -0.025em;"
            >
              {embed.title}
            </h3>
          </BlurFade>
          {#if embed.description?.trim()}
            <BlurFade delay={0.16} once={true}>
              <p class="ui:max-w-xl ui:m-0 ui:mb-6 ui:text-[15px]" style="color: #9da1ab;">
                {embed.description}
              </p>
            </BlurFade>
          {/if}
          {#if embed.secondaryAction?.label && embed.secondaryAction?.href}
            <BlurFade delay={0.22} once={true}>
              <div class="ui:mb-8">
                <SecondaryActionButton
                  href={embed.secondaryAction.href}
                  label={embed.secondaryAction.label}
                  {variant}
                />
              </div>
            </BlurFade>
          {/if}
          {#if embed.code}
            <BlurFade delay={0.3} once={true}>
              <div
                class="ui:rounded-xl ui:overflow-hidden ui:max-w-[820px]"
                style="border: 1px solid #262a35; background: #0f1218; box-shadow: 0 30px 90px -30px rgba(0,0,0,0.7);"
              >
                <div class="ui:p-5 ui:overflow-x-auto" style="color: #e9eaed;">
                  {@html embed.code}
                </div>
              </div>
            </BlurFade>
          {/if}
        </div>
      </section>
    {:else}
      <section class="ui:py-12 ui:px-6 ui:md:px-8">
        <div class="ui:mx-auto ui:flex ui:max-w-7xl ui:flex-col ui:items-center ui:gap-6 ui:text-center">
          <BlurFade delay={0} once={true}>
            <h3 class="ui:text-center ui:text-2xl ui:font-semibold ui:tracking-tight">{embed.title}</h3>
          </BlurFade>
          {#if embed.description?.trim()}
            <BlurFade delay={0.12} once={true}>
              <p class="ui:max-w-3xl ui:text-center ui:text-base ui:leading-7 ui:text-muted-foreground">
                {embed.description}
              </p>
            </BlurFade>
          {/if}
          {#if embed.secondaryAction?.label && embed.secondaryAction?.href}
            <BlurFade delay={0.2} once={true}>
              <SecondaryActionButton href={embed.secondaryAction.href} label={embed.secondaryAction.label} {variant} />
            </BlurFade>
          {/if}
          {#if embed.code}
            <BlurFade delay={0.28} once={true}>
              <div class="ui:flex ui:w-full ui:justify-center">
                {@html embed.code}
              </div>
            </BlurFade>
          {/if}
        </div>
      </section>
    {/if}
  </EditableLandingSection>
{/if}
