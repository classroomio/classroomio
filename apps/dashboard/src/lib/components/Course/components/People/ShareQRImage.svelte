<script lang="ts">
  import type { AccountOrg } from '$features/app/types';
  import type { Course } from '$lib/utils/types';
  import { isFreePlan } from '$lib/utils/store/org';
  import { qrInviteNodeStore } from './store';

  let node: any = $state();

  $effect(() => {
    qrInviteNodeStore.set(node);
  });

  interface Props {
    qrImage: string;
    currentOrg: AccountOrg;
    course: Course;
  }

  let { qrImage, currentOrg, course }: Props = $props();
</script>

<div
  bind:this={node}
  id="qr-container"
  class="h-160 w-160 flex flex-col items-center justify-center rounded-xl bg-blue-900 p-10 pb-20"
>
  <div class="rounded-3xl bg-white p-6 pb-3 text-center">
    <div class="my-4 rounded-xl bg-gray-100 p-2 text-xl">Scan QR</div>
    <img src={qrImage} alt="qrcode" />
    <div class="pb-4 pt-1">
      <p class="text-primary-600 mt-2 text-2xl">{course.title}</p>
      <p class="mt-1 text-lg font-semibold text-black">{currentOrg.name}</p>
    </div>
  </div>
  {#if $isFreePlan}
    <div class="relative top-16 flex items-center gap-x-2 rounded-md bg-white px-4 py-2">
      <img src="/logo.svg" alt="logo" class="w-6" />
      <span class="text-base">ClassroomIO.com</span>
    </div>
  {/if}
</div>
