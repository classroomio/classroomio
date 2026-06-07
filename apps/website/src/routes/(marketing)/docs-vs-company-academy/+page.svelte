<script lang="ts">
  import { PageHeader, PageSignupCTA, WorkflowSteps } from '$lib/components';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import AlertCircle from '@lucide/svelte/icons/alert-circle';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import BookOpen from '@lucide/svelte/icons/book-open';
  import Check from '@lucide/svelte/icons/check';
  import CheckCircle2 from '@lucide/svelte/icons/check-circle-2';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
  import FileText from '@lucide/svelte/icons/file-text';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Layers from '@lucide/svelte/icons/layers';
  import Route from '@lucide/svelte/icons/route';
  import Search from '@lucide/svelte/icons/search';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Users from '@lucide/svelte/icons/users';

  const quickVerdicts = [
    {
      Icon: FileText,
      title: 'Use documentation when the reader knows what they need.',
      description:
        'Docs are best for lookup, reference, troubleshooting, API details, product behavior, release notes, and anything a user needs to search in the moment.'
    },
    {
      Icon: GraduationCap,
      title: 'Use a company academy when the learner needs a guided path.',
      description:
        'Academies are best when people need onboarding, role-based training, practice, proof of completion, certification, or a repeatable learning journey.'
    }
  ];

  const comparisonRows = [
    {
      need: '"How do I do X?"',
      docs: true,
      academy: false,
      note: 'The person already has a task in mind and needs the fastest reliable answer.'
    },
    {
      need: '"Teach me the product from zero"',
      docs: false,
      academy: true,
      note: 'Beginners need sequencing, context, examples, and a clear path from first step to confident use.'
    },
    {
      need: '"Prove I am an expert"',
      docs: false,
      academy: true,
      note: 'Expertise needs assessment, completion records, certificates, or some visible proof of readiness.'
    },
    {
      need: '"Onboard a new partner team"',
      docs: false,
      academy: true,
      note: 'Partner onboarding usually needs role-based paths, assignments, progress tracking, and certification.'
    },
    {
      need: '"Look something up fast"',
      docs: true,
      academy: false,
      note: 'Lookup work should stay searchable, skimmable, linkable, and easy to update.'
    },
    {
      need: '"Make sure everyone completed required training"',
      docs: false,
      academy: true,
      note: 'Completion, reminders, renewals, and audit evidence belong in an academy or LMS.'
    },
    {
      need: '"Explain a technical reference"',
      docs: true,
      academy: false,
      note: 'API details, parameters, edge cases, and error codes work best as documentation.'
    },
    {
      need: '"Launch a repeatable customer education program"',
      docs: false,
      academy: true,
      note: 'A program needs structure: lessons, cohorts or audiences, assessments, certificates, and analytics.'
    }
  ];

  const docsUseCases = [
    'Product setup steps that users need to revisit',
    'API references, SDK details, Webhooks, limits, and errors',
    'Feature explanations and configuration options',
    'Troubleshooting articles and known issue workarounds',
    'Release notes, migration notes, and changelogs',
    'Short answers that support, success, and sales teams repeatedly send'
  ];

  const academyUseCases = [
    'New employee, customer, or partner onboarding',
    'Admin training for complex products or internal systems',
    'Certification for resellers, agencies, consultants, or power users',
    'Compliance training that needs proof, renewal, and audit evidence',
    'Feature adoption programs after a major product launch',
    'Role-based enablement for sales, support, implementation, or customer success teams'
  ];

  const decisionSignals = [
    {
      Icon: Search,
      title: 'If the audience is searching, write docs.',
      description:
        'Search intent usually means the person already has context. They need precision, not a course. Make the page easy to scan, link related topics, and keep it current.'
    },
    {
      Icon: Route,
      title: 'If the audience needs sequence, build an academy.',
      description:
        'Sequence matters when concepts depend on each other. A company academy can start with foundations, add practice, check understanding, then issue proof.'
    },
    {
      Icon: ClipboardCheck,
      title: 'If the business needs proof, build an academy.',
      description:
        'Docs can inform, but they rarely prove readiness. Use courses, assessments, completion records, and certificates when managers need to know who is trained.'
    },
    {
      Icon: Users,
      title: 'If different roles need different outcomes, build paths.',
      description:
        'A support agent, admin, reseller, and executive sponsor should not read the same long documentation tree. Academies let each role follow a purpose-built path.'
    }
  ];

  const hybridModel = [
    {
      title: 'Docs stay as the source of truth',
      description:
        'Keep canonical facts in documentation: product behavior, technical references, setup options, screenshots, limitations, and troubleshooting details.'
    },
    {
      title: 'Academy packages the learning journey',
      description:
        'Turn the most important docs into guided lessons with context, order, exercises, quizzes, examples, and certificates.'
    },
    {
      title: 'Support and success route people to the right layer',
      description:
        'Send advanced users to docs for quick answers. Send new users, partners, and internal teams to academy paths when they need structured training.'
    }
  ];

  const academySignals = [
    'People keep asking for onboarding calls even though docs exist.',
    'Customers read the docs but still do not adopt the full workflow.',
    'Managers ask who has completed training.',
    'Partners need certification before they sell or implement.',
    'Compliance, policy, or process training needs renewal evidence.',
    'Product changes require more than an announcement.'
  ];
