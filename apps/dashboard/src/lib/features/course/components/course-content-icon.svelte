<script lang="ts">
  import type { ContentType } from '@cio/utils/constants/content';
  import LearningEntityIcon from '$features/ui/learning-entity-icon.svelte';

  interface Props {
    type: ContentType;
    size?: number;
    className?: string;
    isHovered?: boolean;
    colored?: boolean;
  }

  let { type, size = 14, className = '', isHovered = false, colored = true }: Props = $props();
</script>

<LearningEntityIcon {type} {size} {className} {isHovered} {colored} />
