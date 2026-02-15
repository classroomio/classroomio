<script lang="ts">
  import { courseApi } from '$features/course/api';
  import { currentOrg } from '$lib/utils/store/org';

  interface Props {
    studentName?: string;
  }

  let { studentName = '' }: Props = $props();
  const logo = '/logo-512.png';

  const dateIssued = new Date().toLocaleDateString();
</script>

<div class="w-full bg-[#2D499F] p-3 dark:text-black">
  <div class="flex w-full bg-white pb-5">
    <div class="w-[80%] pl-3">
      <header class="flex items-center justify-start gap-1 text-sm">
        <img src={$currentOrg.avatarUrl ? $currentOrg.avatarUrl : logo} alt="logo" class="w-5" />
        <h1 class="text-sm">{$currentOrg.name}</h1>
      </header>

      <div class="mt-7">
        <h2 class="m-0 text-[7px]">This certificate is awarded to</h2>
        <h1 class="m-0 mt-0.5 text-lg leading-3 text-[#2D499F]">{studentName}</h1>
      </div>

      <div class="mt-3 w-[90%]">
        <h1 class="text-[7px]">has succesfully completed training on</h1>
        <h2 class="m-0 text-lg">
          {courseApi.course?.title}
        </h2>
      </div>

      <div class="mt-8 mb-5 flex items-center justify-between text-center">
        <div class="">
          <h1 class="m-0 h-2/4 text-[7px]">DATE ISSUED:</h1>
          <p class="border-b border-black text-[7px]">{dateIssued}</p>
        </div>
        <div class="w-[20%] text-[7px]">
          <div class=""></div>
          <p class="border-t border-black text-[7px]">Signature</p>
        </div>
      </div>

      <footer class="desc w-[90%] text-[8px]">
        {courseApi.course?.description}
      </footer>
    </div>

    <div class="w-[20%]">
      <img src="/images/blue-professional-badge.svg" alt="A badge" class="w-full" />
    </div>
  </div>
</div>
