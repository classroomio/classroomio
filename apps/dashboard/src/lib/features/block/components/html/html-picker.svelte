<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { HTML_BLOCK_MAX_LENGTH, HTML_BLOCK_NAME_MAX_LENGTH } from '@cio/utils/validation/block';
  import { snackbar } from '$features/ui/snackbar/store';
  import { HtmlGenerationApi } from '../../api/html-generation.svelte';
  import { getBlockEditHost } from '../../utils/block-host';
  import type { BlockPickerProps } from '../../utils/types';
  import { getHtmlSourceDialogLabels } from './html-labels';
  import { deriveHtmlName, getHtmlTemplates } from './html-utils';

  let { open, onPick, onClose }: BlockPickerProps<'html'> = $props();

  const host = getBlockEditHost();
  const generationApi = new HtmlGenerationApi();

  function pick(name: string, html: string) {
    if (html.length > HTML_BLOCK_MAX_LENGTH) {
      snackbar.error('course.navItem.lessons.materials.blocks.html.too_large');
      return;
    }

    onPick([{ name, html }]);
    onClose();
  }

  async function handleFile(file: File) {
    const html = (await file.text()).trim();
    if (!html) {
      snackbar.error('course.navItem.lessons.materials.blocks.html.empty_file');
      return;
    }

    pick(file.name.slice(0, HTML_BLOCK_NAME_MAX_LENGTH), html);
  }

  async function handleGenerate(prompt: string) {
    const html = await generationApi.generate(host, prompt);
    if (!html) return;

    pick(deriveHtmlName(html, 'ai-page.html'), html);
  }

  function handleCode(html: string) {
    pick(deriveHtmlName(html, 'page.html'), html);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Block.HtmlSourceDialog
  bind:open={() => open, handleOpenChange}
  templates={getHtmlTemplates()}
  labels={getHtmlSourceDialogLabels()}
  generating={generationApi.isLoading}
  onFile={(file) => void handleFile(file)}
  onGenerate={(prompt) => void handleGenerate(prompt)}
  onCode={handleCode}
/>
