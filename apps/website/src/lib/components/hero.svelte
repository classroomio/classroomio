<script>
  import { Button } from '@cio/ui/base/button';
  import ParticleField from './particle-field.svelte';
</script>

<section class="relative overflow-hidden px-6 pt-32 pb-16 lg:px-12 lg:pt-40 lg:pb-24">
  <!-- Soft off-white base with the faintest blue undertone -->
  <div
    class="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#f7f9fc_0%,#eef2fa_60%,#e5ecf7_100%)]"
  ></div>

  <!-- Bordered clouds, top-left — crisp SVG silhouettes -->
  <div class="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
    <!-- Cloud 1 (largest) -->
    <svg
      class="cio-cloud-1 absolute top-6 left-3 h-24 w-[220px] md:top-8 md:left-5 md:h-36 md:w-[340px] lg:top-10 lg:left-6 lg:h-48 lg:w-[460px]"
      viewBox="0 0 240 110"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 22 80
           C 22 60, 42 50, 62 56
           C 68 36, 100 30, 116 52
           C 130 32, 168 38, 174 60
           C 196 56, 216 68, 214 82
           C 214 96, 196 102, 174 96
           C 164 106, 130 106, 120 96
           C 110 106, 78 106, 66 94
           C 46 100, 22 96, 22 80 Z"
        fill="white"
        stroke="#cbd5e1"
        stroke-width="0.75"
      />
    </svg>

    <!-- Cloud 2 (medium) -->
    <svg
      class="cio-cloud-2 absolute top-24 left-40 h-16 w-[150px] md:top-32 md:left-56 md:h-24 md:w-[230px] lg:top-40 lg:left-72 lg:h-36 lg:w-[320px]"
      viewBox="0 0 200 90"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 16 64
           C 16 48, 34 40, 52 46
           C 58 30, 86 26, 100 44
           C 114 28, 144 34, 150 52
           C 168 48, 184 58, 182 70
           C 182 82, 168 86, 150 82
           C 142 90, 114 90, 106 82
           C 98 90, 70 90, 60 80
           C 42 86, 16 82, 16 64 Z"
        fill="white"
        stroke="#cbd5e1"
        stroke-width="0.75"
      />
    </svg>

    <!-- Cloud 3 (small, lower) -->
    <svg
      class="cio-cloud-3 absolute top-40 left-16 h-14 w-[120px] md:top-56 md:left-20 md:h-20 md:w-[180px] lg:top-72 lg:left-28 lg:h-28 lg:w-[240px]"
      viewBox="0 0 180 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M 14 56
           C 14 42, 30 36, 44 40
           C 50 26, 76 22, 88 38
           C 100 24, 128 30, 134 46
           C 150 42, 166 52, 164 62
           C 164 72, 150 76, 134 72
           C 128 80, 100 80, 92 72
           C 84 80, 60 80, 52 70
           C 36 76, 14 72, 14 56 Z"
        fill="white"
        stroke="#cbd5e1"
        stroke-width="0.75"
      />
    </svg>
  </div>

  <!-- Particle cloud — same component used in the footer at lower intensity -->
  <ParticleField class="pointer-events-none absolute inset-0 z-[2] hidden h-full w-full md:block" />

  <!-- Bottom fade to next section -->
  <div
    class="pointer-events-none absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-b from-transparent to-white"
  ></div>

  <div class="relative z-10 mx-auto flex max-w-[1100px] flex-col items-center text-center">
    <h1 class="max-w-[820px] text-[clamp(2rem,4vw,3.25rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
      The simplest way to run training
      <em class="text-blue-700 not-italic">across your entire company</em>
    </h1>

    <p class="mt-5 max-w-[580px] text-sm leading-relaxed lg:text-base">
      Run employee training, customer education, and partner onboarding from one place, with certifications, your own
      domain, and an AI tutor in every lesson.
    </p>

    <div class="mt-7 flex flex-wrap items-center justify-center gap-3">
      <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">Book a Demo</Button>
      <Button href="/signup" variant="outline">Start free</Button>
    </div>
  </div>

  <div class="relative z-30 mx-auto mt-14 w-full max-w-[1100px]">
    <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
      <img
        src="https://assets.cdn.clsrio.com/www/home/hero-academy.jpeg"
        alt="Branded customer academy on a custom domain — catalog, cohorts, AI tutor"
        width="2560"
        height="1440"
        class="block h-auto w-full"
        loading="eager"
        decoding="async"
      />
    </div>
  </div>
</section>

<style>
  .cio-cloud-1 {
    animation: cio-cloud-drift-1 22s ease-in-out infinite;
  }
  .cio-cloud-2 {
    animation: cio-cloud-drift-2 28s ease-in-out infinite;
  }
  .cio-cloud-3 {
    animation: cio-cloud-drift-3 26s ease-in-out infinite;
  }
  @keyframes cio-cloud-drift-1 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.9;
    }
    50% {
      transform: translate(28px, 10px) scale(1.04);
      opacity: 1;
    }
  }
  @keyframes cio-cloud-drift-2 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.85;
    }
    50% {
      transform: translate(36px, -8px) scale(1.06);
      opacity: 1;
    }
  }
  @keyframes cio-cloud-drift-3 {
    0%,
    100% {
      transform: translate(0, 0) scale(1);
      opacity: 0.8;
    }
    50% {
      transform: translate(-12px, 14px) scale(1.05);
      opacity: 0.95;
    }
  }
</style>
