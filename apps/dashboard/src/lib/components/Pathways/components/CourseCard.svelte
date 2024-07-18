<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  export let id: string;
  export let title: string;
  export let avatar: string;
  export let description: string;
  export let lessonNumber: number;
  export let studentNumber: number;
</script>

<a
  href="/courses/{id}"
  class="border rounded-md cursor-pointer no-underline min-w-[250px] md:max-w-[28%] h-full w-full p-2.5"
>
  <div class="max-h-2/4 overflow-hidden">
    <img
      src={avatar}
      alt="Course"
      class="h-full w-full object-cover hover:scale-125 transition-all duration-300"
    />
  </div>
  <h3 class="md:text-sm no-underline">{title}</h3>
  <p class="lg:text-xs no-underline">
    {description}
  </p>
  <div class="md:text-xs border-t mt-2 py-2 flex justify-between font-medium">
    <span>{lessonNumber} {$t('pathways.components.courseCard.lessons')}lessons</span>
    <span>{studentNumber} {$t('pathways.components.courseCard.students')}students</span>
  </div>
</a>

<style>
  a {
    text-decoration: none !important;
  }
</style>
