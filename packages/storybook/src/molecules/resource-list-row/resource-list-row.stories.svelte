<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import * as ResourceListRow from '@cio/ui/custom/resource-list-row';
  import * as Item from '@cio/ui/base/item';
  import * as Avatar from '@cio/ui/base/avatar';
  import * as Checkbox from '@cio/ui/base/checkbox';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';

  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ListChecksIcon from '@lucide/svelte/icons/list-checks';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import GitBranchIcon from '@lucide/svelte/icons/git-branch';
  import GitCommitHorizontalIcon from '@lucide/svelte/icons/git-commit-horizontal';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import UserIcon from '@lucide/svelte/icons/user';

  import { FIELDS } from './fields';

  /** Storybook-only sample data for the courses-style list row. */
  const sampleCourses = [
    {
      title: 'Introduction to Python',
      type: 'Self-paced',
      lastUpdated: 'Last updated Mar 28, 2026',
      tags: ['Beginner', 'Programming', 'Python', 'API', 'Testing'],
      lessons: 24,
      exercises: 12,
      students: 128,
      published: true
    },
    {
      title: 'Advanced TypeScript',
      type: 'Live',
      lastUpdated: 'Last updated Mar 26, 2026',
      tags: ['TypeScript', 'Advanced'],
      lessons: 18,
      exercises: 9,
      students: 42,
      published: true
    },
    {
      title: 'Draft: Data visualization',
      type: 'Self-paced',
      lastUpdated: 'Last updated Mar 20, 2026',
      tags: [],
      lessons: 6,
      exercises: 2,
      students: 0,
      published: false
    }
  ];

  const { Story } = defineMeta({
    title: 'Molecules/ResourceListRow',
    component: ResourceListRow.Root,
    args: {
      variant: 'default',
      size: 'sm',
      align: 'start',
      density: 'default',
      class: ''
    },
    argTypes: {
      variant: {
        control: 'select',
        options: ['default', 'outline', 'muted', 'muted-border'],
        description: 'Passed through to `Item.Root` (border / background).'
      },
      size: {
        control: 'select',
        options: ['default', 'sm'],
        description: 'Item padding and gap (`Item` size variant).'
      },
      align: {
        control: 'select',
        options: ['center', 'start'],
        description: 'Vertical alignment of row sections (e.g. start for multi-line cells).'
      },
      density: {
        control: 'select',
        options: ['default', 'toolbar'],
        description: '`toolbar` tightens padding for a “select all” style header; otherwise use default.'
      },
      class: {
        control: 'text',
        description: 'Extra classes merged onto the row (Tailwind / `ui:`).'
      },
      child: { control: false },
      children: { control: false },
      ref: { control: false }
    },
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default" parameters={{ layout: 'padded' }}>
  {#snippet template()}
    {@const studentAvatarSrc = [
      'https://github.com/shadcn.png',
      'https://github.com/maxleiter.png',
      'https://github.com/evilrabbit.png'
    ]}
    <ResourceListRow.Group class="@container w-full">
      {#each sampleCourses as course (course.title)}
        <ResourceListRow.Root variant="default" align="start" class="ui:cursor-pointer ui:py-3">
          <div
            class="ui:grid ui:w-full ui:items-start grid-cols-1 gap-x-3 gap-y-2 @3xl:grid-cols-[var(--row-cols)]"
            style="--row-cols: 2fr 5.5rem 2fr 4.5rem 6rem 2.5rem"
          >
            <!-- Title -->
            <div class="ui:flex ui:min-w-0 ui:flex-col ui:gap-0.5">
              <p class="ui:line-clamp-1 ui:font-semibold ui:text-sm">{course.title}</p>
              <p class="ui:text-muted-foreground ui:mt-0.5 ui:text-sm">{course.type}</p>
              <p class="ui:text-muted-foreground ui:mt-0.5 ui:text-xs">{course.lastUpdated}</p>
            </div>

            <!-- Published -->
            <div>
              {#if course.published}
                <Badge variant="success" class="ui:whitespace-nowrap">Published</Badge>
              {:else}
                <Badge variant="secondary" class="ui:whitespace-nowrap">Draft</Badge>
              {/if}
            </div>

            <!-- Tags -->
            <div class="ui:flex ui:min-w-0 ui:flex-wrap ui:items-center ui:gap-1">
              {#if course.tags.length === 0}
                <span class="ui:text-muted-foreground ui:text-xs">—</span>
              {:else}
                {#each course.tags.slice(0, 3) as tag (tag)}
                  <Badge variant="outline" class="ui:max-w-[140px] ui:truncate">{tag}</Badge>
                {/each}
                {#if course.tags.length > 3}
                  <Badge variant="secondary" class="shrink-0 tabular-nums">+{course.tags.length - 3}</Badge>
                {/if}
              {/if}
            </div>

            <!-- Lessons / exercises -->
            <div class="ui:flex ui:flex-col ui:gap-1 ui:tabular-nums">
              <p class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm" aria-label="{course.lessons} lessons">
                <BookOpenIcon class="ui:text-muted-foreground ui:size-3.5 ui:shrink-0" aria-hidden="true" />
                <span class="ui:font-medium">{course.lessons}</span>
              </p>
              <p class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm" aria-label="{course.exercises} exercises">
                <ListChecksIcon class="ui:text-muted-foreground ui:size-3.5 ui:shrink-0" aria-hidden="true" />
                <span class="ui:font-medium">{course.exercises}</span>
              </p>
            </div>

            <!-- Students -->
            <div class="flex items-center gap-1">
              {#if course.students > 0}
                <div class="flex -space-x-2">
                  {#each studentAvatarSrc as src, index (src)}
                    {#if index < Math.min(2, course.students)}
                      <Avatar.Root class="ui:size-6 ui:border-2 ui:border-background">
                        <Avatar.Image {src} alt="" />
                        <Avatar.Fallback>?</Avatar.Fallback>
                      </Avatar.Root>
                    {/if}
                  {/each}
                  {#if course.students > 2}
                    <Avatar.Root class="ui:size-6 ui:border-2 ui:border-background">
                      <Avatar.Fallback class="ui:text-[10px]">+{course.students - 2}</Avatar.Fallback>
                    </Avatar.Root>
                  {/if}
                </div>
              {:else}
                <Avatar.Root class="ui:size-6">
                  <Avatar.Fallback>
                    <UserIcon class="ui:size-3 ui:text-muted-foreground" />
                  </Avatar.Fallback>
                </Avatar.Root>
                <p class="ui:text-xs">0</p>
              {/if}
            </div>

            <!-- Actions -->
            <div class="ui:flex ui:justify-end">
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button
                      {...props}
                      variant="ghost"
                      size="icon"
                      class="ui:size-8"
                      aria-label="Course actions"
                      onclick={(e) => e.stopPropagation()}
                    >
                      <EllipsisVerticalIcon class="ui:size-4" />
                    </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item>Open</DropdownMenu.Item>
                  <DropdownMenu.Item>Clone</DropdownMenu.Item>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Item variant="destructive">Delete</DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>
        </ResourceListRow.Root>
      {/each}
    </ResourceListRow.Group>
  {/snippet}
</Story>

<Story name="DomainStyle">
  {#snippet template()}
    <ResourceListRow.Group class="w-3xl!">
      <ResourceListRow.Root density="toolbar">
        <ResourceListRow.Lead>
          <Checkbox.Root aria-label="Select all domains" />
        </ResourceListRow.Lead>
        <ResourceListRow.Main>
          <span class="ui:text-sm ui:font-semibold">Select all</span>
        </ResourceListRow.Main>
        <Item.Actions>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" size="icon" class="ui:size-8" aria-label="Bulk actions">
                  <MoreHorizontalIcon class="ui:size-4" />
                </Button>
              {/snippet}
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item>Export</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </Item.Actions>
      </ResourceListRow.Root>
      <ResourceListRow.Root>
        <ResourceListRow.Lead>
          <Checkbox.Root aria-label="Select fastlearner.io" />
        </ResourceListRow.Lead>
        <ResourceListRow.Main>
          <Item.Title class="ui:font-semibold">fastlearner.io</Item.Title>
          <p class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm ui:text-amber-800 dark:ui:text-amber-200">
            <ClockIcon class="ui:size-3.5 ui:shrink-0" />
            Expires 16 Jan 2027
          </p>
        </ResourceListRow.Main>
        <ResourceListRow.End>
          <span class="ui:text-muted-foreground ui:text-sm">Jan 16</span>
          <Avatar.Root class="ui:size-8">
            <Avatar.Image src="https://github.com/shadcn.png" alt="" />
            <Avatar.Fallback>CN</Avatar.Fallback>
          </Avatar.Root>
        </ResourceListRow.End>
        <Item.Actions>
          <Button variant="ghost" size="icon" class="ui:size-8" aria-label="Row actions">
            <MoreHorizontalIcon class="ui:size-4" />
          </Button>
        </Item.Actions>
      </ResourceListRow.Root>
      <ResourceListRow.Root>
        <ResourceListRow.Lead>
          <Checkbox.Root aria-label="Select macusaone.com" />
        </ResourceListRow.Lead>
        <ResourceListRow.Main>
          <Item.Title class="ui:font-semibold">macusaone.com</Item.Title>
          <p class="ui:text-muted-foreground ui:text-sm">Third Party</p>
        </ResourceListRow.Main>
        <ResourceListRow.End>
          <span class="ui:text-muted-foreground ui:text-sm">11/20/25</span>
          <Avatar.Root class="ui:size-8">
            <Avatar.Image src="https://github.com/maxleiter.png" alt="" />
            <Avatar.Fallback>ML</Avatar.Fallback>
          </Avatar.Root>
        </ResourceListRow.End>
        <Item.Actions>
          <Button variant="ghost" size="icon" class="ui:size-8" aria-label="Row actions">
            <MoreHorizontalIcon class="ui:size-4" />
          </Button>
        </Item.Actions>
      </ResourceListRow.Root>
    </ResourceListRow.Group>
  {/snippet}
</Story>

<Story name="WithoutSelection">
  {#snippet template()}
    <ResourceListRow.Group class="w-3xl!">
      <ResourceListRow.Root>
        <ResourceListRow.Main>
          <Item.Title class="ui:font-semibold">fastlearner.io</Item.Title>
          <p class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm ui:text-amber-800 dark:ui:text-amber-200">
            <ClockIcon class="ui:size-3.5 ui:shrink-0" />
            Expires 16 Jan 2027
          </p>
        </ResourceListRow.Main>
        <ResourceListRow.End>
          <span class="ui:text-muted-foreground ui:text-sm">Jan 16</span>
          <Avatar.Root class="ui:size-8">
            <Avatar.Image src="https://github.com/shadcn.png" alt="" />
            <Avatar.Fallback>CN</Avatar.Fallback>
          </Avatar.Root>
        </ResourceListRow.End>
        <Item.Actions>
          <Button variant="ghost" size="icon" class="ui:size-8" aria-label="Row actions">
            <MoreHorizontalIcon class="ui:size-4" />
          </Button>
        </Item.Actions>
      </ResourceListRow.Root>
      <ResourceListRow.Root>
        <ResourceListRow.Main>
          <Item.Title class="ui:font-semibold">macusaone.com</Item.Title>
          <p class="ui:text-muted-foreground ui:text-sm">Third Party</p>
        </ResourceListRow.Main>
        <ResourceListRow.End>
          <span class="ui:text-muted-foreground ui:text-sm">11/20/25</span>
          <Avatar.Root class="ui:size-8">
            <Avatar.Image src="https://github.com/maxleiter.png" alt="" />
            <Avatar.Fallback>ML</Avatar.Fallback>
          </Avatar.Root>
        </ResourceListRow.End>
        <Item.Actions>
          <Button variant="ghost" size="icon" class="ui:size-8" aria-label="Row actions">
            <MoreHorizontalIcon class="ui:size-4" />
          </Button>
        </Item.Actions>
      </ResourceListRow.Root>
    </ResourceListRow.Group>
  {/snippet}
</Story>

<Story name="Density">
  {#snippet template()}
    <div class="ui:text-muted-foreground ui:mb-3 ui:w-full ui:max-w-md ui:text-xs">
      Use rows inside <code>ResourceListGroup</code>. Optional <code>density=&quot;toolbar&quot;</code> shortens the row
      for a “select all” header.
    </div>
    <ResourceListRow.Group class="max-w-md">
      <ResourceListRow.Root density="default">
        <ResourceListRow.Main>
          <span class="ui:text-sm ui:font-medium">density=&quot;default&quot;</span>
        </ResourceListRow.Main>
      </ResourceListRow.Root>
      <ResourceListRow.Root density="toolbar">
        <ResourceListRow.Main>
          <span class="ui:text-sm ui:font-medium">density=&quot;toolbar&quot;</span>
        </ResourceListRow.Main>
      </ResourceListRow.Root>
    </ResourceListRow.Group>
  {/snippet}
</Story>

<Story name="DeploymentStyle">
  {#snippet template()}
    <ResourceListRow.Group class="w-5xl">
      <ResourceListRow.Root align="start" class="ui:py-3">
        <ResourceListRow.Main class="ui:max-w-[140px]">
          <span class="ui:font-mono ui:text-sm ui:font-semibold">2CSQFANmQ</span>
          <button
            type="button"
            class="ui:text-primary ui:w-fit ui:text-left ui:text-xs ui:underline ui:underline-offset-2"
          >
            Preview
          </button>
        </ResourceListRow.Main>
        <div class="ui:flex ui:min-w-0 ui:shrink-0 ui:items-center ui:gap-2 ui:px-2">
          <span class="ui:bg-destructive ui:size-2 ui:shrink-0 ui:rounded-full" aria-hidden="true"></span>
          <div class="ui:flex ui:min-w-0 ui:flex-col ui:gap-0.5">
            <span class="ui:text-sm ui:font-medium">Error</span>
            <span class="ui:text-muted-foreground ui:text-xs">3s</span>
          </div>
        </div>
        <div class="ui:flex ui:shrink-0 ui:items-center ui:gap-2 ui:px-2">
          <span class="ui:flex ui:size-6 ui:items-center ui:justify-center ui:rounded-full ui:bg-blue-600/15">
            <span class="ui:size-2 ui:rounded-full ui:bg-blue-600"></span>
          </span>
          <span class="ui:text-sm">cio-com</span>
        </div>
        <div class="ui:min-w-0 ui:flex-1 ui:px-2">
          <p class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm">
            <GitBranchIcon class="ui:text-muted-foreground ui:size-3.5 ui:shrink-0" />
            <span class="ui:truncate">release-v2/debug-course</span>
          </p>
          <p class="ui:text-muted-foreground ui:flex ui:items-center ui:gap-1.5 ui:truncate ui:text-xs">
            <GitCommitHorizontalIcon class="ui:size-3.5 ui:shrink-0" />
            <span class="ui:truncate">b00bf14 fix: move org id into the inv…</span>
          </p>
        </div>
        <ResourceListRow.End class="ui:flex-col ui:items-end ui:gap-1 ui:self-start">
          <span class="ui:text-muted-foreground ui:text-xs">Mar 30</span>
          <span class="ui:text-muted-foreground ui:text-xs">by Chifez</span>
          <Avatar.Root class="ui:size-6">
            <Avatar.Image src="https://github.com/shadcn.png" alt="" />
            <Avatar.Fallback>C</Avatar.Fallback>
          </Avatar.Root>
        </ResourceListRow.End>
      </ResourceListRow.Root>
      <ResourceListRow.Root align="start" class="ui:py-3">
        <ResourceListRow.Main class="ui:max-w-[140px]">
          <span class="ui:font-mono ui:text-sm ui:font-semibold">AiS1LEGci</span>
          <button
            type="button"
            class="ui:text-primary ui:w-fit ui:text-left ui:text-xs ui:underline ui:underline-offset-2"
          >
            Preview
          </button>
        </ResourceListRow.Main>
        <div class="ui:flex ui:min-w-0 ui:shrink-0 ui:items-center ui:gap-2 ui:px-2">
          <span class="ui:bg-destructive ui:size-2 ui:shrink-0 ui:rounded-full" aria-hidden="true"></span>
          <div class="ui:flex ui:min-w-0 ui:flex-col ui:gap-0.5">
            <span class="ui:text-sm ui:font-medium">Error</span>
            <span class="ui:text-muted-foreground ui:text-xs">8s</span>
          </div>
        </div>
        <div class="ui:flex ui:shrink-0 ui:items-center ui:gap-2 ui:px-2">
          <span class="ui:flex ui:size-6 ui:items-center ui:justify-center ui:rounded-full ui:bg-blue-600/15">
            <span class="ui:size-2 ui:rounded-full ui:bg-blue-600"></span>
          </span>
          <span class="ui:text-sm">cio-docs</span>
        </div>
        <div class="ui:min-w-0 ui:flex-1 ui:px-2">
          <p class="ui:flex ui:items-center ui:gap-1.5 ui:text-sm">
            <GitBranchIcon class="ui:text-muted-foreground ui:size-3.5 ui:shrink-0" />
            <span class="ui:truncate">feat/release-v2</span>
          </p>
          <p class="ui:text-muted-foreground ui:flex ui:items-center ui:gap-1.5 ui:truncate ui:text-xs">
            <GitCommitHorizontalIcon class="ui:size-3.5 ui:shrink-0" />
            <span class="ui:truncate">a1b2c3d docs: update API reference</span>
          </p>
        </div>
        <ResourceListRow.End class="ui:flex-col ui:items-end ui:gap-1 ui:self-start">
          <span class="ui:text-muted-foreground ui:text-xs">Mar 29</span>
          <span class="ui:text-muted-foreground ui:text-xs">by rotimi-best</span>
          <Avatar.Root class="ui:size-6">
            <Avatar.Image src="https://github.com/maxleiter.png" alt="" />
            <Avatar.Fallback>R</Avatar.Fallback>
          </Avatar.Root>
        </ResourceListRow.End>
      </ResourceListRow.Root>
    </ResourceListRow.Group>
  {/snippet}
</Story>
