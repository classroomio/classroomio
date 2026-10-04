<script lang="ts">
  import { CodeBlock, HeroSubtitle, McpServerSection, PageHeader, PageSignupCTA } from '$lib/components';
  import { CtaButton, MachineCard, Section, SectionHeader } from '$lib/components/ui';
  import { Badge } from '@cio/ui/base/badge';
  import { MachineEventWire } from '@cio/ui/custom/animation/machines';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Github from '@lucide/svelte/icons/github';

  const apiCurl = [
    '<span class="text-slate-500"># Enroll a learner in a course</span>',
    '<span class="text-pink-400">curl</span> <span class="text-emerald-300">"https://api.classroomio.com/v1/enrollments"</span> \\',
    '  <span class="text-sky-300">-H</span> <span class="text-emerald-300">"Authorization: Bearer $CIO_API_KEY"</span> \\',
    '  <span class="text-sky-300">-H</span> <span class="text-emerald-300">"Content-Type: application/json"</span> \\',
    '  <span class="text-sky-300">-d</span> <span class="text-emerald-300">\'{ "courseId": "crs_…", "userId": "usr_…" }\'</span>'
  ];

  const webhookSample = [
    '<span class="text-slate-500">// POST https://yourapp.com/webhooks/cio</span>',
    '<span class="text-slate-500">{</span>',
    '  <span class="text-sky-300">"event"</span><span class="text-slate-500">:</span> <span class="text-emerald-300">"certificate.issued"</span><span class="text-slate-500">,</span>',
    '  <span class="text-sky-300">"orgId"</span><span class="text-slate-500">:</span> <span class="text-emerald-300">"org_acme"</span><span class="text-slate-500">,</span>',
    '  <span class="text-sky-300">"data"</span><span class="text-slate-500">: {</span>',
    '    <span class="text-sky-300">"learnerId"</span><span class="text-slate-500">:</span> <span class="text-emerald-300">"usr_…"</span><span class="text-slate-500">,</span>',
    '    <span class="text-sky-300">"courseId"</span><span class="text-slate-500">:</span> <span class="text-emerald-300">"crs_…"</span><span class="text-slate-500">,</span>',
    '    <span class="text-sky-300">"certificateUrl"</span><span class="text-slate-500">:</span> <span class="text-emerald-300">"https://learn.acme.com/v/CIO-…"</span>',
    '  <span class="text-slate-500">},</span>',
    '  <span class="text-sky-300">"createdAt"</span><span class="text-slate-500">:</span> <span class="text-emerald-300">"2026-05-15T12:04:18Z"</span>',
    '<span class="text-slate-500">}</span>'
  ];

  const events = [
    'user.created',
    'enrollment.created',
    'enrollment.completed',
    'lesson.completed',
    'exercise.submitted',
    'exercise.graded',
    'certificate.issued',
    'cohort.completed',
    'course.published',
    'course.unpublished'
  ];
</script>

