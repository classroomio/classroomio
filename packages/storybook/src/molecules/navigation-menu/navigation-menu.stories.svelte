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
    argTypes: {
      value: {
        control: 'text',
        description: 'The controlled value of the active navigation item'
      },
      onValueChange: {
        control: false,
        description: 'Callback function when the active navigation item changes'
      },
      dir: {
        control: 'select',
        options: ['ltr', 'rtl'],
        description: 'The reading direction of the navigation menu'
      },
      orientation: {
        control: 'select',
        options: ['horizontal', 'vertical'],
        description: 'The orientation of the navigation menu'
      },
      viewport: {
        control: 'boolean',
        description: 'Whether to show the viewport component',
        defaultValue: true
      },
      disabled: {
        control: 'boolean',
        description: 'Whether the navigation menu is disabled'
      },
      ref: {
        control: false,
        description: 'The underlying DOM element reference'
      }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <NavigationMenu.Root class="ui:relative">
      <NavigationMenu.List class="ui:flex ui:gap-2">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Getting started</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul class="ui:grid ui:gap-3 ui:p-6 ui:md:w-[400px] ui:lg:w-[500px] ui:lg:grid-cols-[.75fr_1fr]">
              <li class="ui:row-span-3">
                <NavigationMenu.Link
                  href="/"
                  class="ui:from-muted/50 ui:to-muted ui:flex ui:h-full ui:w-full ui:select-none ui:flex-col ui:justify-end ui:rounded-md ui:bg-gradient-to-b ui:p-6 ui:no-underline ui:outline-none ui:focus:shadow-md"
                >
                  <div class="ui:mb-2 ui:mt-4 ui:text-lg ui:font-medium">ClassroomIO</div>
                  <p class="ui:text-muted-foreground ui:text-sm ui:leading-tight">
                    A powerful learning management system for creating and managing online courses.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/docs"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Introduction</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Learn how to get started with ClassroomIO.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/docs/installation"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Installation</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    How to install and configure your instance.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/docs/components"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Components</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
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
            <ul class="ui:grid ui:w-[400px] ui:gap-3 ui:p-4 md:ui:w-[500px] md:ui:grid-cols-2 lg:ui:w-[600px]">
              <li>
                <NavigationMenu.Link
                  href="/courses"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Course Management</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Create and organize your courses with ease.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/students"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Student Tracking</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Monitor student progress and performance.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/assessments"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Assessments</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Create quizzes, assignments, and exams.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/analytics"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Analytics</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    View detailed analytics and reports.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/collaboration"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Collaboration</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Enable team collaboration and discussions.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/integrations"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Integrations</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
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

<Story name="Vertical">
  {#snippet template()}
    <NavigationMenu.Root orientation="vertical" class="ui:relative">
      <NavigationMenu.List class="ui:flex ui:flex-col ui:gap-2">
        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Getting started</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul class="ui:grid ui:w-[300px] ui:gap-3 ui:.p-4">
              <li>
                <NavigationMenu.Link
                  href="/docs"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Introduction</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Learn how to get started.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/docs/installation"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Installation</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    How to install dependencies.
                  </p>
                </NavigationMenu.Link>
              </li>
            </ul>
          </NavigationMenu.Content>
        </NavigationMenu.Item>

        <NavigationMenu.Item>
          <NavigationMenu.Trigger>Components</NavigationMenu.Trigger>
          <NavigationMenu.Content>
            <ul class="ui:grid ui:w-[300px] ui:gap-3 ui:p-4">
              <li>
                <NavigationMenu.Link
                  href="/components/button"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Button</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Interactive button component.
                  </p>
                </NavigationMenu.Link>
              </li>
              <li>
                <NavigationMenu.Link
                  href="/components/input"
                  class="ui:hover:bg-accent ui:hover:text-accent-foreground ui:focus:bg-accent ui:focus:text-accent-foreground ui:block ui:select-none ui:space-y-1 ui:rounded-md ui:p-3 ui:leading-none ui:no-underline ui:outline-none ui:transition-colors"
                >
                  <div class="ui:text-sm ui:font-medium ui:leading-none">Input</div>
                  <p class="ui:text-muted-foreground ui:line-clamp-2 ui:text-sm ui:leading-snug">
                    Text input field component.
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
