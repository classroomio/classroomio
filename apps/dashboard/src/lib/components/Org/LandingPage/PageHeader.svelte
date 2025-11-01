<script>
  import { Search } from 'carbon-components-svelte';
  import { t } from '$lib/utils/functions/translations';

  let searchValue = $state('');
</script>

<section class="p- flex min-h-[337px] w-full items-center justify-center bg-[#040f2d]">
  <div class="flex w-full flex-col-reverse items-center justify-center md:flex-row">
    <!-- Course Description -->
    <div class="course-descr w-11/12 py-10">
      <h1 class="my-4 text-center text-5xl font-bold text-white dark:text-white">
        {$t('course.navItem.landing_page.explore')}
      </h1>
      <p class="text-md mb-6 text-center text-white dark:text-white">
        {$t('course.navItem.landing_page.find')}🌎.
      </p>

      <Search placeholder={$t('course.navItem.landing_page.find_course')} bind:value={searchValue} />
    </div>
  </div>
</section>
