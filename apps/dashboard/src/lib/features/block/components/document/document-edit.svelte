<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { blockChangeLabel } from '../../utils/block-labels';
  import { documentLabels, downloadDocument, toAttachmentFile, viewDocument } from './document-actions';
  import type { BlockEditProps } from '../../utils/types';

  let { block, onRequestSource }: BlockEditProps<'document'> = $props();
</script>

<Block.Document
  editable
  files={[toAttachmentFile(block.id, block.data)]}
  labels={documentLabels(1)}
  changeLabel={blockChangeLabel('document')}
  onChange={onRequestSource}
  onView={() => viewDocument(block.data)}
  onDownload={() => downloadDocument(block.data)}
/>
