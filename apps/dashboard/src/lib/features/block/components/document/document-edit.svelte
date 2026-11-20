<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { blockChangeLabel } from '../../utils/block-labels';
  import { documentLabels, toAttachmentFile, viewDocument } from './document-actions';
  import type { BlockEditProps } from '../../utils/types';

  let { block, onRequestSource }: BlockEditProps<'document'> = $props();
</script>

<Block.Document
  editable
  file={toAttachmentFile(block.id, block.data)}
  labels={documentLabels()}
  changeLabel={blockChangeLabel('document')}
  onChange={onRequestSource}
  onView={() => viewDocument(block.data)}
/>
