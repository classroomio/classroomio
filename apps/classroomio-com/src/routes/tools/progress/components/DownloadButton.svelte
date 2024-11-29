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
            $openModal.showFullscreenButton = false;
          });
      }, 300);
    } else {
      console.error('Node is not defined');
    }
  }
</script>

<button
  type="button"
  disabled={isDownloading || !isDisabled}
  on:click={convertToPng}
  class="download-button {isDownloading || !isDisabled ? 'disabled' : ''} 
         {text === 'Generate Progress Report' ? 'mobile-only' : ''}"
>
  {isDownloading ? 'Loading...' : text}
</button>

<style>
  .download-button {
    margin-top: 1.25rem;
    transition: all 100ms;
    color: var(--button-text);
    font-size: 0.75rem;
    font-weight: 600;
    width: 100%;
    padding: 0.75rem;
    border-radius: 0.375rem;
    background-color: var(--button-bg);
  }

  .download-button.disabled {
    background-color: var(--button-disabled-bg);
    color: var(--button-disabled-text);
    cursor: not-allowed;
  }

  .mobile-only {
    display: block;
  }

  @media (min-width: 768px) {
    .mobile-only {
      display: none;
    }
  }

  :global(body) {
    --button-bg: #0233BD;
    --button-text: #ffffff;
    --button-disabled-bg: #e5e7eb;
    --button-disabled-text: #6b7280;
  }

  :global(body.dark) {
    --button-bg: #1f78d1;
    --button-text: #ffffff;
    --button-disabled-bg: #4b5563;
    --button-disabled-text: #9ca3af;
  }
</style>