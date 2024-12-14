<script lang="ts">
  import RadioButtonChecked from 'carbon-icons-svelte/lib/RadioButtonChecked.svelte';
  import GrowthIcon from 'carbon-icons-svelte/lib/Growth.svelte';
  import UserProfileIcon from 'carbon-icons-svelte/lib/UserProfile.svelte';

  const COURSE_TYPE = {
    LIVE_CLASS: 'live',
    SELF_PACED: 'paced'
  };

  interface Props {
    bannerImage: string | undefined;
    slug?: string;
    title?: string;
    description?: string;
    cost?: number;
    totalLessons?: number;
    currency?: string;
    type: any;
  }

  let {
    bannerImage,
    slug = '',
    title = '',
    description = '',
    cost = 0,
    totalLessons = 0,
    currency = 'USD',
    type
  }: Props = $props();
  let target: any = $state();

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
  class="border-gray relative h-fit w-full min-w-[250px] max-w-[300px] rounded border text-black transition-all ease-in-out hover:scale-95 dark:border-neutral-600 md:h-[350px]"
>
  <div class="p-4">
    <div class="relative mb-5">
      <img
        src={bannerImage || '/course-banner.jpg'}
        alt="Course Logo"
        class="relative h-[170px] w-full rounded dark:border dark:border-neutral-600"
      />
      {#if type}
        {@const tag = COURSE_TAG[type]}
        <span
          class="bg-primary-50 absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded-sm p-1 font-mono text-xs capitalize"
        >
          <tag.icon size={16} class={tag.iconStyle} />
          {tag.label}
        </span>
      {/if}
    </div>

    <h3 class="line-clamp-1 text-xl font-semibold dark:text-white">{title}</h3>
    <p class="description mt-2 text-sm text-gray-500 dark:text-gray-300">
      {description}
    </p>
  </div>

  <div class="border-gray mx-2 flex justify-between border-t py-4 dark:border-neutral-600">
    <div>
      <p class="pl-2 text-xs dark:text-white">
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
