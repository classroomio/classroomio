<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { documentLabels, downloadDocument, toAttachmentFile, viewDocument } from './document-actions';
  import type { BlockViewProps } from '../../utils/types';

  let { block }: BlockViewProps<'document'> = $props();
</script>

<Block.Document
  editable={false}
  file={toAttachmentFile(block.id, block.data)}
  labels={documentLabels()}
  onView={() => viewDocument(block.data)}
  onDownload={() => downloadDocument(block.data)}
/>
