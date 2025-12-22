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

<section class="flex flex-col justify-center items-center">
  <PageHeader
    className="flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-6 lg:px-28 md:px-16 px-8"
  >
    <Badge class="py-2! px-4!" variant="outline">Solution for Bootcamps</Badge>

    <div
      class="w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-8"
    >
      <div
        class="w-full max-w-7xl flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="mx-auto m-0 text-4xl md:text-6xl text-slate-900 lg:text-center">
          The platform for fast
          <span class="text-blue-700 relative"> growing bootcamps</span>
        </h1>
        <p class="lg:w-[60%] text-base md:text-lg lg:text-center font-normal text-slate-700">
          From AI powered course creation to student collaboration tools, ClassroomIO provides
          everything you need to run a cutting-edge, high-impact bootcamp.
        </p>
      </div>
      <Button href="/signup" target="_blank" rel="noopener noreferrer nofollow">
        Get Started for Free 🚀
      </Button>
    </div>
  </PageHeader>

  <section
    class="w-full lg:py-24 py-16 lg:px-28 md:px-16 px-6 flex flex-col lg:items-center lg:justify-between justify-center gap-y-12"
  >
    <div
      class="w-full gap-y-4 flex flex-col lg:items-center items-start lg:justify-center justify-start"
    >
      <Badge class="py-2! px-4!" variant="outline">Our benefits</Badge>

      <div
        class="lg:w-full max-w-7xl flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="text-3xl md:text-5xl font-bold">Inspire Student Success</h1>
        <p class="text-[#334155] text-sm md:text-base font-light lg:text-center md:w-[80%]">
          Scale your bootcamp with ClassroomIO's comprehensive toolkit. Create engaging content,
          foster community, and drive student achievement.
        </p>
      </div>
    </div>

    <div
      class="w-full max-w-7xl flex lg:flex-row flex-col lg:justify-between justify-start gap-6 lg:items-center items-start"
    >
      {#each benefitDetails as benefits}
        <div class="w-full md:p-6 p-4 border border-[#D9E0F5] rounded-2xl flex flex-col gap-y-6">
          <img
            class="w-[48px] h-[48px]"
            src="https://assets.cdn.clsrio.com/www/bootcamps/{benefits.icon}"
            alt="brain"
          />

          <div class="w-full flex flex-col justify-start align-start gap-y-2">
            <h1 class="text-xl font-medium">{benefits.title}</h1>

            {#each benefits.points as point}
              <div class="flex flex-row justify-start items-start gap-x-3">
                <img
                  src="https://assets.cdn.clsrio.com/www/bootcamps/{benefits.checkMark}"
                  alt="check mark"
                />
                <p class="leading-8 text-gray-500 font-[#656565] font-light">
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
    class="w-full bg-[#F1F6FF] flex flex-col items-center justify-center gap-y-16 lg:py-24 py-16 lg:px-28 md:px-16 px-8"
  >
    <div
      class="w-full max-w-7xl gap-y-4 flex flex-col lg:items-center items-start lg:justify-center justify-start"
    >
      <Badge class="py-2! px-4!" variant="outline">Explore our features</Badge>

      <div
        class="w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="text-3xl md:text-5xl font-bold">Why We're the Perfect Fit</h1>
        <p class="text-[#334155] text-sm md:text-base font-light lg:text-center md:w-[80%]">
          Discover why we’re the ideal partner for your bootcamp training needs. Experience
          innovative solutions designed to elevate student engagement and maximize learning
          outcomes.
        </p>
      </div>
    </div>

    <div class="w-full max-w-7xl flex flex-col justify-start items-center lg:gap-y-24 gap-y-16">
      {#each featureDetails as feature, i}
        <div
          class="w-full lg:w-[70%] flex lg:flex-row {i % 2 !== 0
            ? 'lg:flex-row-reverse'
            : ''} flex-col lg:justify-between justify-between lg:items-center items-start gap-10"
        >
          <div
            class="w-full max-w-sm lg:w-[40%] lg:gap-y-6 gap-y-3 flex flex-col items-start justify-start"
          >
            <img
              class="w-[48px] h-[48px]"
              src="https://assets.cdn.clsrio.com/www/bootcamps/{feature.icon}"
              alt="team icon"
            />
            <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
              <h1 class="font-bold text-4xl">{feature.title}</h1>
              <p class="leading-8 text-lg text-gray-500">
                {feature.description}
              </p>
            </div>

            {#if feature.ctaLink}
              <Button variant="outline" href={feature.ctaLink} target="_blank noopener noreferrer">
                {feature.ctaLabel}
              </Button>
            {:else}
              <Button
                variant="outline"
                data-cal-config="'layout':'month_view'"
                data-cal-link="classroomio/demo"
              >
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
