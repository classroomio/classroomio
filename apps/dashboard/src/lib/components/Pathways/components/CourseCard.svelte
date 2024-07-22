<script lang="ts">
  import { t } from '$lib/utils/functions/translations';

  export let id: string;
  export let title: string;
  export let banner_image: string;
  export let description: string;
  export let total_lessons: number;
  export let total_students: number;
</script>

<a
  href="/courses/{id}"
  class="border rounded-md cursor-pointer no-underline min-w-[250px] md:max-w-[28%] h-full w-full p-2.5"
>
  <div class="max-h-2/4 overflow-hidden">
    <img
      src={banner_image ? banner_image : '/images/org-landingpage-our-story.jpeg'}
      alt="Course"
      class="h-full w-full object-cover hover:scale-125 transition-all duration-300"
    />
  </div>
  <h3 class="md:text-sm no-underline">{title}</h3>
  <p class="lg:text-xs no-underline">
    {description}
  </p>
  <div class="md:text-xs border-t mt-2 py-2 flex justify-between font-medium">
    <span>{total_lessons} {$t('pathways.components.courseCard.lessons')}</span>
    <span>{total_students} {$t('pathways.components.courseCard.students')}</span>
  </div>
</a>

<style>
  a {
    text-decoration: none !important;
  }
</style>
