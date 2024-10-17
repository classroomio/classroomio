<script lang="ts">
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';

  export let data;
</script>

{#if data.header.banner.show}
  <section class="flex items-center justify-center py-10 px-10 md:px-14 min-h-full overflow-hidden">
    <section
      class="flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
    >
      <div class="space-y-6 w-full mb-4">
        <p class="text-3xl md:text-5xl font-bold w-full md:w-[70%] mx-auto">
          {data.header.title}
        </p>

        <p class="w-full text-lg font-semibold md:w-[70%] mx-auto">
          {data.header.subtitle}
        </p>
        <Button
          on:click={() => {
            goto(data.header.action.link);
          }}
          class="capitalize py-2 px-3 bg-white text-black ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-bold mb-4"
          >{data.header.action.label}</Button
        >
      </div>

      <div
        class=" relative rounded-lg h-fit md:h-[300px] md:max-h-[350px] w-full md:w-[800px] md:max-w-[80vw] lg:max-w-[80%] flex"
      >
        <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3" />
        <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10" />
        <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3" />
        <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10" />

        <div class="flex items-center justify-center">
          <img
            style="min-width:280px; min-height:200px"
            alt="landing page banner"
            src={data.header?.banner?.image ? data.header?.banner?.image : '/posthog.svg'}
            class="h-[150px] md:h-full max-h-full w-full rounded-lg object-cover"
          />
        </div>
      </div>
    </section>
  </section>
{/if}
