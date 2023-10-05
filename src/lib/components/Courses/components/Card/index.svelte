<script lang="ts">
  import { Tag, ImageLoader, SkeletonPlaceholder } from 'carbon-components-svelte';
  import getCurrencyFormatter from '$lib/utils/functions/getCurrencyFormatter';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';

  export let bannerImage: string | undefined;
  export let id = '';
  export let slug = '';
  export let title = '';
  export let description = '';
  export let isPublished = false;
  export let cost = 0;
  export let totalLessons = 0;
  export let currency = 'NGN';
  export let isOnLandingPage = false;
  export let isLMS = false;
  export let progressRate = 45;

  $: formatter = getCurrencyFormatter(currency);
</script>

<a
  rel="prefetch"
  href={isOnLandingPage ? `/course/${slug}` : `/courses/${id}`}
  class="text-black border border-gray rounded w-full max-w-[320px] relative hover:scale-95 transition-all ease-in-out"
>
  <div class="p-4">
    <div class=" mb-5">
      <ImageLoader
        src={bannerImage}
        alt="Course Logo"
        class="h-[200px] w-full rounded dark:border dark:border-white"
      >
        <svelte:fragment slot="loading">
          <SkeletonPlaceholder style="width: 100%; height: 200px;" />
        </svelte:fragment>
        <svelte:fragment slot="error">An error occurred.</svelte:fragment>
      </ImageLoader>
    </div>

    <h3 class="text-xl dark:text-white title">{title}</h3>
    <p class="mt-2 text-sm text-gray-500 dark:text-gray-300 description">
      {description}
    </p>
  </div>

  <div
    class="px-4 border border-gray border-b-0 border-l-0 border-r-0 flex justify-between items-center"
  >
    <div>
      <p class="text-xs pt-2 {!isLMS && 'pl-2'} dark:text-white">{totalLessons} lessons</p>
      <p class="text-xs py-2">
        {#if isOnLandingPage}
          <span class="px-2">{!cost ? 'Free' : formatter.format(cost)}</span>
        {:else if isLMS}
          <div class="flex items-center gap-2">
            <div class=" relative bg-[#EAEAEA] w-[50px] h-1">
              <div
                style="width:{progressRate}%"
                class={`absolute top-0 left-0 bg-primary-700 h-full`}
              />
            </div>
            <p class="text-xs text-[#656565] dark:text-white">{progressRate}%</p>
          </div>
        {:else}
          <Tag type={isPublished ? 'green' : 'cool-gray'}>
            {#if isPublished}
              Published
            {:else}
              Unpublished
            {/if}
          </Tag>
        {/if}
      </p>
    </div>

    {#if isLMS}
      <PrimaryButton
        label={'Continue Course'}
        variant={VARIANTS.OUTLINED}
        className="rounded-none text-primary-600"
      />
    {/if}
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
