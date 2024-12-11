<script lang="ts">
  import { goto } from '$app/navigation';
  import { getPageSection } from '@/utils/helpers/page';
  import { homePage } from '@/utils/stores/pages';
  import PrimaryButton from './PrimaryButton.svelte';

  const content = $derived(getPageSection($homePage, 'cta'));
</script>

{#if content?.show}
  <section class="flex flex-col items-center justify-between px-6 lg:px-10 py-20 bg-classic">
    <div class="flex items-center justify-center w-full">
      <p class="text-4xl text-white text-center font-bold w-full">
        {content.settings.title}
      </p>
    </div>
    <div class="w-full flex items-center justify-center my-5">
      <PrimaryButton
        onClick={() => goto('/courses')}
        class="rounded-sm font-bold text-lg bg-classic-secondary border hover:scale-95 hover:bg-classic-secondary border-gray-100"
        label={content.settings.buttonLabel}
      />
    </div>
  </section>
{/if}
