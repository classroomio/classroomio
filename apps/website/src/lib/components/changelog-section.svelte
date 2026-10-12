<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import type { ChangelogEntry } from '$lib/utils/types';
  import ChangelogFeatured from './changelog-featured.svelte';
  import CtaButton from './ui/cta-button.svelte';
  import NotchCard from './ui/notch-card.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  let latestEntry = $state<ChangelogEntry | null>(null);
  let hasLoaded = $state(false);

  onMount(async () => {
    try {
      const response = await fetch('/api/changelog?limit=1');
      const payload = (await response.json()) as { entries?: ChangelogEntry[] };

      latestEntry = payload.entries?.[0] ?? null;
    } catch (error) {
      console.error('ChangelogSection error:', error);
    } finally {
      hasLoaded = true;
    }
  });
</script>

{#if !hasLoaded || latestEntry}
  <Section id="changelog" class="bg-gray-50">
    <SectionHeader
      eyebrow="Changelog"
      eyebrowClass="text-blue-700"
      lede="We ship improvements to ClassroomIO every single week. Here's the latest."
      ledeClass="text-gray-500"
      titleClass=""
    >
      {#snippet title()}We're shipping new features every week{/snippet}
    </SectionHeader>

    <div class="mt-12">
      {#if latestEntry}
        <ChangelogFeatured entry={latestEntry} />
      {:else}
        <NotchCard class="bg-white" notchClass="bg-gray-50">
          <div class="grid items-center gap-8 lg:grid-cols-[2.4fr_1fr] lg:gap-12">
            <Skeleton class="aspect-video w-full" />
            <div class="flex flex-col gap-4">
              <Skeleton class="h-4 w-40" />
              <Skeleton class="h-8 w-3/4" />
              <Skeleton class="h-4 w-full" />
              <Skeleton class="h-4 w-5/6" />
            </div>
          </div>
        </NotchCard>
      {/if}
    </div>

    <div class="mt-8 flex justify-center">
      <CtaButton href="https://feedback.classroomio.com/updates" arrow>See all updates</CtaButton>
    </div>
  </Section>
{/if}
