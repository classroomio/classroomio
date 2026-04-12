<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { ShinnyText } from '@cio/ui/custom/animation';
  import Copy from 'lucide-svelte/icons/copy';
  import { cn } from '$lib/utils';

  let { command = 'pnpx @classroomio/course-app' } = $props();
</script>

<button
  onclick={() => {
    navigator.clipboard.writeText(command);
    toast('Copied to clipboard 😉');
  }}
  class={cn(
    'group z-10 mt-5 rounded-full border  border-white/50 bg-neutral-700 transition-all  ease-in hover:cursor-pointer hover:bg-neutral-700 hover:text-white'
  )}
>
  <ShinnyText
    class="animate-gradient inline-flex items-center justify-center bg-linear-to-r from-[#ffaa40]  via-[#9c40ff] to-[#ffaa40] bg-size-[var(--bg-size)_100%]  bg-clip-text px-4 py-1 text-transparent text-white transition ease-out hover:text-neutral-400 hover:duration-300"
  >
    <span>{command}</span>

    <Copy class="ml-2 size-3" />
  </ShinnyText>
</button>
