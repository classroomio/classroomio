<script lang="ts">
  import type { OrgLandingPageTheme, LandingPageEmbed } from './types';
  import SecondaryActionButton from './secondary-action-button.svelte';
  import { BlurFade } from '../animation/blurfade';

  let { embed, variant = 'minimal' }: { embed?: LandingPageEmbed; variant?: OrgLandingPageTheme } = $props();
</script>

{#if embed}
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
