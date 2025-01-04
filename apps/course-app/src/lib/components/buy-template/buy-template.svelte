<script lang="ts">
  import { buttonVariants } from '$lib/components/ui/button';
  import { ShimmerButton } from '$lib/components/animation/shimmerbutton';
  import * as Dialog from '$lib/components/ui/dialog';
  import { cn } from '$lib/utils';
  import BadgeCheck from 'lucide-svelte/icons/badge-check';

  const PAYMENT_LINK = 'https://buy.stripe.com/3csbJZ4O9bfl2R26ot';

  const whatYouGet = [
    'A custom template for your SAAS/Course',
    'A 101 course on how to use your SAAS',
    'Deploy to Vercel or Selfhost',
    'Request 1 revision',
    'Get first draft in 48 hours'
  ];

  let { ctaLabel = 'Learn More', ctaClass = '' } = $props();
</script>

<Dialog.Root>
  <!-- <span
    class="absolute inset-0 z-30 flex items-center justify-center bg-black/50 opacity-0 transition-all duration-500 hover:opacity-80"
  >
</span> -->
  <Dialog.Trigger class={cn(buttonVariants({ variant: 'default' }), `z-20 ${ctaClass}`)}>
    {ctaLabel}
  </Dialog.Trigger>

  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>Buy A Custom Template</Dialog.Title>
      <Dialog.Description>
        Place an order for a custom template and we will ship it in 48 hours.
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <p>What you get for <strong>ONLY $50</strong>:</p>
      <ul>
        {#each whatYouGet as item}
          <li class="mb-2 flex items-center gap-2">
            <BadgeCheck class="text-green-700" />
            {item}
          </li>
        {/each}
      </ul>
    </div>
    <Dialog.Footer>
      <ShimmerButton
        href={PAYMENT_LINK}
        target="_blank"
        rel="noopener noreferrer"
        class="w-full px-6 shadow-2xl"
      >
        <span
          class="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white lg:text-lg dark:from-white dark:to-slate-900/10"
        >
          Buy ($50)
        </span>
      </ShimmerButton>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
