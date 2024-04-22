<script lang="ts">
  import { slide } from 'svelte/transition';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const whyStart = [
    {
      src: '/why-1.svg',
      header: 'Fully Online; Teach from anywhere',
      subText:
        ' Facilitate a subject from the comfort of your space, engaging students from highly diverse background'
    },
    {
      src: '/why-2.svg',
      header: 'Get paid extra commission',
      subText:
        'Get paid for the course you design and earn extra comission based on course perfomance'
    },
    {
      src: '/why-3.svg',
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

  const faqs = [
    {
      question: 'What kind of tutors does classroomIO look for?',
      answer:
        'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique deleniti saepe non fuga cupiditate eaque culpa natus tempore tenetur. Quaerat, adipisci similique? Quidem aspernatur ratione quasi exercitationem iure dignissimos velit!',
      showAnswer: false
    },
    {
      question: 'How can I get my profile approved quickly?',
      answer:
        'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique deleniti saepe non fuga cupiditate eaque culpa natus tempore tenetur. Quaerat, adipisci similique? Quidem aspernatur ratione quasi exercitationem iure dignissimos velit!',
      showAnswer: false
    },
    {
      question: 'How can I get my profile approved quickly?',
      answer:
        'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique deleniti saepe non fuga cupiditate eaque culpa natus tempore tenetur. Quaerat, adipisci similique? Quidem aspernatur ratione quasi exercitationem iure dignissimos velit!',
      showAnswer: false
    },
    {
      question: 'Why should I teach on classroomio?',
      answer:
        'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique deleniti saepe non fuga cupiditate eaque culpa natus tempore tenetur. Quaerat, adipisci similique? Quidem aspernatur ratione quasi exercitationem iure dignissimos velit!',
      showAnswer: false
    },
    {
      question: 'What equipment do I need to teach on classroomio?',
      answer:
        'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique deleniti saepe non fuga cupiditate eaque culpa natus tempore tenetur. Quaerat, adipisci similique? Quidem aspernatur ratione quasi exercitationem iure dignissimos velit!',
      showAnswer: false
    },
    {
      question: 'How much can I earn on classroomio?',
      answer:
        'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Similique deleniti saepe non fuga cupiditate eaque culpa natus tempore tenetur. Quaerat, adipisci similique? Quidem aspernatur ratione quasi exercitationem iure dignissimos velit!',
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
        class="w-full block text-center lg:w-[30%] py-3 text-md text-white rounded-md bg-[#1D4ED8]"
      >
        Register
      </a>
    </div>

    <div class=" ">
      <img src="/teacher-hero.png" alt="" class="w-full" />
    </div>
  </PageHeader>

  <div class="mt-10 mx-auto">
    <div class="px-[10%] pb-10 border-b border-slate-100">
      <h1 class="text-4xl pb-28 text-center font-bold flex gap-3 justify-center items-center">
        Why you should teach with us? <img src="/star.svg" alt="" />
      </h1>

      <div class="flex flex-wrap justify-center lg:justify-between mt-10">
        {#each whyStart as why}
          <figure
            class="flex gap-3 flex-col justify-center items-center px-2 w-full h-full max-w-[250px] max-h-[380px] text-center"
          >
            <img src={why.src} alt="" class="w-[80px] h-[80px]" />
            <figcaption>
              <h1 class="font-bold text-md">{why.header}</h1>
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
        How to get started <img src="/thumbs-up.svg" alt="" />
      </h1>

      <div class="flex flex-wrap justify-between gap-y-10 mx-auto mt-5">
        {#each steps as step, i}
          <div class="lg:max-w-[40%] px-10 py-5">
            <h1 class="font-bold text-xl">
              <span class="px-2 py-1 mr-3 bg-[#F7F7F7] rounded-md">{i + 1}</span>
              {step.title}
            </h1>
            <p class="text-xs text-gray-600 mt-5">
              {step.subText}
            </p>
          </div>
        {/each}
      </div>
      <div class="flex justify-center px-[5%] mt-3">
        <a
          href="/teach/register"
          target="_blank"
          class="w-full lg:max-w-[20%] py-3 text-md text-white rounded-md bg-[#1D4ED8] text-center"
        >
          Get Started
        </a>
      </div>
    </div>

    <div class="px-[12%] bg-[#F5F8FE] my-10 py-12 h-[75%] lg:h-[80%]">
      <h1 class="text-2xl text-center font-bold flex gap-3 justify-center items-center">
        Word from our fufilled facilitators
      </h1>

      <img src="/facilitator-1.png" class="lg:w-2/4 mt-10 mx-auto" alt="" />
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
              <div transition:slide class="text-md font-light leading-5">{faq.answer}</div>
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
