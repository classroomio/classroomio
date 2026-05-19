<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Github from '@lucide/svelte/icons/github';
  import Server from '@lucide/svelte/icons/server';
  import Coins from '@lucide/svelte/icons/coins';

  /** @type {{ stars?: number }} */
  let { stars = 0 } = $props();

  const lanes = [
    {
      Icon: Github,
      title: 'AGPL on GitHub',
      description: 'Dashboard, API, AI assistant, MCP server. All of it.'
    },
    {
      Icon: Server,
      title: 'Self-host or hosted',
      description: 'Run it in your VPC, or let us run it. Same product.'
    },
    {
      Icon: Coins,
      title: 'No per-seat fees',
      description: 'Pricing scales with workspaces, not headcount.'
    }
  ];
</script>

<section class="bg-white px-6 py-16 lg:px-12 lg:py-24">
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-20">
      <BlurFade once>
        <div>
          <div class="mb-3 text-xs font-medium tracking-widest text-blue-700 uppercase">Open source</div>
          <h2 class="text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight">
            Read it. Fork it. Run it.
          </h2>
        </div>
      </BlurFade>

      <BlurFade delay={0.1} once>
        <p class="text-base leading-relaxed text-gray-500 lg:text-lg">
          AGPL on GitHub. Self-host or use ours. Bring your own AI keys.
        </p>
      </BlurFade>
    </div>

    <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
      {#each lanes as lane, i}
        <BlurFade delay={0.08 * i} once>
          <div class="h-full rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <div
              class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 ring-1 ring-gray-200"
            >
              <lane.Icon size={20} strokeWidth={1.75} />
            </div>
            <h3 class="text-base font-medium text-gray-950">{lane.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-gray-500">{lane.description}</p>
          </div>
        </BlurFade>
      {/each}
    </div>

    <div class="mt-8 flex flex-wrap items-center gap-3">
      <a
        href="/github"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-medium text-white no-underline transition-all hover:-translate-y-0.5 hover:bg-blue-700"
      >
        <Github size={16} />
        Star on GitHub
        {#if stars}<span class="text-blue-300">{stars}</span>{/if}
      </a>
      <a
        href="https://classroomio.com/docs/self-hosting"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-950 no-underline transition-all hover:border-gray-950"
      >
        Self-hosting guide →
      </a>
    </div>
  </div>
</section>
