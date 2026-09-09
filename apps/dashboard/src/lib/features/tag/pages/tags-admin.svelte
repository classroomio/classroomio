<script lang="ts">
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import { Button } from '@cio/ui/base/button';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Page from '@cio/ui/base/page';
  import * as Table from '@cio/ui/base/table';
  import { Empty } from '@cio/ui/custom/empty';
  import { IconButton } from '@cio/ui/custom/icon-button';

  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import TagIcon from '@lucide/svelte/icons/tag';

  import { tagApi } from '$features/tag/api';
  import { TagFormModal, TagGroupFormModal } from '$features/tag/components';
  import type { OrganizationTag, OrganizationTagGroup, OrganizationTagGroups } from '$features/tag/utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    initialTagGroups: OrganizationTagGroups;
    orgSlug: string;
  }

  let { initialTagGroups, orgSlug }: Props = $props();

  let isTagModalOpen = $state(false);
  let isTagGroupModalOpen = $state(false);

  let editingTag = $state<OrganizationTag | null>(null);
  let editingGroup = $state<OrganizationTagGroup | null>(null);

  const hasTagGroups = $derived(tagApi.tagGroups.length > 0);

  $effect(() => {
    tagApi.tagGroups = initialTagGroups;
  });

  function openCreateTagModal() {
    tagApi.reset();
    editingTag = null;
    isTagModalOpen = true;
  }

  function openEditTagModal(tag: OrganizationTag) {
    tagApi.reset();
    editingTag = tag;
    isTagModalOpen = true;
  }

  function openCreateTagGroupModal() {
    tagApi.reset();
    editingGroup = null;
    isTagGroupModalOpen = true;
  }

  function openEditTagGroupModal(group: OrganizationTagGroup) {
    tagApi.reset();
    editingGroup = group;
    isTagGroupModalOpen = true;
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
      <Page.Subtitle>{$t('tags_admin.page_subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
    <Page.Action>
      <ButtonGroup.Root>
        <Button onclick={openCreateTagModal}>{$t('tags_admin.actions.create_tag')}</Button>
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
            <DropdownMenu.Item onclick={openCreateTagModal}>
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
                <Table.Row class="group ui:bg-muted/20">
                  <Table.Cell colspan={5}>
                    <div class="flex items-start justify-between gap-4 py-1">
                      <div class="space-y-1">
                        <p class="text-sm font-semibold">{group.name}</p>
                        {#if group.description}
                          <p class="ui:text-muted-foreground max-w-[320px] truncate text-xs">{group.description}</p>
                        {/if}
                      </div>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger class="flex shrink-0 items-center justify-center">
                          <IconButton
                            variant="outline"
                            class="pointer-events-none opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
                            aria-label={$t('tags_admin.actions.actions_menu')}
                          >
                            <EllipsisVerticalIcon size={16} />
                          </IconButton>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Item onclick={() => openEditTagGroupModal(group)}>
                            {$t('tags_admin.actions.edit_group')}
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
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
                    <Table.Row class="group">
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
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger class="inline-flex items-center justify-center">
                            <IconButton
                              variant="outline"
                              class="pointer-events-none opacity-0 transition-opacity group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-hover:pointer-events-auto group-hover:opacity-100"
                              aria-label={$t('tags_admin.actions.actions_menu')}
                            >
                              <EllipsisVerticalIcon size={16} />
                            </IconButton>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content align="end">
                            <DropdownMenu.Item onclick={() => openEditTagModal(tag)}>
                              {$t('tags_admin.actions.edit_tag')}
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
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

<TagFormModal bind:open={isTagModalOpen} mode={editingTag ? 'edit' : 'create'} tag={editingTag} />
<TagGroupFormModal bind:open={isTagGroupModalOpen} mode={editingGroup ? 'edit' : 'create'} group={editingGroup} />
