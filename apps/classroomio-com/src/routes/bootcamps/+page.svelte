<script>
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';

  const benefitDetails = [
    {
      title: 'Increased Engagement',
      description: 'Interactive courses and collaborative features keep employees motivated.'
    },
    {
      title: 'Streamlined Learning',
      description: 'Centralized platform for all training materials and progress tracking.'
    },
    {
      title: 'Customizable Experience',
      description: "Tailor the learning experience to your company's specific needs and branding."
    },
    {
      title: 'Data-Driven Insights',
      description: 'Gain valuable insights into employee performance and learning patterns.'
    }
  ];
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
    class="w-full lg:py-24 py-16 lg:px-28 px-8 flex lg:flex-row flex-col lg:items-center lg:justify-between justify-center gap-x-6 gap-y-8"
  >
    <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
      <div class="w-fit py-2 px-4 rounded-full border-[#C2D2FF] border-2 text-center">
        <p class=" text-sm md:text-base text-[#4B5563] text-center font-medium">Amazing benefits</p>
      </div>

      <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
        <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">
          Unlock Your Team's Potential and Drive Success
        </h1>
        <p class="text-[#656565] text-xl font-light">
          Experience the power of collaborative learning with ClassroomIO. Engage your workforce
          with personalized training that aligns with your company's goals.
        </p>
      </div>
    </div>
    <div class="w-full flex flex-col lg:w-[50%] lg:grid lg:grid-cols-2 gap-y-4 lg:gap-4">
      <div
        class="w-full md:w-[100%] md:p-6 p-4 border border-[#D9E0F5] rounded-2xl flex flex-col gap-y-6"
      >
        <div>
          <img src="/employee-training/light-bulb.svg" alt="light-bulb" />
        </div>
        <div class="w-full flex flex-col justify-start align-start gap-y-2">
          <h1 class="w-full text-xl font-medium font-[#282828]">Increased Engagement</h1>
          <p class=" w-full text-base font-[#656565] font-light">
            Interactive courses and collaborative features keep employees motivated.
          </p>
        </div>
      </div>
      <div class="w-full md:w-[100%] p-6 border border-[#D9E0F5] rounded-2xl flex flex-col gap-y-6">
        <div>
          <img src="/employee-training/learning.svg" alt="light-bulb" />
        </div>
        <div class="w-full flex flex-col justify-start align-start gap-y-2">
          <h1 class="w-full text-xl font-medium font-[#282828]">Streamlined Learning</h1>
          <p class=" w-full text-base font-[#656565] font-light">
            Centralized platform for all training materials and progress tracking.
          </p>
        </div>
      </div>
      <div class="w-full md:w-[100%] p-6 border border-[#D9E0F5] rounded-2xl flex flex-col gap-y-6">
        <div>
          <img src="/employee-training/paint-brush.svg" alt="paint-brush" />
        </div>
        <div class="w-full flex flex-col justify-start align-start gap-y-2">
          <h1 class="w-full text-xl font-medium font-[#282828]">Customizable Experience</h1>
          <p class=" w-full text-base font-[#656565] font-light">
            Tailor the learning experience to your company's specific needs and branding.
          </p>
        </div>
      </div>
      <div class="w-full md:w-[100%] p-6 border border-[#D9E0F5] rounded-2xl flex flex-col gap-y-6">
        <div>
          <img src="/employee-training/pie-chart.svg" alt="pie-chart" />
        </div>
        <div class="w-full flex flex-col justify-start align-start gap-y-2">
          <h1 class="w-full text-xl font-medium font-[#282828]">Data-Driven Insights</h1>
          <p class=" w-full text-base font-[#656565] font-light">
            Gain valuable insights into employee performance and learning patterns.
          </p>
        </div>
      </div>
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
        <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">
          What makes us the right choice
        </h1>
        <p class="text-[#656565] text-xl font-light lg:text-center lg:w-[80%]">
          Discover why we’re the perfect partner for your employee training needs. Experience
          innovative solutions designed to reduce stress and enhance productivity.
        </p>
      </div>
    </div>

    <div class="w-full flex flex-col justify-start items-start lg:gap-y-24 gap-y-16">
      <div
        class="w-full flex lg:flex-row flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
      >
        <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
          <img src="/employee-training/team-mgnt.svg" alt="team icon" />
          <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
            <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">Team management</h1>
            <p class="text-[#656565] text-xl font-light">
              Company administrators can invite their team members to collaborate on course creation
              within classroomio
            </p>
          </div>
          <button
            class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
            >Book a Demo</button
          >
        </div>

        <div>
          <img src="/employee-training/team-mgnt2.svg" alt="team management feature ui" />
        </div>
      </div>
      <div
        class="w-full flex lg:flex-row-reverse flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
      >
        <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
          <img src="/employee-training/colour-pallete.svg" alt="team icon" />
          <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
            <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">Custom branding</h1>
            <p class="text-[#656565] text-xl font-light">
              Admins can set the company logo which appears all through the product and the employee
              dashboard as well as select a preferred brand color
            </p>
          </div>
          <button
            class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
            >Book a Demo</button
          >
        </div>

        <div>
          <img src="/employee-training/custom2.svg" alt="team management feature ui" />
        </div>
      </div>
      <div
        class="w-full flex lg:flex-row flex-col lg:justify-between justify-start lg:items-center items-start gap-y-8"
      >
        <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
          <img src="/employee-training/cup.svg" alt="team icon" />
          <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
            <h1 class="md:text-5xl text-3xl font-medium text-[#282828]">Track learners progress</h1>
            <p class="text-[#656565] text-xl font-light">
              Administrators can track the progress of their employees and assist whoever needs help
            </p>
          </div>
          <button
            class="py-4 px-8 border border-[#1D4ED8] outline-transparent rounded text-[#1D4ED8] text-sm font-semibold"
            >Book a Demo</button
          >
        </div>

        <div>
          <img src="/employee-training/progress.svg" alt="team management feature ui" />
        </div>
      </div>
    </div>
  </section>

  <section
    class="w-full bg-[#040F2D] flex flex-col items-start justify-start gap-y-16 lg:py-24 py-16 lg:px-28 px-8"
  >
    <div
      class="w-full flex lg:flex-row-reverse flex-col-reverse lg:justify-between justify-start lg:items-center items-start gap-y-8"
    >
      <div class="w-full lg:w-[40%] gap-y-4 flex flex-col items-start justify-start">
        <div class="md:w-full flex flex-col items-start justify-start gap-y-4">
          <h1 class="md:text-5xl text-3xl font-medium text-white">
            Did you know you can request for custom features?
          </h1>
          <p class="text-[#DEDEDE] text-xl font-light">
            Companies get the opportunity to request custom features from us.
          </p>
        </div>
        <button
          class="py-4 px-8 border border-tranparent outline-transparent bg-white rounded text-[#040F2D] text-sm font-semibold"
          >Sign me up</button
        >
      </div>

      <div>
        <img src="/employee-training/bro.svg" alt="male and female in an office" />
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
