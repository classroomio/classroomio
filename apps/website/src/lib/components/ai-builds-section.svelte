<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import LayoutTemplate from '@lucide/svelte/icons/layout-template';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import Terminal from '@lucide/svelte/icons/terminal';
  import Eyebrow from './ui/eyebrow.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  const lanes = [
    {
      Icon: LayoutTemplate,
      title: 'Pick a template',
      description: 'Product 101, onboarding, or expert track. Fill three fields, get a course draft.'
    },
    {
      Icon: MessagesSquare,
      title: 'Chat with the builder',
      description: 'Claude lives in the editor. It plans, drafts, and writes quizzes. You approve each step.'
    },
    {
      Icon: Terminal,
      title: 'Use your own agent',
      description: 'Drive course authoring from Cursor, Claude Code, Codex, or OpenCode via MCP.'
    }
  ];

  const agents = [
    { name: 'Cursor', logo: 'https://assets.cdn.clsrio.com/www/home/cursor-logo.png' },
    { name: 'Claude Code', logo: 'https://assets.cdn.clsrio.com/www/home/claude-logo.svg' },
    { name: 'Codex', logo: 'https://assets.cdn.clsrio.com/www/home/codex-logo.png' },
    { name: 'OpenCode', logo: 'https://assets.cdn.clsrio.com/www/home/opencode-logo.svg' }
  ];
</script>

<Section class="bg-gray-50">
  <BlurFade once>
    <SectionHeader
      eyebrow="AI authoring"
      eyebrowClass="text-blue-700"
      lede="Feed it your docs, policies, videos, and internal knowledge. AI drafts the structure, lessons, and quizzes. You review and approve every step before learners see it."
      ledeClass="text-gray-500"
    >
      {#snippet title()}
        AI that turns company knowledge into trainings that drive <em class="text-blue-700 not-italic"
          >business outcomes</em
        >
      {/snippet}
    </SectionHeader>
  </BlurFade>

  <BlurFade delay={0.1} once>
    <div class="mt-12 w-full overflow-hidden rounded-xl bg-white ring-1 ring-gray-200">
      <img
        src="https://assets.cdn.clsrio.com/www/home/ai-course-builder.jpeg"
        alt="Course builder: plan, approve, implement. Templates, in-editor chat, and MCP."
        class="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </div>
  </BlurFade>

  <div class="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
    {#each lanes as lane, i}
      <BlurFade delay={0.05 * i + 0.15} once>
        <div>
          <div class="flex size-10 items-center justify-center rounded-md bg-gray-100 text-gray-950">
            <lane.Icon size={20} strokeWidth={1.8} />
          </div>
          <h3 class="text-card-title mt-5 font-medium text-gray-950">{lane.title}</h3>
          <p class="mt-2 max-w-[320px] text-[15px] leading-relaxed text-gray-500">{lane.description}</p>
        </div>
      </BlurFade>
    {/each}
  </div>

  <BlurFade delay={0.3} once>
    <div class="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-200 pt-6">
      <Eyebrow size="sm" class="text-gray-500">Works with</Eyebrow>
      {#each agents as agent}
        <div class="flex items-center gap-1.5">
          <img src={agent.logo} alt="{agent.name} logo" class="h-4 w-4 rounded-full" />
          <span class="text-sm text-gray-600">{agent.name}</span>
        </div>
      {/each}
    </div>
  </BlurFade>
</Section>
