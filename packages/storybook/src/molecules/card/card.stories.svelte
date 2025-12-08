<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import * as Card from '@cio/ui/base/card';
  import { Button } from '@cio/ui/base/button';
  import { Label } from '@cio/ui/base/label';
  import { Input } from '@cio/ui/base/input';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Card',
    component: Card.Root,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let email = $state('');
  let password = $state('');
</script>

<Story name="Default">
  {#snippet template()}
    <Card.Root class="w-full max-w-sm">
      <Card.Header>
        <Card.Title>Login to your account</Card.Title>
        <Card.Description>Enter your email below to login to your account</Card.Description>
        <Card.Action>
          <Button variant="link">Sign Up</Button>
        </Card.Action>
      </Card.Header>
      <Card.Content>
        <form>
          <div class="ui:flex ui:flex-col ui:gap-6">
            <div class="ui:grid ui:gap-2">
              <Label for="email">Email</Label>
              <Input id="email" type="email" bind:value={email} placeholder="m@example.com" required />
            </div>
            <div class="ui:grid ui:gap-2">
              <div class="ui:flex ui:items-center">
                <Label for="password">Password</Label>
                <a href="/" class="ui:ms-auto ui:inline-block ui:text-sm ui:underline-offset-4 hover:ui:underline">
                  Forgot your password?
                </a>
              </div>
              <Input id="password" type="password" bind:value={password} required />
            </div>
          </div>
        </form>
      </Card.Content>
      <Card.Footer class="ui:flex-col ui:gap-2">
        <Button type="submit" class="ui:w-full">Login</Button>
        <Button variant="outline" class="ui:w-full">Login with Google</Button>
      </Card.Footer>
    </Card.Root>
  {/snippet}
</Story>

<Story name="Simple">
  {#snippet template()}
    <Card.Root class="ui:w-full ui:max-w-sm">
      <Card.Header>
        <Card.Title>Card Title</Card.Title>
        <Card.Description>Card description goes here.</Card.Description>
      </Card.Header>
      <Card.Content>
        <p>Card content goes here.</p>
      </Card.Content>
    </Card.Root>
  {/snippet}
</Story>

<Story name="With Footer">
  {#snippet template()}
    <Card.Root class="ui:w-full ui:max-w-sm">
      <Card.Header>
        <Card.Title>Card Title</Card.Title>
        <Card.Description>Card description goes here.</Card.Description>
      </Card.Header>
      <Card.Content>
        <p>Card content goes here.</p>
      </Card.Content>
      <Card.Footer>
        <Button size="sm">Action</Button>
      </Card.Footer>
    </Card.Root>
  {/snippet}
</Story>

<Story name="With Action">
  {#snippet template()}
    <Card.Root class="ui:w-full ui:max-w-sm">
      <Card.Header>
        <Card.Title>Card Title</Card.Title>
        <Card.Description>Card description goes here.</Card.Description>
        <Card.Action>
          <Button variant="ghost" size="sm">More</Button>
        </Card.Action>
      </Card.Header>
      <Card.Content>
        <p>Card content goes here.</p>
      </Card.Content>
    </Card.Root>
  {/snippet}
</Story>

<Story name="No Header">
  {#snippet template()}
    <Card.Root class="ui:w-full ui:max-w-sm">
      <Card.Content>
        <p>Card content without header.</p>
      </Card.Content>
      <Card.Footer>
        <Button size="sm">Action</Button>
      </Card.Footer>
    </Card.Root>
  {/snippet}
</Story>
