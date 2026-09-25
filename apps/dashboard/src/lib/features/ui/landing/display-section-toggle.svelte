<script lang="ts">
  import { Label } from '@cio/ui/base/label';
  import { Switch } from '@cio/ui/base/switch';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    show: boolean;
    toggleId: string;
    onToggleShow: (show: boolean) => void;
  }

  let { show, toggleId, onToggleShow }: Props = $props();
</script>

<div class="mt-5 flex flex-col gap-2">
  <p class="font-semibold">
    {$t('learningPath.landing.display_section')}
  </p>

  <div class="flex items-center space-x-2">
    <Switch id={toggleId} checked={show} onCheckedChange={onToggleShow} />

    <Label for={toggleId} class="text-gray-600">
      {show ? $t('settings.landing_page.show_section') : $t('settings.landing_page.hide_section')}
    </Label>
  </div>
</div>
