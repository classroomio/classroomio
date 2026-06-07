<script>
  import {
    AiTutorSection,
    BoxedGrid,
    CertificateMock,
    EmbedCodePreview,
    FeatureGrid,
    HeroSubtitle,
    ImageDemoSection,
    LanguageReel,
    MultiAcademySection,
    PageHeader,
    PageSignupCTA,
    RoiBand,
    TrustBand,
    VsHelpDocs,
    WorkflowSteps
  } from '$lib/components';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Meteors } from '@cio/ui/custom/animation/meteors';
  import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
  import BookMarked from '@lucide/svelte/icons/book-marked';
  import Bot from '@lucide/svelte/icons/bot';
  import Code2 from '@lucide/svelte/icons/code-2';
  import Crown from '@lucide/svelte/icons/crown';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import Languages from '@lucide/svelte/icons/languages';
  import MessagesSquare from '@lucide/svelte/icons/messages-square';
  import MonitorPlay from '@lucide/svelte/icons/monitor-play';
  import PanelTop from '@lucide/svelte/icons/panel-top';

  const workflow = [
    {
      title: 'Bring your product knowledge',
      description:
        'Use help docs, onboarding guides, release notes, demo videos, Looms, and internal customer success notes.'
    },
    {
      title: 'Build a customer academy',
      description:
        'Create structured courses for onboarding, feature adoption, admin training, and power-user education.'
    },
    {
      title: 'Publish it under your brand',
      description:
        'Custom domain, themed landing pages, public course catalog, and embeddable widgets — your academy, not ours.'
    },
    {
      title: 'Track adoption & retention',
      description: 'See progress, assessment results, certificates, and completion data across customers and cohorts.'
    }
  ];

  const features = [
    {
      Icon: PanelTop,
      title: 'Branded learning portal',
      description:
        'Customer-facing catalog with landing pages, themes, your logo, your domain, and SEO-ready public pages.'
    },
    {
      Icon: MonitorPlay,
      title: 'Video & rich media lessons',
      description:
        'Embed demos, walkthroughs, Looms, MP4s, PDFs, and slide decks. Auto-thumbnails and transcoding included.'
    },
    {
      Icon: BookMarked,
      title: 'Programs & learning paths',
      description:
        'Bundle courses into onboarding journeys with required completion order, prerequisites, and certificates.'
    },
    {
      Icon: Bot,
      title: 'AI lesson assistant',
      description:
        'Each learner gets a Claude-powered tutor inside the lesson that can answer questions and summarise content.'
    },
    {
      Icon: MessagesSquare,
      title: 'Community & Q&A',
      description: 'Per-course discussion forums and program newsfeeds with reactions, threads, and mentions.'
    },
    {
      Icon: GraduationCap,
      title: 'Certificates customers can share',
      description:
        'Issue branded PDF/PNG certificates with verifiable IDs. Great for customer champions and admin programs.'
    },
    {
      Icon: Code2,
      title: 'Embeddable widgets',
      description:
        'Drop courses into your help center, marketing site, or in-product onboarding via a single script tag.'
    },
    {
      Icon: BarChart3,
      title: 'Adoption analytics',
      description: 'See who completed onboarding, who passed assessments, and which features need more education.'
    },
    {
      Icon: Languages,
      title: 'Deliver lessons in 10 languages',
      description:
        'Per-language lesson variants for English, Spanish, Portuguese, German, French, Hindi, Vietnamese, Russian, Polish, and Danish.'
    }
  ];

  const langs = [
    {
      code: 'en',
      native: 'English',
      en: 'English',
      sample: 'Getting Started: Your First Workspace',
      tone: 'from-blue-100 to-blue-200',
      ring: 'ring-blue-200'
    },
    {
      code: 'es',
      native: 'Español',
      en: 'Spanish',
      sample: 'Primeros pasos: Tu primer espacio',
      tone: 'from-amber-100 to-rose-200',
      ring: 'ring-amber-200'
    },
    {
      code: 'pt',
      native: 'Português',
      en: 'Portuguese',
      sample: 'Primeiros passos: Seu primeiro workspace',
      tone: 'from-emerald-100 to-teal-200',
      ring: 'ring-emerald-200'
    },
    {
      code: 'de',
      native: 'Deutsch',
      en: 'German',
      sample: 'Erste Schritte: Dein erster Arbeitsbereich',
      tone: 'from-slate-100 to-slate-200',
      ring: 'ring-slate-200'
    },
    {
      code: 'fr',
      native: 'Français',
      en: 'French',
      sample: 'Premiers pas : Votre premier espace',
      tone: 'from-blue-100 to-indigo-200',
      ring: 'ring-indigo-200'
    },
    {
      code: 'hi',
      native: 'हिन्दी',
      en: 'Hindi',
      sample: 'शुरुआत: आपका पहला वर्कस्पेस',
      tone: 'from-orange-100 to-rose-200',
      ring: 'ring-orange-200'
    },
    {
      code: 'vi',
      native: 'Tiếng Việt',
      en: 'Vietnamese',
      sample: 'Bắt đầu: Không gian làm việc đầu tiên',
      tone: 'from-red-100 to-yellow-200',
      ring: 'ring-red-200'
    },
    {
      code: 'ru',
      native: 'Русский',
      en: 'Russian',
      sample: 'Начало работы: ваше рабочее пространство',
      tone: 'from-sky-100 to-blue-200',
      ring: 'ring-sky-200'
    },
    {
      code: 'pl',
      native: 'Polski',
      en: 'Polish',
      sample: 'Pierwsze kroki: Twoja przestrzeń',
      tone: 'from-rose-100 to-red-200',
      ring: 'ring-rose-200'
    },
    {
      code: 'da',
      native: 'Dansk',
      en: 'Danish',
      sample: 'Kom godt i gang: Dit første område',
      tone: 'from-red-100 to-rose-200',
      ring: 'ring-red-200'
    }
  ];

  const outcomes = [
    { title: 'Reduce repeat support tickets', sub: 'Self-serve education replaces 1:1 onboarding calls.' },
    { title: 'Shorten time-to-value', sub: 'Customers learn core workflows before their first review call.' },
    { title: 'Train admins and power users', sub: 'Multi-tier programs for end-users vs. champions.' },
    { title: 'Certify customer champions', sub: 'Public shareable certificates fuel community advocacy.' },
    { title: 'Drive feature adoption', sub: 'Targeted micro-courses when you ship something new.' },
    { title: 'Build a moat of educated users', sub: 'The customers who know your product never churn quietly.' }
  ];
