<script>
  import { PageSignupCTA, PageHeader } from '$lib/components';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';

  const benefitDetails = [
    {
      icon: 'ai.svg',
      title: 'AI-Powered Learning',
      checkMark: 'check.svg',
      points: [
        'Create engaging courses with AI-assisted content generation.',
        'Automate grading and feedback processes, saving time and effort.',
        'Personalize learning experiences based on individual student needs.'
      ]
    },
    {
      icon: 'community.svg',
      title: 'Foster a Thriving Community',
      checkMark: 'check.svg',
      points: [
        'Create a supportive learning environment with built-in forums and interactive tools.',
        'Encourage collaboration and knowledge sharing among students.',
        'Build a strong community of learners and mentors.'
      ]
    },
    {
      icon: 'operations.svg',
      title: 'Streamline Operations',
      checkMark: 'check.svg',
      points: [
        'Manage your courses and students efficiently with our user-friendly platform.',
        'Issue custom certificates to validate student achievements.',
        'Provide a seamless learning experience for your students.'
      ]
    }
  ];

  const featureDetails = [
    {
      icon: 'certificate-i.svg',
      img: 'certificate.svg',
      title: 'Certificates',
      description:
        'We provide pre built certificate templates anyone can choose from and provide to their students right within our dashboard'
    },
    {
      icon: 'forum-i.svg',
      img: 'forum.svg',
      title: 'Forum area for question and answer',
      description:
        'Our community section allows for a robust question and answer experience encouraging collaboration between students. This also encourages knowledge sharing amongst students.'
    },
    {
      icon: 'ai.svg',
      img: 'ai-pic.svg',
      title: 'AI Powered Content creation',
      description:
        'We give you the ability to create courses with AI, upload videos, embed slides, create quizzes and even grade quizzes with AI.'
    },
    {
      icon: 'free-tools-i.svg',
      img: 'free-tools.svg',
      title: 'Free tools for students',
      description:
        'We provide a suite of free tools like Pomodoro timer, Random name picker, and a Progress report generator to make the lives of educators and students much easier.',
      ctaLabel: 'Try it out',
      ctaLink: '/tools'
    }
  ];
</script>

<svelte:head>
  <title>Bootcamps | ClassroomIO</title>
</svelte:head>

<section class="flex flex-col items-center justify-center">
  <PageHeader
    className="flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-6 lg:px-28 md:px-16 px-8"
  >
    <Badge class="px-4! py-2!" variant="outline">Solution for Bootcamps</Badge>

    <div class="flex w-full flex-col items-start justify-start gap-y-8 lg:items-center lg:justify-center">
      <div class="flex w-full max-w-7xl flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
        <h1 class="m-0 mx-auto text-4xl text-slate-900 md:text-6xl lg:text-center">
          The platform for fast
          <span class="relative text-blue-700"> growing bootcamps</span>
        </h1>
        <p class="text-base font-normal text-slate-700 md:text-lg lg:w-[60%] lg:text-center">
          From AI powered course creation to student collaboration tools, ClassroomIO provides everything you need to
          run a cutting-edge, high-impact bootcamp.
        </p>
      </div>
      <Button href="/signup" target="_blank" rel="noopener noreferrer nofollow">Get Started for Free 🚀</Button>
    </div>
  </PageHeader>

  <section
    class="flex w-full flex-col justify-center gap-y-12 px-6 py-16 md:px-16 lg:items-center lg:justify-between lg:px-28 lg:py-24"
  >
    <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
      <Badge class="px-4! py-2!" variant="outline">Our benefits</Badge>

      <div
        class="flex max-w-7xl flex-col items-start justify-start gap-y-4 lg:w-full lg:items-center lg:justify-center"
      >
        <h1 class="text-3xl">Inspire Student Success</h1>
        <p class="text-sm font-light text-[#334155] md:w-[80%] md:text-base lg:text-center">
          Scale your bootcamp with ClassroomIO's comprehensive toolkit. Create engaging content, foster community, and
          drive student achievement.
        </p>
      </div>
    </div>

    <div
      class="flex w-full max-w-7xl flex-col items-start justify-start gap-6 lg:flex-row lg:items-center lg:justify-between"
    >
      {#each benefitDetails as benefits}
        <div class="flex w-full flex-col gap-y-6 rounded-2xl border border-[#D9E0F5] p-4 md:p-6">
          <img
            class="h-[48px] w-[48px]"
            src="https://assets.cdn.clsrio.com/www/bootcamps/{benefits.icon}"
            alt="brain"
          />

          <div class="align-start flex w-full flex-col justify-start gap-y-2">
            <h1 class="text-md">{benefits.title}</h1>

            {#each benefits.points as point}
              <div class="flex flex-row items-start justify-start gap-x-3">
                <img src="https://assets.cdn.clsrio.com/www/bootcamps/{benefits.checkMark}" alt="check mark" />
                <p class="font-[#656565] leading-8 font-light text-gray-500">
                  {point}
                </p>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="flex w-full flex-col items-center justify-center gap-y-16 bg-[#F1F6FF] px-8 py-16 md:px-16 lg:px-28 lg:py-24"
  >
    <div class="flex w-full max-w-7xl flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
      <Badge class="px-4! py-2!" variant="outline">Explore our features</Badge>

      <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
        <h1 class="text-3xl">Why We're the Perfect Fit</h1>
        <p class="text-sm font-light text-[#334155] md:w-[80%] md:text-base lg:text-center">
          Discover why we’re the ideal partner for your bootcamp training needs. Experience innovative solutions
          designed to elevate student engagement and maximize learning outcomes.
        </p>
      </div>
    </div>

    <div class="flex w-full max-w-7xl flex-col items-center justify-start gap-y-16 lg:gap-y-24">
      {#each featureDetails as feature, i}
        <div
          class="flex w-full lg:w-[70%] lg:flex-row {i % 2 !== 0
            ? 'lg:flex-row-reverse'
            : ''} flex-col items-start justify-between gap-10 lg:items-center lg:justify-between"
        >
          <div class="flex w-full max-w-sm flex-col items-start justify-start gap-y-3 lg:w-[40%] lg:gap-y-6">
            <img
              class="h-[48px] w-[48px]"
              src="https://assets.cdn.clsrio.com/www/bootcamps/{feature.icon}"
              alt="team icon"
            />
            <div class="flex flex-col items-start justify-start gap-y-4 md:w-full">
              <h1 class="text-2xl">{feature.title}</h1>
              <p class="text-lg leading-8 text-gray-500">
                {feature.description}
              </p>
            </div>

            {#if feature.ctaLink}
              <Button variant="outline" href={feature.ctaLink} target="_blank noopener noreferrer">
                {feature.ctaLabel}
              </Button>
            {:else}
              <Button variant="outline" data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">
                Book a Demo
              </Button>
            {/if}
          </div>

          <div>
            <img
              class="w-full lg:max-w-[380px]"
              src="https://assets.cdn.clsrio.com/www/bootcamps/{feature.img}"
              alt="team management feature ui"
            />
          </div>
        </div>
      {/each}
    </div>
  </section>

  <PageSignupCTA
    header="Why spend time and money on building your own platform?"
    subText="Invest that time and money back into giving your students the best experience possible."
    btnLabel="Sign me up"
    link="/signup"
    demo={false}
  />
</section>
