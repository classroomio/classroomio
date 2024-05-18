<script>
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';

  export let studentName = '';
  const logo = '/logo-512.png';

  const dateIssued = new Date().toLocaleDateString();
</script>

<div class="w-full md:w-[70%] dark:text-black relative mx-auto">
  <img
    src="/images/purple-badge-pattern-background.svg"
    alt=""
    class="w-full h-full absolute z-0 object-cover"
  />
  <div class="relative bg-white flex z-20 my-2 w-[90%] mx-auto">
    <div class="w-full pl-3">
      <header class="flex justify-end items-center gap-1 text-sm font-bold">
        <img src={$currentOrg.avatar_url ? $currentOrg.avatar_url : logo} alt="logo" class="w-5" />
        <h1 class="text-sm">{$currentOrg.name}</h1>
      </header>

      <div class="font-bold mt-12">
        <h2 class="text-[7px] m-0">This certificate is awarded to</h2>
        <h1 class="text-[13px] m-0 mt-0.5 leading-3 text-[#914397]">{studentName}</h1>
      </div>

      <div class="font-bold mt-3 w-[90%]">
        <h1 class="text-[7px]">has successfully completed training on</h1>
        <h2 class="text-[13px] m-0">
          {$course.title}
        </h2>
      </div>

      <div class="flex justify-between items-center my-8 text-center">
        <div>
          <h1 class="h-2/4 m-0 text-[7px]">DATE ISSUED:</h1>
          <p class="border-b border-black font-bold text-[7px]">{dateIssued}</p>
        </div>
        <div class="w-[20%] text-[7px]">
          <div></div>
          <p class="border-t border-black font-bold text-[7px]">Signature</p>
        </div>
      </div>

      <footer class="text-[6px] font-bold w-[90%] desc">
        {$course.description}
      </footer>
    </div>

    <div class="max-w-[40%] flex justify-center items-center">
      <img
        src="/images/purple-badge-pattern-badge.svg"
        alt="A badge"
        class="w-full object-contain"
      />
    </div>
  </div>
</div>
