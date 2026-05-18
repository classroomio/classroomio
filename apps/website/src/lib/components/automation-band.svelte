<script>
  import BoxedGrid from './boxed-grid.svelte';
  import Webhook from '@lucide/svelte/icons/webhook';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Sparkles from '@lucide/svelte/icons/sparkles';

  const lanes = [
    {
      Icon: Code2,
      title: 'REST API',
      description: 'Every object, reachable over HTTP. Provision users, pull completions, build your own tools.'
    },
    {
      Icon: Webhook,
      title: 'Webhooks',
      description: 'Signed events on enrollment, completion, certificate. Retries on failure.'
    },
    {
      Icon: Sparkles,
      title: 'MCP server',
      description: 'Course authoring as agent tools. Works with Cursor, Claude Code, Codex, OpenCode.'
    }
  ];
</script>

<section class="bg-gray-50 px-6 py-12 lg:px-12 lg:py-16">
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-8 max-w-[640px]">
      <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">For developers</div>
      <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">API, Webhooks, MCP.</h2>
      <p class="mt-3 text-sm leading-relaxed text-gray-500">
        No middleware in between. Wire it into the stack you already have.
      </p>
    </div>

    <BoxedGrid items={lanes} cols={3} padding="p-5 lg:p-6">
      {#snippet cell(lane)}
        <div class="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <lane.Icon size={16} strokeWidth={1.75} />
        </div>
        <h3 class="text-sm font-medium text-gray-950 lg:text-base">{lane.title}</h3>
        <p class="mt-1.5 text-xs leading-relaxed text-gray-500 lg:text-sm">{lane.description}</p>
      {/snippet}
    </BoxedGrid>

    <div class="mt-6">
      <a
        href="/automation"
        class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-950 no-underline transition-all hover:border-gray-950"
      >
        See the developer reference →
      </a>
    </div>
  </div>
</section>
