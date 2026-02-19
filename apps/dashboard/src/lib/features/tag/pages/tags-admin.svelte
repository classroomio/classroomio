<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Page from '@cio/ui/base/page';
  import * as Popover from '@cio/ui/base/popover';
  import * as Select from '@cio/ui/base/select';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { InputField } from '@cio/ui/custom/input-field';
  import { TextareaField } from '@cio/ui/custom/textarea-field';

  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import TagIcon from '@lucide/svelte/icons/tag';

  import { tagApi } from '$features/tag/api';
  import type { OrganizationTag, OrganizationTagGroup, OrganizationTagGroups } from '$features/tag/utils';
  import { t } from '$lib/utils/functions/translations';
  import { TAG_COLOR_OPTIONS, type TTagColor } from '@cio/utils/validation/tag';

  interface Props {
    initialTagGroups: OrganizationTagGroups;
    orgSlug: string;
  }

  let { initialTagGroups, orgSlug }: Props = $props();

  let isTagModalOpen = $state(false);
  let isTagGroupModalOpen = $state(false);

  let tagGroupModalMode = $state<'create' | 'edit'>('create');
  let editingGroupId = $state<string | null>(null);

  let tagModalMode = $state<'create' | 'edit'>('create');
  let editingTagId = $state<string | null>(null);

  let tagName = $state('');
  let tagDescription = $state('');
  let tagGroupId = $state('');
  let tagColor = $state<TTagColor>(TAG_COLOR_OPTIONS[0]);

  let groupName = $state('');
  let groupDescription = $state('');

  const hasTagGroups = $derived(tagApi.tagGroups.length > 0);

  $effect(() => {
    tagApi.tagGroups = initialTagGroups;
  });

  $effect(() => {
    if (!tagGroupId && tagApi.tagGroups.length > 0) {
      tagGroupId = tagApi.tagGroups[0].id;
    }
  });

  function resetTagForm() {
    tagApi.reset();
    tagName = '';
    tagDescription = '';
    tagGroupId = tagApi.tagGroups[0]?.id ?? '';
    tagColor = TAG_COLOR_OPTIONS[0];
    editingTagId = null;
    tagModalMode = 'create';
  }

  function openCreateTagModal() {
    resetTagForm();
    isTagModalOpen = true;
  }

  function openEditTagModal(tag: OrganizationTag) {
    tagApi.reset();
    tagModalMode = 'edit';
    editingTagId = tag.id;
    tagName = tag.name;
    tagDescription = tag.description ?? '';
    tagGroupId = tag.groupId;
    tagColor = tag.color as TTagColor;
    isTagModalOpen = true;
  }

  function openCreateTagGroupModal() {
    tagApi.reset();
    tagGroupModalMode = 'create';
    editingGroupId = null;
    groupName = '';
    groupDescription = '';
    isTagGroupModalOpen = true;
  }

  function openEditTagGroupModal(group: OrganizationTagGroup) {
    tagApi.reset();
    tagGroupModalMode = 'edit';
    editingGroupId = group.id;
    groupName = group.name;
    groupDescription = group.description ?? '';
    isTagGroupModalOpen = true;
  }

  async function handleTagGroupSubmit() {
    if (tagGroupModalMode === 'edit' && editingGroupId) {
      const updated = await tagApi.updateTagGroup(editingGroupId, {
        name: groupName,
        description: groupDescription || undefined
      });

      if (!updated) {
        return;
      }

      isTagGroupModalOpen = false;
      return;
    }

    const created = await tagApi.createTagGroup({
      name: groupName,
      description: groupDescription || undefined
    });

    if (!created) {
      return;
    }

    isTagGroupModalOpen = false;

    if (!tagGroupId && tagApi.tagGroups.length > 0) {
      tagGroupId = tagApi.tagGroups[0].id;
    }
  }

  async function handleTagSubmit() {
    if (tagModalMode === 'edit' && editingTagId) {
      const updated = await tagApi.updateTag(editingTagId, {
        name: tagName,
        description: tagDescription || undefined,
        groupId: tagGroupId,
        color: tagColor
      });

      if (updated) {
        isTagModalOpen = false;
      }

      return;
    }

    const created = await tagApi.createTag({
      name: tagName,
      description: tagDescription || undefined,
      groupId: tagGroupId,
      color: tagColor
    });

    if (created) {
      isTagModalOpen = false;
    }
  }

  function getTagCoursesHref(tagSlug: string) {
    return `/org/${orgSlug}/courses?tags=${encodeURIComponent(tagSlug)}`;
  }
