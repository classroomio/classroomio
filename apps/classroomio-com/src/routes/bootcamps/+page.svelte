<script>
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const benefitDetails = [
    {
      img: 'ai.svg',
      title: 'AI-Powered Learning',
      point_1: 'Create engaging courses with AI-assisted content generation.',
      point_2: 'Automate grading and feedback processes, saving time and effort.',
      point_3: 'Personalize learning experiences based on individual student needs.'
    },
    {
      img: 'community.svg',
      title: 'Foster a Thriving Community',
      point_1:
        'Create a supportive learning environment with built-in forums and interactive tools.',
      point_2: 'Encourage collaboration and knowledge sharing among students.',
      point_3: 'Build a strong community of learners and mentors.'
    },
    {
      img: 'operations.svg',
      title: 'Streamline Operations',
      point_1: 'Manage your courses and students efficiently with our user-friendly platform.',
      point_2: 'Issue custom certificates to validate student achievements.',
      point_3: 'Provide a seamless learning experience for your students.'
    }
  ];

  //   const features = [
  //     {
  //         img
  //         icon:
  //         title:
  //         decription:
  //     }
  //   ]
</script>

<svelte:head>
  <title>Blog | ClassroomIO</title>
</svelte:head>

<section>
  <PageHeader
    className="flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-6 lg:px-28 px-8"
  >
    <div class="bg-[#DCE5FF] py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
      <p class=" text-sm md:text-base text-[#4B5563] text-center font-medium">
        Solution for Bootcamps
      </p>
    </div>
    <div
      class="w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-8"
    >
      <div
        class="w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1
          class="w-[100%] mx-auto m-0 text-4xl lg:text-7xl md:text-6xl font-bold text-slate-900 lg:text-center"
        >
          Elevate Your <span class="text-blue-700 relative"> Bootcamps</span> with
          <span class="text-blue-700 relative"> Innovative</span> Tools
        </h1>
        <p class="w-[100%] lg:w-[60%] lg:text-center font-normal text-lg text-slate-700">
          From intelligent course creation to student collaboration tools, ClassroomIO provides
          everything you need to run a cutting-edge, high-impact bootcamp.
        </p>
      </div>
      <button
        class="py-5 px-6 bg-[#1D4ED8] border-transparent outline-transparent rounded-lg text-white text-lg font-semibold"
        >Get Started for Free 🚀</button
      >
    </div>
  </PageHeader>

  <section
    class="w-full lg:py-24 py-16 lg:px-28 px-8 flex flex-col lg:items-center lg:justify-between justify-center gap-y-12"
  >
    <div
      class="w-full gap-y-4 flex flex-col lg:items-center items-start lg:justify-center justify-start"
    >
      <div class="w-fit py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
        <p class=" text-sm md:text-base text-[#4B5563] text-center font-medium">
          Have you heard the benefits?
        </p>
      </div>
      <div
        class="lg:w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">Inspire Student Success</h1>
        <p class="text-[#656565] text-xl font-light lg:text-center lg:w-[80%]">
          Elevate your bootcamp with ClassroomIO's comprehensive toolkit. Create engaging content,
          foster community, and drive student achievement.
        </p>
      </div>
    </div>

    <div
      class="w-full flex lg:flex-row flex-col lg:justify-between justify-start gap-6 lg:items-center items-start lg:items-stretch"
    >
      {#each benefitDetails as benefits}
        <div class="w-full md:p-6 p-4 border border-[#D9E0F5] rounded-2xl flex flex-col gap-y-6">
          <div>
            <img src="/bootcamps/{benefits.img}" alt="brain" />
          </div>
          <div class="w-full flex flex-col justify-start align-start gap-y-2">
            <h1 class="w-full text-xl font-medium font-[#282828]">{benefits.title}</h1>

            <div class="flex flex-row justify-start items-start gap-x-3">
              <img src="/bootcamps/check.svg" alt="check mark" />
              <p class=" w-full text-base font-[#656565] font-light">
                {benefits.point_1}
              </p>
            </div>

            <div class="flex flex-row justify-start items-start gap-x-3">
              <img src="/bootcamps/check.svg" alt="check mark" />
              <p class=" w-full text-base font-[#656565] font-light">
                {benefits.point_2}
              </p>
            </div>

            <div class="flex flex-row justify-start items-start gap-x-3">
              <img src="/bootcamps/check.svg" alt="check mark" />
              <p class=" w-full text-base font-[#656565] font-light">
                {benefits.point_3}
              </p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <section
    class="w-full bg-[#F1F6FF] flex flex-col items-start justify-start gap-y-16 lg:py-24 py-16 lg:px-28 px-8"
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
        class="lg:w-full flex flex-col lg:items-center items-start lg:justify-center justify-start gap-y-4"
      >
        <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">Why We're the Perfect Fit</h1>
        <p class="text-[#656565] text-xl font-light lg:text-center lg:w-[80%]">
          Discover why we’re the ideal partner for your bootcamp training needs. Experience
          innovative solutions designed to elevate student engagement and maximize learning
          outcomes.
        </p>
      </div>
    </div>

    <div class="w-full flex flex-col justify-start items-start lg:gap-y-24 gap-y-16">
      <div
        class="w-full flex lg:flex-row flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
      >
        <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
          <img src="/bootcamps/certificate-i.svg" alt="team icon" />
          <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
            <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">Certificates</h1>
            <p class="text-[#656565] text-xl font-light">
              We provide pre built certificate templates anyone can choose from and provide to their
              students right within our dashboard
            </p>
          </div>
          <button
            class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
            >Book a Demo</button
          >
        </div>

        <div>
          <img src="/bootcamps/certificate.svg" alt="team management feature ui" />
        </div>
      </div>
      <div
        class="w-full flex lg:flex-row-reverse flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
      >
        <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
          <img src="/bootcamps/forum-i.svg" alt="team icon" />
          <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
            <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">
              Forum area for question and answer
            </h1>
            <p class="text-[#656565] text-xl font-light">
              Our community section allows for a robust question and answer experience encouraging
              collaboration between students. This also encourages knowledge sharing amongst
              students.
            </p>
          </div>
          <button
            class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
            >Book a Demo</button
          >
        </div>

        <div>
          <img src="/bootcamps/forum.svg" alt="team management feature ui" />
        </div>
      </div>
      <div
        class="w-full flex lg:flex-row flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
      >
        <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
          <img src="/bootcamps/ai.svg" alt="team icon" />
          <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
            <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">
              AI Powered Content creation
            </h1>
            <p class="text-[#656565] text-xl font-light">
              we give you the ability to create courses with AI, upload videos, embed slides, create
              quizzes and even grade quizzes with AI
            </p>
          </div>
          <button
            class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
            >Book a Demo</button
          >
        </div>

        <div>
          <img src="/bootcamps/ai-pic.svg" alt="team management feature ui" />
        </div>
      </div>
      <div
        class="w-full flex lg:flex-row-reverse flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
      >
        <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
          <img src="/bootcamps/free-tools-i.svg" alt="team icon" />
          <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
            <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">Free tools for students</h1>
            <p class="text-[#656565] text-xl font-light">
              We provide a suite of free tools like Pomodoro timer, Random name picker, and a
              Progress report generator to make the lives of educators and students much easier (use
              links for images)
            </p>
          </div>
          <button
            class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
            >Book a Demo</button
          >
        </div>

        <div>
          <img src="/bootcamps/free-tools.svg" alt="team management feature ui" />
        </div>
      </div>
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