<section class="bg-white">
  <PageHeader className="px-6 md:px-10">
    <div class="max-w-content mx-auto grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
      <div>
        <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
          <Code2 size={14} class="text-blue-700" />
          Developer reference
        </Badge>
        <h1 class="text-h2 font-medium text-balance text-gray-950 lg:text-[64px]">
          API, Webhooks, MCP.
          <em class="text-blue-700 not-italic">No integration tax.</em>
        </h1>
        <HeroSubtitle>
          ClassroomIO ships with a public REST API, signed Webhooks, and an MCP server. No closed marketplace, no
          "premium connector" plans. Build the integration that fits your stack.
        </HeroSubtitle>
        <div class="mt-9 flex flex-wrap items-center gap-3">
          <CtaButton href="https://classroomio.com/docs/api">Read the API docs</CtaButton>
          <CtaButton href="/github" variant="secondary">Star on GitHub</CtaButton>
        </div>
      </div>

      <MachineCard>
        <MachineEventWire
          class="h-64 w-full md:h-80"
          label="Webhook events travelling from ClassroomIO to a CRM and a help desk, retrying after no response"
        />
      </MachineCard>
    </div>
  </PageHeader>

  <Section innerClass="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
    <div>
      <SectionHeader
        align="left"
        size="h3"
        eyebrow="REST API"
        eyebrowClass="text-blue-700"
        titleClass=""
        ledeClass="text-gray-500"
        lede="Bearer-token auth, JSON in, JSON out. Provision learners from your CRM, pull completion data into your warehouse, or build your own admin tooling on the same surface the dashboard uses."
      >
        {#snippet title()}Everything in the LMS is reachable over HTTP.{/snippet}
      </SectionHeader>

      <ul class="mt-8 space-y-3 text-[15px] text-gray-700">
        <li class="flex items-start gap-2">
          <span class="text-blue-700">→</span> Orgs, users, courses, lessons, exercises, submissions, certificates
        </li>
        <li class="flex items-start gap-2">
          <span class="text-blue-700">→</span> Per-org API keys, scoped permissions
        </li>
        <li class="flex items-start gap-2">
          <span class="text-blue-700">→</span> Cursor-based pagination, rate limits documented
        </li>
        <li class="flex items-start gap-2">
          <span class="text-blue-700">→</span> Same endpoints whether you self-host or run on our cloud
        </li>
      </ul>
    </div>
    <CodeBlock
      fileName="enrol-a-learner.sh"
      lang="bash"
      codeLines={apiCurl}
      statusBar="POST · application/json · authenticated"
    />
  </Section>

  <Section class="bg-gray-50" innerClass="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
    <CodeBlock
      fileName="webhook-payload.json"
      lang="JSON"
      codeLines={webhookSample}
      statusBar="signed with HMAC-SHA256 · retries up to 24h"
    />
    <div>
      <SectionHeader
        align="left"
        size="h3"
        eyebrow="Webhooks"
        eyebrowClass="text-blue-700"
        titleClass=""
        ledeClass="text-gray-500"
        lede="Every important state change posts to your endpoint, signed with your shared secret. We retry with exponential backoff, and you can replay any event from the dashboard."
      >
        {#snippet title()}Subscribe to the events you care about, instead of polling.{/snippet}
      </SectionHeader>

      <div class="mt-8 flex flex-wrap gap-2">
        {#each events as event}
          <span class="rounded-full border border-gray-200 bg-white px-3 py-1 font-mono text-xs text-blue-700">
            {event}
          </span>
        {/each}
      </div>
    </div>
  </Section>

  <McpServerSection />

  <Section innerClass="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
    <div>
      <SectionHeader
        align="left"
        size="h3"
        eyebrow="Self-host"
        eyebrowClass="text-blue-700"
        titleClass=""
        ledeClass="text-gray-500"
        lede="ClassroomIO is open source on GitHub. You can self-host the dashboard, the API, the AI assistant, and the MCP server, and bring your own AI keys. It's the same product with the same API surface."
      >
        {#snippet title()}Or run the whole thing in your own VPC.{/snippet}
      </SectionHeader>

      <div class="mt-9 flex flex-wrap items-center gap-3">
        <CtaButton
          href="https://classroomio.com/docs/self-hosted/docker"
          target="_blank"
          rel="noopener noreferrer"
          class="bg-gray-950 hover:bg-blue-700 hover:brightness-100"
        >
          Self-hosting guide →
        </CtaButton>
        <CtaButton
          href="/github"
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
          class="hover:border-gray-950 hover:brightness-100"
        >
          <Github size={16} />
          View the source
        </CtaButton>
      </div>
    </div>

    <div class="rounded-xl border border-gray-200 bg-gray-50 p-6 md:p-8">
      <p class="text-label font-mono text-gray-500 uppercase">Stack</p>
      <ul class="mt-5 space-y-4 text-[15px] text-gray-700">
        <li class="flex items-start gap-3">
          <span
            class="flex h-6 min-w-9 shrink-0 items-center justify-center rounded-xs bg-blue-50 px-1.5 font-mono text-[10px] font-medium text-blue-700"
            >API</span
          >
          Hono on Node, Drizzle, Postgres
        </li>
        <li class="flex items-start gap-3">
          <span
            class="flex h-6 min-w-9 shrink-0 items-center justify-center rounded-xs bg-blue-50 px-1.5 font-mono text-[10px] font-medium text-blue-700"
            >UI</span
          >
          SvelteKit 2, Svelte 5, Tailwind v4
        </li>
        <li class="flex items-start gap-3">
          <span
            class="flex h-6 min-w-9 shrink-0 items-center justify-center rounded-xs bg-blue-50 px-1.5 font-mono text-[10px] font-medium text-blue-700"
            >AI</span
          >
          Bring your own keys for OpenAI, Anthropic, Google Gemini, or Moonshot
        </li>
        <li class="flex items-start gap-3">
          <span
            class="flex h-6 min-w-9 shrink-0 items-center justify-center rounded-xs bg-blue-50 px-1.5 font-mono text-[10px] font-medium text-blue-700"
            >MCP</span
          >
          Open-source server, <span class="font-mono text-xs">@classroomio/mcp</span>
        </li>
      </ul>
    </div>
  </Section>

  <PageSignupCTA
    header="Programmable from day one."
    subText="API, Webhooks, and an MCP server in the box. Self-host it or use the hosted version. Same surface either way."
    btnLabel="Read the docs"
    link="https://classroomio.com/docs/api"
    demo={false}
  />
</section>
