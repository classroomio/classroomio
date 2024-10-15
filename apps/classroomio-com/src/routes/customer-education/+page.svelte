<script>
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const benefitDetails = [
    {
      icon: 'personalised.svg',
      title: 'Personalized Learning',
      description: 'Offer branded landing pages and multilingual courses for diverse customers.'
    },
    {
      icon: 'structured.svg',
      title: 'Structured Education',
      description: 'Create engaging courses with AI-assisted content generation.'
    },
    {
      icon: 'simplified.svg',
      title: 'Simplified Management',
      description:
        'Centralize and easily manage, share, and distribute all customer education materials.'
    }
  ];

  const featureDetails = [
    {
      icon: 'landing-i.svg',
      img: 'landing.svg',
      title: 'Dedicated landing page',
      description:
        'We give you a customisable landing page that can be shared with your customers who are interested in learning about your products',
      CTA: 'Book a Demo'
    },
    {
      icon: 'link.svg',
      img: 'domain.svg',
      title: 'Custom domains',
      description:
        'companies can use their own urls to link to our landing page instead of using our free subdomain (company.classroomio.com)',
      CTA: 'Book a Demo'
    },
    {
      icon: 'globe.svg',
      img: 'language.svg',
      title: 'Multi language support',
      description:
        'We support 6 languages and you can deploy courses in different languages to support different demographics',
      CTA: 'Book a Demo'
    },
    {
      icon: 'paths.svg',
      img: 'pathways.svg',
      title: 'Pathways',
      description: 'Grouping of multiple courses into one comprehensive learning pathway',
      CTA: 'Book a Demo'
    }
  ];
</script>

<svelte:head>
  <title>Customer Education | ClassroomIO</title>
</svelte:head>

<section class="flex flex-col justify-center items-center">
  <PageHeader
    className="flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-6 lg:px-28 md:px-16 px-8"
  >
    <div class="bg-[#DCE5FF] py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
      <p class=" text-sm md:text-base text-[#4B5563] text-center font-medium">
        Solution for Customer Education
      </p>
    </div>
    <div
      class="w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-8"
    >
      <div
        class="w-full max-w-screen-xl flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1
          class="w-[95%] mx-auto m-0 text-4xl lg:text-7xl md:text-6xl font-bold text-slate-900 lg:text-center"
        >
          <span class="text-blue-700 relative">Empower</span> Your Customers with Self-Service
          <span class="text-blue-700 relative">Education</span>
        </h1>
        <p class="lg:w-[60%] text-base md:text-lg lg:text-center font-normal text-slate-700">
          Create beautiful, branded landing pages to showcase your courses and get customers up to
          speed quickly
        </p>
      </div>
      <button
        class="py-5 px-6 bg-[#1D4ED8] border-transparent outline-transparent rounded-lg text-white text-lg font-semibold"
        >Get Started for Free 🚀</button
      >
    </div>
  </PageHeader>

  <section
    class="w-full lg:py-24 py-16 lg:px-28 md:px-16 px-8 flex flex-col lg:items-center lg:justify-between justify-center gap-y-12"
  >
    <div
      class="w-full gap-y-4 flex flex-col lg:items-center items-start lg:justify-center justify-start"
    >
      <div class="w-fit py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
        <p class="text-sm md:text-base font-medium">Have you heard the benefits?</p>
      </div>
      <div
        class="lg:w-full max-w-screen-xl flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="text-3xl md:text-5xl font-bold">
          Elevate Your Customer Education with ClassroomIO
        </h1>
        <p class="text-[#334155] text-sm md:text-base font-light lg:text-center md:w-[80%]">
          Empower your customers with personalized, scalable, and effective learning experiences.
        </p>
      </div>
    </div>

    <div
      class="w-full max-w-screen-xl flex lg:flex-row flex-col lg:justify-between justify-start gap-6 lg:items-center items-start lg:items-stretch"
    >
      {#each benefitDetails as benefits}
        <div class="w-full md:p-6 p-4 border border-[#D9E0F5] rounded-2xl flex flex-col gap-y-6">
          <img class="size-12" src="/customer-education/{benefits.icon}" alt="icon" />

          <div class="w-full flex flex-col justify-start align-start gap-y-2">
            <h1 class="text-xl font-medium">{benefits.title}</h1>

            <div class="flex flex-row justify-start items-start gap-x-3">
              <p class="leading-8 text-gray-500 font-[#656565] font-light">
                {benefits.description}
              </p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="w-full bg-[#F1F6FF] flex flex-col items-center justify-center gap-y-16 lg:py-24 py-16 lg:px-28 md:px-16 px-8"
  >
    <div
      class="w-full gap-y-4 flex flex-col lg:items-center items-start lg:justify-center justify-start"
    >
      <div class="w-fit py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
        <p class=" text-sm md:text-base text-[#4B5563] text-center font-medium">
          Explore our features
        </p>
      </div>
      <div
        class="lg:w-full max-w-screen-xl flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="text-3xl md:text-5xl font-bold">Why Choose Us For Education Needs</h1>
        <p class="text-[#334155] text-sm md:text-base font-light lg:text-center md:w-[80%]">
          Discover how our innovative solutions can reduce stress, enhance productivity, and achieve
          your training goals.
        </p>
      </div>
    </div>

    <div
      class="w-full max-w-screen-xl flex flex-col justify-start items-start lg:gap-y-24 gap-y-16"
    >
      {#each featureDetails as feature, i}
        <div
          class="w-full flex lg:flex-row {i % 2 !== 0
            ? 'lg:flex-row-reverse'
            : ''} flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
        >
          <div
            class="w-full max-w-sm lg:w-[40%] lg:gap-y-6 gap-y-3 flex flex-col items-start justify-start"
          >
            <img src="/customer-education/{feature.icon}" alt="team icon" />
            <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
              <h1 class="font-bold text-4xl">{feature.title}</h1>
              <p class="leading-8 text-lg text-gray-500">
                {feature.description}
              </p>
            </div>
            <button
              class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
              >{feature.CTA}</button
            >
          </div>

          <div>
            <img
              class="max-w-[380px]"
              src="/customer-education/{feature.img}"
              alt="team management feature ui"
            />
          </div>
        </div>
      {/each}
    </div>
  </section>

  <PageSignupCTA
    header="Take Charge Of Your Trainings Today"
    subText="It's free to sign up and start getting value out of the product."
    btnLabel="Sign me up"
    link="/signup"
    demo={false}
  />
</section>
