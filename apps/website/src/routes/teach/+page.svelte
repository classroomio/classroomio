<script lang="ts">
  import { slide } from 'svelte/transition';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const whyStart = [
    {
      src: '/teach/teach-from-anywhere.svg',
      header: 'Fully Online; Teach from anywhere',
      subText: ' Facilitate a subject from the comfort of your space, engaging students from highly diverse background'
    },
    {
      src: '/teach/get-paid.svg',
      header: 'Get paid extra commission',
      subText: 'Get paid for the course you design and earn extra comission based on course perfomance'
    },
    {
      src: '/teach/inspire-learners.svg',
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

  let faqs = [
    {
      question: 'What kind of tutors does ClassroomIO look for?',
      answer:
        'We are looking for all kinds of tutors. The most important thing is that you have some experience teaching and you have proven track record of excellent communication',
      showAnswer: false
    },
    {
      question: 'What equipment do I need to teach on ClassroomIO?',
      answer: 'You just need internet access and a laptop.',
      showAnswer: false
    },
    {
      question: 'What happens after I apply?',
      answer:
        'We will get your application and review it. You should get a response from us within 2-5 working days depending on the volume of applications',
      showAnswer: false
    },
    {
      question: 'How much can I earn?',
      answer:
        'That depends on how much your course sells for and how many students buy your course. Your income is limitless, you can keep making money while you sleep.',
      showAnswer: false
    }
  ];

  function toggleAnswer(index: number) {
    faqs[index].showAnswer = !faqs[index].showAnswer;
  }
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
  <PageHeader className="flex items-center justify-evenly px-5 flex-wrap text-left">
    <div>
      <h1 class="text-5xl font-bold">Teach with us</h1>
      <p class="my-5 text-center lg:w-[77%] lg:text-left">
        With ClassroomIO, you can make side income while teaching the subject you love
      </p>

      <a
        href="/teach/register"
        target="_blank"
        class="block w-full rounded-md bg-blue-700 py-3 text-center text-base text-white lg:w-[30%]"
      >
        Register
      </a>
    </div>

    <div class=" ">
      <img src="/teach/teacher-hero.png" alt="" class="w-full" />
    </div>
  </PageHeader>

  <div class="mx-auto mt-10">
    <div class="border-b border-slate-100 px-[10%] pb-10">
      <h1 class="flex items-center justify-center gap-3 pb-28 text-center text-4xl font-bold">
        Why you should teach with us? <img src="/teach/star.svg" alt="" />
      </h1>

      <div class="mt-10 flex flex-wrap justify-center lg:justify-between">
        {#each whyStart as why}
          <figure
            class="flex h-full max-h-[380px] w-full max-w-[250px] flex-col items-center justify-center gap-3 px-2 text-center"
          >
            <img src={why.src} alt="" class="h-[80px] w-[80px]" />
            <figcaption>
              <h1 class="text-base font-bold">{why.header}</h1>
              <p class="mt-1 text-sm">
                {why.subText}
              </p>
            </figcaption>
          </figure>
        {/each}
      </div>
    </div>

    <div class="mt-10 px-[10%] py-10">
      <h1 class="mb-28 flex items-center justify-center gap-3 text-center text-4xl font-bold">
        How to get started <img src="/teach/thumbs-up.svg" alt="" />
      </h1>

      <div class="mx-auto mt-5 flex flex-wrap justify-between gap-y-10">
        {#each steps as step, i}
          <div class="px-10 py-5 lg:max-w-[40%]">
            <h1 class="text-2xl font-bold">
              <span class="mr-3 rounded-md bg-[#F7F7F7] px-2 py-1">{i + 1}</span>
              {step.title}
            </h1>
            <p class="mt-5 text-base text-gray-600">
              {step.subText}
            </p>
          </div>
        {/each}
      </div>
      <div class="mt-3 flex justify-center px-[5%]">
        <a
          href="/teach/register"
          target="_blank"
          class="w-full rounded-md bg-blue-700 py-3 text-center text-base text-white lg:max-w-[20%]"
        >
          Get Started
        </a>
      </div>
    </div>

    <div class="my-10 h-[75%] bg-[#F5F8FE] px-2 py-12 lg:h-[80%] lg:px-[12%]">
      <h1 class="flex items-center justify-center gap-3 text-center text-2xl font-bold">
        Word from our fufilled facilitators
      </h1>

      <div
        class="relative mx-auto mt-10 w-full rounded-md border bg-white py-6 text-center shadow-sm before:absolute before:left-0 before:top-0 before:h-full before:w-[4.5%] before:rounded-bl-md before:rounded-tl-md before:bg-[#0233BD] md:w-2/4"
      >
        <h1 class="mx-auto w-[77%] text-base font-medium leading-5">
          With ClassroomIO, I am training over 100 students. I am making more money than expected with little effort and
          my students are happy. Love the product
        </h1>
        <div class="mt-3 flex flex-row items-center justify-center gap-4">
          <img src="/teach/user-profile.png" alt="" class="w-8" />
          <p class="text-sm">
            <span class="mr-2 font-semibold"> Bilik Diana </span> English tutor
          </p>
        </div>
      </div>
    </div>

    <div class="mx-auto my-10 mt-10 px-10 lg:max-w-[65%] lg:px-[15%]">
      <h1 class="text-center text-2xl font-bold">Frequently asked questions</h1>

      <div class="mt-10">
        {#each faqs as faq, index}
          <div class="border-b border-black pb-2 pt-1 lg:px-3">
            <div>
              <button
                type="button"
                class="my-2 flex w-full justify-between text-left text-sm font-medium md:text-center md:text-lg"
                on:click={() => toggleAnswer(index)}
              >
                {faq.question} <span>{faq.showAnswer ? '-' : '+'}</span>
              </button>
            </div>
            {#if faq.showAnswer}
              <div transition:slide class="text-base font-light leading-5">{faq.answer}</div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <PageSignupCTA
      header="Kick off your Teaching Business in Minutes"
      subText="Don't wait, let's get you started."
      btnLabel="Register"
      link="/teach/register"
      demo={false}
    />
  </div>
</section>
