<script>
  import { Button } from '@cio/ui/base/button';
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { isFormValid } from '$lib/utils/is-form-valid';
  import { submitForm } from '$lib/utils/submit-form';
  import { Success } from '$lib/components';

  let name = '';
  let email = '';
  let title = '';
  let description = '';

  let isLoading = false;
  let errorMessage = '';
  let sent = false;

  const handleClick = async () => {
    const data = { name, email, title, description };

    if (!isFormValid(data)) {
      errorMessage = 'Please fill out all required fields.';
      return;
    }

    isLoading = true;

    const formData = {
      title: `[FEEDBACK] ${title}`,
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
  };
</script>

<div>
  {#if sent}
    <Success />
  {:else}
    <div class="w-full my-10 space-y-5">
      <Field.Group>
        <div class="flex flex-col md:flex-row gap-10">
          <Field.Field class="w-full">
            <Field.Label for="feedback-name">Your Name</Field.Label>
            <Input id="feedback-name" bind:value={name} required />
          </Field.Field>
          <Field.Field class="w-full">
            <Field.Label for="feedback-email">Your Email</Field.Label>
            <Input id="feedback-email" type="email" bind:value={email} required />
          </Field.Field>
        </div>
        <Field.Field>
          <Field.Label for="feedback-subject">Subject</Field.Label>
          <Input id="feedback-subject" bind:value={title} required />
        </Field.Field>
        <Field.Field>
          <Field.Label for="feedback-message">Message</Field.Label>
          <Textarea id="feedback-message" bind:value={description} required />
        </Field.Field>
        {#if !!errorMessage}
          <Field.Field>
            <Field.Error>{errorMessage}</Field.Error>
          </Field.Field>
        {/if}
      </Field.Group>
      <Button
        onclick={handleClick}
        disabled={isLoading}
        loading={isLoading}
      >
        Submit Feedback
      </Button>
    </div>
  {/if}
</div>
