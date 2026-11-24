<script lang="ts">
  import type { Snippet } from 'svelte';
  import OnboardingLogo from './onboarding-logo.svelte';
  import TestimonialPanel from './testimonial-panel.svelte';

  interface Props {
    tagline?: string;
    contentClass?: string;
    children: Snippet;
  }

  let { tagline, contentClass = 'max-w-xl', children }: Props = $props();
</script>

<div class="ui:bg-background grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
  <div class="relative flex flex-col px-4 lg:px-12">
    <header class="flex justify-center pt-6 md:block">
      <OnboardingLogo {tagline} class="pt-0 md:pt-0" />
    </header>

    <div class="flex flex-1 items-center justify-center py-4 md:pt-12 md:pb-10">
      <div class="w-full {contentClass}">
        {@render children()}
      </div>
    </div>
  </div>

  <TestimonialPanel />
</div>
