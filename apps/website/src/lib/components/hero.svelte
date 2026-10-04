<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { MachineTrainingLine } from '@cio/ui/custom/animation/machines';
  import CtaButton from './ui/cta-button.svelte';
</script>

<section class="relative px-4 pt-20 md:px-6 lg:pt-[108px]">
  <div
    class="rounded-t-wash relative mx-auto max-w-[1400px] overflow-hidden bg-[linear-gradient(135deg,#f7f9fc_0%,#eef2fa_60%,#e5ecf7_100%)] px-6 pt-16 pb-16 md:px-10 lg:pt-24 lg:pb-24"
  >
    <div class="cio-dotfield pointer-events-none absolute inset-0" aria-hidden="true"></div>
    <div
      class="hero-machine pointer-events-none absolute top-0 -right-40 hidden h-[760px] w-[1240px] opacity-30 md:block lg:-right-24"
      aria-hidden="true"
    >
      <MachineTrainingLine class="h-full w-full" />
    </div>
    <div
      class="pointer-events-none absolute right-0 bottom-0 left-0 h-40 bg-gradient-to-b from-transparent to-white"
      aria-hidden="true"
    ></div>

    <div class="max-w-content relative z-10 mx-auto">
      <h1 class="text-display max-w-[1040px] text-center text-balance text-gray-950 lg:text-left">
        The simplest way to run training
        <em class="text-blue-700 not-italic">across your entire company</em>
      </h1>

      <div class="mt-8 flex flex-col items-center text-center lg:items-start lg:text-left">
        <p class="text-lead max-w-[580px]">
          Run employee training, customer education, and partner onboarding from one place, with certifications, your
          own domain, and an AI tutor in every lesson.
        </p>

        <div class="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
          <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">Book a Demo</Button>
          <CtaButton href="/signup" variant="secondary">Start free</CtaButton>
        </div>
      </div>
    </div>

    <div class="max-w-content relative z-30 mx-auto mt-16 w-full">
      <div class="overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
        <img
          src="https://assets.cdn.clsrio.com/www/home/hero-academy.jpeg"
          alt="Branded customer academy on a custom domain with catalog, cohorts, and AI tutor"
          width="2560"
          height="1440"
          class="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  </div>
</section>

<style>
  .hero-machine {
    --machine-ink: var(--color-blue-700);
    --machine-face: #eef2fa;
  }
</style>
