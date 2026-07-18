<script>
  import {
    EmbedCodePreview,
    FeatureGrid,
    HeroSubtitle,
    ImageDemoSection,
    LanguageReel,
    PageHeader,
    PageSignupCTA,
    TrustBand,
    WorkflowSteps
  } from '$lib/components';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Meteors } from '@cio/ui/custom/animation/meteors';
  import BadgeCheck from '@lucide/svelte/icons/badge-check';
  import BookOpenCheck from '@lucide/svelte/icons/book-open-check';
  import Boxes from '@lucide/svelte/icons/boxes';
  import ChartNoAxesCombined from '@lucide/svelte/icons/chart-no-axes-combined';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Globe from '@lucide/svelte/icons/globe';
  import Languages from '@lucide/svelte/icons/languages';
  import Layers from '@lucide/svelte/icons/layers';
  import MessageSquareText from '@lucide/svelte/icons/message-square-text';
  import Share2 from '@lucide/svelte/icons/share-2';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Trophy from '@lucide/svelte/icons/trophy';

  const steps = [
    {
      title: 'Spin up a partner workspace',
      description:
        'Add a separate partner workspace under your existing account. Its own brand, its own domain, its own catalog. Customers never see partner content, and partners never see customer content.'
    },
    {
      title: 'Package your product knowledge',
      description:
        'Bring in your docs, sales playbooks, release notes, demo videos, and enablement Looms. The AI assistant turns them into a structured course you can edit.'
    },
    {
      title: 'Design certification paths',
      description:
        'Group courses into cohorts for onboarding, sales, implementation, and advanced topics, with required exercises and a final exam.'
    },
    {
      title: 'Track readiness and certify',
      description: 'See progress, marks, submissions, and issued certificates across partner orgs and individual reps.'
    }
  ];

  const features = [
    {
      Icon: Layers,
      title: 'Cohorts and learning paths',
      description: 'Bundle multiple courses into a certification journey with a required order and shared progress.'
    },
    {
      Icon: BadgeCheck,
      title: 'Branded partner certificates',
      description:
        'Issue PDF and PNG certificates with your logo, configurable IDs, and a public verification URL partners can share.'
    },
    {
      Icon: Globe,
      title: 'Custom domain and branded portal',
      description:
        'Run your partner academy on your own domain via Cloudflare. Theme, logo, landing pages, and SEO are all yours.'
    },
    {
      Icon: Share2,
      title: 'Public pages and embeds',
      description:
        'Publish course landing pages, or embed a learning widget on your partner portal, intranet, or marketing site.'
    },
    {
      Icon: Languages,
      title: 'Multilingual content',
      description:
        'Deliver lessons in 10 languages. Author once and publish per-language variants for English, Spanish, Portuguese, German, French, Hindi, and more.'
    },
    {
      Icon: ChartNoAxesCombined,
      title: 'Performance analytics',
      description:
        'Drill into completion, time-to-certify, exercise marks, and submission quality, by partner, cohort, or geography.'
    },
    {
      Icon: MessageSquareText,
      title: 'AI lesson assistant',
      description:
        'Each partner gets a Claude-powered tutor inside the course that can summarise lessons and answer product questions.'
    },
    {
      Icon: Boxes,
      title: 'Cohort enrolment and invites',
      description:
        'Import full partner orgs from CSV, assign by role, gate paid programs, and track who has accepted their invite.'
    }
  ];

  const langs = [
    {
      code: 'en',
      native: 'English',
      en: 'English',
      sample: 'Implementation Checklist',
      tone: 'from-blue-100 to-blue-200',
      ring: 'ring-blue-200'
    },
    {
      code: 'es',
      native: 'Español',
      en: 'Spanish',
      sample: 'Lista de implementación',
      tone: 'from-amber-100 to-rose-200',
      ring: 'ring-amber-200'
    },
    {
      code: 'pt',
      native: 'Português',
      en: 'Portuguese',
      sample: 'Lista de implementação',
      tone: 'from-emerald-100 to-teal-200',
      ring: 'ring-emerald-200'
    },
    {
      code: 'de',
      native: 'Deutsch',
      en: 'German',
      sample: 'Implementierungs-Checkliste',
      tone: 'from-slate-100 to-slate-200',
      ring: 'ring-slate-200'
    },
    {
      code: 'fr',
      native: 'Français',
      en: 'French',
      sample: 'Liste de mise en œuvre',
      tone: 'from-blue-100 to-indigo-200',
      ring: 'ring-indigo-200'
    },
    {
      code: 'hi',
      native: 'हिन्दी',
      en: 'Hindi',
      sample: 'कार्यान्वयन चेकलिस्ट',
      tone: 'from-orange-100 to-rose-200',
      ring: 'ring-orange-200'
    },
    {
      code: 'vi',
      native: 'Tiếng Việt',
      en: 'Vietnamese',
      sample: 'Danh sách triển khai',
      tone: 'from-red-100 to-yellow-200',
      ring: 'ring-red-200'
    },
    {
      code: 'ru',
      native: 'Русский',
      en: 'Russian',
      sample: 'Контрольный список',
      tone: 'from-sky-100 to-blue-200',
      ring: 'ring-sky-200'
    },
    {
      code: 'pl',
      native: 'Polski',
      en: 'Polish',
      sample: 'Lista wdrożeniowa',
      tone: 'from-rose-100 to-red-200',
      ring: 'ring-rose-200'
    },
    {
      code: 'da',
      native: 'Dansk',
      en: 'Danish',
      sample: 'Implementeringstjekliste',
      tone: 'from-red-100 to-rose-200',
      ring: 'ring-red-200'
    }
  ];
