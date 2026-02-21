<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg } from '$lib/utils/store/org';
  import { isFreePlan } from '$lib/utils/store/org';
  import { courseApi } from '$features/course/api';
  import { qrInviteNodeStore } from './store';

  let node: any = $state();

  $effect(() => {
    qrInviteNodeStore.set(node);
  });

  interface Props {
    qrImage: string;
  }

  let { qrImage }: Props = $props();
</script>

<div
  bind:this={node}
  id="qr-container"
  class="flex h-160 w-160 flex-col items-center justify-center rounded-xl bg-blue-900 p-10 pb-20"
>
  <div class="rounded-3xl bg-white p-6 pb-3 text-center">
    <div class="my-4 rounded-xl bg-gray-100 p-2 text-xl">{$t('course.navItem.people.invite_modal.scan_qr')}</div>
    <img src={qrImage} alt="qrcode" />
    <div class="pt-1 pb-4">
      <p class="ui:text-primary mt-2 text-2xl">{courseApi.course?.title}</p>
      <p class="mt-1 text-lg font-semibold text-black">{$currentOrg.name}</p>
    </div>
  </div>
  {#if $isFreePlan}
    <div class="relative top-16 flex items-center gap-x-2 rounded-md bg-white px-4 py-2">
      <img src="/logo.svg" alt="logo" class="w-6" />
      <span class="text-base">{$t('course.navItem.people.invite_modal.classroomio_brand')}</span>
    </div>
  {/if}
</div>
