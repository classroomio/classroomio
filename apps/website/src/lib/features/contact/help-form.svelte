<script>
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { isFormValid } from '$lib/utils/is-form-valid';
  import { submitForm } from '$lib/utils/submit-form';
  import { Success } from '$lib/components';

  let name = $state('');
  let email = $state('');
  let title = $state('');
  let description = $state('');

  let isLoading = $state(false);
  let errorMessage = $state('');
  let sent = $state(false);

  async function handleClick() {
    const data = { name, email, title, description };

    if (!isFormValid(data)) {
      errorMessage = 'Please fill out all required fields.';
      return;
    }

    isLoading = true;

    const formData = {
      title: `[HELP] ${title}`,
      description: `My name is ${JSON.stringify(name)}, email is ${JSON.stringify(
        email
      )}. \n\n${JSON.stringify(description)}.`,
      replyTo: email
    };

    try {
      await submitForm(formData);
      sent = true;
    } catch (error) {
      console.log(error);
    } finally {
      isLoading = false;
    }
  }
</script>

<div>
  {#if sent}
    <Success />
  {:else}
    <div class="my-10 w-full space-y-5">
      <Field.Group>
        <div class="flex flex-col gap-10 md:flex-row">
          <Field.Field class="w-full">
            <Field.Label for="help-name">Your Name</Field.Label>
            <Input id="help-name" bind:value={name} required />
          </Field.Field>
          <Field.Field class="w-full">
            <Field.Label for="help-email">Your Email</Field.Label>
            <Input id="help-email" type="email" bind:value={email} required />
          </Field.Field>
        </div>
        <Field.Field>
          <Field.Label for="help-subject">Subject</Field.Label>
          <Input id="help-subject" bind:value={title} required />
        </Field.Field>
        <Field.Field>
          <Field.Label for="help-message">Message</Field.Label>
          <Textarea id="help-message" bind:value={description} required />
        </Field.Field>
        {#if !!errorMessage}
          <Field.Field>
            <Field.Error>{errorMessage}</Field.Error>
          </Field.Field>
        {/if}
      </Field.Group>
      <Button onclick={handleClick} disabled={isLoading} loading={isLoading}>Submit Request</Button>
    </div>
  {/if}
</div>
