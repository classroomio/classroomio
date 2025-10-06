<script lang="ts">
  import { course } from '$lib/components/Course/store';
  import { currentOrg } from '$lib/utils/store/org';

  interface Props {
    studentName?: string;
  }

  let { studentName = '' }: Props = $props();
  const logo = '/logo-512.png';

  const dateIssued = new Date().toLocaleDateString();
</script>

<div class="relative w-full dark:text-black">
  <img
    src="/images/blue-badge-pattern-background.svg"
    alt=""
    class="absolute z-0 h-full w-full object-cover"
  />
  <div class="relative z-20 m-2 flex h-full justify-between bg-white md:h-[17rem]">
    <div class="w-[70%] pl-3">
      <header class="absolute flex w-full items-center justify-center gap-1 text-sm font-bold">
        <img src={$currentOrg.avatar_url ? $currentOrg.avatar_url : logo} alt="logo" class="w-5" />
        <h1 class="text-sm">{$currentOrg.name}</h1>
      </header>

      <div class="mt-16 font-bold">
        <h2 class="m-0 text-[7px]">This certificate is awarded to</h2>
        <h1 class="m-0 mt-0.5 text-lg leading-3 text-[#2D499F]">{studentName}</h1>
      </div>

      <div class="mt-3 w-[90%] font-bold">
        <h1 class="text-[7px]">has successfully completed training on</h1>
        <h2 class="m-0 text-lg">
          {$course.title}
        </h2>
      </div>

      <div class="my-8 flex items-center justify-between text-center">
        <div>
          <h1 class="m-0 h-2/4 text-[7px]">DATE ISSUED:</h1>
          <p class="border-b border-black text-[7px] font-bold">{dateIssued}</p>
        </div>
        <div class="w-[20%] text-[7px]">
          <div></div>
          <p class="border-t border-black text-[7px] font-bold">Signature</p>
        </div>
      </div>

      <footer class="desc w-[90%] text-[8px] font-bold">
        {$course.description}
      </footer>
    </div>

    <div class="flex items-center justify-center overflow-hidden">
      <img
        src="/images/blue-badge-pattern-badge.svg"
        alt="A badge"
        class="w-[8rem] max-w-none md:w-[10rem]"
      />
    </div>
  </div>
</div>
