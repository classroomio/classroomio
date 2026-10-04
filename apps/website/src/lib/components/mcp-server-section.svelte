<script>
  import CodeBlock from './code-block.svelte';
  import Eyebrow from './ui/eyebrow.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

  /**
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

{#snippet heading()}{title}{/snippet}

<Section
  class="relative overflow-hidden bg-gray-950 text-white"
  innerClass="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20"
>
  <div
    class="pointer-events-none absolute -top-[200px] -right-[200px] h-[500px] w-[500px] bg-[radial-gradient(circle,rgba(2,51,189,0.18)_0%,transparent_70%)]"
  ></div>

  <div class="relative">
    <SectionHeader
      align="left"
      size="h3"
      {eyebrow}
      eyebrowClass="text-blue-400"
      titleClass="text-white"
      ledeClass="text-gray-400"
      lede={description}
      title={heading}
    />

    {#if showTools}
      <div class="mt-8">
        <Eyebrow size="sm" class="mb-3 text-gray-500">Available tools</Eyebrow>
        <div class="flex flex-wrap gap-2">
          {#each mcpTools as tool}
            <span
              class="rounded-tag border border-white/10 bg-white/[0.05] px-2.5 py-1 font-mono text-[12px] text-blue-300"
            >
              {tool}
            </span>
          {/each}
        </div>
      </div>
    {/if}
  </div>

  <CodeBlock
    class="min-w-0"
    fileName="mcp.json"
    lang="JSON"
    codeLines={mcpJsonLines}
    statusBar="paste into your agent's MCP config"
  />
</Section>
