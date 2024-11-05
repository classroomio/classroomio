<script lang="ts">
  import { ImageLoader, SkeletonPlaceholder } from 'carbon-components-svelte';

  import RadioButtonChecked from 'carbon-icons-svelte/lib/RadioButtonChecked.svelte';
  import GrowthIcon from 'carbon-icons-svelte/lib/Growth.svelte';
  import UserProfileIcon from 'carbon-icons-svelte/lib/UserProfile.svelte';

  const COURSE_TYPE = {
    LIVE_CLASS: 'live',
    SELF_PACED: 'paced'
  };

  export let bannerImage: string | undefined;

  export let slug = '';
  export let title = '';
  export let description = '';
  export let cost = 0;
  export let totalLessons = 0;
  export let currency = 'USD';
  export let isLMS = false;
  export let type;
  let target: any;

  function getCourseUrl() {
    return `/course/${slug}`;
  }
  const COURSE_TAG: Record<
    string,
    {
      style: string;
      label: string;
      icon: any;
      iconStyle?: string;
    }
  > = {
    [COURSE_TYPE.LIVE_CLASS]: {
      style: '',
      label: 'live',
      icon: RadioButtonChecked,
      iconStyle: 'text-red-700'
    },
    [COURSE_TYPE.SELF_PACED]: {
      style: '',
      label: 'paced',
      icon: UserProfileIcon,
      iconStyle: 'text-primary-700'
    },
    SPECIALIZATION: {
      style: '',
      label: 'specialized',
      icon: GrowthIcon
    }
  };
</script>

<a
  rel="prefetch"
  bind:this={target}
  href={getCourseUrl()}
  class="text-black border border-gray dark:border-neutral-600 rounded w-full h-fit md:h-[350px] min-w-[250px] max-w-[300px] relative hover:scale-95 transition-all ease-in-out"
>
  <div class="p-4">
    <div class="relative mb-5">
      <ImageLoader
        src={bannerImage || '/classroomio-course-img-template.jpg'}
        alt="Course Logo"
        class="h-[170px] w-full rounded dark:border dark:border-neutral-600 relative"
      >
        <svelte:fragment slot="loading">
          <SkeletonPlaceholder style="width: 100%; height: 170px;" />
        </svelte:fragment>
        <svelte:fragment slot="error">an error occured</svelte:fragment>
      </ImageLoader>
      {#if type}
        {@const tag = COURSE_TAG[type]}
        <span
          class="absolute bottom-2 left-2 z-10 text-xs capitalize bg-primary-50 rounded-sm p-1 flex items-center gap-1 font-mono"
        >
          <svelte:component this={tag.icon} size={16} class={tag.iconStyle} />
          {tag.label}
        </span>
      {/if}
    </div>

    <h3 class="text-xl dark:text-white font-semibold line-clamp-1">{title}</h3>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-300 description">
      {description}
    </p>
  </div>

  <div class="py-4 mx-2 border-t border-gray dark:border-neutral-600 flex justify-between">
    <div>
      <p class="text-xs {!isLMS && 'pl-2'} dark:text-white">
        {totalLessons}
        lessons
      </p>
    </div>
    <p class="text-xs">
      <span class="px-2 font-bold text-[#944499]"
        >{!cost ? 'Free' : currency == 'USD' ? `$ ${cost}` : `N ${cost}`}</span
      >
    </p>
  </div>
</a>

<style>
  a,
  a:hover {
    text-decoration: none;
  }
  .title,
  .description {
    height: 42px;
    line-height: 20px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -moz-box-orient: vertical;
    -ms-box-orient: vertical;
    box-orient: vertical;
    -webkit-line-clamp: 2;
    -moz-line-clamp: 2;
    -ms-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
  }
</style>
