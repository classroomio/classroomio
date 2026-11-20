<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { HTML_BLOCK_NAME_MAX_LENGTH, HTML_PAGE_MAX_BYTES, type THtmlPage } from '@cio/utils/validation/block';
  import { snackbar } from '$features/ui/snackbar/store';
  import { HtmlPageApi } from '../../api/html-page.svelte';
  import { getBlockEditHost } from '../../utils/block-host';
  import type { BlockPickerProps } from '../../utils/types';
  import { getHtmlSourceDialogLabels } from './html-labels';
  import { getHtmlTemplates } from './html-utils';

  let { open, onPick, onClose }: BlockPickerProps<'html'> = $props();

  const host = getBlockEditHost();
  const htmlPageApi = new HtmlPageApi();

  function pick(page: THtmlPage | null) {
    if (!page) return;

    onPick([page]);
    onClose();
  }

  async function store(name: string, html: string) {
    if (new Blob([html]).size > HTML_PAGE_MAX_BYTES) {
      snackbar.error('course.navItem.lessons.materials.blocks.html.too_large');
      return;
    }

    pick(await htmlPageApi.create(host, { name, html }));
  }

  async function handleFile(file: File) {
    const html = (await file.text()).trim();
    if (!html) {
      snackbar.error('course.navItem.lessons.materials.blocks.html.empty_file');
      return;
    }

    await store(file.name.slice(0, HTML_BLOCK_NAME_MAX_LENGTH), html);
  }

  async function handleGenerate(prompt: string) {
    pick(await htmlPageApi.generate(host, { prompt }));
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<Block.HtmlSourceDialog
  bind:open={() => open, handleOpenChange}
  templates={getHtmlTemplates()}
  labels={getHtmlSourceDialogLabels()}
  generating={htmlPageApi.isLoading}
  onFile={(file) => void handleFile(file)}
  onGenerate={(prompt) => void handleGenerate(prompt)}
  onCode={(html) => void store('page.html', html)}
/>
