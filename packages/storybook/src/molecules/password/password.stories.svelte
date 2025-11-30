<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Password } from '@cio/ui/custom/password';
  import * as Field from '@cio/ui/base/field';

  const { Story } = defineMeta({
    title: 'Molecules/Password',
    component: Password,
    parameters: {
      layout: 'centered',
      controls: {
        include: ['placeholder', 'disabled', 'class']
      }
    },
    tags: ['autodocs']
  });

  let password = $state('');
  let passwordWithError = $state('');
  let passwordDisabled = $state('password123');
</script>

<Story name="Default">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <Password bind:value={password} placeholder="Enter password" />
      <p class="ui:text-sm ui:text-muted-foreground">Value: {password || '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="With Field">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <Field.Field>
        <Field.Label for="password">Password</Field.Label>
        <Field.Content>
          <Password id="password" bind:value={password} placeholder="Enter your password" />
        </Field.Content>
        <Field.Description>Password must be more than 8 characters</Field.Description>
      </Field.Field>
    </div>
  {/snippet}
</Story>

<Story name="With Error">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <Field.Field>
        <Field.Label for="password-error">Password</Field.Label>
        <Field.Content>
          <Password
            id="password-error"
            bind:value={passwordWithError}
            placeholder="Enter your password"
            aria-invalid="true"
          />
        </Field.Content>
        <Field.Error>Password is required</Field.Error>
      </Field.Field>
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <Field.Field>
        <Field.Label for="password-disabled">Password</Field.Label>
        <Field.Content>
          <Password
            id="password-disabled"
            bind:value={passwordDisabled}
            placeholder="Enter your password"
            disabled={true}
          />
        </Field.Content>
      </Field.Field>
    </div>
  {/snippet}
</Story>

<Story name="Custom Labels">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <Password
        bind:value={password}
        placeholder="Enter your password"
        showPasswordTooltip="Click to show password"
        hidePasswordTooltip="Click to hide password"
        showPasswordAriaLabel="Show password"
        hidePasswordAriaLabel="Hide password"
      />
    </div>
  {/snippet}
</Story>

