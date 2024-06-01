<script>
  import { onDestroy } from 'svelte';
  import { toPng } from 'html-to-image';
  export let downloadTrigger;
  import QR from '@svelte-put/qr/svg/QR.svelte';
  import { getStudentInviteLink } from '$lib/utils/functions/course';
  import { course } from '$lib/components/Course/store';
  import { currentOrg, currentOrgDomain } from '$lib/utils/store/org';

  let qrContainer;

  const captureAndDownload = async () => {
    try {
      const dataUrl = await toPng(qrContainer);
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${$course.slug}-qr-code.png`;
      link.click();
    } catch (error) {
      console.error('Failed to capture image:', error);
    }
  };

  const unsubscribe = downloadTrigger.subscribe((value) => {
    if (value) {
      captureAndDownload();
      downloadTrigger.set(false);
    }
  });

  onDestroy(() => {
    unsubscribe();
  });
</script>

<div
  bind:this={qrContainer}
  id="qr-container"
  class="flex flex-col items-center justify-center h-screen bg-blue-900 mt-10"
>
  <div class="bg-white pb-3 p-4 rounded-lg text-center">
    <div class="font-bold text-xl p-2 bg-gray-100 my-4 rounded-md">Scan QR</div>
    <QR
      id="qr-code"
      data={getStudentInviteLink($course, $currentOrg.siteName, $currentOrgDomain)}
      moduleFill="black"
      anchorOuterFill="black"
      anchorInnerFill="blue"
    />
    <div class="pb-4 pt-1">
      <p class="mt-2 font-bold text-xl text-primary-600">{$course.title}</p>
      <a
        href={`${$currentOrgDomain}/course/${$course.slug}`}
        target="_blank"
        class="text-blue-500 hover:underline"
      >
        {`${$currentOrgDomain}/course/${$course.slug}`}
      </a>
    </div>
  </div>
</div>
