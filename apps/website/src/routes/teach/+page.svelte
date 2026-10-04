<script lang="ts">
  import { PageSignupCTA, PageHeader } from '$lib/components';
  import { CtaButton, NotchCard, Section, SectionHeader } from '$lib/components/ui';
  import * as Accordion from '@cio/ui/base/accordion';

  const whyStart = [
    {
      src: 'https://assets.cdn.clsrio.com/www/teach/teach-from-anywhere.svg',
      header: 'Fully Online; Teach from anywhere',
      subText: ' Facilitate a subject from the comfort of your space, engaging students from highly diverse background'
    },
    {
      src: 'https://assets.cdn.clsrio.com/www/teach/get-paid.svg',
      header: 'Get paid extra commission',
      subText: 'Get paid for the course you design and earn extra comission based on course perfomance'
    },
    {
      src: 'https://assets.cdn.clsrio.com/www/teach/inspire-learners.svg',
      header: 'Inspire learners',
      subText: 'Your opportunity to inspire thousands of learners to achieve dreams and academic pursue exellence'
    }
  ];

  const steps = [
    {
      title: 'Sign up',
      subText: 'Create a free account on our platform by going to classroomio.com/signup'
    },
    {
      title: 'Record a course',
      subText: 'Prepare your content however you want and then upload them onto our platform.'
    },
    {
      title: 'Launch the course',
      subText: 'Polish your course, make sure it is ready for students. Then publish it.'
    },
    {
      title: 'Start making sales',
      subText:
        'Share your course with your audience and on social media and start earning money on the courses you create'
    }
  ];

  const faqs = [
    {
      value: 'tutors',
      question: 'What kind of tutors does ClassroomIO look for?',
      answer:
        'We are looking for all kinds of tutors. The most important thing is that you have some experience teaching and you have proven track record of excellent communication'
    },
    {
      value: 'equipment',
      question: 'What equipment do I need to teach on ClassroomIO?',
      answer: 'You just need internet access and a laptop.'
    },
    {
      value: 'apply',
      question: 'What happens after I apply?',
      answer:
        'We will get your application and review it. You should get a response from us within 2-5 working days depending on the volume of applications'
    },
    {
      value: 'earn',
      question: 'How much can I earn?',
      answer:
        'That depends on how much your course sells for and how many students buy your course. Your income is limitless, you can keep making money while you sleep.'
    }
  ];
</script>

<svelte:head>
  <title>Teach | ClassroomIO</title>
  <meta property="og:image" itemprop="image" content="https://brand.cdn.clsrio.com/og/teach.png" />
  <meta property="og:title" content="Teach on ClassroomIO" />
  <meta property="og:description" content="On ClassroomIO you can make side income while doing what you love." />

  <meta property="og:image:secure_url" itemprop="image" content="https://brand.cdn.clsrio.com/og/teach.png" />

  <meta name="twitter:title" content="Teach on ClassroomIO" />
  <meta name="twitter:description" content="On ClassroomIO you can make side income while doing what you love." />
  <meta name="twitter:image" content="https://brand.cdn.clsrio.com/og/teach.png" />
</svelte:head>

<section>
  <PageHeader className="mx-auto max-w-content px-6 md:px-10">
    <div class="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
      <div class="flex flex-col items-center text-center lg:items-start lg:text-left">
        <h1 class="text-display text-balance">Teach with us</h1>
        <p class="text-lead mt-6 max-w-[580px] text-pretty">
          With ClassroomIO, you can make side income while teaching the subject you love
        </p>

        <div class="mt-9">
          <CtaButton href="/teach/register" target="_blank">Register</CtaButton>
        </div>
      </div>

      <div>
        <img src="https://assets.cdn.clsrio.com/www/teach/teacher-hero.png" alt="" class="w-full" />
      </div>
    </div>
  </PageHeader>

  <Section class="border-b border-slate-100">
    <SectionHeader titleClass="">
      {#snippet title()}
        <span class="inline-flex items-center justify-center gap-3">
          Why you should teach with us? <img src="https://assets.cdn.clsrio.com/www/teach/star.svg" alt="" />
        </span>
      {/snippet}
    </SectionHeader>

    <div class="mt-16 grid gap-6 md:grid-cols-3">
      {#each whyStart as why}
        <NotchCard class="h-full items-center gap-5 bg-gray-50 text-center">
          <img src={why.src} alt="" class="size-20" />
          <div>
            <h3 class="text-card-title font-medium">{why.header}</h3>
            <p class="mt-2 text-[15px] leading-relaxed">
              {why.subText}
            </p>
          </div>
        </NotchCard>
      {/each}
    </div>
  </Section>

  <Section>
    <SectionHeader titleClass="">
      {#snippet title()}
        <span class="inline-flex items-center justify-center gap-3">
          How to get started <img src="https://assets.cdn.clsrio.com/www/teach/thumbs-up.svg" alt="" />
        </span>
      {/snippet}
    </SectionHeader>

    <div class="mt-16 grid gap-6 md:grid-cols-2">
      {#each steps as step, i}
        <NotchCard class="h-full bg-gray-50">
          <h3 class="text-h4 flex items-center font-medium">
            <span class="rounded-tag mr-3 bg-[#F7F7F7] px-2 py-1 font-mono text-base ring-1 ring-gray-200">{i + 1}</span
            >
            {step.title}
          </h3>
          <p class="mt-4 text-base leading-relaxed text-gray-600">
            {step.subText}
          </p>
        </NotchCard>
      {/each}
    </div>
    <div class="mt-12 flex justify-center">
      <CtaButton href="/teach/register" target="_blank" rel="noopener noreferrer nofollow">Get Started</CtaButton>
    </div>
  </Section>

  <Section>
    <h2 class="text-h3 text-center text-balance">Word from our fufilled facilitators</h2>

    <div
      class="relative mx-auto mt-12 w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-8 pl-[4.5%] text-center before:absolute before:top-0 before:left-0 before:h-full before:w-[4.5%] before:bg-[#0233BD] md:w-2/4"
    >
      <p class="text-quote mx-auto w-[77%] font-medium">
        With ClassroomIO, I am training over 100 students. I am making more money than expected with little effort and
        my students are happy. Love the product
      </p>
      <div class="mt-5 flex flex-row items-center justify-center gap-4">
        <img src="https://assets.cdn.clsrio.com/www/teach/user-profile.png" alt="" class="w-8 rounded-full" />
        <p class="text-sm">
          <span class="mr-2 font-semibold"> Bilik Diana </span> English tutor
        </p>
      </div>
    </div>
  </Section>

  <Section innerClass="grid gap-10 lg:grid-cols-12 lg:gap-12">
    <div class="lg:col-span-4">
      <h2 class="text-h3 text-balance lg:sticky lg:top-28">Frequently asked questions</h2>
    </div>

    <div class="lg:col-span-8">
      <Accordion.Root type="single" class="w-full">
        {#each faqs as faq}
          <Accordion.Item value={faq.value}>
            <Accordion.Trigger class="text-left">
              {faq.question}
            </Accordion.Trigger>
            <Accordion.Content>
              {faq.answer}
            </Accordion.Content>
          </Accordion.Item>
        {/each}
      </Accordion.Root>
    </div>
  </Section>

  <PageSignupCTA
    header="Kick off your Teaching Business in Minutes"
    subText="Don't wait, let's get you started."
    btnLabel="Register"
    link="/teach/register"
    demo={false}
  />
</section>
