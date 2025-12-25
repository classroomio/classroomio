<script>
  import { PageSignupCTA, PageHeader } from '$lib/components';
  import { Button } from '@cio/ui/base/button';
  import { Badge } from '@cio/ui/base/badge';

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
      description: 'Centralize and easily manage, share, and distribute all customer education materials.'
    }
  ];

  const featureDetails = [
    {
      icon: 'landing-i.svg',
      img: 'landing.svg',
      title: 'Dedicated landing page',
      description:
        'We give you a customisable landing page that can be shared with your customers who are interested in learning about your products'
    },
    {
      icon: 'link.svg',
      img: 'domain.svg',
      title: 'Custom domains',
      description: 'Use your own domain to link to our landing page instead of using our free subdomain'
    },
    {
      icon: 'globe.svg',
      img: 'language.svg',
      title: 'Multi language support',
      description:
        'We support 6 languages and you can deploy courses in different languages to support different demographics'
    },
    {
      icon: 'paths.svg',
      img: 'pathways.svg',
      title: 'Pathways',
      description:
        'With the introduction of pathways, you can group multiple courses into one comprehensive learning pathway'
    }
  ];
</script>

<svelte:head>
  <title>Customer Education | ClassroomIO</title>
</svelte:head>

<section class="flex flex-col items-center justify-center">
  <PageHeader
    className="flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-6 lg:px-28 md:px-16 px-8"
  >
    <Badge class="py-2! px-4!" variant="outline">Solution for Customer Education</Badge>

    <div class="flex w-full flex-col items-start justify-start gap-y-8 lg:items-center lg:justify-center">
      <div class="flex w-full max-w-7xl flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
        <h1 class="m-0 mx-auto w-[95%] text-4xl text-slate-900 md:text-6xl lg:text-center">
          Drive retention and revenue with
          <span class="relative text-blue-700">Customer Education</span>
        </h1>
        <p class="text-base font-normal text-slate-700 md:text-lg lg:w-[60%] lg:text-center">
          Yes you are making lots of sales however you keep experiencing churn and customers leaving you. Without a
          proper customer education strategy you are leaving a lot of money on the table.
        </p>
      </div>
      <Button href="/signup" target="_blank" rel="noopener noreferrer nofollow">Get Started for Free 🚀</Button>
    </div>
  </PageHeader>

  <section
    class="flex w-full flex-col justify-center gap-y-12 px-8 py-16 md:px-16 lg:items-center lg:justify-between lg:px-28 lg:py-24"
  >
    <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
      <Badge class="py-1! px-4!" variant="outline">Our benefits</Badge>
      <div
        class="flex max-w-7xl flex-col items-start justify-start gap-y-4 lg:w-full lg:items-center lg:justify-center"
      >
        <h1 class="text-3xl">The customer education toolkit</h1>
        <p class="text-sm font-light text-[#334155] md:w-[80%] md:text-base lg:text-center">
          Create beautiful, branded landing pages to showcase your courses and get customers up to speed quickly
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
            src="https://assets.cdn.clsrio.com/www/customer-education/{benefits.icon}"
            alt="icon"
          />

          <div class="align-start flex w-full flex-col justify-start gap-y-2">
            <p class="text-lg">{benefits.title}</p>

            <div class="flex flex-row items-start justify-start gap-x-3">
              <p class="font-[#656565] font-light leading-8 text-gray-500">
                {benefits.description}
              </p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="flex w-full flex-col items-center justify-center gap-y-16 bg-[#F1F6FF] px-8 py-16 md:px-16 lg:px-28 lg:py-24"
  >
    <div class="flex w-full flex-col items-start justify-start gap-y-4 lg:items-center lg:justify-center">
      <div class="w-fit rounded-full border-2 border-[#C2D2FF] px-4 py-2 text-center">
        <p class="text-center text-sm text-[#4B5563]">Explore our features</p>
      </div>
      <div
        class="flex max-w-7xl flex-col items-start justify-start gap-y-4 lg:w-full lg:items-center lg:justify-center"
      >
        <h1 class="text-3xl">Why Choose Us For Education Needs</h1>
        <p class="text-sm font-light text-[#334155] md:w-[80%] md:text-base lg:text-center">
          Discover how our innovative solutions can reduce stress, enhance productivity, and achieve your training
          goals.
        </p>
      </div>
    </div>

    <div class="flex w-full max-w-7xl flex-col items-center justify-start gap-y-16 lg:gap-y-24">
      {#each featureDetails as feature, i}
        <div
          class="flex w-full lg:flex-row {i % 2 !== 0
            ? 'lg:flex-row-reverse'
            : ''} flex-col items-start justify-start gap-10 lg:items-center lg:justify-evenly"
        >
          <div class="flex w-full max-w-sm flex-col items-start justify-start gap-y-3 lg:w-[40%] lg:gap-y-6">
            <img src="https://assets.cdn.clsrio.com/www/customer-education/{feature.icon}" alt="team icon" />
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
              src="https://assets.cdn.clsrio.com/www/customer-education/{feature.img}"
              alt="team management feature ui"
            />
          </div>
        </div>
      {/each}
    </div>
  </section>

  <PageSignupCTA
    header="Stop losing customers to your competitors"
    subText="We help you retain customers by helping them understand your products and services."
    btnLabel="Book a demo"
    demo={true}
  />
</section>
