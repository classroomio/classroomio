<script lang="ts">
  import { slide } from 'svelte/transition';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const whyStart = [
    {
      src: '/teach/teach-from-anywhere.svg',
      header: 'Fully Online; Teach from anywhere',
      subText:
        ' Facilitate a subject from the comfort of your space, engaging students from highly diverse background'
    },
    {
      src: '/teach/get-paid.svg',
      header: 'Get paid extra commission',
      subText:
        'Get paid for the course you design and earn extra comission based on course perfomance'
    },
    {
      src: '/teach/inspire-learners.svg',
      header: 'Inspire learners',
      subText:
        'Your opportunity to inspire thousands of learners to achieve dreams and academic pursue exellence'
    }
  ];

  const steps = [
    {
      title: 'Sign up',
      subText: 'Create a free account on our platform by going to classroomio.com/signup'
    },
    {
      title: 'Record course & Plan exercise',
      subText: 'Prepare your content however you want and then upload them onto our platform.'
    },
    {
      title: 'Launch your course',
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
</svelte:head>

<section>
  <PageHeader className="flex items-center justify-evenly px-5 flex-wrap text-left">
    <div>
      <h1 class="text-5xl font-bold">Teach with us</h1>
      <p class="my-5 lg:w-[77%] lg:text-left text-center">
        With ClassroomIO, you can make side income while teaching the subject you love
      </p>

      <a
        href="/teach/register"
        target="_blank"
        class="w-full block text-center lg:w-[30%] py-3 text-base text-white rounded-md bg-[#1D4ED8]"
      >
        Register
      </a>
    </div>

    <div class=" ">
      <img src="/teach/teacher-hero.png" alt="" class="w-full" />
    </div>
  </PageHeader>

  <div class="mt-10 mx-auto">
    <div class="px-[10%] pb-10 border-b border-slate-100">
      <h1 class="text-4xl pb-28 text-center font-bold flex gap-3 justify-center items-center">
        Why you should teach with us? <img src="/teach/star.svg" alt="" />
      </h1>

      <div class="flex flex-wrap justify-center lg:justify-between mt-10">
        {#each whyStart as why}
          <figure
            class="flex gap-3 flex-col justify-center items-center px-2 w-full h-full max-w-[250px] max-h-[380px] text-center"
          >
            <img src={why.src} alt="" class="w-[80px] h-[80px]" />
            <figcaption>
              <h1 class="font-bold text-base">{why.header}</h1>
              <p class="text-sm mt-1">
                {why.subText}
              </p>
            </figcaption>
          </figure>
        {/each}
      </div>
    </div>

    <div class="px-[10%] mt-10 py-10">
      <h1 class="text-4xl mb-28 text-center font-bold flex gap-3 justify-center items-center">
        How to get started <img src="/teach/thumbs-up.svg" alt="" />
      </h1>

      <div class="flex flex-wrap justify-between gap-y-10 mx-auto mt-5">
        {#each steps as step, i}
          <div class="lg:max-w-[40%] px-10 py-5">
            <h1 class="font-bold text-2xl">
              <span class="px-2 py-1 mr-3 bg-[#F7F7F7] rounded-md">{i + 1}</span>
              {step.title}
            </h1>
            <p class="text-base text-gray-600 mt-5">
              {step.subText}
            </p>
          </div>
        {/each}
      </div>
      <div class="flex justify-center px-[5%] mt-3">
        <a
          href="/teach/register"
          target="_blank"
          class="w-full lg:max-w-[20%] py-3 text-base text-white rounded-md bg-[#1D4ED8] text-center"
        >
          Get Started
        </a>
      </div>
    </div>

    <div class="px-[12%] bg-[#F5F8FE] my-10 py-12 h-[75%] lg:h-[80%]">
      <h1 class="text-2xl text-center font-bold flex gap-3 justify-center items-center">
        Word from our fufilled facilitators
      </h1>

      <div
        class="mt-10 w-[50%] mx-auto border shadow-sm bg-white rounded-md text-center py-6 relative before:w-[4.5%] before:absolute before:left-0 before:top-0 before:h-full before:bg-[#0233BD] before:rounded-tl-md before:rounded-bl-md"
      >
        <h1 class="text-base font-medium leading-5 w-[77%] mx-auto">
          With ClassroomIO, I am training over 100 students. I am making more money than expected
          with little effort and my students are happy. Love the product
        </h1>
        <div class="flex flex-row gap-4 justify-center items-center mt-3">
          <img src="/teach/user-profile.png" alt="" class="w-8" />
          <p class="text-sm">
            <span class="font-semibold mr-2"> Bilik Diana </span> English tutor
          </p>
        </div>
      </div>
    </div>

    <div class="px-[10%] lg:px-[15%] lg:max-w-[65%] my-10 mt-10 mx-auto">
      <h1 class="text-2xl text-center font-bold">Frequently asked questions</h1>

      <div class="mt-10">
        {#each faqs as faq, index}
          <div class="border-b border-black lg:px-3 pt-1 pb-2">
            <div>
              <button
                type="button"
                class="w-full font-medium text-lg my-2 flex justify-between"
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
      header="Skyrocket Your Teaching Career"
      subText="Don't wait, let's get you started."
      btnLabel="Register"
      link="/teach/register"
    />
  </div>
</section>
