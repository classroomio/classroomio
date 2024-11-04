<script>
  import { Button } from '$lib/components/ui/button';
  export let data;
</script>

<section class="w-full bg-[#F4F4F4] py-16 px-4 lg:px-10">
  <div
    class="relative flex flex-col md:flex-row min-h-40 justify-center border-2 border-[#141414] rounded-xl divide-x divide-transparent w-full lg:w-[80%] mx-auto"
  >
    <div
      class="bg-[#E5E7E0] text-center md:text-start rounded-t-xl md:rounded-l-xl flex justify-center capitalize items-center py-20 px-4 lg:px-10 w-full md:w-[65%] min-h-40 text-4xl font-bold"
    >
      <h1 class="leading-normal">programs that you will love.<br />100% guaranteed</h1>
    </div>

    <div
      class="rounded-b-xl md:rounded-r-xl flex items-center justify-center py-16 px-4 bg-white w-full md:w-[35%] min-h-40 text-lg font-semibold"
    >
      <p>
        Unlock skills you'll use for life with courses designed to inspire, empower, and elevate
        your expertise.
      </p>
      <Button
        class="absolute -bottom-5 uppercase rounded-2xl py-6 bg-white hover:bg-white hover:text-black border-[1.5px] border-[#141414] text-[#141414] shadow-[0px_3px_#141414]"
      >
        Learn More
      </Button>
    </div>
  </div>
</section>
