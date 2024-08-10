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
  <title>Contact us | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader className="flex flex-col items-center justify-center text-center">
    <div class="mb-2 ml-[5%] lg:ml-0 flex w-full items-center justify-start lg:justify-center">
      <span
        style="color: rgb(75, 85, 99);"
        class="rounded-full border-2 border-[#C2D2FF] px-4 py-1 text-sm font-medium bg-[#DCE5FF] text-blue-700"
      >
        Contact Us
      </span>
    </div>
    <h1
      class="mx-auto text-4xl md:text-7xl lg:text-6xl font-bold text-slate-900 flex flex-col items-center"
    >
      <span>Get in touch with <span class="text-blue-700">Us</span></span>
    </h1>
    <p
      class="w-[90%] md:w-[60%] max-w-3xl text-center font-normal text-lg text-slate-700 mt-10 lg:mt-7"
    >
      Report any bugs you encounter, request new features you'd like to see, or ask any questions
      you have about ClassroomIO
    </p>
  </PageHeader>

  <div class="mt-10 mx-auto">
    <!-- Content here -->

    <PageSignupCTA
      header="Scale your Teaching Business in Minutes"
      subText="Don't wait, let's get you started."
      btnLabel="Register"
      link="/teach/register"
      demo={false}
    />
  </div>
</section>
