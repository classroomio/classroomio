<script>
  import { PageSignupCTA, PageHeader } from '$lib/components';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';

  const benefitDetails = [
    {
      icon: 'light-bulb.svg',
      title: 'Grow from within',
      description: 'Employees who learn new skills stay longer, perform better, and take on bigger challenges.'
    },
    {
      icon: 'learning.svg',
      title: 'Training that sticks',
      description: 'Structured courses with quizzes and certifications so your team actually retains what they learn.'
    },
    {
      icon: 'pie-chart.svg',
      title: 'See the ROI',
      description: 'Track completion rates, skill gaps, and progress across every department in real time.'
    },
    {
      icon: 'paint-brush.svg',
      title: 'Make it yours',
      description: 'Your logo, your colors, your domain. Employees see your brand, not ours.'
    }
  ];

  const featureDetails = [
    {
      icon: 'team-mgnt.svg',
      img: 'team-mgnt2.svg',
      title: 'Enroll entire teams in minutes',
      description:
        'Invite managers and employees by department or role. Assign the right training to the right people without the back and forth.'
    },
    {
      icon: 'colour-pallete.svg',
      img: 'custom.svg',
      title: 'A learning platform that feels like yours',
      description:
        'Set your company logo, brand colors, and custom domain. Your employees get a seamless experience that looks and feels internal.'
    },
    {
      icon: 'cup.svg',
      img: 'progress.svg',
      title: 'Know exactly where your team stands',
      description: 'See who completed what, who needs a nudge, and where the skill gaps are. All in one dashboard.'
    }
  ];
</script>

<svelte:head>
  <title>Employee Training | ClassroomIO</title>
</svelte:head>

<section class="flex flex-col items-center justify-center">
  <PageHeader
    className="flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-6 lg:px-28 md:px-16 px-8"
  >
    <Badge class="px-4! py-2!" variant="outline">Invest in your people</Badge>

    <div class="flex w-full flex-col items-start justify-start gap-y-8 lg:items-center lg:justify-center">
      <div class="flex w-full max-w-7xl flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
        <h1 class="m-0 mx-auto text-4xl text-slate-900 md:text-6xl lg:text-center">
          Your best investment is
          <br /><span class="relative text-blue-700">your employees</span>
        </h1>
        <p class="text-base font-normal text-slate-700 md:text-lg lg:w-[60%] lg:text-center">
          Companies that invest in employee growth outperform the ones that don't. Give your team the tools to learn,
          grow, and lead.
        </p>
      </div>
      <Button href="/signup" target="_blank">Start investing in your team</Button>
    </div>
  </PageHeader>

  <section
    class="flex w-full max-w-7xl flex-col justify-center gap-x-6 gap-y-8 px-8 py-16 md:px-16 lg:flex-row lg:items-center lg:justify-between lg:px-28 lg:py-24"
  >
    <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:w-[35%]">
      <Badge variant="outline">Why it matters</Badge>

      <div class="flex flex-col items-start justify-start gap-y-4 md:w-full">
        <h1 class="text-3xl">Great teams are built, not hired</h1>
        <p class="text-lg leading-8 text-gray-500">
          The companies people want to work for are the ones that help them grow. Training is how you get there.
        </p>
      </div>
    </div>
    <div
      class="flex w-full flex-col items-center justify-start gap-6 lg:w-[60%] lg:min-w-[450px] lg:flex-row lg:flex-wrap"
    >
      {#each benefitDetails as benefits}
        <div
          class="flex w-full min-w-[220px] grow flex-col gap-y-6 rounded-2xl border border-[#D9E0F5] p-4 md:p-6 lg:w-[47%]"
        >
          <img
            class="h-[48px] w-[48px]"
            src="https://assets.cdn.clsrio.com/www/employee-training/{benefits.icon}"
            alt={benefits.title}
          />

          <div class="align-start flex w-full flex-col justify-start gap-y-2">
            <h1 class="text-lg">{benefits.title}</h1>
            <p class="font-[#656565] text-base leading-8 font-light text-gray-500">
              {benefits.description}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="flex w-full flex-col items-center justify-start gap-y-16 bg-[#F1F6FF] px-8 py-16 md:px-16 lg:px-28 lg:py-24"
  >
    <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
      <Badge class="px-4! py-2!" variant="outline">How it works</Badge>

      <div
        class="flex max-w-7xl flex-col items-start justify-start gap-y-4 lg:w-full lg:items-center lg:justify-center"
      >
        <h1 class="text-3xl">Everything you need to grow your team</h1>
        <p class="text-sm font-light text-[#334155] md:w-[80%] md:text-base lg:text-center">
          From onboarding to upskilling, ClassroomIO gives you the tools to build a culture of continuous learning.
        </p>
      </div>
    </div>

    <div class="flex w-full max-w-7xl flex-col items-center justify-start gap-16 p-2 lg:gap-y-24">
      {#each featureDetails as feature, i}
        <div
          class="flex w-full lg:w-[70%] lg:flex-row {i % 2 !== 0
            ? 'lg:flex-row-reverse'
            : ''} flex-col items-start justify-between gap-10 lg:items-center"
        >
          <div class="flex w-fit max-w-sm flex-col items-start justify-start gap-y-3 lg:w-[40%] lg:gap-y-6">
            <img
              class="h-[48px] w-[48px]"
              src="https://assets.cdn.clsrio.com/www/employee-training/{feature.icon}"
              alt={feature.title}
            />
            <div class="flex flex-col items-start justify-start gap-y-4 md:w-full">
              <h1 class="text-2xl">{feature.title}</h1>
              <p class="text-lg leading-8 text-gray-500">
                {feature.description}
              </p>
            </div>
            <Button variant="outline" data-cal-config="'layout':'month_view'" data-cal-link="classroomio/demo">
              Book a Demo
            </Button>
          </div>

          <div>
            <img
              class="w-full lg:max-w-[380px]"
              src="https://assets.cdn.clsrio.com/www/employee-training/{feature.img}"
              alt={feature.title}
            />
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="flex w-full flex-col items-center justify-start gap-y-16 bg-[#040F2D] px-8 py-16 md:px-16 lg:px-28 lg:py-24"
  >
    <div
      class="flex w-full max-w-7xl flex-col-reverse items-start justify-start gap-y-8 lg:flex-row-reverse lg:items-center lg:justify-between"
    >
      <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:w-[40%]">
        <div class="flex flex-col items-start justify-start gap-y-4 md:w-full">
          <h1 class="text-2xl text-white">Need something specific for your team?</h1>
          <p class="text-base leading-8 text-[#DEDEDE]">
            We work with companies to build custom training solutions. Tell us what your team needs and we'll make it
            happen.
          </p>
        </div>
        <Button href="/demo" target="_blank" variant="outline">Talk to sales</Button>
      </div>

      <img
        class="size-96"
        src="https://assets.cdn.clsrio.com/www/employee-training/bro.svg"
        alt="male and female in an office"
      />
    </div>
  </section>

  <PageSignupCTA
    header="The best time to invest in your team is now"
    subText="Start for free. No credit card required."
    btnLabel="Get started"
    link="/signup"
    demo={false}
  />
</section>
