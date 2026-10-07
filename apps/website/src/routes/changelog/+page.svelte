<script lang="ts">
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import { MachineCertificatePress } from '@cio/ui/custom/animation/machines';
  import { PageSignupCTA, ChangelogFeatured, ChangelogTimeline } from '$lib/components';
  import { CtaButton } from '$lib/components/ui';

  let { data } = $props();

  const latestEntry = $derived(data.entries[0]);
  const earlierEntries = $derived(data.entries.slice(1));
</script>

<svelte:head>
  <title>Changelog | ClassroomIO</title>
  <meta
    name="description"
    content="Every new feature, improvement and fix we ship to ClassroomIO, updated every week."
  />
</svelte:head>

<section>
  <div class="relative px-4 pt-[72px] md:px-6 lg:pt-[88px]">
    <div
      class="rounded-t-wash relative mx-auto max-w-[1400px] overflow-hidden bg-[linear-gradient(135deg,#f7f9fc_0%,#eef2fa_60%,#e5ecf7_100%)] px-6 py-16 md:px-10 lg:py-24"
    >
      <div class="cio-dotfield pointer-events-none absolute inset-0" aria-hidden="true"></div>

      <div
        class="changelog-machine pointer-events-none absolute top-1/2 -right-16 hidden h-[560px] w-[820px] -translate-y-1/2 opacity-30 md:block lg:-right-8"
        aria-hidden="true"
      >
        <MachineCertificatePress class="h-full w-full" />
      </div>
      <div
        class="pointer-events-none absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-b from-transparent to-gray-50"
        aria-hidden="true"
      ></div>

      <div
        class="max-w-content relative z-10 mx-auto flex flex-col items-center text-center lg:items-start lg:text-left"
      >
        <BlurFade duration={0.6} once>
          <h1 class="text-display max-w-[1040px] text-balance text-gray-950">
            Shipping every week.
            <em class="text-blue-700 not-italic">See what's new.</em>
          </h1>
        </BlurFade>
        <BlurFade duration={0.6} delay={0.15} once>
          <p class="text-lead mt-6 max-w-[580px] text-pretty">
            New features, improvements and fixes in ClassroomIO, straight from the team.
          </p>
        </BlurFade>
      </div>
    </div>
  </div>

  <div class="bg-gray-50 px-6 py-16 md:px-10 md:py-24">
    {#if latestEntry}
      <div class="mx-auto flex w-full max-w-[1400px] flex-col gap-16">
        <ChangelogFeatured entry={latestEntry} />

        {#if earlierEntries.length > 0}
          <div class="max-w-lede mx-auto w-full">
            <h2 class="text-label mb-8 font-mono text-gray-500 uppercase">Earlier updates</h2>
            <ChangelogTimeline entries={earlierEntries} />
          </div>
        {/if}
      </div>
      <div class="mt-12 flex justify-center">
        <CtaButton variant="secondary" href="https://feedback.classroomio.com/updates" arrow>
          See older updates
        </CtaButton>
      </div>
    {:else}
      <div class="mx-auto flex max-w-[480px] flex-col items-center gap-5 text-center">
        <p class="text-lead text-gray-500">We couldn't load the changelog right now.</p>
        <CtaButton href="https://feedback.classroomio.com/updates" arrow>View updates on UserJot</CtaButton>
      </div>
    {/if}
  </div>

  <PageSignupCTA
    header="Turn what your team already knows into training."
    subText="ClassroomIO helps you convert docs, policies, videos, and internal knowledge into courses, quizzes, certificates, and completion evidence."
    btnLabel="Start for free"
    link="/signup"
    demo={false}
  />
</section>

<style>
  .changelog-machine {
    --machine-ink: var(--color-blue-700);
    --machine-face: #eef2fa;
  }
</style>
