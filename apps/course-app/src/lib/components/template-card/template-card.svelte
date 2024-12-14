<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import ArrowUpRight from 'lucide-svelte/icons/arrow-up-right';

  interface Props {
    template: {
      name: string;
      image: string;
      url: string;
      github: string;
    };
  }
  let { template }: Props = $props();
</script>

<div class="mb-5 w-full max-w-[340px]">
  <Button
    href={template.url}
    variant="link"
    target="_blank"
    rel="noopener noreferrer"
    class="border-stroke-primary relative h-80 min-w-60 overflow-hidden rounded-md border border-solid p-0 transition-all duration-500 lg:h-96"
  >
    <span
      class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-all duration-500 hover:opacity-80"
    >
      <ArrowUpRight class="h-14 w-14 text-white" />
    </span>
    <img
      src={template.image}
      class="h-full w-full object-contain hover:opacity-10"
      alt={template.name}
    />
  </Button>
  <div>
    <h3 class="text-md font-bold">{template.name}</h3>
  </div>
</div>
