<script lang="ts">
  interface Props {
    data: any;
    logo?: string;
    orgName?: string;
  }

  let { data, logo = '', orgName = '' }: Props = $props();
</script>

{#if data.footer.show}
  <nav class="w-full py-4 px-4 lg:px-14 bg-[#F4F4F4]">
    <div
      class="bg-[#2E2E2F] rounded-lg p-4 text-white w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between"
    >
      <a href="/#">
        <img
          src={logo || '/logo-192.png'}
          alt={`${orgName || 'ClassroomIO'} logo`}
          class="rounded w-9 inline-block mx-auto"
          data-atf="1"
        />
      </a>
      <ul
        class="flex flex-col md:flex-row items-start md:items-center gap-4 -md:gap-8 font-semibold capitalize underline"
      >
        {#if data.footer.twitter}
          <a href={data.footer.twitter} target="_blank" title="twitter">Twitter</a>
        {/if}
        {#if data.footer?.youtube}
          <a href={data.footer?.youtube} target="_blank">Youtube</a>{/if}

        {#if data.footer.linkedin}
          <a href={data.footer.linkedin} target="_blank" title="linkedin">LinkedIn</a>
        {/if}
        {#if data.footer.facebook}
          <a href={data.footer.facebook} target="_blank" title="facebook">facebook</a>
        {/if}
      </ul>
      <a
        href="www.classroomio.com"
        class="flex w-full md:w-fit items-center justify-center lg:justify-start hover:underline text-white gap-1"
      >
        <p class="text-base font-bold">Built on ClassroomIO</p>
      </a>
    </div>
  </nav>
{/if}
