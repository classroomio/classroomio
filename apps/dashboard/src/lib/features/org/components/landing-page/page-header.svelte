<script>
  import { Input } from '@cio/ui/base/input';

  import { t } from '$lib/utils/functions/translations';
  import Search from '@lucide/svelte/icons/search';

  let searchValue = $state('');
</script>

<section class="p- flex min-h-[337px] w-full items-center justify-center bg-[#040f2d]">
  <div class="flex w-full flex-col-reverse items-center justify-center md:flex-row">
    <!-- Course Description -->
    <div class="course-descr w-11/12 py-10">
      <h1 class="my-4 text-center text-5xl text-white dark:text-white">
        {$t('course.navItem.landing_page.explore')}
      </h1>
      <p class="text-md mb-6 text-center text-white dark:text-white">
        {$t('course.navItem.landing_page.find')}🌎.
      </p>

      <div class="relative mx-auto max-w-xl">
        <Input type="text" placeholder={$t('course.navItem.landing_page.find_course')} bind:value={searchValue} />
        <Search class="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2" />
      </div>
    </div>
  </div>
</section>
