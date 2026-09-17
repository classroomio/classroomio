<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as NavigationMenu from '@cio/ui/base/navigation-menu';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/NavigationMenu',
    component: NavigationMenu.Root,
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
    <NavigationMenu.Root class="relative">
      <NavigationMenu.List class="flex gap-2">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Getting started</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul class="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
              <li class="row-span-3">
                <NavigationMenu.Link
                  href="/"
                  class="ui:from-muted/50 ui:to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none select-none focus:shadow-md"
                >
                  <div class="mt-4 mb-2 text-lg font-medium">ClassroomIO</div>
                  <p class="ui:text-muted-foreground text-sm leading-tight">
                    A powerful learning management system for creating and managing online courses.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/docs"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Introduction</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Learn how to get started with ClassroomIO.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/docs/installation"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Installation</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    How to install and configure your instance.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/docs/components"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Components</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Explore the available UI components.
                  </p>
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Features</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul class="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              <li>
                <NavigationMenu.Link
                  href="/courses"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Course Management</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Create and organize your courses with ease.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/students"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Student Tracking</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Monitor student progress and performance.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/assessments"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Assessments</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Create quizzes, assignments, and exams.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/analytics"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Analytics</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    View detailed analytics and reports.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/collaboration"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Collaboration</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Enable team collaboration and discussions.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/integrations"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                >
                  <div class="text-sm leading-none font-medium">Integrations</div>
                  <p class="ui:text-muted-foreground line-clamp-2 text-sm leading-snug">
                    Connect with your favorite tools.
                  </p>
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Link href="/docs">Documentation</NavigationMenu.Link>
        </NavigationMenu.Item>
      </NavigationMenu.List>
    </NavigationMenu.Root>
  {/snippet}
</Story>
