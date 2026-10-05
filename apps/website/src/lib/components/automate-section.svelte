<script>
  import NotchCard from './ui/notch-card.svelte';
  import Section from './ui/section.svelte';
  import SectionHeader from './ui/section-header.svelte';

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
        'Drive course authoring from Cursor, Claude Code, Codex, or OpenCode. The MCP server exposes the API surface as agent tools: list, create, update, publish.'
    },
    {
      icon: '🪝',
      title: 'Webhooks',
      description:
        'Real-time event notifications for every action. Course enrolled, lesson completed, certificate issued. Push to any endpoint instantly.'
    }
  ];
</script>

<Section class="bg-gray-50">
  <SectionHeader
    eyebrow="Automate the boring parts"
    eyebrowClass="text-blue-700"
    ledeClass="text-gray-500"
    lede="Connect ClassroomIO to everything you already use. New hire joins Slack? They're enrolled. Course completed? Your HRIS knows."
  >
    {#snippet title()}Set it up once.<br />Let it run.{/snippet}
  </SectionHeader>

  <div class="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
    {#each integrations as item}
      <NotchCard class="h-full bg-white" notchClass="bg-gray-50">
        <div class="mb-4 flex size-10 items-center justify-center rounded-md bg-gray-100 text-xl">{item.icon}</div>
        <h3 class="text-card-title mb-2 font-medium">{item.title}</h3>
        <p class="text-[15px] leading-relaxed text-gray-500">{item.description}</p>
      </NotchCard>
    {/each}
  </div>
</Section>
