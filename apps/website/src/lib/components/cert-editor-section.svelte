<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import ImagePlaceholder from './image-placeholder.svelte';
</script>

<section class="bg-white px-6 py-16 lg:px-12 lg:py-24">
  <div class="mx-auto max-w-[1100px]">
    <BlurFade delay={0} once>
      <div class="mb-10 max-w-[620px]">
        <div class="mb-3 text-xs font-medium tracking-widest text-blue-700 uppercase">Certificate templates</div>
        <h2 class="text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight">
          Design certificates that
          <em class="text-blue-700 not-italic">look like yours.</em>
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          A real design canvas — drag elements, swap brand colours and fonts, configure the ID format. Issue PDFs and
          PNGs learners actually want to share.
        </p>
      </div>
    </BlurFade>

    <BlurFade delay={0.1} once>
      <ImagePlaceholder
        suggestedFile="/static/certificate-editor.png"
        caption="Screenshot of the certificate template editor"
        aspect="aspect-[16/9]"
      />
    </BlurFade>
  </div>
</section>