</script>

<svelte:head>
  <title>{$t('tags_admin.page_title')}</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('tags_admin.heading')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <ButtonGroup.Root>
        <Button onclick={openCreateTagModal} disabled={!hasTagGroups}>{$t('tags_admin.actions.create_tag')}</Button>
        <ButtonGroup.Separator />
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <Button {...props} size="icon" aria-label={$t('tags_admin.create')}>
                <ChevronDownIcon size={16} />
              </Button>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end" class="w-56">
            <DropdownMenu.Item onclick={openCreateTagModal} disabled={!hasTagGroups}>
              {$t('tags_admin.actions.create_tag')}
            </DropdownMenu.Item>
            <DropdownMenu.Item onclick={openCreateTagGroupModal}>
              {$t('tags_admin.actions.create_group')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      </ButtonGroup.Root>
    </Page.Action>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      {#if !tagApi.tagGroups.length}
        <Empty
          title={$t('tags_admin.empty.title')}
          description={$t('tags_admin.empty.description')}
          icon={TagIcon}
          variant="page"
        >
          <Button onclick={openCreateTagGroupModal}>{$t('tags_admin.actions.create_group')}</Button>
        </Empty>
      {:else}
        <div class="rounded-md border">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>{$t('tags_admin.table.tag')}</Table.Head>
                <Table.Head>{$t('tags_admin.table.total_courses')}</Table.Head>
                <Table.Head>{$t('tags_admin.table.description')}</Table.Head>
                <Table.Head>{$t('tags_admin.table.category')}</Table.Head>
                <Table.Head class="text-right">{$t('tags_admin.table.action')}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each tagApi.tagGroups as group (group.id)}
                <Table.Row class="ui:bg-muted/20">
                  <Table.Cell colspan={5}>
                    <div class="flex items-start justify-between gap-4 py-1">
                      <div class="space-y-1">
                        <p class="text-sm font-semibold">{group.name}</p>
                        {#if group.description}
                          <p class="ui:text-muted-foreground max-w-[320px] truncate text-xs">{group.description}</p>
                        {/if}
                      </div>
                      <Button variant="ghost-default" size="sm" onclick={() => openEditTagGroupModal(group)}>
                        {$t('tags_admin.actions.edit_group')}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>

                {#if group.tags.length === 0}
                  <Table.Row>
                    <Table.Cell colspan={5} class="ui:text-muted-foreground text-sm">
                      {$t('tags_admin.table.empty_group')}
                    </Table.Cell>
                  </Table.Row>
                {:else}
                  {#each group.tags as tag (tag.id)}
                    <Table.Row>
                      <Table.Cell>
                        <div class="flex items-center gap-2">
                          <span
                            class="inline-block h-3 w-3 rounded-full border"
                            style={`background-color: ${tag.color}`}
                            aria-hidden="true"
                          ></span>
                          <span class="font-medium">{tag.name}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <Button variant="link" class="h-auto p-0" href={getTagCoursesHref(tag.slug)}>
                          {tag.courseCount}
                          {' '}
                          {tag.courseCount === 1 ? $t('tags_admin.table.course') : $t('tags_admin.table.courses')}
                        </Button>
                      </Table.Cell>
                      <Table.Cell>
                        <p class="max-w-[320px] truncate">{tag.description || $t('tags_admin.common.not_available')}</p>
                      </Table.Cell>
                      <Table.Cell>{group.name}</Table.Cell>
                      <Table.Cell class="text-right">
                        <Button variant="ghost-default" size="sm" onclick={() => openEditTagModal(tag)}>
                          {$t('tags_admin.actions.edit_tag')}
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  {/each}
                {/if}
              {/each}
            </Table.Body>
          </Table.Root>
        </div>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<Dialog.Root bind:open={isTagGroupModalOpen}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {$t(tagGroupModalMode === 'edit' ? 'tags_admin.group_modal.edit_title' : 'tags_admin.group_modal.create_title')}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <InputField
        label={$t('tags_admin.group_modal.name')}
        bind:value={groupName}
        errorMessage={tagApi.errors.name}
        autoFocus
      />

      <TextareaField
        label={$t('tags_admin.group_modal.description')}
        placeholder={$t('tags_admin.group_modal.description_placeholder')}
        bind:value={groupDescription}
        errorMessage={tagApi.errors.description}
      />
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isTagGroupModalOpen = false)}>
        {$t('tags_admin.actions.cancel')}
      </Button>
      <Button onclick={handleTagGroupSubmit} loading={tagApi.isLoading}>
        {$t('tags_admin.actions.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={isTagModalOpen}>
  <Dialog.Content class="sm:max-w-lg">
    <Dialog.Header>
      <Dialog.Title>
        {$t(tagModalMode === 'edit' ? 'tags_admin.tag_modal.edit_title' : 'tags_admin.tag_modal.create_title')}
      </Dialog.Title>
    </Dialog.Header>

    <div class="space-y-4 py-2">
      <InputField
        label={$t('tags_admin.tag_modal.name')}
        bind:value={tagName}
        errorMessage={tagApi.errors.name}
        autoFocus
      />

      <TextareaField
        label={$t('tags_admin.tag_modal.description')}
        placeholder={$t('tags_admin.tag_modal.description_placeholder')}
        bind:value={tagDescription}
        errorMessage={tagApi.errors.description}
      />

      <div class="space-y-2">
        <p class="text-sm font-medium">{$t('tags_admin.tag_modal.category')}</p>
        <Select.Root type="single" bind:value={tagGroupId}>
          <Select.Trigger>
            <p>
              {tagGroupId
                ? tagApi.tagGroups.find((group) => group.id === tagGroupId)?.name ||
                  $t('tags_admin.tag_modal.select_category')
                : $t('tags_admin.tag_modal.select_category')}
            </p>
          </Select.Trigger>
          <Select.Content>
            {#each tagApi.tagGroups as group (group.id)}
              <Select.Item value={group.id}>{group.name}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        {#if tagApi.errors.groupId}
          <p class="text-sm text-red-600">{tagApi.errors.groupId}</p>
        {/if}
      </div>

      <div class="space-y-2">
        <p class="text-sm font-medium">{$t('tags_admin.tag_modal.color')}</p>
        <Popover.Root>
          <Popover.Trigger>
            {#snippet child({ props })}
              <Button {...props} type="button" variant="outline" class="w-full justify-start gap-2">
                <span
                  class="inline-block h-3 w-3 rounded-full border"
                  style={`background-color: ${tagColor}`}
                  aria-hidden="true"
                ></span>
                {tagColor}
              </Button>
            {/snippet}
          </Popover.Trigger>
          <Popover.Content align="start" class="w-44 p-3">
            <div class="grid grid-cols-5 gap-2">
              {#each TAG_COLOR_OPTIONS as color (color)}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  class={`h-6 w-6 rounded-full p-0 ${tagColor === color ? 'ring-2 ring-offset-1' : ''}`}
                  style={`background-color: ${color}`}
                  aria-label={color}
                  onclick={() => {
                    tagColor = color;
                  }}
                />
              {/each}
            </div>
          </Popover.Content>
        </Popover.Root>
        <p class="ui:text-muted-foreground text-xs">{$t('tags_admin.tag_modal.color_help')}</p>
      </div>

      {#if !hasTagGroups}
        <p class="ui:text-muted-foreground text-sm">{$t('tags_admin.tag_modal.no_groups')}</p>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isTagModalOpen = false)}>
        {$t('tags_admin.actions.cancel')}
      </Button>
      <Button onclick={handleTagSubmit} loading={tagApi.isLoading} disabled={!hasTagGroups}>
        {$t('tags_admin.actions.save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
