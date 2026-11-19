<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Eyebrow from './ui/eyebrow.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  const deployOptions = [
    {
      icon: '🚂',
      title: 'Railway',
      description: 'One-click deploy with our Railway template. Live in under 3 minutes.',
      href: 'https://railway.app'
    },
    {
      icon: '🐳',
      title: 'Docker Compose',
      description: 'Standard Docker setup for any Linux server or VPS. Full control.',
      href: '/github'
    },
    {
      icon: '❄️',
      title: 'Coolify',
      description: 'Self-hosted Heroku alternative. Deploy ClassroomIO alongside your stack.',
      href: 'https://coolify.io'
    }
  ];
</script>

<Section id="deploy" class="bg-white" innerClass="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
  <BlurFade once>
    <div>
      <SectionHeader
        align="left"
        size="h3"
        eyebrow="Deploy to your servers"
        eyebrowClass="text-blue-700"
        ledeClass="text-gray-500"
        lede="No SaaS lock-in. No per-seat pricing surprises. Deploy ClassroomIO wherever you run your infrastructure. Minutes, not days."
      >
        {#snippet title()}Your data.<br />Your servers.<br />Your call.{/snippet}
      </SectionHeader>

      <div class="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5">
        <Eyebrow size="sm" class="mb-2.5 text-gray-500">One-line deploy</Eyebrow>
        <code class="font-mono text-sm text-gray-950">docker compose up -d</code>
      </div>
    </div>
  </BlurFade>

  <div class="flex flex-col gap-4">
    {#each deployOptions as option, i}
      <BlurFade delay={0.1 * i} once>
        <a
          href={option.href}
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-5 rounded-xl border border-gray-200 p-6 text-gray-950 no-underline transition-colors hover:border-blue-700 hover:bg-blue-50"
        >
          <div
            class="flex size-10 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xl"
          >
            {option.icon}
          </div>
          <div>
            <h3 class="text-card-title mb-0.5 font-medium">{option.title}</h3>
            <p class="text-[15px] leading-relaxed text-gray-500">{option.description}</p>
          </div>
          <span class="ml-auto text-lg text-gray-400">→</span>
        </a>
      </BlurFade>
    {/each}
  </div>
</Section>
