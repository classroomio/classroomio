<script lang="ts">
  import { Faq, FeatureGrid, PageHeader, PageSignupCTA, TrustBand, WorkflowSteps } from '$lib/components';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { BlurFade } from '@cio/ui/custom/animation/blurfade';
  import Check from '@lucide/svelte/icons/check';
  import Globe from '@lucide/svelte/icons/globe';
  import GraduationCap from '@lucide/svelte/icons/graduation-cap';
  import MoonStar from '@lucide/svelte/icons/moon-star';
  import Palette from '@lucide/svelte/icons/palette';
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import Users from '@lucide/svelte/icons/users';
  import Zap from '@lucide/svelte/icons/zap';

  const creatorUseCases = [
    'A free intro course that leads into a paid program',
    'A public sample course people can review before they buy',
    'A short onboarding or community course that does not need login friction',
    'Partner or reseller training you can share with a link',
    'A simple home for short lessons and self-graded modules'
  ];

  const learnerUseCases = [
    'Browse the full catalog without creating an account',
    'Read in light mode or dark mode',
    'Get immediate quiz feedback',
    'Start on mobile and continue on desktop',
    'Use a course page that matches the creator brand they came for'
  ];

  const keyFeatures = [
    {
      Icon: Palette,
      title: 'Branding controls',
      description:
        'Choose a landing theme, add your logo, set your site name, and connect a custom domain without custom development.'
    },
    {
      Icon: MoonStar,
      title: 'Light and dark mode',
      description:
        'The lesson viewer includes a built-in mode switcher, and the learner preference stays in place between visits.'
    },
    {
      Icon: Sparkles,
      title: 'Clean lesson pages',
      description:
        'Public course pages use the same design system as the rest of ClassroomIO, so they feel like part of your product instead of a separate microsite.'
    },
    {
      Icon: Zap,
      title: 'Auto-graded quizzes',
      description:
        'Support for 15 auto-gradable question types, including multiple choice, ordering, hotspot, short answer, and fill-in-the-blank, with instant feedback in the lesson.'
    }
  ];

  const conversionMechanics = [
    {
      title: 'Inline callout cards',
      description:
        'Add a callout card inside any lesson with a title, description, button label, and link to your paid course, checkout, or community.'
    },
    {
      title: 'Locked lesson previews',
      description:
        'Leave part of the course open, then replace locked lesson content with a callout that points to the next step.'
    },
    {
      title: 'Payment, discount, and invite gating',
      description: 'Route learners into paid enrollment with payment links, discount codes, or invite-based access.'
    },
    {
      title: 'Auto-enroll after sign-up',
      description: 'Learners who sign in can return to the lesson they were already viewing instead of starting over.'
    }
  ];

  const brandingItems = ['Custom domain', 'Your logo', 'Your site name', 'Dark mode built-in', 'SEO-friendly pages'];

  const workflow = [
    {
      title: 'Build the course',
      description:
        'Use the same course editor you already use for paid courses. Public courses support all 15 auto-gradable question types.',
      label: 'Step 01'
    },
    {
      title: 'Switch type to PUBLIC',
      description:
        'Change the course type to `PUBLIC`. If a question type is not supported, ClassroomIO flags it before publish.',
      label: 'Step 02'
    },
    {
      title: 'Set the page up',
      description: 'Choose a theme, add your logo and site name, and connect a custom domain if you want one.',
      label: 'Step 03'
    },
    {
      title: 'Publish',
      description:
        'Publish the course on your public site, then add callouts or locked lessons where you want to turn readers into enrollments.',
      label: 'Step 04'
    }
  ];

  const publicCoursesFaqs = [
    {
      question: 'Does hosting a public course cost extra?',
      answer:
        'No. Public courses are part of your existing ClassroomIO workspace. Every paid plan can publish them, and learners do not count against your seat limits until they enroll in a paid course.'
    },
    {
      question: 'Can I require payment, or capture leads on a public course?',
      answer:
        'Yes. You can attach a payment link, a discount code, or an invite token to the enrollment flow. You can also place callout cards inside lessons that link to a paid course, a community, or any URL you choose.'
    },
    {
      question: 'Do I need a custom domain?',
      answer:
        'No. Every public course is available on your ClassroomIO public site by default. A custom domain is optional if you want the course to live at your own URL.'
    },
    {
      question: 'Can search engines index a public course?',
      answer:
        'Yes. Public course landing pages and lesson previews are server-rendered and include the metadata search engines need, so courses are discoverable.'
    },
    {
      question: 'How are quizzes graded?',
      answer:
        'Instantly in the browser. Public courses support 15 auto-gradable question types, including multiple choice, ordering, matching, hotspot, fill-in-the-blank, numeric, short answer, and file upload.'
    },
    {
      question: 'Can I gate some lessons and leave the rest public?',
      answer:
        'Yes. Lock the lessons you want to gate and the viewer will show a callout card in place of the content. You can use that card to send people to the paid version of the course.'
    },
    {
      question: 'Can I match the course page to my brand?',
      answer:
        'Yes. You can choose a landing theme, upload your logo, set a site name, and optionally connect a custom domain. Dark mode is built in for learners.'
    }
  ];
