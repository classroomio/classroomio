<script>
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';
  import Timeline from '$lib/Timeline/Timeline.svelte';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';

  let newFeatures = [
    {
      title: 'Course Newsfeed',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'Security RLS',
      desc: 'Row-Level Security (RLS) enhances data security by restricting access to specific rows in a database based on user roles or attributes.'
    },
    {
      title: 'Increased video limit',
      desc: 'Increasing video limits in an LMS allows for longer, more comprehensive instructional videos, enhancing the depth and quality of educational content.'
    },
    {
      title: 'LMS Customization',
      desc: "LMS customization allows educators and administrators to tailor the platform's features, interface, and content to meet specific educational needs and preferences."
    },
    {
      title: 'More certificate option',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'Multi language support',
      desc: 'Multi-language support in an LMS enables users to access content and interface options in their preferred language, promoting inclusivity and global accessibility.'
    }
  ];

  let upcomingFeatures = [
    {
      title: 'Learning path',
      desc: 'A learning path in an LMS structures curses and materials sequentially, guiding learners through a tailored educational journey to achieve specific learning goals.'
    },
    {
      title: 'Landing page builder',
      desc: 'A landing page builder in an LMS enables educators to design personalized, engaging course entry points, enhancing user experience and promoting learning paths.'
    }
  ];
</script>

<svelte:head>
  <title>Roadmap | ClassroomIO</title>
</svelte:head>
<PageHeader
  className="h-screen flex flex-col items-start px-8 md:items-center justify-center space-y-10 bg-[#F5F8FE]"
>
  <h1 class="text-start md:text-center text-5xl md:text-7xl font-bold">Roadmap</h1>
  <p class="text-start md:text-center w-[80%] md:w-[40%] text-gray-500">
    This is a live document, and will be updated regularly. To submit an idea, or to view a list of
    feature requests and ideas that we're considering, check out our <a
      href="https://github.com/rotimi-best/classroomio/discussion"
      class="underline">GitHub Discussions</a
    >
  </p>
</PageHeader>
<section class="relative flex flex-col items-center w-full px-4 py-20 border-b-2">
  <img src="/roadmap-one.svg" alt="" class="w-60 lg:w-96 absolute bottom-0 right-0" />
  <img src="/roadmap-two.svg" alt="" class="hidden lg:block absolute top-0 left-0" />
  <div class="flex flex-col items-start space-y-10 px-4">
    <div>
      <h1 class="text-3xl font-bold">Latest Features</h1>
    </div>

    <Timeline items={newFeatures} />
  </div>
</section>

<section class="flex flex-col items-center w-full px-4 py-20 border-b-2">
  <div class="flex flex-col items-start space-y-10 px-4">
    <div>
      <h1 class="text-3xl font-bold">Upcoming Features</h1>
    </div>

    <Timeline items={upcomingFeatures} />
  </div>
</section>

<section class="flex items-center justify-center py-16">
  <PageSignupCTA
    header="  Launch Your Online Bootcamp In Minutes"
    subText="Meet a better collaboration tool for teachers and students."
    btnLabel="Get started for free"
    link="/signup"
    demo={false}
  />
</section>
