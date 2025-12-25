<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Accordion from '@cio/ui/base/accordion';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Atom/Accordion',
    component: Accordion.Root,
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
    <Accordion.Root type="single" class="w-[450px]">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>Is it accessible?</Accordion.Trigger>
        <Accordion.Content>
          Yes. It adheres to the WAI-ARIA design pattern and includes proper keyboard navigation support.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>Is it styled?</Accordion.Trigger>
        <Accordion.Content>
          Yes. It comes with default styles that matches the other components' aesthetic.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-3">
        <Accordion.Trigger>Is it animated?</Accordion.Trigger>
        <Accordion.Content>Yes. It's animated by default, but you can disable it if you prefer.</Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  {/snippet}
</Story>

<Story name="Single Expanded">
  {#snippet template()}
    <Accordion.Root type="single" class="w-[450px]">
      <Accordion.Item value="item-1">
        <Accordion.Trigger>What is ClassroomIO?</Accordion.Trigger>
        <Accordion.Content>
          ClassroomIO is an open-source learning management system designed to help educators create and manage online
          courses efficiently.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-2">
        <Accordion.Trigger>How do I get started?</Accordion.Trigger>
        <Accordion.Content>
          You can get started by creating an account, setting up your organization, and creating your first course. Our
          documentation provides step-by-step guides.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="item-3">
        <Accordion.Trigger>Is it free to use?</Accordion.Trigger>
        <Accordion.Content>
          Yes! ClassroomIO is open-source and free to use. We also offer premium features for organizations that need
          additional capabilities.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  {/snippet}
</Story>

<Story name="Multiple Expanded">
  {#snippet template()}
    <Accordion.Root type="multiple" class="w-[450px]">
      <Accordion.Item value="features">
        <Accordion.Trigger>Features</Accordion.Trigger>
        <Accordion.Content>
          <ul class="list-disc space-y-1 pl-4">
            <li>Course management</li>
            <li>Student analytics</li>
            <li>AI-powered grading</li>
            <li>Custom certificates</li>
          </ul>
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="pricing">
        <Accordion.Trigger>Pricing</Accordion.Trigger>
        <Accordion.Content>
          We offer flexible pricing plans for individuals, teams, and enterprises. Contact us for more information.
        </Accordion.Content>
      </Accordion.Item>
      <Accordion.Item value="support">
        <Accordion.Trigger>Support</Accordion.Trigger>
        <Accordion.Content>
          We provide email support, documentation, and community forums to help you succeed.
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  {/snippet}
</Story>
