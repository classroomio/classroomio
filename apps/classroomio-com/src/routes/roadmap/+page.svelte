<script>
  import PageHeader from '$lib/PageHeader/PageHeader.svelte';
  import Timeline from '$lib/Timeline/Timeline.svelte';

  let newFeatures = [
    {
      title: 'Course Newsfeed',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'Security RLS',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'Increased video limit',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'LMS Customization',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'More certificate option',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'Multi language support',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'Course Newsfeed',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    }
  ];

  let upcomingFeatures = [
    {
      title: 'Learning path',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    },
    {
      title: 'Landing page builder',
      desc: 'Meet our LMS newsfeed centralizes updates, announcements, and interactions, enhancing communication, engagement, and real-time access to course information.'
    }
  ];
</script>

<svelte:head>
  <title>Roadmap | ClassroomIO</title>
</svelte:head>
<PageHeader className="flex flex-col items-center justify-center text-center space-y-10">
  <h1 class="text-7xl font-bold">Roadmap</h1>
  <p class="text-center w-[40%]">
    Lorem ipsum dolor sit amet consectetur adipisicing elit. Architecto blanditiis, illo beatae
    earum voluptatum ea suscipit consequatur veritatis labore accusantium.
  </p>
</PageHeader>
<section class="flex flex-col items-center w-full px-4 mb-10">
  <div class="flex flex-col items-start space-y-4">
    <div>
      <h1 class="text-3xl font-bold">Latest Features</h1>
    </div>

    <Timeline items={newFeatures} />
  </div>
</section>

<section class="flex flex-col items-center w-full px-4">
  <div class="flex flex-col items-start space-y-4">
    <div>
      <h1 class="text-3xl font-bold">Upcoming Features</h1>
    </div>

    <Timeline items={upcomingFeatures} />
  </div>
</section>
