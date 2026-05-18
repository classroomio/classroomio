<script>
  const integrations = [
    {
      icon: '🔌',
      title: 'REST API',
      description:
        'Full API access to every object in your LMS. Create users, enroll learners, pull completions. All programmatically, at scale.'
    },
    {
      icon: '🤖',
      title: 'MCP server',
      description:
        'Drive course authoring from Cursor, Claude Code, Codex, or OpenCode. The MCP server exposes the API surface as agent tools — list, create, update, publish.'
    },
    {
      icon: '🪝',
      title: 'Webhooks',
      description:
        'Real-time event notifications for every action. Course enrolled, lesson completed, certificate issued. Push to any endpoint instantly.'
    }
  ];
</script>

<section class="bg-gray-50 px-6 py-16 lg:px-12 lg:py-24">
  <div class="mx-auto max-w-[1100px]">
    <div class="mb-3.5 text-xs font-medium tracking-widest text-blue-700 uppercase">Automate the boring parts</div>
    <h2 class="mb-4 text-[clamp(2rem,3vw,2.8rem)] leading-[1.15] font-medium tracking-tight">
      Set it up once.<br />Let it run.
    </h2>
    <p class="mb-14 max-w-[520px] text-base leading-relaxed text-gray-500 lg:text-lg">
      Connect ClassroomIO to everything you already use. New hire joins Slack? They're enrolled. Course completed? Your
      HRIS knows.
    </p>

    <div class="grid grid-cols-1 gap-5 md:grid-cols-3">
      {#each integrations as item}
        <div
          class="rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-200 hover:border-gray-950 hover:shadow-lg hover:shadow-black/5"
        >
          <div class="mb-4 text-3xl">{item.icon}</div>
          <h3 class="mb-2 text-base font-medium">{item.title}</h3>
          <p class="text-sm leading-relaxed text-gray-500">{item.description}</p>
        </div>
      {/each}
    </div>
  </div>
</section>
