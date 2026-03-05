<script lang="ts">
  import Section from './core-feature-section.svelte';
  import { PUBLIC_ENABLE_STATS } from '$env/static/public';
</script>

<section class="w-full border-x-0 border-t-0 border-b border-gray-200 py-32">
  <div class="flex flex-wrap justify-center gap-x-12 gap-y-16 text-center">
    <div class="w-full min-w-0" style="max-width: 1000px; flex: 1 1 550px;">
      <div class="mx-auto flex max-w-lg flex-col items-center gap-2">
        <div class="flex-none">
          <div class="">
            <img
              src="https://senjaio.b-cdn.net/public/avatar/406f29d4-5811-4f2e-90c1-e586fce3b3a7_me.JPEG?width=78&amp;height=78&amp;format=webp"
              alt="Pranav Singhal avatar"
              class="rounded-full"
              loading="lazy"
              referrerpolicy="no-referrer"
              style="width: 52px; height: 52px;"
            />
          </div>
        </div>
        <div class="text-center text-base leading-snug">
          <span class="text-4xl font-bold opacity-50">“</span>
          <span class="text-gray-800" style="font-size: 17px;"
            >ClassroomIO really helped me bootstrap my program. The dashboard is extremely intuitive. I could navigate
            most of it without any help / support. Coming from framer, I can honestly say that I am extremely greatful
            that I found ClassroomIO.</span
          > <span class="inline-block text-4xl font-bold opacity-50">”</span>
        </div>
        <div class="mx-auto flex items-center justify-center gap-2">
          <div class="flex max-w-[200px] flex-none flex-col overflow-hidden text-left" style="color: var(--clr-text);">
            <div class="text-center text-sm font-medium opacity-90">
              Pranav Singhal <div class="block text-xs font-medium opacity-70 hover:opacity-50">
                Founder at <a href="https://www.dblocked.io/" target="_blank">DBlockEd</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<Section
  id="coursemanagement"
  tagline="Simplified"
  title="Course Management"
  description="ClassroomIO simplifies teaching tasks, boosts the educational experience, and is beneficial for both educators and students, providing a user-friendly platform for assessment, grading, attendance, and scorebook management."
  video="https://brand.cdn.clsrio.com/course-management.mp4"
  rightToLeft={true}
/>
<Section
  id="ai"
  tagline="Efficient"
  title="AI Support"
  description="Our platform integrates AI to simplify lesson outline generation, streamline lesson planning and spark creative ideas. With ClassroomIO, educators can focus on what matters most: teaching."
  rightToLeft={false}
  video="https://brand.cdn.clsrio.com/ai-lesson.mp4"
/>
<Section
  id="customization"
  tagline="Flexible"
  title="Dashboard Customization"
  description="ClassroomIO offers organizations the ability to tailor our LMS to their specific requirements. With our customizable features, you can create a personalized learning environment that aligns with your organization's goals"
  rightToLeft={true}
  video="https://brand.cdn.clsrio.com/lms-customization.mp4"
/>
<Section
  id="collaboration"
  tagline="Collaborative"
  title="Student and Teacher Community"
  description="Our platform includes a forum-like feature where students and teachers can ask and answer questions, creating a collaborative learning environment. This fosters engagement and knowledge sharing among the community"
  video="https://brand.cdn.clsrio.com/community.mp4"
  rightToLeft={false}
/>

<!-- body section 5 -->
{#if PUBLIC_ENABLE_STATS}
  <div
    class="mx-0 flex flex-row flex-wrap items-center justify-between gap-x-20 gap-y-20 border-b-[1px] px-[10%] py-[7%] text-center lg:mx-[12%] lg:flex-nowrap"
  >
    <div class="w-full">
      <h2 class="order-first w-full text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">1 thousand</h2>
      <p class="text-base leading-7 text-gray-600">Feedback collected</p>
    </div>
    <div class="w-full">
      <h2 class="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">5 thousand</h2>
      <p class="text-base leading-7 text-gray-600">Documents processed</p>
    </div>
    <div class="w-full">
      <h2 class="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">1 million</h2>
      <p class="text-base leading-7 text-gray-600">Page views recorded</p>
    </div>
  </div>
{/if}
