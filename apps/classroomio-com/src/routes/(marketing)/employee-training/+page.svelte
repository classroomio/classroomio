<script>
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

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
      description:
        'You can invite managers and employees to create and take trainings at scale in your organization.'
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

<section class="flex flex-col justify-center items-center">
  <PageHeader
    className="flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-6 lg:px-28 md:px-16 px-8"
  >
    <div class="bg-[#DCE5FF] py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
      <p class=" text-sm md:text-base text-[#4B5563] text-center font-medium">
        Unlock your team's potential
      </p>
    </div>
    <div
      class="w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-8"
    >
      <div
        class="w-full max-w-screen-xl flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1
          class="mx-auto m-0 text-4xl lg:text-7xl md:text-6xl font-bold text-slate-900 lg:text-center"
        >
          Employee training software for
          <br /><span class="text-blue-700 relative">modern teams</span>
        </h1>
        <p class="lg:w-[60%] text-base md:text-lg lg:text-center font-normal text-slate-700">
          With ClassroomIO, you can keep your teams in sync with company standards as they change
          quickly.
        </p>
      </div>
      <a
        href="/signup"
        target="_blank"
        class="py-5 px-6 bg-[#1D4ED8] border-transparent outline-transparent rounded-lg text-white text-lg font-semibold"
      >
        Get Started for Free 🚀
      </a>
    </div>
  </PageHeader>

  <section
    class="w-full max-w-screen-xl lg:py-24 py-16 lg:px-28 md:px-16 px-8 flex lg:flex-row flex-col lg:items-center lg:justify-between justify-center gap-x-6 gap-y-8"
  >
    <div class="w-full lg:w-[35%] gap-y-4 flex flex-col items-start justify-start">
      <div class="w-fit py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
        <p class=" text-sm md:text-base font-medium">Amazing benefits</p>
      </div>

      <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
        <h1 class="font-bold text-4xl">Unlock your team's potential</h1>
        <p class="leading-8 text-lg text-gray-500">
          Modern teams require solutions that are easy to use and allows them move quickly.
        </p>
      </div>
    </div>
    <div
      class="lg:w-[60%] lg:min-w-[450px] w-full flex flex-col lg:flex-wrap lg:flex-row justify-start items-center gap-6"
    >
      {#each benefitDetails as benefits}
        <div
          class="w-full lg:w-[47%] min-w-[220px] md:p-6 p-4 border border-[#D9E0F5] rounded-2xl flex flex-col grow gap-y-6"
        >
          <img
            class="w-[48px] h-[48px]"
            src="https://assets.cdn.clsrio.com/www/employee-training/{benefits.icon}"
            alt="light-bulb"
          />

          <div class="w-full flex flex-col justify-start align-start gap-y-2">
            <h1 class="text-xl font-medium">{benefits.title}</h1>
            <p class="leading-8 text-gray-500 font-[#656565] font-light">
              {benefits.description}
            </p>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="w-full bg-[#F1F6FF] flex flex-col items-center justify-start gap-y-16 lg:py-24 py-16 lg:px-28 md:px-16 px-8"
  >
    <div
      class="w-full gap-y-4 flex flex-col lg:items-center items-start lg:justify-center justify-start"
    >
      <div class="w-fit py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
        <p class="text-sm md:text-base text-[#4B5563] text-center font-medium">
          Explore our features
        </p>
      </div>
      <div
        class="lg:w-full max-w-screen-xl flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="text-3xl md:text-5xl font-bold">What makes us the right choice</h1>
        <p class="text-[#334155] text-sm md:text-base font-light lg:text-center md:w-[80%]">
          Discover why we’re the perfect partner for your employee training needs. Experience
          innovative solutions designed to reduce stress and enhance productivity.
        </p>
      </div>
    </div>

    <div
      class="w-full max-w-screen-xl flex flex-col justify-start items-center lg:gap-y-24 gap-16 p-2"
    >
      {#each featureDetails as feature, i}
        <div
          class="w-full lg:w-[70%] flex lg:flex-row {i % 2 !== 0
            ? 'lg:flex-row-reverse'
            : ''} flex-col justify-between lg:items-center items-start gap-10"
        >
          <div
            class="w-fit max-w-sm lg:w-[40%] lg:gap-y-6 gap-y-3 flex flex-col items-start justify-start"
          >
            <img
              class="w-[48px] h-[48px]"
              src="https://assets.cdn.clsrio.com/www/employee-training/{feature.icon}"
              alt="team icon"
            />
            <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
              <h1 class="font-bold text-4xl">{feature.title}</h1>
              <p class="leading-8 text-lg text-gray-500">
                {feature.description}
              </p>
            </div>
            <button
              class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
              data-cal-config="'layout':'month_view'"
              data-cal-link="classroomio/demo"
            >
              Book a Demo
            </button>
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
    class="w-full bg-[#040F2D] flex flex-col items-center justify-start gap-y-16 lg:py-24 py-16 lg:px-28 md:px-16 px-8"
  >
    <div
      class="w-full max-w-screen-xl flex lg:flex-row-reverse flex-col-reverse lg:justify-between justify-start lg:items-center items-start gap-y-8"
    >
      <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
        <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
          <h1 class="font-bold text-4xl text-white">
            Did you know you can request for custom features?
          </h1>
          <p class="leading-8 text-[#DEDEDE] text-xl font-light">
            Companies get the opportunity to request custom features from us.
          </p>
        </div>
        <a
          href="/demo"
          target="_blank"
          class="py-4 px-8 border border-tranparent outline-transparent bg-white rounded text-[#040F2D] text-sm font-semibold"
        >
          Talk to sales
        </a>
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
