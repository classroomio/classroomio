<script>
  import {
    AiTutorSection,
    CertificateMock,
    FeatureGrid,
    HeroSubtitle,
    ImageDemoSection,
    PageHeader,
    PageSignupCTA,
    SplitFeatureSection,
    TrustBand,
    WorkflowSteps
  } from '$lib/components';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Meteors } from '@cio/ui/custom/animation/meteors';
  import AlertTriangle from '@lucide/svelte/icons/alert-triangle';
  import BadgeCheck from '@lucide/svelte/icons/badge-check';
  import CalendarClock from '@lucide/svelte/icons/calendar-clock';
  import ClipboardCheck from '@lucide/svelte/icons/clipboard-check';
  import FileSpreadsheet from '@lucide/svelte/icons/file-spreadsheet';
  import FileText from '@lucide/svelte/icons/file-text';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import KeyRound from '@lucide/svelte/icons/key-round';
  import RefreshCw from '@lucide/svelte/icons/refresh-cw';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import Users from '@lucide/svelte/icons/users';

  const workflow = [
    {
      title: 'Start with the policies you already have',
      description:
        'Bring SOPs, PDFs, Notion pages, Google Docs, videos, and internal process notes into one structured course.'
    },
    {
      title: 'Assign training by audience',
      description:
        'Import people via CSV, group by team or role, and assign the right course to the right audience in bulk.'
    },
    {
      title: 'Set the compliance rules',
      description: 'Define passing scores, deadlines, retake intervals, grace periods, reminders, and renewal windows.'
    },
    {
      title: 'Keep proof in one place',
      description:
        'Track who is compliant, expiring, in progress, waived, or non-compliant without ever opening a spreadsheet.'
    }
  ];

  const features = [
    {
      Icon: ShieldCheck,
      title: 'Compliance status tracking',
      description:
        'Know at a glance whether each learner is compliant, expiring soon, or non-compliant — and surface the people who need a reminder.'
    },
    {
      Icon: RefreshCw,
      title: 'Renewals & retake intervals',
      description:
        'Configure recurring training rules — annual, biannual, custom — so certifications refresh on schedule.'
    },
    {
      Icon: CalendarClock,
      title: 'Deadlines & grace periods',
      description:
        'Set required completion dates and grace windows. Reminders go out automatically before learners fall out of compliance.'
    },
    {
      Icon: ClipboardCheck,
      title: 'Waivers, resets, and extensions',
      description:
        'Handle real-world exceptions without losing the audit history of who was required to complete training.'
    },
    {
      Icon: BadgeCheck,
      title: 'Certificates with custom IDs',
      description:
        'Issue branded PDF/PNG certificates with configurable ID formats (year, month, sequence, org prefix) tied to course completion.'
    },
    {
      Icon: FileSpreadsheet,
      title: 'Completion records & certificate ledger',
      description:
        'Every completion, mark, and issued certificate is stored against the learner — searchable from the dashboard when you need to look up who finished what.'
    },
    {
      Icon: KeyRound,
      title: 'SSO and domain enforcement',
      description:
        'Force SSO by email domain with Better Auth. Break-glass overrides for admins; full sign-in audit history.'
    },
    {
      Icon: Users,
      title: 'Audience targeting',
      description:
        'Bulk enrollment, role-based access, and group assignment. Onboard contractors, vendors, and full-time staff differently.'
    }
  ];

  const questionTypes = [
    'Multiple choice',
    'Checkbox',
    'True / false',
    'Short answer',
    'Paragraph',
    'Numeric',
    'Fill in the blank',
    'Matching',
    'Ordering',
    'File upload',
    'Hotspot',
    'Word bank',
    'Star rating',
    'Links',
    'Video recording'
  ];

  const useCases = [
    'Annual security awareness',
    'GDPR & privacy training',
    'HIPAA refreshers',
    'AML / KYC training',
    'Workplace conduct & harassment',
    'Contractor & vendor onboarding',
    'Healthcare SOPs',
    'Financial-services policy acks',
    'Manufacturing safety',
    'Role-based access training'
  ];
