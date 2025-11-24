<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FolderCodeIcon from '@lucide/svelte/icons/folder-code';
  import CloudIcon from '@lucide/svelte/icons/cloud';
  import BellIcon from '@lucide/svelte/icons/bell';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  import * as Empty from '@cio/ui/base/empty';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Button } from '@cio/ui/base/button';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Empty',
    component: Empty.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="icon">
          <FolderCodeIcon />
        </Empty.Media>
        <Empty.Title>No Courses Yet</Empty.Title>
        <Empty.Description>
          You haven't created any courses yet. Get started by creating your first course.
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <div class="flex gap-2">
          <Button>Create Course</Button>
          <Button variant="outline">Import Project</Button>
        </div>
      </Empty.Content>
      <Button variant="link" class="ui:text-muted-foreground" size="sm">
        <a href="#/">
          Learn More <ArrowUpRightIcon class="inline" />
        </a>
      </Button>
    </Empty.Root>
  {/snippet}
</Story>

<Story name="Outline">
  {#snippet template()}
    <Empty.Root class="border border-dashed">
      <Empty.Header>
        <Empty.Media variant="icon">
          <CloudIcon />
        </Empty.Media>
        <Empty.Title>Cloud Storage Empty</Empty.Title>
        <Empty.Description>Upload files to your cloud storage to access them anywhere.</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" size="sm">Upload Files</Button>
      </Empty.Content>
    </Empty.Root>
  {/snippet}
</Story>

<Story name="Background">
  {#snippet template()}
    <Empty.Root class="ui:from-muted/50 ui:to-background ui:h-full ui:bg-gradient-to-b ui:from-30%">
      <Empty.Header>
        <Empty.Media variant="icon">
          <BellIcon />
        </Empty.Media>
        <Empty.Title>No Notifications</Empty.Title>
        <Empty.Description>You're all caught up. New notifications will appear here.</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button variant="outline" size="sm">
          <RefreshCcwIcon />
          Refresh
        </Button>
      </Empty.Content>
    </Empty.Root>
  {/snippet}
</Story>

<Story name="Avatar">
  {#snippet template()}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media variant="default">
          <Avatar.Root class="size-12">
            <Avatar.Image src="https://github.com/shadcn.png" class="grayscale" />
            <Avatar.Fallback>LR</Avatar.Fallback>
          </Avatar.Root>
        </Empty.Media>
        <Empty.Title>User Offline</Empty.Title>
        <Empty.Description>
          This user is currently offline. You can leave a message to notify them or try again later.
        </Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button size="sm">Leave Message</Button>
      </Empty.Content>
    </Empty.Root>
  {/snippet}
</Story>

<Story name="Avatar Groups">
  {#snippet template()}
    <Empty.Root>
      <Empty.Header>
        <Empty.Media>
          <div class="*:ring-background flex -space-x-2 *:size-12 *:ring-2 *:grayscale">
            <Avatar.Root>
              <Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
              <Avatar.Fallback>CN</Avatar.Fallback>
            </Avatar.Root>
            <Avatar.Root>
              <Avatar.Image src="https://github.com/maxleiter.png" alt="@maxleiter" />
              <Avatar.Fallback>LR</Avatar.Fallback>
            </Avatar.Root>
            <Avatar.Root>
              <Avatar.Image src="https://github.com/evilrabbit.png" alt="@evilrabbit" />
              <Avatar.Fallback>ER</Avatar.Fallback>
            </Avatar.Root>
          </div>
        </Empty.Media>
        <Empty.Title>No Team Members</Empty.Title>
        <Empty.Description>Invite your team to collaborate on this project.</Empty.Description>
      </Empty.Header>
      <Empty.Content>
        <Button size="sm">
          <PlusIcon />
          Invite Members
        </Button>
      </Empty.Content>
    </Empty.Root>
  {/snippet}
</Story>
