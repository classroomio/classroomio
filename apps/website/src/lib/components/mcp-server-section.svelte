<script>
  import CodeBlock from './code-block.svelte';

  /**
   * Shared MCP server section — dark background, copy + mcp.json on left/right.
   * Used on /automation and /mcp-recipes.
   *
   * @typedef {Object} Props
   * @property {string} [eyebrow]
   * @property {string} [title]
   * @property {string} [description]
   * @property {boolean} [showTools]   Render the list of MCP tool names (default true)
   */

  /** @type {Props} */
  let {
    eyebrow = 'MCP server',
    title = 'Course authoring from your coding agent.',
    description = 'Connect Cursor, Claude Code, Codex, or OpenCode to ClassroomIO and let your agent draft courses, reorganise sections, generate exercises, and publish them without leaving your terminal.',
    showTools = true
  } = $props();

  const mcpJsonLines = [
    '<span class="text-slate-500">{</span>',
    '  <span class="text-sky-300">"mcpServers"</span><span class="text-slate-500">: {</span>',
    '    <span class="text-sky-300">"classroomio"</span><span class="text-slate-500">: {</span>',
    '      <span class="text-sky-300">"command"</span><span class="text-slate-500">:</span> <span class="text-emerald-300">"npx"</span><span class="text-slate-500">,</span>',
    '      <span class="text-sky-300">"args"</span><span class="text-slate-500">: [</span><span class="text-emerald-300">"-y"</span><span class="text-slate-500">,</span> <span class="text-emerald-300">"@classroomio/mcp"</span><span class="text-slate-500">],</span>',
    '      <span class="text-sky-300">"env"</span><span class="text-slate-500">: { </span><span class="text-sky-300">"CLASSROOMIO_API_KEY"</span><span class="text-slate-500">: </span><span class="text-emerald-300">"&lt;your-mcp-key&gt;"</span><span class="text-slate-500"> }</span>',
    '    <span class="text-slate-500">}</span>',
    '  <span class="text-slate-500">}</span>',
    '<span class="text-slate-500">}</span>'
  ];

  const mcpTools = [
    'list_org_courses',
    'create_course_draft',
    'create_course_draft_from_course',
    'update_course_draft',
    'publish_course_draft',
    'publish_course_draft_to_existing_course',
    'update_course_landing_page',
    'create_course_exercise',
    'create_course_exercise_from_template',
    'update_course_exercise',
    'reorder_course_content',
    'tag_courses',
    'tag_course_draft',
    'get_course_structure',
    'get_course_draft',
    'get_course_exercise',
    'list_course_exercises'
  ];
</script>

<section class="relative overflow-hidden bg-gray-950 px-6 py-12 text-white lg:px-12 lg:py-16">
  <div
    class="pointer-events-none absolute -top-[200px] -right-[200px] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(2,51,189,0.18)_0%,transparent_70%)]"
  ></div>

  <div class="relative mx-auto grid max-w-[1100px] grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
    <div>
      <div class="mb-2 text-xs font-medium tracking-widest text-blue-400 uppercase">{eyebrow}</div>
      <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight text-white">
        {title}
      </h2>
      <p class="mt-5 max-w-[520px] text-sm leading-relaxed text-gray-400">
        {description}
      </p>

      {#if showTools}
        <div class="mt-6">
          <p class="mb-3 text-[10px] tracking-wider text-gray-500 uppercase">Available tools</p>
          <div class="flex flex-wrap gap-2">
            {#each mcpTools as tool}
              <span
                class="rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-[11px] text-blue-300"
              >
                {tool}
              </span>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="relative">
      <div class="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <CodeBlock
          fileName="mcp.json"
          lang="JSON"
          codeLines={mcpJsonLines}
          statusBar="paste into your agent's MCP config"
        />
      </div>
    </div>
  </div>
</section>