</script>

<svelte:head>
  <title>Compliance Training | ClassroomIO</title>
  <meta
    name="description"
    content="Keep your employees compliant and track who's falling behind. Turn policies and SOPs into certified training with renewals, grace periods, and audit evidence."
  />
  <meta property="og:title" content="Keep your employees compliant and track who's falling behind." />
  <meta
    property="og:description"
    content="Turn policies and SOPs into certified training. Track compliance, renewals, grace periods, and audit evidence in one place."
  />
  <meta name="twitter:title" content="Keep your employees compliant and track who's falling behind." />
  <meta
    name="twitter:description"
    content="Turn policies and SOPs into certified training. Track compliance, renewals, grace periods, and audit evidence in one place."
  />
  <script
    type="module"
    src="https://assets.cdn.clsrio.com/embeds/question-type-picker/question-type-picker.js"
  ></script>
</svelte:head>

<section class="bg-white">
  <PageHeader className="px-6 lg:px-12">
    <div class="mx-auto flex max-w-[820px] flex-col items-center text-center">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75"></span>
          <span class="relative inline-flex h-2 w-2 rounded-full bg-blue-600"></span>
        </span>
        Compliance Training
      </Badge>
      <h1 class="text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
        Keep your employees compliant and
        <em class="text-blue-700 not-italic">track who's falling behind.</em>
      </h1>
      <HeroSubtitle class="mx-auto">
        Turn policies, SOPs, docs, and videos into assigned courses with quizzes, certificates, renewal rules, and
        completion evidence. Know exactly who is compliant — and prove it.
      </HeroSubtitle>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">Book a Demo</Button>
        <Button href="/signup" variant="outline">Start free</Button>
      </div>
      <div class="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
        <span class="flex items-center gap-1.5"><span class="font-medium text-blue-700">✓</span> SOC 2-friendly</span>
        <span class="flex items-center gap-1.5"
          ><span class="font-medium text-blue-700">✓</span> Self-hosted option</span
        >
        <span class="flex items-center gap-1.5"><span class="font-medium text-blue-700">✓</span> Open source</span>
      </div>
    </div>

    <div class="mx-auto mt-14 w-full max-w-[1100px]">
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <img
          src="https://assets.cdn.clsrio.com/www/compliance-training/org-compliance.jpeg"
          alt="Compliance dashboard — required learners grouped by compliant, expiring soon, and non-compliant"
          class="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  </PageHeader>

  <TrustBand
    caption="Built for evidence-based programs"
    items={[
      'SOC 2 readiness',
      'GDPR awareness',
      'HIPAA refreshers',
      'ISO 27001 controls',
      'PCI-DSS staff training',
      'AML / KYC'
    ]}
  />

  <WorkflowSteps eyebrow="How it works" title="From policy document to provable completion." steps={workflow} />

  <ImageDemoSection
    eyebrow="Inside a compliance program"
    title="A look inside a compliance program."
    description="From importing your team to issuing a certificate — the whole flow at a glance."
    imageSrc="https://assets.cdn.clsrio.com/www/compliance-training/compliance-dashboard.jpeg"
    imageAlt="Compliance dashboard — required learners, status, and certificates"
  />

  <FeatureGrid
    eyebrow="Built for audit pressure"
    title="Everything you need when training completion is not optional."
    description={'Not a generic LMS with a "compliance" checkbox. Real workflows for the people who have to answer the auditor\u2019s questions.'}
    ctaLabel="Get started"
    ctaHref="/signup"
    {features}
  />

  <!-- Renewal split feature -->
  <SplitFeatureSection
    bgClass="bg-gray-50"
    eyebrow="Renewals on autopilot"
    title="Training that re-runs itself."
    description="Set a retake interval once. ClassroomIO automatically moves learners back into “expiring soon”, sends reminders, holds them in a grace period, and flags non-compliance — all without admin intervention."
    imageSrc="https://assets.cdn.clsrio.com/www/compliance-training/course-compliance.jpeg"
    imageAlt="Compliance settings panel — retake interval, grace period, reminders, waiver rules"
  >
    {#snippet bullets()}
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-700">→</span> Annual, biannual, or custom intervals per course
      </li>
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-700">→</span> Reminder cadences before expiry
      </li>
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-700">→</span> Configurable grace periods and waiver workflows
      </li>
      <li class="flex items-start gap-2">
        <span class="mt-0.5 text-blue-700">→</span> Pause renewals for leave, role change, or offboarding
      </li>
    {/snippet}
  </SplitFeatureSection>

  <!-- Question types showcase -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-[1100px]">
      <div class="mb-10 max-w-[640px]">
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Assessments</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          15 question types. Twelve auto-graded.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Don't settle for multiple choice. Test understanding the way the policy actually requires — with partial
          credit, file uploads, video evidence, and manual override when you need a human in the loop.
        </p>
        <div class="mt-6 flex flex-wrap gap-2">
          <span class="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Auto-graded · 12</span>
          <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">Partial credit · 9</span>
          <span class="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">Manual review · 3</span>
        </div>
      </div>

      <div class="flex justify-center">
        <div data-cio-widget="question-type-picker" class="w-full max-w-[900px]"></div>
      </div>
    </div>
  </section>

  <!-- Certificates split -->
  <section class="bg-gray-50 px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div class="order-2 lg:order-1">
        <CertificateMock
          recipient="Sarah Chen"
          achievement="Annual Security Training 2026"
          issued="11 May 2026"
          verifyValue="CIO-2026-05-0142"
        />
      </div>
      <div class="order-1 lg:order-2">
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Certificates & evidence</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          Proof of training, designed for your brand.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Configure the certificate ID format the way your records team needs it — by year, month, sequence, or a custom
          prefix. Download as PDF or PNG. Every issuance is logged for audit.
        </p>
        <ul class="mt-6 space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <GraduationCap size={16} class="mt-0.5 text-blue-700" /> Templated and branded with your logo and colours
          </li>
          <li class="flex items-start gap-2">
            <BadgeCheck size={16} class="mt-0.5 text-blue-700" /> Tied to a required passing score and assessment
          </li>
          <li class="flex items-start gap-2">
            <AlertTriangle size={16} class="mt-0.5 text-blue-700" /> Auto-revokes when a renewal lapses
          </li>
        </ul>
      </div>
    </div>
  </section>

  <AiTutorSection
    accent="In your dashboard"
    title="A personal course-authoring assistant."
    description="Drop in a policy doc or paste a URL. The assistant plans the compliance course, drafts each lesson, writes the quiz questions, and stops for your approval before publishing — so building required training drops from a week to an afternoon."
    imageSrc="https://assets.cdn.clsrio.com/www/compliance-training/ai-course-builder.jpeg"
    imageAlt="Course builder — plan, approve, implement. Templates, in-editor chat, and MCP."
  />

  <!-- Use cases -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-[1100px]">
      <div class="mb-10 max-w-[640px]">
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Use cases</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          Training for the work people are required to know.
        </h2>
      </div>

      <div class="overflow-hidden border border-gray-200 bg-white">
        <div
          class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 [&>*:nth-child(2n)]:sm:border-r-0 [&>*:nth-child(2n)]:lg:border-r [&>*:nth-child(3n)]:lg:border-r-0 [&>*:nth-last-child(-n+2)]:sm:border-b-0 [&>*:nth-last-child(-n+3)]:lg:border-b-0"
        >
          {#each useCases as useCase, i}
            <div
              class="group relative flex items-center gap-3 border-b border-gray-200 p-6 transition-colors hover:bg-gray-50/60 sm:border-r"
            >
              <span class="font-mono text-[11px] tracking-[0.15em] text-gray-400">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span class="text-sm font-medium text-gray-900">{useCase}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </section>

  <PageSignupCTA
    header="Keep your employees compliant and track who's falling behind."
    subText="Build certified training from your existing policies, assign it to the right people, and keep proof of completion in one place."
    btnLabel="Book a Demo"
  />
</section>
