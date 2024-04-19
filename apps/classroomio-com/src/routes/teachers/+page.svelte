<script>
  import { slide } from 'svelte/transition';

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

  function toggleAnswer(index) {
    faqs[index].showAnswer = !faqs[index].showAnswer;
  }
</script>

<svelte:head>
  <title>Teacher | ClassroomIO</title>
</svelte:head>

<div class="mt-[10%] md:mt-16">
  <header class="root bg-[#F5F8FE] px-[10%] border-4 pt-14 w-full flex flex-wrap text-left">
    <div class="lg:max-w-2/4 pt-[6%] pb-8">
      <h1 class="text-5xl font-bold">Teach with us</h1>
      <p class="my-5 lg:w-[77%] lg:text-left text-center">
        With ClassroomIO, you can make side income while teaching the subject you love
      </p>
      <button type="button" class="w-full lg:w-[30%] py-3 rounded-md text-white bg-[#1D4ED8]"
        >Register</button
      >
    </div>

    <div class="lg:max-w-[40%] z-20">
      <img src="/teacher-hero.png" alt="" class="w-full z-20" />
    </div>
  </header>

  <div class="mt-10 mx-auto">
    <div class="px-[10%]">
      <h1 class="text-2xl text-center font-bold flex gap-3 justify-center items-center">
        Why you should start with us <img src="/star.svg" alt="" />
      </h1>

      <div class="flex flex-wrap justify-center lg:justify-between mt-10">
        {#each whyStart as why}
          <figure
            class="flex gap-3 flex-col justify-center items-center px-2 w-full h-full max-w-[250px] max-h-[380px] text-center"
          >
            <img src={why.src} alt="" class="w-[80px] h-[80px]" />
            <figcaption>
              <h1 class="font-bold text-sm">{why.header}</h1>
              <p class="text-xs mt-1">
                {why.subText}
              </p>
            </figcaption>
          </figure>
        {/each}
      </div>
    </div>

    <div class="px-[10%] mt-10 py-10">
      <h1 class="text-2xl text-center font-bold flex gap-3 justify-center items-center">
        How to get started <img src="/thumbs-up.svg" alt="" />
      </h1>

      <div class="flex flex-wrap justify-between gap-y-10 mx-auto mt-5">
        {#each steps as step, i}
          <div class="lg:max-w-[40%] px-10 py-5">
            <h1 class="font-bold">
              <span class="px-2 py-1 mr-3 bg-[#F7F7F7] rounded-md">{i + 1}</span>
              {step.title}
            </h1>
            <p class="text-xs text-gray-600 mt-5">
              {step.subText}
            </p>
          </div>
        {/each}
      </div>
      <div class="flex justify-end px-[5%] mt-3">
        <button
          type="button"
          class="w-full lg:max-w-[20%] py-3 text-xs text-white rounded-md bg-[#1D4ED8]"
          >Click here to register</button
        >
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
                class="w-full font-bold text-xs lg:text-sm my-2 flex justify-between"
                on:click={() => toggleAnswer(index)}
              >
                {faq.question} <span>{faq.showAnswer ? '-' : '+'}</span>
              </button>
            </div>
            {#if faq.showAnswer}
              <div transition:slide class="text-[10px] lg:text-xs leading-5">{faq.answer}</div>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    <div
      class="p-[5%] py-[7%] lg:py-[3%] lg:px-[10%] w-[85%] rounded-md my-10 mx-auto bg-[#1D4ED8] flex flex-wrap item-center gap-5 justify-between"
    >
      <div class="text-white lg:max-w-2/4 text-center lg:text-left">
        <h1 class="text-3xl font-medium lg:font-bold">Get paid to teach online</h1>
        <p class="text-sm lg:w-[70%] mt-6">
          Earn over N100,000 naira monthly as side income while teaching the subject you love
        </p>
      </div>

      <div class="w-full lg:w-[30%] flex justify-center items-center">
        <button
          type="button"
          class="w-full py-3 text-sm lg:text-xs font-bold text-black rounded-md bg-white"
          >Create a tutor profile now</button
        >
      </div>
    </div>
  </div>
</div>

<style>
  .root {
    background-image: url('/hero-bg.svg');
  }
</style>
