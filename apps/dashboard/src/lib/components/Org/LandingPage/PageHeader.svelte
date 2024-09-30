<script>
  import { Search } from 'carbon-components-svelte';
  import { t } from '$lib/utils/functions/translations';

  let searchValue = '';
</script>

<section class="bg-[#040f2d] min-h-[337px] w-full flex items-center justify-center p-">
  <div class="w-full flex items-center justify-center flex-col-reverse md:flex-row">
    <!-- Course Description -->
    <div class="course-descr w-11/12 py-10">
      <h1 class="dark:text-white text-5xl text-white text-center my-4 font-bold">
        {$t('course.navItem.landing_page.explore')}
      </h1>
      <p class="dark:text-white text-md text-white mb-6 text-center">
        {$t('course.navItem.landing_page.find')}🌎.
      </p>

      <Search
        placeholder={$t('course.navItem.landing_page.find_course')}
        bind:value={searchValue}
      />
    </div>
  </div>
</section>