</script>

<svelte:head>
  <title>Docs vs Company Academy | ClassroomIO</title>
  <meta
    name="description"
    content="A practical guide to when your company needs documentation, when it needs a company academy, and how both work together for onboarding, enablement, and certification."
  />
</svelte:head>

<section class="bg-white">
  <PageHeader className="px-6 lg:px-12">
    <div class="mx-auto flex max-w-[820px] flex-col items-center text-center">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <BookOpen size={14} class="text-blue-700" />
        Docs vs Company Academy
      </Badge>

      <h1 class="text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.08] font-medium tracking-tight text-gray-950">
        Documentation answers questions.
        <em class="text-blue-700 not-italic">A company academy teaches them to do the job.</em>
      </h1>

      <p class="mt-6 text-sm leading-relaxed lg:text-base">
        Most teams do not need to choose one forever. They need to understand the job each format performs. This guide
        explains when docs are enough, when a company academy is the better tool, and how the two should work together.
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">Book a Demo</Button>
        <Button href="/customer-education" variant="outline">Explore academies</Button>
      </div>
    </div>

    <div class="mx-auto mt-14 w-full max-w-[1100px]">
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <img
          src="https://assets.cdn.clsrio.com/www/docs-vs-company-academy/docs-vs-customer-site.jpeg"
          alt="Docs answering questions, customer academy building capability — side by side"
          class="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  </PageHeader>

  <section class="bg-gray-50 px-6 py-16 lg:px-12 lg:py-24">
    <div class="mx-auto max-w-[1120px]">
      <div class="mb-10 max-w-[720px]">
        <div class="mb-3 text-xs font-medium tracking-widest text-blue-700 uppercase">Decision table</div>
        <h2 class="text-[clamp(2rem,3vw,2.7rem)] leading-[1.15] font-medium tracking-tight text-gray-950">
          Start with the need, then choose the format.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          If the person wants one answer, documentation is usually right. If the person needs a path, proof, or
          repeatable onboarding, a company academy is usually right.
        </p>
      </div>

      <div class="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div
          class="grid grid-cols-[1fr_84px_96px] border-b border-gray-200 bg-gray-950 text-white md:grid-cols-[1fr_110px_130px_1.3fr]"
        >
          <div class="px-5 py-4 text-sm font-medium">Need</div>
          <div class="px-3 py-4 text-center text-sm font-medium md:px-5">Docs</div>
          <div class="px-3 py-4 text-center text-sm font-medium md:px-5">Academy</div>
          <div class="hidden px-5 py-4 text-sm font-medium md:block">Why</div>
        </div>

        {#each comparisonRows as row}
          <div
            class="grid grid-cols-[1fr_84px_96px] border-b border-gray-100 last:border-b-0 md:grid-cols-[1fr_110px_130px_1.3fr]"
          >
            <div class="bg-gray-50 px-5 py-5 text-sm font-medium text-gray-950">{row.need}</div>
            <div class="flex items-center justify-center px-3 py-5 md:px-5">
              {#if row.docs}
                <span class="text-xl text-green-600" aria-label="Yes">✓</span>
              {:else}
                <span class="text-xl text-red-500" aria-label="No">×</span>
              {/if}
            </div>
            <div class="flex items-center justify-center px-3 py-5 md:px-5">
              {#if row.academy}
                <span class="text-xl text-green-600" aria-label="Yes">✓</span>
              {:else}
                <span class="text-xl text-red-500" aria-label="No">×</span>
              {/if}
            </div>
            <div class="hidden px-5 py-5 text-sm leading-relaxed text-gray-600 md:block">{row.note}</div>
          </div>
        {/each}
      </div>
    </div>
  </section>

  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-[1120px]">
      <div class="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-gray-200">
        <!-- When docs are enough -->
        <div class="lg:pr-10">
          <div class="text-[11px] font-medium tracking-widest text-blue-700 uppercase">When docs are enough</div>
          <h2 class="mt-4 text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
            Choose documentation when the task is searchable, narrow, and repeatable.
          </h2>
          <p class="mt-5 text-sm leading-relaxed text-gray-500">
            Documentation works best when the user has a specific job and needs a precise answer. Easy to find, easy to
            scan, easy to trust — no enrollment required.
          </p>

          <div class="my-7 border-t border-gray-200"></div>

          <ul class="space-y-4">
            {#each docsUseCases as useCase}
              <li class="flex items-start gap-3 text-sm text-gray-700">
                <span
                  class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700"
                >
                  <Check size={12} strokeWidth={2.5} />
                </span>
                {useCase}
              </li>
            {/each}
          </ul>

          <div class="mt-8">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
            >
              <FileText size={13} strokeWidth={2} />
              Reference & retrieval
            </span>
          </div>
        </div>

        <!-- When an academy is better -->
        <div class="mt-12 lg:mt-0 lg:pl-10">
          <div class="text-[11px] font-medium tracking-widest text-emerald-700 uppercase">
            When an academy is better
          </div>
          <h2 class="mt-4 text-[clamp(1.6rem,2.6vw,2.2rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
            Choose a company academy when capability, behavior change, or proof matters.
          </h2>
          <p class="mt-5 text-sm leading-relaxed text-gray-500">
            An academy turns scattered knowledge into a structured path. Use it when the learner needs context before
            details, practice before independence, or a certificate before being trusted with a role.
          </p>

          <div class="my-7 border-t border-gray-200"></div>

          <ul class="space-y-4">
            {#each academyUseCases as useCase}
              <li class="flex items-start gap-3 text-sm text-gray-700">
                <span
                  class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"
                >
                  <Check size={12} strokeWidth={2.5} />
                </span>
                {useCase}
              </li>
            {/each}
          </ul>

          <div class="mt-8">
            <span
              class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700"
            >
              <GraduationCap size={13} strokeWidth={2} />
              Structured learning
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <WorkflowSteps
    eyebrow="Decision framework"
    title="Ask these four questions before creating another content surface."
    description="The wrong format creates expensive confusion. Long docs cannot force mastery, and long courses are frustrating when someone only needs one answer."
    steps={decisionSignals.map((signal, i) => ({
      title: signal.title,
      description: signal.description,
      label: `Question ${String(i + 1).padStart(2, '0')}`
    }))}
  />

  <section class="px-6 py-16 lg:px-12 lg:py-24">
    <div class="mx-auto grid max-w-[1120px] grid-cols-1 items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
      <div>
        <div class="mb-3 text-xs font-medium tracking-widest text-blue-700 uppercase">The hybrid model</div>
        <h2 class="text-[clamp(2rem,3vw,2.7rem)] leading-[1.15] font-medium tracking-tight text-gray-950">
          The strongest teams use docs and academies together.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Treat documentation as the reference layer and the academy as the enablement layer. The academy should not
          duplicate every page in your docs. It should organize the important material into an outcome-driven path.
        </p>
      </div>

      <div class="space-y-4">
        {#each hybridModel as item, i}
          <BlurFade delay={0.08 * i} once>
            <div class="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-medium text-white"
              >
                {i + 1}
              </div>
              <div>
                <h3 class="text-base font-medium text-gray-950">{item.title}</h3>
                <p class="mt-2 text-sm leading-relaxed text-gray-500">{item.description}</p>
              </div>
            </div>
          </BlurFade>
        {/each}
      </div>
    </div>
  </section>

  <PageSignupCTA
    header="ClassroomIO can host your company academy."
    subText="Turn your docs, videos, policies, and product knowledge into a branded academy with courses, assessments, certificates, analytics, and a custom domain."
    btnLabel="Book a Demo"
  />
</section>
