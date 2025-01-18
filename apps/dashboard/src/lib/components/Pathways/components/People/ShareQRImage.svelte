<script lang="ts">
  import type { CurrentOrg } from '$lib/utils/types/org.ts';
  import type { Pathway } from '$lib/utils/types/index.ts';
  import { isFreePlan } from '$lib/utils/store/org';
  import { qrInviteNodeStore } from './store';

  let node: any;

  $: qrInviteNodeStore.set(node);

  export let qrImage: string;
  export let currentOrg: CurrentOrg;
  export let pathway: Pathway;
</script>

<div
  bind:this={node}
  id="qr-container"
  class="flex flex-col items-center justify-center h-[60rem] w-[40rem] bg-blue-900 rounded-xl p-10 pb-20"
>
  <div class="bg-white pb-3 p-6 rounded-3xl text-center">
    <div class="font-bold text-xl p-2 bg-gray-100 my-4 rounded-xl">Scan QR</div>
    <img src={qrImage} alt="qrcode" />
    <div class="pb-4 pt-1">
      <p class="mt-2 font-bold text-2xl text-primary-600">{pathway.title}</p>
      <p class="mt-1 font-semibold text-lg text-black">{currentOrg.name}</p>
    </div>
  </div>
  {#if $isFreePlan}
    <div class="bg-white flex items-center gap-x-2 px-4 py-2 rounded-md relative top-16">
      <img src="/logo.svg" alt="logo" class="w-6" />
      <span class="font-bold text-base">ClassroomIO.com</span>
    </div>
  {/if}
</div>
