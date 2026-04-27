<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Page from '@cio/ui/base/page';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { WidgetsPage } from '$features/widget/pages';
  import { widgetApi } from '$features/widget';
  import { t } from '$lib/utils/functions/translations';

  let { data } = $props();

  let createModalOpen = $state(false);
  let newWidgetName = $state('');

  async function handleCreate() {
    if (!newWidgetName.trim()) return;

    const widget = await widgetApi.createWidget({
      name: newWidgetName.trim(),
      layoutType: 'card_grid',
      selectionMode: 'manual',
      config: undefined,
      selectedCourseIds: []
    });

    if (!widget) return;

    createModalOpen = false;
    newWidgetName = '';
    goto(resolve(`/widgets/${widget.id}`, {}));
  }
</script>

<svelte:head>
  <title>{$t('widgets.heading')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('widgets.heading')}</Page.Title>
      <Page.Subtitle>{$t('widgets.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <Button onclick={() => (createModalOpen = true)}>{$t('widgets.actions.create')}</Button>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <WidgetsPage initialWidgets={data.initialWidgets} onCreate={() => (createModalOpen = true)} />
    {/snippet}
  </Page.Body>
</Page.Root>

<Dialog.Root bind:open={createModalOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('widgets.actions.create')}</Dialog.Title>
      <Dialog.Description>{$t('widgets.create.description')}</Dialog.Description>
    </Dialog.Header>
    <InputField label={$t('widgets.form.name')} bind:value={newWidgetName} />
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (createModalOpen = false)}>{$t('app.cancel')}</Button>
      <Button disabled={!newWidgetName.trim()} onclick={handleCreate}>{$t('widgets.actions.create')}</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
