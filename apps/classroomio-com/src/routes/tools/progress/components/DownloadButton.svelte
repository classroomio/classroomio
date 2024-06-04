<script lang="ts">
  import { toPng } from 'html-to-image';
  import { nodeStore, htmlBody, openModal } from './store';

  export let isDisabled: boolean;
  export let isDownloading: boolean;
  export let text: string = 'Generate Progress Report';

  function convertToPng() {
    isDownloading = true;
    $openModal.showFullscreenButton = false;

    const fileName = `${$htmlBody.name} - ${$htmlBody.mood.text} (ClassroomIO_com)`;

    if ($nodeStore) {
      setTimeout(() => {
        toPng($nodeStore, {
          width: 500,
          height: 500,
          quality: 1
        })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = fileName;
            link.href = dataUrl;
            link.click();
          })
          .catch((error) => {
            console.error('Oops, something went wrong!', error);
          })
          .finally(() => {
            isDownloading = false;
            $openModal.showFullscreenButton = true;
          });
      }, 300);
    } else {
      console.error('Node is not defined');
    }
  }
</script>

<button
  type="button"
  disabled={isDownloading || !isDisabled ? true : false}
  on:click={convertToPng}
  class="{isDownloading || !isDisabled
    ? 'bg-gray-200 cursor-not-allowed text-gray-600'
    : 'bg-[#0233BD] text-white'} {text === 'Generate Progress Report'
    ? 'block md:hidden'
    : ''} mt-5 transition-all delay-100 text-white text-xs font-semibold w-full py-3 rounded-md"
  >{isDownloading ? 'Loading...' : text}</button
>