</script>

<svelte:head>
  <title>Public Courses | ClassroomIO</title>
  <meta
    name="description"
    content="Publish public courses on your own branded page, with built-in quizzes, lesson callouts, and optional custom domains."
  />
  <meta property="og:title" content="Public Courses | ClassroomIO" />
  <meta
    property="og:description"
    content="A branded public course page for sharing free lessons, quizzes, and previews before someone enrolls."
  />
</svelte:head>

<section class="bg-white">
  <PageHeader className="px-6 lg:px-12">
    <div class="mx-auto flex max-w-[820px] flex-col items-center text-center">
      <Badge variant="outline" class="mb-6 gap-2! bg-white px-3.5! py-1.5!">
        <Globe size={14} class="text-blue-700" />
        Public Courses
      </Badge>

      <h1 class="text-[clamp(2.4rem,4vw,3.6rem)] leading-[1.08] font-medium tracking-tight text-gray-950">
        Publish free courses that lead to paid enrollments.
      </h1>

      <p class="mt-6 text-sm leading-relaxed lg:text-base">
        Public courses let you share lessons without asking people to create an account first. You can publish free
        course content, add quizzes, customize the page, and guide interested learners into a paid course or community.
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">Book a Demo</Button>
        <Button href="/signup" variant="outline">Start free</Button>
      </div>
    </div>

    <div class="mx-auto mt-14 w-full max-w-[1100px]">
      <img
        src="https://assets.cdn.clsrio.com/www/public-courses/public-courses-hero.jpeg"
        alt="Public course page on desktop"
        width="1920"
        height="1481"
        loading="eager"
        class="w-full rounded-2xl border border-gray-200 shadow-sm"
      />
    </div>
  </PageHeader>

  <!-- Use cases: two-column split -->
  <section class="bg-gray-50 px-6 py-16 lg:px-12 lg:py-24">
    <div class="mx-auto max-w-[1120px]">
      <div class="mb-10 max-w-[720px]">
        <div class="mb-3 text-xs font-medium tracking-widest text-blue-700 uppercase">Why teams use it</div>
        <h2 class="text-[clamp(2rem,3vw,2.7rem)] leading-[1.15] font-medium tracking-tight text-gray-950">
          Public courses are useful before someone is ready to enroll.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Teams use them to share sample lessons, open training, and course previews. Learners get a low-friction way to
          read or try the material before deciding what to do next.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-gray-200">
        <div class="rounded-2xl border border-gray-200 bg-white p-8 lg:rounded-r-none lg:border-r-0">
          <div class="text-[11px] font-medium tracking-widest text-blue-700 uppercase">For creators</div>
          <h3 class="mt-4 text-[clamp(1.4rem,2.2vw,1.9rem)] leading-[1.15] font-medium tracking-tight text-gray-950">
            A practical way to publish useful course content in public.
          </h3>

          <div class="my-7 border-t border-gray-200"></div>

          <ul class="space-y-4">
            {#each creatorUseCases as useCase}
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
              <GraduationCap size={13} strokeWidth={2} />
              Shareable by default
            </span>
          </div>
        </div>

        <div class="mt-6 rounded-2xl border border-gray-200 bg-white p-8 lg:mt-0 lg:rounded-l-none lg:border-l-0">
          <div class="text-[11px] font-medium tracking-widest text-emerald-700 uppercase">For learners</div>
          <h3 class="mt-4 text-[clamp(1.4rem,2.2vw,1.9rem)] leading-[1.15] font-medium tracking-tight text-gray-950">
            A simple course page that is easy to browse and easy to read.
          </h3>

          <div class="my-7 border-t border-gray-200"></div>

          <ul class="space-y-4">
            {#each learnerUseCases as useCase}
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
              <Users size={13} strokeWidth={2} />
              No login wall
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Key features -->
  <FeatureGrid
    eyebrow="What you get"
    title="The essentials are already built in."
    description="You do not need a separate website project to publish public course pages that look finished and work well."
    features={keyFeatures}
    columns={4}
  />

  <!-- Drive-to-paid story -->
  <section class="bg-white px-6 py-12 lg:px-12 lg:py-16">
    <div class="mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
      <div>
        <div class="mb-2 text-xs font-medium tracking-widest text-blue-700 uppercase">Moving people forward</div>
        <h2 class="text-[clamp(1.75rem,2.6vw,2.2rem)] leading-[1.15] font-medium tracking-tight">
          If someone wants more, you can give them a clear next step.
        </h2>
        <p class="mt-5 text-base leading-relaxed text-gray-500">
          Public courses are useful on their own, but they can also lead into a paid course, a cohort, or a community.
          Add callouts inside lessons, lock selected content, and guide people into enrollment when it makes sense.
        </p>
        <ul class="mt-6 space-y-3 text-sm text-gray-700">
          {#each conversionMechanics as item, i}
            <BlurFade delay={0.06 * i} once>
              <li class="flex gap-3">
                <span class="mt-1.5 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700"></span>
                <span>
                  <span class="font-medium text-gray-950">{item.title}.</span>
                  <span class="ml-1 text-gray-500">{item.description}</span>
                </span>
              </li>
            </BlurFade>
          {/each}
        </ul>
      </div>
      <img
        src="https://assets.cdn.clsrio.com/www/public-courses/public-course-empty-state.jpeg"
        alt="Public course empty state in the dashboard"
        width="1920"
        height="1410"
        loading="lazy"
        class="w-full rounded-2xl border border-gray-200 shadow-sm"
      />
    </div>
  </section>

  <!-- Custom domain + branding trust band -->
  <TrustBand caption="Branding options" items={brandingItems} />

  <!-- How it works -->
  <WorkflowSteps
    eyebrow="How it works"
    title="Set it up in the same workflow you already use."
    description="You do not need a second publishing tool. Public courses use the same course editor and publishing flow as the rest of ClassroomIO."
    steps={workflow}
  />

  <!-- FAQ -->
  <section class="bg-white px-6 lg:px-12">
    <Faq
      heading="Public courses, answered"
      subheading="A few common questions before teams publish their first public course."
      items={publicCoursesFaqs}
      hideCta
    />
  </section>

  <!-- Final CTA -->
  <PageSignupCTA
    header="Publish a public course without spinning up a separate site."
    subText="Use the same ClassroomIO workspace to share free lessons, add quizzes, and point interested learners toward the next step."
    btnLabel="Book a Demo"
  />
</section>
