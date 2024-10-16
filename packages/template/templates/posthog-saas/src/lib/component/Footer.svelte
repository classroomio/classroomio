<script>
  export let data;
  export let logo = '';
  export let orgName = '';
</script>

{#if data.footer.show}
  <nav
    class="w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:justify-between py-4 px-6"
  >
    <div class="logo">
      <a href="/" title={`Go to ${orgName} Home`} id="logo" data-hveid="8">
        <img
          src={logo || '/logo-192.png'}
          alt={`${orgName || 'ClassroomIO'} logo`}
          class="rounded w-9 inline-block mx-auto"
          data-atf="1"
        />
      </a>
    </div>
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
      class="flex items-center hover:underline text-[#0233BD] dark:text-white gap-1"
    >
      <p class="text-base font-semibold">Built on ClassroomIO</p>
    </a>
  </nav>
{/if}
