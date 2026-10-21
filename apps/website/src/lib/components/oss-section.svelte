<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Github from '@lucide/svelte/icons/github';
  import Server from '@lucide/svelte/icons/server';
  import Coins from '@lucide/svelte/icons/coins';
  import CtaButton from './ui/cta-button.svelte';
  import NotchCard from './ui/notch-card.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

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

<Section class="bg-white">
  <BlurFade once>
    <SectionHeader
      eyebrow="Open source"
      eyebrowClass="text-blue-700"
      ledeClass="text-gray-500"
      lede="AGPL on GitHub. Self-host or use ours. Bring your own AI keys."
    >
      {#snippet title()}Read it. Fork it. Run it.{/snippet}
    </SectionHeader>
  </BlurFade>

  <div class="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
    {#each lanes as lane, i}
      <BlurFade delay={0.08 * i} once class="h-full">
        <NotchCard class="h-full bg-gray-50">
          <div
            class="mb-4 flex size-10 items-center justify-center rounded-md bg-white text-blue-700 ring-1 ring-gray-200"
          >
            <lane.Icon size={20} strokeWidth={1.8} />
          </div>
          <h3 class="text-card-title font-medium text-gray-950">{lane.title}</h3>
          <p class="mt-2 text-[15px] leading-relaxed text-gray-500">{lane.description}</p>
        </NotchCard>
      </BlurFade>
    {/each}
  </div>

  <div class="mt-10 flex flex-wrap items-center justify-center gap-3">
    <CtaButton
      href="/github"
      target="_blank"
      rel="noopener noreferrer"
      class="bg-gray-950 hover:bg-blue-700 hover:brightness-100"
    >
      <Github size={16} />
      Star on GitHub
      {#if stars}<span class="text-blue-300">{stars}</span>{/if}
    </CtaButton>
    <CtaButton
      variant="secondary"
      href="https://classroomio.com/docs/self-hosted/docker"
      target="_blank"
      rel="noopener noreferrer"
      class="hover:border-gray-950 hover:brightness-100"
    >
      Self-hosting guide →
    </CtaButton>
  </div>
</Section>
