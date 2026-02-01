<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import BookIcon from '@lucide/svelte/icons/book';
  import GraduationCapIcon from '@lucide/svelte/icons/graduation-cap';
  import UsersIcon from '@lucide/svelte/icons/users';
  import SearchIcon from '@lucide/svelte/icons/search';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import MoreHorizontalIcon from '@lucide/svelte/icons/more-horizontal';
  import FolderCodeIcon from '@lucide/svelte/icons/folder-code';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import ShareIcon from '@lucide/svelte/icons/share';
  import ArchiveIcon from '@lucide/svelte/icons/archive';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';

  import * as Page from '@cio/ui/base/page';
  import * as ButtonGroup from '@cio/ui/base/button-group';
  import * as Empty from '@cio/ui/base/empty';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as InputGroup from '@cio/ui/base/input-group';
  import { Button } from '@cio/ui/base/button';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Page',
    component: Page.Root,
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
    <Page.Root class="h-4xl w-4xl">
      <Page.Header>
        <Page.HeaderContent>
          <Page.Title>Courses</Page.Title>
          <Page.Subtitle>Manage and organize your course offerings.</Page.Subtitle>
        </Page.HeaderContent>
        <Page.Action>
          <Button variant="default">
            <PlusIcon />
            New Course
          </Button>
          <Button variant="outline">
            Visit Site
            <ArrowUpRightIcon />
          </Button>
        </Page.Action>
      </Page.Header>
      <Page.Body>
        {#snippet child()}
          <Empty.Root class="border border-dashed">
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
                <Button>
                  <PlusIcon />
                  Create Course
                </Button>
                <Button variant="outline">Import Course</Button>
              </div>
            </Empty.Content>
          </Empty.Root>
        {/snippet}
      </Page.Body>
    </Page.Root>
  {/snippet}
</Story>

<Story name="Courses">
  {#snippet template()}
    <Page.Root>
      <Page.Header>
        <Page.HeaderContent>
          <Page.Title>Courses</Page.Title>
          <Page.Subtitle>Manage and organize your course offerings.</Page.Subtitle>
        </Page.HeaderContent>
        <Page.Action>
          <Button>
            <PlusIcon />
            New Course
          </Button>
        </Page.Action>
      </Page.Header>
      <Page.Body>
        <Page.BodyHeader align="right">
          <ButtonGroup.Root>
            <InputGroup.Root>
              <InputGroup.Input placeholder="Search courses..." />
              <InputGroup.Addon>
                <SearchIcon />
              </InputGroup.Addon>
            </InputGroup.Root>
            <ButtonGroup.Root>
              <Button variant="outline">
                <FilterIcon />
                Filter
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button {...props} variant="outline" class="ps-2!">
                      <ChevronDownIcon />
                    </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="[--radius:1rem]">
                  <DropdownMenu.Group>
                    <DropdownMenu.Item>
                      <DownloadIcon />
                      Export Courses
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <ShareIcon />
                      Share Courses
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <ArchiveIcon />
                      Archive Selected
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                  <DropdownMenu.Separator />
                  <DropdownMenu.Group>
                    <DropdownMenu.Item variant="destructive">
                      <TrashIcon />
                      Delete Selected
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </ButtonGroup.Root>
          </ButtonGroup.Root>
        </Page.BodyHeader>
        {#snippet child()}
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
                <Button>
                  <PlusIcon />
                  Create Course
                </Button>
                <Button variant="outline">Import Course</Button>
              </div>
            </Empty.Content>
          </Empty.Root>
        {/snippet}
      </Page.Body>
    </Page.Root>
  {/snippet}
</Story>

<Story name="Classes">
  {#snippet template()}
    <Page.Root>
      <Page.Header>
        <Page.HeaderContent>
          <Page.Title>Classes</Page.Title>
          <Page.Subtitle>View and manage your class schedules and sessions.</Page.Subtitle>
        </Page.HeaderContent>
        <Page.Action>
          <ButtonGroup.Root>
            <ButtonGroup.Root>
              <Input placeholder="Search classes..." />
              <Button variant="outline" size="icon" aria-label="Search">
                <SearchIcon />
              </Button>
            </ButtonGroup.Root>
            <ButtonGroup.Root>
              <Button variant="outline">
                <FilterIcon />
                Filter
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button {...props} variant="outline" class="ps-2!">
                      <ChevronDownIcon />
                    </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="[--radius:1rem]">
                  <DropdownMenu.Group>
                    <DropdownMenu.Item>
                      <DownloadIcon />
                      Export Schedule
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <SettingsIcon />
                      Class Settings
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </ButtonGroup.Root>
          </ButtonGroup.Root>
          <Button>
            <PlusIcon />
            New Class
          </Button>
        </Page.Action>
      </Page.Header>
      <Page.Body>
        {#snippet child()}
          <Empty.Root>
            <Empty.Header>
              <Empty.Media variant="icon">
                <GraduationCapIcon />
              </Empty.Media>
              <Empty.Title>No Classes Scheduled</Empty.Title>
              <Empty.Description>
                Create your first class session to start teaching. Classes help you organize your teaching schedule.
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <Button>
                <PlusIcon />
                Create Class
              </Button>
            </Empty.Content>
          </Empty.Root>
        {/snippet}
      </Page.Body>
    </Page.Root>
  {/snippet}
</Story>

<Story name="Students">
  {#snippet template()}
    <Page.Root>
      <Page.Header>
        <Page.HeaderContent>
          <Page.Title>Students</Page.Title>
          <Page.Subtitle>Manage student enrollments and track progress.</Page.Subtitle>
        </Page.HeaderContent>
        <Page.Action>
          <ButtonGroup.Root>
            <ButtonGroup.Root>
              <Input placeholder="Search students..." />
              <Button variant="outline" size="icon" aria-label="Search">
                <SearchIcon />
              </Button>
            </ButtonGroup.Root>
            <ButtonGroup.Root>
              <Button variant="outline">
                <FilterIcon />
                Filter
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button {...props} variant="outline" class="ps-2!">
                      <ChevronDownIcon />
                    </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="[--radius:1rem]">
                  <DropdownMenu.Group>
                    <DropdownMenu.Item>
                      <DownloadIcon />
                      Export Student List
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <FileTextIcon />
                      Generate Report
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <ShareIcon />
                      Share Student List
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </ButtonGroup.Root>
          </ButtonGroup.Root>
          <Button>
            <UserPlusIcon />
            Add Student
          </Button>
        </Page.Action>
      </Page.Header>
      <Page.Body>
        {#snippet child()}
          <Empty.Root>
            <Empty.Header>
              <Empty.Media variant="icon">
                <UsersIcon />
              </Empty.Media>
              <Empty.Title>No Students Enrolled</Empty.Title>
              <Empty.Description>
                Start by adding students to your courses. You can invite them via email or import from a CSV file.
              </Empty.Description>
            </Empty.Header>
            <Empty.Content>
              <div class="flex gap-2">
                <Button>
                  <UserPlusIcon />
                  Add Student
                </Button>
                <Button variant="outline">Import CSV</Button>
              </div>
            </Empty.Content>
          </Empty.Root>
        {/snippet}
      </Page.Body>
    </Page.Root>
  {/snippet}
</Story>

<Story name="Header Only">
  {#snippet template()}
    <Page.Root>
      <Page.Header>
        <Page.HeaderContent>
          <Page.Title>Analytics Dashboard</Page.Title>
          <Page.Subtitle>View and analyze your learning management data.</Page.Subtitle>
        </Page.HeaderContent>
        <Page.Action>
          <ButtonGroup.Root>
            <ButtonGroup.Root>
              <Input placeholder="Search..." />
              <Button variant="outline" size="icon" aria-label="Search">
                <SearchIcon />
              </Button>
            </ButtonGroup.Root>
            <ButtonGroup.Root>
              <Button variant="outline">
                <DownloadIcon />
                Export
              </Button>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger>
                  {#snippet child({ props })}
                    <Button {...props} variant="outline" class="ps-2!">
                      <ChevronDownIcon />
                    </Button>
                  {/snippet}
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end" class="[--radius:1rem]">
                  <DropdownMenu.Group>
                    <DropdownMenu.Item>
                      <ShareIcon />
                      Share Dashboard
                    </DropdownMenu.Item>
                    <DropdownMenu.Item>
                      <SettingsIcon />
                      Dashboard Settings
                    </DropdownMenu.Item>
                  </DropdownMenu.Group>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </ButtonGroup.Root>
          </ButtonGroup.Root>
        </Page.Action>
      </Page.Header>
    </Page.Root>
  {/snippet}
</Story>
