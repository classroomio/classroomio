<script>
  import { PageSignupCTA, PageHeader } from '$lib/components';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';

  const benefitDetails = [
    {
      icon: 'light-bulb.svg',
      title: 'Increased Engagement',
      description: 'Interactive courses and collaborative features keep employees motivated.'
    },
    {
      icon: 'learning.svg',
      title: 'Streamlined Learning',
      description: 'Centralized platform for all training materials and progress tracking.'
    },
    {
      icon: 'pie-chart.svg',
      title: 'Data-Driven Insights',
      description: 'Gain valuable insights into employee performance and learning patterns.'
    },
    {
      icon: 'paint-brush.svg',
      title: 'Customizable Experience',
      description: "Tailor the learning experience to your company's specific needs and branding."
    }
  ];

  const featureDetails = [
    {
      icon: 'team-mgnt.svg',
      img: 'team-mgnt2.svg',
      title: 'Team management',
      description: 'You can invite managers and employees to create and take trainings at scale in your organization.'
    },
    {
      icon: 'colour-pallete.svg',
      img: 'custom.svg',
      title: 'Custom branding',
      description:
        'With our customizable platform, you can set your company logo, brand color and add a custom domain to your employee LMS.'
    },
    {
      icon: 'cup.svg',
      img: 'progress.svg',
      title: 'Track employee progress',
      description: 'You can track the progress of your employees and assist whoever needs help.'
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
    <Badge class="px-4! py-2!" variant="outline">Unlock your team's potential</Badge>

    <div class="flex w-full flex-col items-start justify-start gap-y-8 lg:items-center lg:justify-center">
      <div class="flex w-full max-w-7xl flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
        <h1 class="m-0 mx-auto text-4xl text-slate-900 md:text-6xl lg:text-center">
          Employee training software for
          <br /><span class="relative text-blue-700">modern teams</span>
        </h1>
        <p class="text-base font-normal text-slate-700 md:text-lg lg:w-[60%] lg:text-center">
          With ClassroomIO, you can keep your teams in sync with company standards as they change quickly.
        </p>
      </div>
      <Button href="/signup" target="_blank">Get Started for Free 🚀</Button>
    </div>
  </PageHeader>

  <section
    class="flex w-full max-w-7xl flex-col justify-center gap-x-6 gap-y-8 px-8 py-16 md:px-16 lg:flex-row lg:items-center lg:justify-between lg:px-28 lg:py-24"
  >
    <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:w-[35%]">
      <Badge variant="outline">Amazing benefits</Badge>

      <div class="flex flex-col items-start justify-start gap-y-4 md:w-full">
        <h1 class="text-3xl">Unlock your team's potential</h1>
        <p class="text-lg leading-8 text-gray-500">
          Modern teams require solutions that are easy to use and allows them move quickly.
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
            alt="light-bulb"
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
      <Badge class="px-4! py-2!" variant="outline">Explore our features</Badge>

      <div
        class="flex max-w-7xl flex-col items-start justify-start gap-y-4 lg:w-full lg:items-center lg:justify-center"
      >
        <h1 class="text-3xl">What makes us the right choice</h1>
        <p class="text-sm font-light text-[#334155] md:w-[80%] md:text-base lg:text-center">
          Discover why we’re the perfect partner for your employee training needs. Experience innovative solutions
          designed to reduce stress and enhance productivity.
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
              alt="team icon"
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
              alt="team management feature ui"
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
          <h1 class="text-2xl text-white">Did you know you can request for custom features?</h1>
          <p class="text-base leading-8 text-[#DEDEDE]">
            Companies get the opportunity to request custom features from us.
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
    header="Give your team the training they deserve"
    subText="It's free to sign up and start getting value out of the product."
    btnLabel="Sign me up"
    link="/signup"
    demo={false}
  />
</section>
