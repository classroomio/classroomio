<script lang="ts">
  import { toPng } from 'html-to-image';
  import { nodeStore, htmlBody, openModal } from './store';
  import { Button } from '@cio/ui/base/button';

  interface Props {
    isDisabled: boolean;
    isDownloading: boolean;
    text?: string;
  }

  let { isDisabled, isDownloading = $bindable(), text = 'Generate Progress Report' }: Props = $props();

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
            $openModal.showFullscreenButton = false;
          });
      }, 300);
    } else {
      console.error('Node is not defined');
    }
  }
</script>

<Button
  type="button"
  disabled={isDownloading || !isDisabled}
  onclick={convertToPng}
  loading={isDownloading}
  class="{text === 'Generate Progress Report' ? 'block md:hidden' : ''} mt-5 w-full"
>
  {isDownloading ? 'Loading...' : text}
</Button>
