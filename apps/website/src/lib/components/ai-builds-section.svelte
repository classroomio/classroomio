<script>
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import LayoutTemplate from '@lucide/svelte/icons/layout-template';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import Terminal from '@lucide/svelte/icons/terminal';

  const lanes = [
    {
      Icon: LayoutTemplate,
      title: 'Pick a template',
      description: 'Product 101, onboarding, or expert track. Fill three fields, get a course draft.'
    },
    {
      Icon: MessagesSquare,
      title: 'Chat with the builder',
      description: 'Claude lives in the editor. It plans, drafts, and writes quizzes — you approve each step.'
    },
    {
      Icon: Terminal,
      title: 'Use your own agent',
      description: 'Drive course authoring from Cursor, Claude Code, Codex, or OpenCode via MCP.'
    }
  ];

  const agents = [
    { name: 'Cursor', logo: '/cursor-logo.png' },
    { name: 'Claude Code', logo: '/claude-logo.svg' },
    { name: 'Codex', logo: '/codex-logo.png' },
    { name: 'OpenCode', logo: '/opencode-logo.svg' }
  ];
</script>

<section class="bg-gray-50 px-6 py-12 lg:px-12 lg:py-16">
  <div class="mx-auto max-w-[1100px]">
    <BlurFade once>
      <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">AI authoring</div>
      <h2 class="max-w-[680px] text-[clamp(1.75rem,3vw,2.6rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
        Build entire courses with AI.
      </h2>
      <p class="mt-3 max-w-[560px] text-sm leading-relaxed text-gray-500">
        Generate the structure, lessons, and quizzes from your docs — then review and approve every step before it
        ships. Three ways in. Pick whichever fits your team.
      </p>
    </BlurFade>

    <BlurFade delay={0.1} once>
      <div class="mx-auto mt-10 w-full max-w-[1100px]">
        <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
          <img
            src="/ai-course-builder.jpeg"
            alt="Course builder — plan, approve, implement. Templates, in-editor chat, and MCP."
            class="block h-auto w-full"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </BlurFade>

    <div class="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
      {#each lanes as lane, i}
        <BlurFade delay={0.05 * i + 0.15} once>
          <div>
            <div class="text-gray-950">
              <lane.Icon size={20} strokeWidth={1.6} />
            </div>
            <h3 class="mt-3 text-sm font-medium text-gray-950 lg:text-base">{lane.title}</h3>
            <p class="mt-1.5 max-w-[280px] text-xs leading-relaxed text-gray-500 lg:text-sm">{lane.description}</p>
          </div>
        </BlurFade>
      {/each}
    </div>

    <BlurFade delay={0.3} once>
      <div class="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-gray-200 pt-6">
        <span class="text-[10px] font-medium tracking-widest text-gray-500 uppercase">Works with</span>
        {#each agents as agent}
          <div class="flex items-center gap-1.5">
            <img src={agent.logo} alt="{agent.name} logo" class="h-4 w-4 rounded-full" />
            <span class="text-xs text-gray-600">{agent.name}</span>
          </div>
        {/each}
      </div>
    </BlurFade>
  </div>
</section>
