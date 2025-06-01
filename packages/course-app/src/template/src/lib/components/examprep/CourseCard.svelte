<script>
  import PrimaryButton from './PrimaryButton.svelte';

  let { slug, title, description, className = '', buttonClass = '' } = $props();
</script>

<div
  class="border-examprep w-full rounded-lg border-2 p-4 shadow-[-12px_12px_0px_#0233BD] md:h-[300px] md:w-[350px] {className}"
>
  <div class="flex h-full w-full flex-col justify-between gap-4 rounded-lg">
    <div class="flex-1 space-y-2">
      <p class="text-examprep line-clamp-2 text-xl font-semibold uppercase">{title}</p>
      <p class="font-inter line-clamp-4 text-gray-600">
        {description}
      </p>
    </div>
    <PrimaryButton
      label="Start course"
      class="w-full text-start font-medium uppercase {buttonClass}"
      href={`/course/${slug}`}
    />
  </div>
</div>
