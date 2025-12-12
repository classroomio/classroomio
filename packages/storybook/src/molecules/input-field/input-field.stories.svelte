<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { InputField } from '@cio/ui/custom/input-field';
  import * as Field from '@cio/ui/base/field';
  import { Password } from '@cio/ui/custom/password';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/InputField',
    component: InputField,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let studentName = $state('');
  let studentEmail = $state('');
  let courseTitle = $state('');
  let password = $state('');
  let enrollmentDate = $state('');
  let coursePrice = $state('');
  let invalidEmail = $state('invalid-email');
  let disabledValue = $state('john.doe@example.com');
</script>

<Story name="Default">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Student Name"
        placeholder="Enter student's full name"
        bind:value={studentName}
        name="student-name"
      />
      <p class="ui:text-sm ui:text-muted-foreground">Value: {studentName || '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="With Label and Helper">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Student Email"
        placeholder="student@example.com"
        bind:value={studentEmail}
        name="student-email"
        type="email"
        helperMessage="We'll use this email to send course notifications and updates"
      />
    </div>
  {/snippet}
</Story>

<Story name="Required Field">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Course Title"
        placeholder="Introduction to Web Development"
        bind:value={courseTitle}
        name="course-title"
        isRequired={true}
        helperMessage="Enter a descriptive title for your course"
      />
    </div>
  {/snippet}
</Story>

<Story name="Password Field">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <Field.Field>
        <Field.Label for="password">Password</Field.Label>
        <Field.Content>
          <Password id="password" bind:value={password} placeholder="Enter your password" />
          <Field.Description>Must be at least 8 characters long</Field.Description>
        </Field.Content>
      </Field.Field>
      <p class="ui:text-sm ui:text-muted-foreground">Value: {password ? '•'.repeat(password.length) : '(empty)'}</p>
    </div>
  {/snippet}
</Story>

<Story name="With Error">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Student Email"
        placeholder="student@example.com"
        bind:value={invalidEmail}
        name="student-email-error"
        type="email"
        errorMessage="Please enter a valid email address"
      />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Student Email"
        placeholder="student@example.com"
        bind:value={disabledValue}
        name="student-email-disabled"
        type="email"
        isDisabled={true}
        helperMessage="This field cannot be modified"
      />
    </div>
  {/snippet}
</Story>

<Story name="Number Input">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Course Price"
        placeholder="0.00"
        bind:value={coursePrice}
        name="course-price"
        type="number"
        min={0}
        helperMessage="Enter the price in your local currency"
      />
    </div>
  {/snippet}
</Story>

<Story name="Date Input">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Enrollment Date"
        bind:value={enrollmentDate}
        name="enrollment-date"
        type="date"
        helperMessage="Select the date when the student enrolled"
      />
    </div>
  {/snippet}
</Story>

<Story name="Auto Focus">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Course Title"
        placeholder="Introduction to Web Development"
        bind:value={courseTitle}
        name="course-title-autofocus"
        autoFocus={true}
        helperMessage="This field will be automatically focused when the page loads"
      />
    </div>
  {/snippet}
</Story>

<Story name="Custom Styling">
  {#snippet template()}
    <div class="ui:flex ui:flex-col ui:gap-4 ui:w-96">
      <InputField
        label="Student Name"
        placeholder="Enter student's full name"
        bind:value={studentName}
        name="student-name-custom"
        className="ui:border ui:border-primary ui:rounded-lg ui:p-4"
        inputClassName="ui:bg-primary/5"
        labelClassName="ui:font-semibold ui:text-primary"
      />
    </div>
  {/snippet}
</Story>

<Story name="Form Example">
  {#snippet template()}
    <form class="ui:flex ui:flex-col ui:gap-4 ui:w-96" onsubmit={(e) => e.preventDefault()}>
      <InputField
        label="Full Name"
        placeholder="John Doe"
        bind:value={studentName}
        name="full-name"
        isRequired={true}
      />
      <InputField
        label="Email Address"
        placeholder="student@example.com"
        bind:value={studentEmail}
        name="email"
        type="email"
        isRequired={true}
        helperMessage="We'll use this to send course updates"
      />
      <Field.Field>
        <Field.Label for="password-form">Password</Field.Label>
        <Field.Content>
          <Password id="password-form" bind:value={password} placeholder="Enter password" required />
          <Field.Description>Must be at least 8 characters</Field.Description>
        </Field.Content>
      </Field.Field>
      <button
        type="submit"
        class="ui:mt-2 ui:rounded-md ui:bg-primary ui:px-4 ui:py-2 ui:text-primary-foreground ui:hover:bg-primary/90"
      >
        Enroll Student
      </button>
    </form>
  {/snippet}
</Story>
