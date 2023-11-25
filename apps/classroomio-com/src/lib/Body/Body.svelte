<script lang="ts">
  import Section from './Section.svelte';
  import { PUBLIC_ENABLE_STATS } from '$env/static/public';
</script>

<Section
  id="coursemanagement"
  tagline="Simplified"
  taglineIcon="simplified"
  title="Advanced Course Management"
  description="ClassroomIO simplifies teaching tasks, boosts the educational experience, and is beneficial for both educators and students, providing a user-friendly platform for assessment, grading, attendance, and scorebook management."
  video="/course-management.mp4"
  rightToLeft={true}
/>
<Section
  id="customization"
  tagline="Flexible"
  taglineIcon="flexible"
  title="Customization at its Core"
  description="ClassroomIO offers organizations the ability to tailor our LMS to their specific requirements. With our customizable features, you can create a personalized learning environment that aligns with your organization's goals"
  rightToLeft={true}
  video="/lms-customization.mp4"
/>

<Section
  id="collaboration"
  tagline="Collaboration"
  taglineIcon="collaboration"
  title="Your Knowledge Base"
  description="Our platform includes a forum-like feature where students and teachers can ask and answer questions, creating a collaborative learning environment. This fosters engagement and knowledge sharing among the community"
  video="/community.mp4"
  rightToLeft={true}
/>
<Section
  id="ai"
  tagline="Productivity"
  taglineIcon="productivity"
  title="AI Integration for Lesson Planning"
  description="Our platform integrates AI to simplify lesson outline generation, streamline lesson planning and spark creative ideas. With ClassroomIO, educators can focus on what matters most: teaching."
  rightToLeft={true}
  video="/ai-lesson.mp4"
/>

<!-- body section 5 -->
{#if PUBLIC_ENABLE_STATS}
  <div
    class="flex justify-between flex-row flex-wrap lg:flex-nowrap items-center text-center px-[10%] py-[7%] border-b-[1px] gap-y-20 gap-x-20 mx-0 lg:mx-[12%]"
  >
    <div class="w-full">
      <h2
        class="w-full order-first text-3xl font-semibold inter tracking-tight text-gray-900 sm:text-5xl"
      >
        1 thousand
      </h2>
      <p class="text-base leading-7 text-gray-600 inter">Feedback collected</p>
    </div>
    <div class="w-full">
      <h2
        class="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl inter"
      >
        5 thousand
      </h2>
      <p class="text-base leading-7 text-gray-600 inter">Documents processed</p>
    </div>
    <div class="w-full">
      <h2
        class="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl inter"
      >
        1 million
      </h2>
      <p class="text-base leading-7 text-gray-600 inter">Page views recorded</p>
    </div>
  </div>
{/if}
