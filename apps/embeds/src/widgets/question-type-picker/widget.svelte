<script lang="ts">
  /** Subpath import avoids `@cio/ui` barrel `index.css` side effect (embed ships its own `embed.css`). */
  import { QuestionTypePicker } from '@cio/ui/custom/question-type-picker';
</script>

<div
  class="cio-embed-root cio-question-type-picker-embed ui:box-border ui:min-h-[320px] ui:min-w-0 ui:w-full ui:max-w-full"
>
  <QuestionTypePicker />
</div>