</script>

<svelte:head>
  <title>Customer academy software for SaaS | ClassroomIO</title>
  <meta
    name="description"
    content="Launch a branded customer academy. Onboarding, feature adoption, admin training, and certification — under your own domain, with an AI tutor in every lesson."
  />
</svelte:head>

<section class="bg-white">
  <PageHeader className="px-6 lg:px-12">
    <div class="mx-auto flex max-w-[820px] flex-col items-center text-center">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <Crown size={14} class="text-blue-700" />
        Customer Education
      </Badge>
      <h1 class="text-[clamp(2rem,3.4vw,2.8rem)] leading-[1.1] font-medium tracking-tight text-gray-950">
        Launch a customer academy
        <em class="text-blue-700 not-italic">customers actually love.</em>
      </h1>
      <HeroSubtitle class="mx-auto">
        Turn your help docs, onboarding videos, and product knowledge into a branded learning portal. Train customers,
        certify power-users, and drive adoption — under your own domain, with an AI tutor in every lesson.
      </HeroSubtitle>
      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">Book a Demo</Button>
        <Button href="/signup" variant="outline">Start free</Button>
      </div>
      <div class="mt-7 flex flex-wrap items-center justify-center gap-5 text-xs text-gray-500">
        <span class="flex items-center gap-1.5"><span class="font-medium text-blue-700">✓</span> Custom domain</span>
        <span class="flex items-center gap-1.5"><span class="font-medium text-blue-700">✓</span> Embed anywhere</span>
        <span class="flex items-center gap-1.5"
          ><span class="font-medium text-blue-700">✓</span> AI in every lesson</span
        >
      </div>
    </div>

    <div class="mx-auto mt-14 w-full max-w-[1100px]">
      <div class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200">
        <img
          src="https://assets.cdn.clsrio.com/www/customer-education/beautiful-academy-site.jpeg"
          alt="Branded customer academy on a custom domain — hero, catalog, themed branding"
          class="block h-auto w-full"
          loading="eager"
          decoding="async"
        />
      </div>
    </div>
  </PageHeader>

  <TrustBand
    caption="Built for product-led teams"
    items={[
      'SaaS onboarding',
      'Developer tools',
      'B2B platforms',
      'Admin training',
      'Customer champions',
      'Open-source projects'
    ]}
  />

  <RoiBand bgClass="bg-white" />

  <WorkflowSteps eyebrow="How it works" title="From scattered docs to a polished academy." steps={workflow} />

  <ImageDemoSection
    eyebrow="Make it yours"
    title="Customize how your customer academy looks like."
    description="Theme the catalog, swap fonts and colors to match your brand, and build landing pages that feel like the rest of your product — without losing the LMS underneath."
    imageSrc="https://assets.cdn.clsrio.com/www/customer-education/customizable-academy.jpeg"
    imageAlt="Customizable customer academy — catalog, course page, certificate"
  />

  <FeatureGrid
    eyebrow="Every piece, included"
    title="Everything you need to teach customers your product."
    description={'Not a "content site" bolted onto your help docs. A real LMS with programs, assessments, certificates, AI tutoring, community, and analytics, wrapped in your brand.'}
    ctaLabel="Get started"
    ctaHref="/signup"
    {features}
  />

  <AiTutorSection
    accent=""
    title="An AI tutor in every lesson."
    description="An AI tutor sits inside every lesson — lesson-aware, multilingual, and patient. It answers the questions customers would have sent to support, before they leave the page."
    imagePath="/static/ai-tutor-stack.png"
    imageCaption="AI tutor in a lesson — lesson-aware chat, follow-ups, translation, summarisation"
    vimeoVideoId="1192910311"
  />

  <LanguageReel
    {langs}
    eyebrow="Global customers"
    headlineLead="Teach customers"
    headlineAccent="in the language they bought in."
    description="Author once, publish in ten. Each lesson supports per-language variants — customers pick the language they read in, certificates render in that language, and adoption analytics roll up across regions."
    moduleLabel="Lesson 1 · Onboarding"
    footerLabel="6 lessons · 18 min"
    bgClass="bg-white"
  />

  <EmbedCodePreview
    eyebrow="Embed anywhere"
    title="Bring lessons to your help center, your app, your marketing site."
    description="Publish any course as a widget. Drop a script tag into your help center, in-product onboarding, or marketing page. Progress, marks, and certificates sync back to ClassroomIO."
    fileName="help-center.html"
    codeLines={[
      '<span class="text-slate-500">&lt;!-- in your help center --&gt;</span>',
      '<span class="text-pink-400">&lt;script</span> <span class="text-sky-300">src</span><span class="text-slate-500">=</span><span class="text-emerald-300">"https://cdn.classroomio.com/widget.js"</span><span class="text-pink-400">&gt;&lt;/script&gt;</span>',
      '',
      '<span class="text-pink-400">&lt;div</span> <span class="text-sky-300">data-cio-widget</span><span class="text-slate-500">=</span><span class="text-emerald-300">"getting-started"</span>',
      '  <span class="text-sky-300">data-org</span><span class="text-slate-500">=</span><span class="text-emerald-300">"yourcompany"</span>',
      '  <span class="text-sky-300">data-theme</span><span class="text-slate-500">=</span><span class="text-emerald-300">"light"</span><span class="text-pink-400">&gt;</span>',
      '<span class="text-pink-400">&lt;/div&gt;</span>'
    ]}
    statusBar="connected · org: yourcompany · widget: getting-started"
    previewUrl="help.yourcompany.com / getting-started"
    previewImageSrc="https://assets.cdn.clsrio.com/www/customer-education/embeddable-widget.jpeg"
    previewAlt="Lesson widget embedded inside a help-center page"
    capabilities={[
      { label: 'One script tag', sub: 'Drop-in install, no SDK required' },
      { label: 'Select from multiple themes', sub: 'Light, dark, and brand-tuned looks bundled in' },
      { label: 'Sync back to CIO', sub: 'Progress, marks, and certs round-trip' }
    ]}
    bgClass="bg-gray-50"
  />

  <!-- Programs / certificates split -->
  <section class="px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Certified champions</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          Turn power-users into a public community.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Bundle courses into Programs, gate them with a required exercise, and issue shareable certificates. Customer
          champions love showing off — and your product gets a quiet army of advocates.
        </p>
        <ul class="mt-6 space-y-3 text-sm text-gray-700">
          <li class="flex items-start gap-2">
            <GraduationCap size={16} class="mt-0.5 text-blue-700" /> Branded PDF/PNG certificates with verifiable IDs
          </li>
          <li class="flex items-start gap-2">
            <BookMarked size={16} class="mt-0.5 text-blue-700" /> Programs with required completion order
          </li>
          <li class="flex items-start gap-2">
            <MessagesSquare size={16} class="mt-0.5 text-blue-700" /> Per-course Q&A and program-wide newsfeed
          </li>
        </ul>
      </div>
      <CertificateMock
        recipient="Alex Rivera"
        achievement="YourCo Admin Bootcamp · 2026"
        issued="11 May 2026"
        verifyValue="CIO-2026-05-0214"
      />
    </div>
  </section>

  <!-- Outcomes -->
  <section class="bg-gray-50 px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto max-w-[1100px]">
      <div class="mb-10 max-w-[640px]">
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Why teams ship this</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          Educated customers churn less. Period.
        </h2>
      </div>

      <BoxedGrid items={outcomes} cols={3}>
        {#snippet cell(outcome)}
          <h3 class="text-base font-medium text-gray-950">{outcome.title}</h3>
          <p class="mt-2 text-sm leading-relaxed text-gray-500">{outcome.sub}</p>
        {/snippet}
      </BoxedGrid>
    </div>
  </section>

  <VsHelpDocs bgClass="bg-white" />

  <MultiAcademySection />

  <PageSignupCTA
    header="Launch your customer academy."
    subText="Build a branded learning portal customers actually use. Custom domain, AI tutoring, certificates, and analytics — out of the box."
    btnLabel="Book a Demo"
  />
</section>
