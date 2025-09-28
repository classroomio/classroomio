<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import PrimaryButton from './PrimaryButton.svelte';

  interface Props {
    className?: string;
    buttonClass?: string;
    slug?: string;
    title?: string;
    description?: string;
  }

  let {
    className = '',
    buttonClass = '',
    slug = '',
    title = '',
    description = ''
  }: Props = $props();
  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div
  class="rounded-lg h-[250px] w-full max-w-full md:max-w-[280px] xl:max-w-[300px] p-4 bg-[#E5E7E0] dark:bg-[#232429] border border-[#D0D1C9] {className}"
>
  <div class="flex flex-col justify-between gap-4 rounded-lg w-full h-full">
    <div class="flex-1 space-y-2">
      <p class="text-lg font-bold capitalize">{title}</p>
      <p class="text-sm line-clamp-4">
        {description}
      </p>
    </div>
    <div class="w-fit">
      <PrimaryButton
        href={getCourseUrl()}
        class="px-8 transition bg-white hover:bg-white text-black"
        label="Get started"
      />
    </div>
  </div>
</div>