</script>

<svelte:head>
  <title>Partner Training | ClassroomIO</title>
  <meta
    name="description"
    content="Run a partner academy alongside your customer one. Separate brand, separate domain, same account. Certify resellers, agencies, and integrators with programs, certificates, and analytics."
  />
</svelte:head>

<section class="bg-white">
  <PageHeader className="px-6 lg:px-12">
    <div class="mx-auto flex max-w-[820px] flex-col items-center text-center">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <Trophy size={14} class="text-blue-700" />
        Partner Training
      </Badge>
      <h1 class="text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
        Train the partners
        <em class="text-blue-700 not-italic">who sell your product.</em>
      </h1>
      <HeroSubtitle class="mx-auto">
        Run a partner workspace alongside your customer academy. Separate brand, separate domain, same account. Certify
        resellers, agencies, and integrators with programs and assessments that stay in sync as your product changes.
      </HeroSubtitle>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">Book a Demo</Button>
        <Button href="/signup" variant="outline">Start free</Button>
      </div>
      <div class="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
        <span class="flex items-center gap-1.5"><span class="font-medium text-blue-700">✓</span> Custom domain</span>
        <span class="flex items-center gap-1.5"
          ><span class="font-medium text-blue-700">✓</span> Separate workspace</span
        >
        <span class="flex items-center gap-1.5"><span class="font-medium text-blue-700">✓</span> Embeddable</span>
      </div>
    </div>

    <div class="mx-auto mt-14 w-full max-w-[1100px]">
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <img
          src="https://assets.cdn.clsrio.com/www/partner-training/latest-courses.jpeg"
          alt="Partner academy — latest courses, cohort structure, and learner state"
          class="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  </PageHeader>

  <TrustBand
    caption="For partner programs at"
    items={[
      'SaaS platforms',
      'Fintech',
      'Developer tools',
      'Solution agencies',
      'Franchise networks',
      'Channel programs'
    ]}
  />

  <WorkflowSteps
    eyebrow="Partner enablement"
    title="Give every partner the same starting point."
    {steps}
    bgClass="bg-gray-50"
  />

  <ImageDemoSection
    eyebrow="Public course pages"
    title="Open a few courses to the public, gate the rest."
    description="Pick the courses you want anyone to see. Partners (and the curious ones who aren’t partners yet) can jump in without signing up, watch a few lessons, and if they’re hooked they create an account to unlock the rest of your catalog."
    imageSrc="https://assets.cdn.clsrio.com/www/partner-training/public-courses.jpeg"
    imageAlt="Public partner course pages — open courses up front, sign-up gates the rest"
  />

  <FeatureGrid
    eyebrow="What you can run"
    title="Certification programs for the people who represent your product."
    {features}
  />

  <EmbedCodePreview
    eyebrow="Embed anywhere"
    title="Drop a learning widget into any site."
    description="Generate a published widget payload for any course, paste the snippet into your partner portal, intranet, or marketing page. Progress, marks, and certificates sync back to ClassroomIO automatically."
    fileName="partner-portal.html"
    codeLines={[
      '<span class="text-slate-500">&lt;!-- in your partner portal --&gt;</span>',
      '<span class="text-pink-400">&lt;script</span> <span class="text-sky-300">src</span><span class="text-slate-500">=</span><span class="text-emerald-300">"https://cdn.classroomio.com/widget.js"</span><span class="text-pink-400">&gt;&lt;/script&gt;</span>',
      '',
      '<span class="text-pink-400">&lt;div</span> <span class="text-sky-300">data-cio-widget</span><span class="text-slate-500">=</span><span class="text-emerald-300">"partner-onboarding"</span>',
      '  <span class="text-sky-300">data-org</span><span class="text-slate-500">=</span><span class="text-emerald-300">"yourcompany"</span>',
      '  <span class="text-sky-300">data-theme</span><span class="text-slate-500">=</span><span class="text-emerald-300">"light"</span>',
      '  <span class="text-sky-300">data-lang</span><span class="text-slate-500">=</span><span class="text-emerald-300">"auto"</span><span class="text-pink-400">&gt;</span>',
      '<span class="text-pink-400">&lt;/div&gt;</span>'
    ]}
    statusBar="connected · org: yourcompany · widget: partner-onboarding"
    previewUrl="partners.yourcompany.com / academy"
    previewImageSrc="https://assets.cdn.clsrio.com/www/partner-training/embeddable-widget.jpeg"
    previewAlt="Course widget embedded inside a partner portal"
    capabilities={[
      { label: 'One script tag', sub: 'Drop-in install, no SDK required' },
      { label: 'Select from multiple themes', sub: 'Light, dark, and brand-tuned looks bundled in' },
      { label: 'Sync back to CIO', sub: 'Progress, marks, and certs round-trip' }
    ]}
  />

  <LanguageReel
    {langs}
    eyebrow="Global partners"
    headlineLead="Train your network"
    headlineAccent="in their language."
    description="Author once, publish in ten. Each lesson supports per-language variants. Learners pick the language they read in, certificates render in that language, and analytics roll up across regions."
    moduleLabel="Module 2 · Implementation"
    footerLabel="8 lessons"
  />

  <!-- Analytics split -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Readiness analytics</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          See which partners are ready to sell, and which need help.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Drill into completion rates, time-to-certify, exercise marks, and submission quality. Filter by partner org,
          cohort, geography, or certification path. Export anything to CSV.
        </p>
        <ul class="mt-6 space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <BookOpenCheck size={16} class="mt-0.5 text-blue-700" /> Course-level and cohort-level dashboards
          </li>
          <li class="flex items-start gap-2">
            <ChartNoAxesCombined size={16} class="mt-0.5 text-blue-700" /> Per-learner gradebook with manual override
          </li>
          <li class="flex items-start gap-2">
            <MessageSquareText size={16} class="mt-0.5 text-blue-700" /> Newsfeed activity and Q&A participation
          </li>
        </ul>
      </div>
      <!-- IMAGE STUB: partner-analytics-dashboard.png -->
      <div class="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl/5">
        <div class="aspect-[4/3] w-full bg-gradient-to-br from-blue-50 via-white to-gray-50 p-6">
          <div class="grid h-full grid-cols-2 gap-3">
            <div class="rounded-xl bg-white p-3 ring-1 ring-gray-100">
              <p class="text-[10px] text-gray-500">Time to certify</p>
              <p class="mt-1 text-xl font-medium text-gray-950">11.2d</p>
              <p class="text-[10px] text-green-600">↓ 2.4d</p>
            </div>
            <div class="rounded-xl bg-white p-3 ring-1 ring-gray-100">
              <p class="text-[10px] text-gray-500">Pass rate</p>
              <p class="mt-1 text-xl font-medium text-blue-700">87%</p>
            </div>
            <div class="col-span-2 rounded-xl bg-white p-3 ring-1 ring-gray-100">
              <p class="mb-2 text-[10px] text-gray-500">Completion by partner org</p>
              <div class="space-y-1.5">
                {#each [{ n: 'Northwind', v: 92 }, { n: 'Acme Resellers', v: 78 }, { n: 'Globex Implements', v: 64 }] as row}
                  <div class="flex items-center gap-2">
                    <span class="w-24 text-[10px] text-gray-600">{row.n}</span>
                    <div class="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div class="h-full rounded-full bg-blue-700" style="width: {row.v}%"></div>
                    </div>
                    <span class="text-[10px] font-medium text-gray-700">{row.v}%</span>
                  </div>
                {/each}
              </div>
            </div>
          </div>
        </div>
        <p class="pb-3 text-center text-xs text-gray-400">Replace with /static/partner-analytics-dashboard.png</p>
      </div>
    </div>
  </section>

  <PageSignupCTA
    header="Certify your next partner cohort."
    subText="Turn your product knowledge into a repeatable program. Courses, certificates, branded portal, and analytics in one place."
    btnLabel="Book a Demo"
  />
</section>
