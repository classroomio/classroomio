<script>
  import { Badge } from '@cio/ui/base/badge';
  import { TENANT_ROOT_DOMAIN } from '@cio/utils/constants';
  import Section from './ui/section.svelte';
</script>

<Section id="student-dashboard" class="bg-black text-center text-white" innerClass="flex flex-col items-center">
  <Badge class="px-4! py-2! font-mono text-sm! underline">yourorg.{TENANT_ROOT_DOMAIN}</Badge>
  <h1 class="text-title mt-6 font-medium text-balance">Your Student Dashboard</h1>

  <p class="text-lead max-w-lede mt-[18px] text-pretty text-gray-400">
    Once you create an account, you get a dedicated dashboard where your students can access all their courses,
    assignments, and more.
  </p>

  <div class="relative mt-14 w-full">
    <video
      class="floating mx-auto w-full rounded-xl lg:w-[85%]"
      autoplay
      loop
      muted
      defaultMuted
      playsinline
      preload="auto"
    >
      <source src="https://video.cdn.clsrio.com/student-dashboard.mp4" type="video/mp4" />
      <track kind="captions" />
    </video>
  </div>
</Section>
