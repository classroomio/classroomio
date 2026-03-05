<script>
  import { Badge } from '@cio/ui/base/badge';
</script>

<section id="student-dashboard" class="bg-black px-3 py-[10%] text-center text-white lg:px-0">
  <Badge class="px-4! py-2! text-sm! underline">yourorg.classroomio.com</Badge>
  <h1 class="mx-auto flex flex-col items-center gap-4 text-3xl leading-[1.5] font-normal md:text-4xl lg:text-6xl">
    Your Student Dashboard
  </h1>

  <p class="mx-auto mt-10 px-4 text-base leading-6 tracking-wide text-gray-400 lg:mt-6 lg:w-2/4 lg:p-0">
    Once you create an account, you get a dedicated dashboard where your students can access all their courses,
    assignments, and more.
  </p>

  <div class="relative my-5 md:my-10">
    <video
      class="floating mx-auto w-[85%] rounded-lg shadow-lg lg:w-[70%]"
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
</section>
