<script lang="ts">
  import { CodeBlock, HeroSubtitle, McpServerSection, PageHeader, PageSignupCTA } from '$lib/components';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
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
  <PageHeader className="px-6 lg:px-12">
    <div class="mx-auto max-w-[1100px]">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <Code2 size={14} class="text-blue-700" />
        Developer reference
      </Badge>
      <h1 class="max-w-[820px] text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
        API, Webhooks, MCP.
        <em class="text-blue-700 not-italic">No integration tax.</em>
      </h1>
      <HeroSubtitle>
        ClassroomIO ships with a public REST API, signed Webhooks, and an MCP server. No closed marketplace, no "premium
        connector" plans. Build the integration that fits your stack.
      </HeroSubtitle>
      <div class="mt-8 flex flex-wrap items-center gap-3">
        <Button href="https://classroomio.com/docs/api">Read the API docs</Button>
        <Button href="/github" variant="outline">Star on GitHub</Button>
      </div>
    </div>
  </PageHeader>

  <!-- REST API -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
      <div>
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">REST API</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          Everything in the LMS is reachable over HTTP.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Bearer-token auth, JSON in, JSON out. Provision learners from your CRM, pull completion data into your
          warehouse, or build your own admin tooling on the same surface the dashboard uses.
        </p>

        <ul class="mt-6 space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-blue-700">→</span> Orgs, users, courses, lessons, exercises, submissions, certificates
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-blue-700">→</span> Per-org API keys, scoped permissions
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-blue-700">→</span> Cursor-based pagination, rate limits documented
          </li>
          <li class="flex items-start gap-2">
            <span class="mt-0.5 text-blue-700">→</span> Same endpoints whether you self-host or run on our cloud
          </li>
        </ul>
      </div>
      <CodeBlock
        fileName="enrol-a-learner.sh"
        lang="bash"
        codeLines={apiCurl}
        statusBar="POST · application/json · authenticated"
      />
    </div>
  </section>

  <!-- Webhooks -->
  <section class="bg-gray-50 px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-20">
      <CodeBlock
        fileName="webhook-payload.json"
        lang="JSON"
        codeLines={webhookSample}
        statusBar="signed with HMAC-SHA256 · retries up to 24h"
      />
      <div>
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Webhooks</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          Subscribe to the events you care about, instead of polling.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Every important state change posts to your endpoint, signed with your shared secret. We retry with exponential
          backoff, and you can replay any event from the dashboard.
        </p>

        <div class="mt-6 flex flex-wrap gap-2">
          {#each events as event}
            <span class="rounded-full border border-gray-200 bg-white px-3 py-1 font-mono text-xs text-blue-700">
              {event}
            </span>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <McpServerSection />

  <!-- Self-host -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Self-host</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          Or run the whole thing in your own VPC.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          ClassroomIO is open source on GitHub. You can self-host the dashboard, the API, the AI assistant, and the MCP
          server, and bring your own AI keys. It's the same product with the same API surface.
        </p>

        <div class="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="https://classroomio.com/docs/self-hosted/docker"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-medium text-white no-underline transition-all hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Self-hosting guide →
          </a>
          <a
            href="/github"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-950 no-underline transition-all hover:border-gray-950"
          >
            <Github size={16} />
            View the source
          </a>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <p class="text-xs font-medium tracking-widest text-gray-500 uppercase">Stack</p>
        <ul class="mt-4 space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-3">
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-medium text-blue-700"
              >API</span
            >
            Hono on Node, Drizzle, Postgres
          </li>
          <li class="flex items-start gap-3">
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-medium text-blue-700"
              >UI</span
            >
            SvelteKit 2, Svelte 5, Tailwind v4
          </li>
          <li class="flex items-start gap-3">
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-medium text-blue-700"
              >AI</span
            >
            Bring your own keys for OpenAI, Anthropic, Google Gemini, or Moonshot
          </li>
          <li class="flex items-start gap-3">
            <span
              class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-medium text-blue-700"
              >MCP</span
            >
            Open-source server, <span class="font-mono text-xs">@classroomio/mcp</span>
          </li>
        </ul>
      </div>
    </div>
  </section>

  <PageSignupCTA
    header="Programmable from day one."
    subText="API, Webhooks, and an MCP server in the box. Self-host it or use the hosted version. Same surface either way."
    btnLabel="Read the docs"
    link="https://classroomio.com/docs/api"
    demo={false}
  />
</section>
