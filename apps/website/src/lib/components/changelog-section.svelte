<script lang="ts">
  import { onMount } from 'svelte';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import type { ChangelogEntry } from '$lib/utils/types';
  import ChangelogEntryCard from './changelog-entry-card.svelte';
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

    <div class="mx-auto mt-12 max-w-[720px]">
      <NotchCard class="bg-white" notchClass="bg-gray-50">
        {#if latestEntry}
          <ChangelogEntryCard entry={latestEntry} />
        {:else}
          <div class="flex flex-col gap-4">
            <Skeleton class="h-4 w-32" />
            <Skeleton class="h-7 w-3/4" />
            <Skeleton class="h-4 w-full" />
          </div>
        {/if}
      </NotchCard>
    </div>

    <div class="mt-8 flex justify-center">
      <CtaButton href="https://feedback.classroomio.com/updates" arrow>See all updates</CtaButton>
    </div>
  </Section>
{/if}
