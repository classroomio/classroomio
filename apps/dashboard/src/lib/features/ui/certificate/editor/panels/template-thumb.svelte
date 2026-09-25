<script lang="ts">
  import type { CertificateTemplateId } from '@cio/certificates';

  interface Props {
    id: CertificateTemplateId;
  }

  let { id }: Props = $props();
</script>

{#if id === 'classique'}
  <div class="flex h-full w-full flex-col items-center justify-center bg-[#faf6ec] text-[#6b4513]">
    <span class="text-[18px] italic" style="font-family:'Bodoni Moda',serif">Classique</span>
    <span class="mt-1 text-[6px] tracking-[0.3em]" style="font-family:'Cinzel',serif">— EST 1892 —</span>
  </div>
{:else if id === 'brutalist'}
  <div class="flex h-full w-full items-end justify-start bg-[#f0ede4] p-2">
    <div
      class="w-full text-left leading-[0.85] text-black"
      style="font-family:'Archivo Black',sans-serif;font-size:18px"
    >
      RAW<br />
      <span class="text-[#ff4500] italic" style="font-family:'Playfair Display',serif;font-weight:400">form</span>
    </div>
  </div>
{:else if id === 'noir'}
  <div class="flex h-full w-full flex-col items-center justify-center bg-[#0e0e0e] text-[#d4af37]">
    <span class="text-[16px] text-[#f5f1e8] italic" style="font-family:'Playfair Display',serif">Noir</span>
    <span class="mt-1 text-[6px] tracking-[0.3em]" style="font-family:'Cinzel',serif">★ ATELIER ★</span>
  </div>
{:else if id === 'poster'}
  <div class="relative h-full w-full overflow-hidden bg-[#fef2dc]">
    <span class="absolute -top-3 -right-4 h-10 w-10 rounded-full bg-[#ff5722]"></span>
    <span class="absolute -bottom-3 -left-3 h-9 w-9 rounded-full bg-[#1e3a8a]"></span>
    <div class="relative z-10 flex h-full w-full items-center justify-center">
      <span class="font-black italic" style="font-family:'Playfair Display',serif;font-size:18px">Poster</span>
    </div>
  </div>
{:else}
  <div class="flex h-full w-full flex-col items-center justify-center bg-white text-black">
    <span class="text-[18px] font-light italic" style="font-family:'Cormorant Garamond',serif">Minimal</span>
    <span class="mt-1 block h-px w-7 bg-black"></span>
    <span class="mt-1 text-[6px] tracking-[0.3em]" style="font-family:'JetBrains Mono',monospace">N°001</span>
  </div>
{/if}
