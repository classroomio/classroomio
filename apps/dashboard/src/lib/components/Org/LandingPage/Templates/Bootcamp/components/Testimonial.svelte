<script>
  import TestimonialCard from './TestimonialCard.svelte';

  const testimonials = [
    {
      profileImage: '/images/classroomio-course-img-template.jpg',
      title: 'Mobile App Developer',
      company: 'Binary',
      description: `
          I can't recommend the Mobile App Development bootcamp enough.
          The course was challenging, but the support from my peers and
          instructors was incredible. I learned so much about both iOS and
          Android development, and I'm now developing apps for a tech startup.
        `
    },
    {
      profileImage: '/images/classroomio-course-img-template.jpg',
      title: 'Web Developer',
      company: 'XYZ Inc.',
      description: `
          The bootcamp gave me all the skills I needed to succeed as a developer.
          I was able to learn at my own pace and now have a job as a full-stack developer!
        `
    },
    {
      profileImage: '/images/classroomio-course-img-template.jpg',
      title: 'Data Analyst',
      company: 'DataPros',
      description: `
          Amazing course! I learned how to analyze and visualize data efficiently.
          The instructors were very supportive and the projects helped me build a strong portfolio.
          I can't recommend the Mobile App Development bootcamp enough.
          The course was challenging, but the support from my peers and
          instructors was incredible. I learned so much about both iOS and
          Android development, and I'm now developing apps for a tech startup.
        `
    }
  ];
</script>

<section class="p-4 lg:p-20 h-full bg-[#FCFCFC]">
  <p class="text-center font-slab text-3xl mb-10">See what our learners are saying</p>

  <div class="lg:w-[80%] space-y-2 md:space-y-4 mx-auto">
    {#each testimonials as testimonial, index}
      <TestimonialCard
        profileImage={testimonial.profileImage}
        title={testimonial.title}
        company={testimonial.company}
        description={testimonial.description}
        {index}
      />
    {/each}
  </div>
</section>
