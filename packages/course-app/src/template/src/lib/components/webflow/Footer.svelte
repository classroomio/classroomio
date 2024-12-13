<script lang="ts">
  import { getPageSection } from '$lib/utils/helpers/page';
  import { sharedPage } from '$lib/utils/stores/pages';

  const content = $derived(getPageSection($sharedPage, 'footer'));
  const seo = $derived(getPageSection($sharedPage, 'seo'));
</script>

{#if content?.show}
  <nav
    class="bg-black text-white w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between py-4 px-6"
  >
    <ul
      class="flex flex-col md:flex-row items-start md:items-center gap-4 -md:gap-8 font-semibold capitalize no-underline"
    >
      {#if content.settings.twitter}
        <a
          href={content.settings.twitter}
          target="_blank"
          title="twitter"
          class="text-gray-500 hover:text-gray-200">Twitter</a
        >
      {/if}
      {#if content.settings?.youtube}
        <a
          href={content.settings?.youtube}
          target="_blank"
          class="text-gray-500 hover:text-gray-200">Youtube</a
        >{/if}

      {#if content.settings.linkedin}
        <a
          href={content.settings.linkedin}
          target="_blank"
          title="linkedin"
          class="text-gray-500 hover:text-gray-200">LinkedIn</a
        >
      {/if}
      {#if content.settings.facebook}
        <a
          href={content.settings.facebook}
          target="_blank"
          title="facebook"
          class="text-gray-500 hover:text-gray-200">facebook</a
        >
      {/if}
    </ul>
    <a
      href="www.classroomio.com"
      class="flex items-center hover:underline text-[#0233BD] dark:text-white gap-1"
    >
      <img
        src={seo?.settings.logo}
        alt={`${seo?.settings.title} logo`}
        class="rounded bg-white size-9 inline-block mx-auto object-contain"
        data-atf="1"
      />
      <p class="text-base font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
