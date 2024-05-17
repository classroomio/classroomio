<script>
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';

  export let studentName = '';
  let logo = '/logo-512.png';

  let dateIssued = new Date().toLocaleDateString();
</script>

<div class="relative certificate-bg w-full sm:w-[70%] md:w-[50%] lg:w-[70%]">
  <div class="w-full py-5 px-7">
    <header class="flex justify-center items-center gap-1 text-sm font-bold">
      <img src={$currentOrg.avatar_url ? $currentOrg.avatar_url : logo} alt="logo" class="w-5" />
      <h1 class="text-sm">{$currentOrg.name}</h1>
    </header>

    <div class="font-bold mt-3">
      <h2 class="text-[10px]">This certificate is awarded to</h2>
      <h1 class="text-[12px] leading-3 text-fuchsia-800">{studentName}</h1>
    </div>

    <div class="text-[6px] font-bold w-[70%]">
      <h1>has succesfully completed training on</h1>
      <h2 class="text-[14px] leading-3">
        {$course.title}
      </h2>
    </div>

    <div class="flex justify-between items-center w-[70%] my-3 text-center">
      <div class="">
        <h1 class="h-2/4 text-[7px]">DATE ISSUED:</h1>
        <p class="border-b border-black font-bold text-[7px]">{dateIssued}</p>
      </div>
      <div class="w-[20%] text-[7px]">
        <div class=""></div>
        <p class="h-2/4 border-t border-black font-bold text-[7px]">Signature</p>
      </div>
    </div>

    <footer class="text-[7px] w-[90%] desc">
      {$course.description}
    </footer>
  </div>
</div>

<style>
  .certificate-bg {
    background: url('/images/purple-lined-background.png');
    background-size: contain;
    background-repeat: no-repeat;
  }
</style>
