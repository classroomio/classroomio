<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { HTML_BLOCK_MAX_HEIGHT, HTML_BLOCK_MIN_HEIGHT, HTML_BLOCK_MIN_WIDTH } from '@cio/utils/validation/block';
  import { HtmlPageApi } from '../../api/html-page.svelte';
  import { getBlockEditHost } from '../../utils/block-host';
  import type { BlockEditProps } from '../../utils/types';
  import { getHtmlBlockLabels } from './html-labels';
  import { getHtmlContentUrl, getHtmlDownloadHref } from './html-utils';

  let { block, onDataChange, onRequestSource }: BlockEditProps<'html'> = $props();

  const host = getBlockEditHost();
  const htmlPageApi = new HtmlPageApi();

  const contentUrl = $derived(getHtmlContentUrl(block.data));

  function handleResize(size: Block.HtmlBlockSize) {
    onDataChange({ ...block.data, width: size.width, height: size.height });
  }

  async function handleEditWithAi(prompt: string): Promise<boolean> {
    const page = await htmlPageApi.generate(host, { prompt, assetId: block.data.assetId });
    if (!page) return false;

    const nextData = { ...block.data, assetId: page.assetId, size: page.size, url: page.url };
    onDataChange(nextData);
    return true;
  }
</script>

<Block.Html
  src={contentUrl}
  downloadHref={getHtmlDownloadHref(contentUrl)}
  name={block.data.name}
  width={block.data.width}
  height={block.data.height}
  minWidth={HTML_BLOCK_MIN_WIDTH}
  minHeight={HTML_BLOCK_MIN_HEIGHT}
  maxHeight={HTML_BLOCK_MAX_HEIGHT}
  editable
  generating={htmlPageApi.isLoading}
  labels={getHtmlBlockLabels()}
  onResize={handleResize}
  onChange={onRequestSource}
  onEditWithAi={handleEditWithAi}
/>
