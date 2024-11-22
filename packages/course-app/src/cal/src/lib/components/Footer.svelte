<script lang="ts">
  import { getPageSection } from '$lib/utils/helpers/page';
  import { sharedPage } from '$lib/utils/stores/pages';

  const content = $derived(getPageSection($sharedPage, 'footer'));
  const seo = $derived(getPageSection($sharedPage, 'seo'));
</script>

{#if content?.show}
  <nav class="w-full py-4 px-4 lg:px-14 bg-[#F4F4F4]">
    <div
      class="bg-[#2E2E2F] rounded-lg p-4 text-white w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between"
    >
      <a href="/#" class="p-2 bg-white rounded-lg">
        <img
          src={seo?.settings.logo}
          alt={`${seo?.settings.title} logo`}
          class="rounded bg-white inline-block mx-auto"
          data-atf="1"
        />
      </a>
      <ul
        class="flex flex-col md:flex-row items-start md:items-center gap-4 -md:gap-8 font-semibold capitalize underline"
      >
        {#if content.settings.twitter}
          <a href={content.settings.twitter} target="_blank" title="twitter">Twitter</a>
        {/if}
        {#if content.settings.youtube}
          <a href={content.settings.youtube} target="_blank">Youtube</a>{/if}

        {#if content.settings.linkedin}
          <a href={content.settings.linkedin} target="_blank" title="linkedin">LinkedIn</a>
        {/if}
        {#if content.settings.facebook}
          <a href={content.settings.facebook} target="_blank" title="facebook">facebook</a>
        {/if}
      </ul>
      <a
        href="https://classroomio.com"
        target="_blank noopener noreferrer"
        class="flex w-full md:w-fit items-center justify-center lg:justify-start hover:underline text-white gap-1"
      >
        <p class="text-base font-bold">❤️ from ClassroomIO</p>
      </a>
    </div>
  </nav>
{/if}
