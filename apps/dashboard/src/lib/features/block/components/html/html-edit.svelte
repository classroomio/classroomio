<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { HTML_BLOCK_MAX_HEIGHT, HTML_BLOCK_MIN_HEIGHT, HTML_BLOCK_MIN_WIDTH } from '@cio/utils/validation/block';
  import { HtmlGenerationApi } from '../../api/html-generation.svelte';
  import { getBlockEditHost } from '../../utils/block-host';
  import type { BlockEditProps } from '../../utils/types';
  import { getHtmlBlockLabels } from './html-labels';

  let { block, onDataChange, onRequestSource }: BlockEditProps<'html'> = $props();

  const host = getBlockEditHost();
  const generationApi = new HtmlGenerationApi();

  function handleResize(size: Block.HtmlBlockSize) {
    onDataChange({ ...block.data, width: size.width, height: size.height });
  }

  async function handleEditWithAi(prompt: string): Promise<boolean> {
    const html = await generationApi.generate(host, prompt, block.data.html);
    if (!html) return false;

    onDataChange({ ...block.data, html });
    return true;
  }
</script>

<Block.Html
  html={block.data.html}
  name={block.data.name}
  width={block.data.width}
  height={block.data.height}
  minWidth={HTML_BLOCK_MIN_WIDTH}
  minHeight={HTML_BLOCK_MIN_HEIGHT}
  maxHeight={HTML_BLOCK_MAX_HEIGHT}
  editable
  generating={generationApi.isLoading}
  labels={getHtmlBlockLabels()}
  onResize={handleResize}
  onChange={onRequestSource}
  onEditWithAi={handleEditWithAi}
/>
