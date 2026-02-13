<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import Plus from '@lucide/svelte/icons/plus';
  import LockIcon from '@lucide/svelte/icons/lock';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import * as Sidebar from '@cio/ui/base/sidebar';
  import * as Collapsible from '@cio/ui/base/collapsible';
  import { ContentType } from '@cio/utils/constants/content';
  import { courseApi } from '$features/course/api';
  import { CONTENT_DEFINITIONS, getContentRoute, getCourseContent } from '$features/course/utils/content';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    path: string;
    id: string;
    isStudent?: boolean;
    className?: string;
    onOpenContentModal?: (sectionId?: string) => void;
  }

  let { path, id, isStudent = false, className = '', onOpenContentModal }: Props = $props();

  const contentData = $derived(getCourseContent(courseApi.course));
</script>

<Sidebar.MenuSub class={className}>
  {#if contentData.grouped}
    {#each contentData.sections as section (section.id)}
      <Collapsible.Root open={true} class="group/section">
        {#snippet child({ props })}
          <Sidebar.MenuSubItem {...props}>
            <Collapsible.Trigger>
              {#snippet child({ props })}
                <Sidebar.MenuSubButton {...props} class="flex w-full items-center gap-2 font-medium">
                  {@const SectionIcon = CONTENT_DEFINITIONS[ContentType.Section].icon}
                  <SectionIcon size={14} />
                  <span class="flex-1 truncate">{section.title}</span>
                  <div class="ml-auto flex items-center gap-1">
                    {#if onOpenContentModal}
                      <Plus
                        size={20}
                        class="rounded-full p-1 hover:bg-gray-200"
                        onclick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          onOpenContentModal(section.id);
                        }}
                      />
                    {/if}

                    <ChevronRightIcon
                      size={20}
                      class="rounded-full p-1 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 hover:bg-gray-200"
                    />
                  </div>
                </Sidebar.MenuSubButton>
              {/snippet}
            </Collapsible.Trigger>
            <Collapsible.Content>
              <Sidebar.MenuSub class="ml-2">
                {#each section.items as contentItem (contentItem.id)}
                  <Sidebar.MenuSubItem>
                    <Sidebar.MenuSubButton isActive={(path || page.url.pathname).includes(contentItem.id)}>
                      {#snippet child({ props })}
                        {@const ItemIcon = CONTENT_DEFINITIONS[contentItem.type].icon}
                        {@const isContentLocked = (contentItem.isUnlocked ?? true) === false}
                        {@const isLockedForStudent = isStudent && isContentLocked}
                        <a
                          href={resolve(getContentRoute(id, contentItem), {})}
                          aria-disabled={isLockedForStudent}
                          title={contentItem.title}
                          class="flex w-full items-center gap-2 {isLockedForStudent
                            ? 'cursor-not-allowed opacity-50'
                            : ''}"
                          onclick={(event) => {
                            if (isLockedForStudent) {
                              event.preventDefault();
                            }
                          }}
                          {...props}
                        >
                          <ItemIcon size={14} />
                          <span class="flex-1 truncate">{contentItem.title}</span>
                          <div class="ml-auto flex items-center gap-1">
                            {#if contentItem.isComplete}
                              <span class="shrink-0">
                                <CircleCheckIcon size={16} filled />
                              </span>
                            {/if}
                            {#if isContentLocked}
                              <span
                                class="shrink-0"
                                title={$t('course.navItem.lessons.add_lesson.lock')}
                                aria-label={$t('course.navItem.lessons.add_lesson.lock')}
                              >
                                <LockIcon size={12} />
                              </span>
                            {/if}
                          </div>
                        </a>
                      {/snippet}
                    </Sidebar.MenuSubButton>
                  </Sidebar.MenuSubItem>
                {/each}
              </Sidebar.MenuSub>
            </Collapsible.Content>
          </Sidebar.MenuSubItem>
        {/snippet}
      </Collapsible.Root>
    {/each}
  {:else}
    {#each contentData.items as contentItem (contentItem.id)}
      <Sidebar.MenuSubItem>
        <Sidebar.MenuSubButton isActive={(path || page.url.pathname).includes(contentItem.id)}>
          {#snippet child({ props })}
            {@const ItemIcon = CONTENT_DEFINITIONS[contentItem.type].icon}
            {@const isContentLocked = (contentItem.isUnlocked ?? true) === false}
            {@const isLockedForStudent = isStudent && isContentLocked}
            <a
              href={resolve(getContentRoute(id, contentItem), {})}
              aria-disabled={isLockedForStudent}
              title={contentItem.title}
              class="flex w-full items-center gap-2 {isLockedForStudent ? 'cursor-not-allowed opacity-50' : ''}"
              onclick={(event) => {
                if (isLockedForStudent) {
                  event.preventDefault();
                }
              }}
              {...props}
            >
              <ItemIcon size={14} />
              <span class="flex-1 truncate">{contentItem.title}</span>
              <div class="ml-auto flex items-center gap-1">
                {#if contentItem.isComplete}
                  <span class="shrink-0">
                    <CircleCheckIcon size={16} filled />
                  </span>
                {/if}
                {#if isContentLocked}
                  <span
                    class="shrink-0"
                    title={$t('course.navItem.lessons.add_lesson.lock')}
                    aria-label={$t('course.navItem.lessons.add_lesson.lock')}
                  >
                    <LockIcon size={12} />
                  </span>
                {/if}
              </div>
            </a>
          {/snippet}
        </Sidebar.MenuSubButton>
      </Sidebar.MenuSubItem>
    {/each}
  {/if}
</Sidebar.MenuSub>

<style>
  a {
    text-decoration: none;
  }
</style>
