<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from './PrimaryButton.svelte';

  const content = $derived(getPageSection($homePage, 'cta'));
</script>

{#if content?.show}
  <section
    class="flex flex-col md:flex-row items-center justify-between px-6 lg:px-10 py-20 bg-blue-800"
  >
    <div class="flex items-center justify-center w-full">
      <p
        class="text-4xl text-white text-center md:text-start font-bold w-full lg:w-[70%] capitalize"
      >
        {content.settings.title}
      </p>
    </div>
    <div class="w-full flex items-center justify-center my-5">
      <PrimaryButton
        onClick={() => goto('/courses')}
        class="py-2 bg-white text-blue-700 hover:bg-white"
        label={content.settings.buttonLabel}
      />
    </div>
  </section>
{/if}
