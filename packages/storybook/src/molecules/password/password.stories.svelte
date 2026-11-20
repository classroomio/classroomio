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
        include: ['placeholder', 'disabled', 'showStrength', 'showLockIcon', 'strengthLabel', 'class']
      }
    },
    tags: ['autodocs']
  });

  let password = $state('');
  let passwordWithError = $state('');
  let passwordDisabled = $state('password123');
  let strengthPassword = $state('');
</script>

<Story name="Default">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <Password bind:value={password} placeholder="Enter password" />
      <p class="ui:text-muted-foreground text-sm">Value: {password || '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="With Field">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
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
    <div class="flex w-96 flex-col gap-4">
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
    <div class="flex w-96 flex-col gap-4">
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
    <div class="flex w-96 flex-col gap-4">
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

<Story name="With Strength Meter">
  {#snippet template()}
    <div class="flex w-96 flex-col gap-4">
      <Password
        bind:value={strengthPassword}
        placeholder="Enter password"
        showStrength
        strengthLabel="Password strength"
      />
      <p class="ui:text-muted-foreground text-sm">Try 8 characters, then a number, then 12 characters.</p>
    </div>
  {/snippet}
</Story>

<Story name="Without Lock Icon">
  {#snippet template()}
    <div class="w-96">
      <Password
        placeholder="At least 8 characters"
        showLockIcon={false}
        showStrength
        strengthLabel="Password strength"
      />
    </div>
  {/snippet}
</Story>
