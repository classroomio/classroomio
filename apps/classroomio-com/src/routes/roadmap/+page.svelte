<script>
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';
  import Timeline from '$lib/Timeline/Timeline.svelte';
  import PageSignupCTA from '$lib/PageSignupCTA/index.svelte';

  const newFeatures = [
    {
      title: 'LMS Customization',
      desc: 'Right in your settings you can customize what you students see in their dashboard in few clicks.'
    },
    {
      title: 'Course Newsfeed',
      desc: 'You can now send a broadcast message to all the students participating in your course right from our dashboard.'
    },
    {
      title: 'Multi language support',
      desc: 'Our dashboard now supports 7 new languages. In addition, we allow you create course content in those any of those languages.'
    },
    {
      title: 'Security RLS',
      desc: "All the tables we've created now have role level security enabled by default"
    },
    {
      title: 'Increased video limit',
      desc: 'You can now upload a single video of about 500mb without interruption.'
    },
    {
      title: 'More certificate templates',
      desc: 'We have shipped 4 more certificate templates in which you can choose from right within your course dashboard'
    }
  ];

  const upcomingFeatures = [
    {
      title: 'Pathways',
      desc: 'This feature gives you the ability to group courses into folder which we are calling - Pathways. Students can complete a series of courses before getting a certificate'
    },
    {
      title: 'Landing page builder',
      desc: 'With more templates and pages, we will allow educators create simple web pages using our platform to showcase their programs and offerings.'
    },
    {
      title: 'Analytics',
      desc: 'Educators can easily track students course completion rating, understand what topics are not clearly understood and much more.'
    }
  ];
</script>

<svelte:head>
  <title>Roadmap | ClassroomIO</title>
</svelte:head>

<PageHeader className="flex flex-col items-center justify-center text-center">
  <h1 class="text-start md:text-center text-5xl md:text-7xl font-bold text-slate-900">
    Product Roadmap
  </h1>
  <p class="text-start md:text-center w-[80%] md:w-[40%] text-slate-700 mt-10">
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

<PageSignupCTA
  header="Share Your First Course With Your Audience In Minutes"
  subText="In about 4 Clicks you can already start creating courses."
  btnLabel="Get started for free"
  link="/signup"
  demo={false}
/>
