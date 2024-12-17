<script lang="ts">
  import { ArrowRight } from 'carbon-icons-svelte';
  interface Props {
    className?: string;
    buttonClass?: string;
    slug?: string;
    title?: string;
    description?: string;
    cost?: number;
    currency?: string;
    lessons?: number;
  }

  let {
    className = '',
    buttonClass = '',
    slug = '',
    title = '',
    description = '',
    cost = 0,
    currency = 'USD',
    lessons = 0
  }: Props = $props();

  function getCourseUrl() {
    return `/course/${slug}`;
  }
</script>

<div class="h-fit w-full min-w-[250px] max-w-[300px] space-y-4">
  <div class="space-y-4 rounded-sm border border-[#EAEAEA] px-4 {className}">
    <div class="overflow-hidden border-b py-4">
      <p class="p line-clamp-1 overflow-ellipsis border-[#EAEAEA] text-xl font-semibold">
        {title}
      </p>
    </div>
    <div class="overflow-hidden rounded-md">
      <p class=" line-clamp-3 overflow-ellipsis text-justify text-[#878787]">
        {description}
      </p>
    </div>
    <span class="flex items-center justify-between py-4">
      <p>{lessons} Lessons</p>
      <p class="font-bold text-[#0233BD]">
        {!cost ? 'Free' : currency == 'USD' ? `$ ${cost}` : `N ${cost}`}
      </p>
    </span>
  </div>
  <a
    href={getCourseUrl()}
    class="flex w-full cursor-pointer items-center justify-between rounded-sm border border-[#EAEAEA] p-3 transition-all duration-200 hover:scale-95 hover:no-underline {buttonClass}"
  >
    <p class="font-bold uppercase text-[#0233BD]">Learn More</p>
    <ArrowRight class="text-[#0233BD]" />
  </a>
</div>
