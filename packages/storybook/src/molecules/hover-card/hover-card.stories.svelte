<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import CalendarDaysIcon from '@lucide/svelte/icons/calendar-days';
  import UsersIcon from '@lucide/svelte/icons/users';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';

  import * as HoverCard from '@cio/ui/base/hover-card';
  import * as Avatar from '@cio/ui/base/avatar';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/HoverCard',
    component: HoverCard.Root,
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
    <HoverCard.Root>
      <HoverCard.Trigger>Introduction to Web Development</HoverCard.Trigger>
      <HoverCard.Content>Learn the fundamentals of modern web development with hands-on projects.</HoverCard.Content>
    </HoverCard.Root>
  {/snippet}
</Story>

<Story name="Instructor Profile">
  {#snippet template()}
    <HoverCard.Root>
      <HoverCard.Trigger
        href="/instructors/sarah-johnson"
        class="ui:rounded-sm ui:underline-offset-4 ui:hover:underline ui:focus-visible:outline-2 ui:focus-visible:outline-offset-8 ui:focus-visible:outline-black ui:flex ui:items-center ui:gap-2"
      >
        <Avatar.Root>
          <Avatar.Image src="https://github.com/shadcn.png" />
          <Avatar.Fallback>SJ</Avatar.Fallback>
        </Avatar.Root> @sarah-johnson
      </HoverCard.Trigger>
      <HoverCard.Content class="w-80">
        <div class="flex justify-between space-x-4">
          <Avatar.Root>
            <Avatar.Image src="https://github.com/shadcn.png" />
            <Avatar.Fallback>SJ</Avatar.Fallback>
          </Avatar.Root>
          <div class="space-y-1">
            <h4 class="text-sm font-semibold">Sarah Johnson</h4>
            <p class="text-sm">Senior Full-Stack Developer & Instructor</p>
            <div class="flex items-center pt-2">
              <CalendarDaysIcon class="me-2 size-4 opacity-70" />
              <span class="text-muted-foreground text-xs">Teaching since January 2020</span>
            </div>
          </div>
        </div>
      </HoverCard.Content>
    </HoverCard.Root>
  {/snippet}
</Story>

<Story name="Course Preview">
  {#snippet template()}
    <HoverCard.Root>
      <HoverCard.Trigger href="/courses/advanced-react" class="text-primary underline-offset-4 hover:underline">
        Advanced React Patterns
      </HoverCard.Trigger>
      <HoverCard.Content class="w-64">
        <div class="space-y-2">
          <h4 class="text-sm font-semibold">Advanced React Patterns</h4>
          <p class="text-muted-foreground text-sm">
            Master advanced React concepts including hooks, context, performance optimization, and modern patterns used
            in production applications.
          </p>
        </div>
      </HoverCard.Content>
    </HoverCard.Root>
  {/snippet}
</Story>

<Story name="Student Profile">
  {#snippet template()}
    <HoverCard.Root>
      <HoverCard.Trigger class="text-primary ui:flex ui:items-center ui:gap-2 underline-offset-4 hover:underline">
        <Avatar.Root>
          <Avatar.Image src="https://github.com/rotimi-best.png" />
          <Avatar.Fallback>AM</Avatar.Fallback>
        </Avatar.Root>
        @rotimi-best
      </HoverCard.Trigger>
      <HoverCard.Content class="w-80">
        <div class="space-y-3">
          <div class="flex items-center gap-3">
            <Avatar.Root>
              <Avatar.Image src="https://github.com/rotimi-best.png" />
              <Avatar.Fallback>AM</Avatar.Fallback>
            </Avatar.Root>
            <div>
              <h4 class="text-sm font-semibold">Alex Martinez</h4>
              <p class="text-muted-foreground text-xs">Student</p>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-muted-foreground flex items-center gap-2 text-xs">
              <BookOpenIcon class="size-4" />
              <span>5 courses enrolled</span>
            </div>
            <div class="text-muted-foreground flex items-center gap-2 text-xs">
              <UsersIcon class="size-4" />
              <span>Active since March 2024</span>
            </div>
          </div>
        </div>
      </HoverCard.Content>
    </HoverCard.Root>
  {/snippet}
</Story>
