<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';

  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Textarea } from '@cio/ui/base/textarea';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Select from '@cio/ui/base/select';
  import { Switch } from '@cio/ui/base/switch';
  import * as RadioGroup from '@cio/ui/base/radio-group';

  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/Field',
    component: Field.Field,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  let courseType = $state();
  let assignmentType = $state();
  let notificationPreference = $state('email');
  let deliveryMethod = $state('live-class');

  const courseTypes = [
    { value: 'live-class', label: 'Live Class' },
    { value: 'self-paced', label: 'Self-Paced' },
    { value: 'hybrid', label: 'Hybrid' }
  ];

  const assignmentTypes = [
    { value: 'essay', label: 'Essay' },
    { value: 'quiz', label: 'Quiz' },
    { value: 'project', label: 'Project' },
    { value: 'presentation', label: 'Presentation' }
  ];

  const courseTypeLabel = $derived(courseTypes.find((t) => t.value === courseType)?.label ?? 'Select course type');
</script>

<Story name="Payment Form">
  {#snippet template()}
    <form class="w-lg">
      <Field.Group>
        <Field.Set>
          <Field.Legend>Course Information</Field.Legend>
          <Field.Description>Create a new course for your students</Field.Description>
          <Field.Group>
            <Field.Field>
              <Field.Label for="course-title">Course Title</Field.Label>
              <Input id="course-title" placeholder="Introduction to Web Development" required />
            </Field.Field>
            <Field.Field>
              <Field.Label for="course-description">Description</Field.Label>
              <Textarea
                id="course-description"
                placeholder="A comprehensive course covering HTML, CSS, and JavaScript fundamentals..."
                rows={4}
                class="resize-none"
              />
              <Field.Description>Provide a brief overview of what students will learn</Field.Description>
            </Field.Field>
            <div class="grid grid-cols-2 gap-4">
              <Field.Field>
                <Field.Label for="course-type">Course Type</Field.Label>
                <Select.Root type="single" bind:value={courseType}>
                  <Select.Trigger id="course-type">
                    <span>{courseTypeLabel}</span>
                  </Select.Trigger>
                  <Select.Content>
                    {#each courseTypes as type (type.value)}
                      <Select.Item value={type.value}>{type.label}</Select.Item>
                    {/each}
                  </Select.Content>
                </Select.Root>
              </Field.Field>
            </div>
          </Field.Group>
        </Field.Set>
        <Field.Separator />
        <Field.Set>
          <Field.Legend>Course Settings</Field.Legend>
          <Field.Description>Configure how your course will be delivered and accessed</Field.Description>
          <Field.Group>
            <Field.Field orientation="horizontal">
              <Checkbox id="course-published" checked={false} />
              <Field.Label for="course-published" class="font-normal">Publish course immediately</Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <Checkbox id="course-certificate" checked={true} />
              <Field.Label for="course-certificate" class="font-normal">
                Enable certificate download upon completion
              </Field.Label>
            </Field.Field>
          </Field.Group>
        </Field.Set>
        <Field.Separator />
        <Field.Set>
          <Field.Group>
            <Field.Field>
              <Field.Label for="course-overview">Course Overview</Field.Label>
              <Textarea
                id="course-overview"
                placeholder="Welcome to this amazing course! In this course, you'll learn..."
                class="resize-none"
                rows={3}
              />
              <Field.Description
                >This message will be displayed to students when they first access the course</Field.Description
              >
            </Field.Field>
          </Field.Group>
        </Field.Set>
        <Field.Field orientation="horizontal">
          <Button type="submit">Create Course</Button>
          <Button variant="outline" type="button">Cancel</Button>
        </Field.Field>
      </Field.Group>
    </form>
  {/snippet}
</Story>

<Story name="Basic Usage">
  {#snippet template()}
    <div class="w-lg">
      <Field.Set>
        <Field.Legend>Student Profile</Field.Legend>
        <Field.Description>Update your profile information visible to teachers and classmates</Field.Description>
        <Field.Group>
          <Field.Field>
            <Field.Label for="student-name">Full name</Field.Label>
            <Input id="student-name" autoComplete="off" placeholder="John Doe" />
            <Field.Description
              >This will be displayed on your certificates and course completion records</Field.Description
            >
          </Field.Field>
          <Field.Field>
            <Field.Label for="student-email">Email</Field.Label>
            <Input id="student-email" type="email" autoComplete="off" aria-invalid />
            <Field.Error>This email is already registered. Please use a different email.</Field.Error>
          </Field.Field>
          <Field.Field orientation="horizontal">
            <Checkbox id="email-notifications" checked={true} />
            <Field.Label for="email-notifications">Receive email notifications about course updates</Field.Label>
          </Field.Field>
        </Field.Group>
      </Field.Set>
    </div>
  {/snippet}
</Story>

<Story name="Input">
  {#snippet template()}
    <div class="w-lg">
      <Field.Set>
        <Field.Group>
          <Field.Field>
            <Field.Label for="login-email">Email</Field.Label>
            <Input id="login-email" type="email" placeholder="student@example.com" />
            <Field.Description>Enter the email address associated with your account</Field.Description>
          </Field.Field>
          <Field.Field>
            <Field.Label for="login-password">Password</Field.Label>
            <Field.Description>Must be at least 8 characters long</Field.Description>
            <Input id="login-password" type="password" placeholder="********" />
          </Field.Field>
        </Field.Group>
      </Field.Set>
    </div>
  {/snippet}
</Story>

<Story name="Textarea">
  {#snippet template()}
    <div class="w-lg">
      <Field.Set>
        <Field.Group>
          <Field.Field>
            <Field.Label for="assignment-answer">Assignment Answer</Field.Label>
            <Textarea
              id="assignment-answer"
              placeholder="Write your response here. Be sure to address all parts of the question..."
              rows={8}
            />
            <Field.Description>
              Submit your completed assignment. You can edit your submission before the deadline.
            </Field.Description>
          </Field.Field>
        </Field.Group>
      </Field.Set>
    </div>
  {/snippet}
</Story>

<Story name="Select">
  {#snippet template()}
    <div class="w-lg">
      <Field.Field>
        <Field.Label for="assignment-type">Assignment Type</Field.Label>
        <Select.Root type="single" bind:value={assignmentType}>
          <Select.Trigger id="assignment-type">
            <span>{assignmentType || 'Select assignment type'}</span>
          </Select.Trigger>
          <Select.Content>
            {#each assignmentTypes as type (type.value)}
              <Select.Item value={type.value}>{type.label}</Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
        <Field.Description>Choose the type of assignment you want to create for your students</Field.Description>
      </Field.Field>
    </div>
  {/snippet}
</Story>

<Story name="Field Set">
  {#snippet template()}
    <div class="@container w-lg">
      <!-- <div class="max-w-sm" style="width: 512px;"> -->
      <Field.Set>
        <Field.Legend>Enrollment Information</Field.Legend>
        <Field.Description>Add a new student to your course</Field.Description>
        <Field.Group>
          <Field.Field>
            <Field.Label for="student-email-enroll">Student Email</Field.Label>
            <Input id="student-email-enroll" type="email" placeholder="student@example.com" />
          </Field.Field>
          <div class="flex justify-between gap-4">
            <Field.Field>
              <Field.Label for="enrollment-date">Enrollment Date</Field.Label>
              <Input id="enrollment-date" type="date" />
            </Field.Field>
            <Field.Field>
              <Field.Label for="access-level">Access Level</Field.Label>
              <Select.Root type="single">
                <Select.Trigger id="access-level">
                  <span>Full Access</span>
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="full">Full Access</Select.Item>
                  <Select.Item value="limited">Limited Access</Select.Item>
                  <Select.Item value="readonly">Read Only</Select.Item>
                </Select.Content>
              </Select.Root>
            </Field.Field>
          </div>
        </Field.Group>
      </Field.Set>
    </div>
  {/snippet}
</Story>

<Story name="Checkbox">
  {#snippet template()}
    <div class="w-lg">
      <Field.Group>
        <Field.Set>
          <Field.Legend variant="label">Course Features</Field.Legend>
          <Field.Description>Enable features available to students in this course</Field.Description>
          <Field.Group class="gap-3">
            <Field.Field orientation="horizontal">
              <Checkbox id="course-forum" checked />
              <Field.Label for="course-forum" class="font-normal">Enable course forum</Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <Checkbox id="course-quiz" checked />
              <Field.Label for="course-quiz" class="font-normal">Enable live quizzes</Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <Checkbox id="course-assignments" checked />
              <Field.Label for="course-assignments" class="font-normal">Enable assignments</Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <Checkbox id="course-certificates" />
              <Field.Label for="course-certificates" class="font-normal">Enable certificate generation</Field.Label>
            </Field.Field>
          </Field.Group>
        </Field.Set>
        <Field.Separator />
        <Field.Field orientation="horizontal">
          <Checkbox id="ai-assistance" checked />
          <Field.Content>
            <Field.Label for="ai-assistance">AI-Powered Course Creation</Field.Label>
            <Field.Description>
              Use AI to generate course content, lesson outlines, and assignments from your notes. This feature helps
              you create comprehensive courses faster.
            </Field.Description>
          </Field.Content>
        </Field.Field>
      </Field.Group>
    </div>
  {/snippet}
</Story>

<Story name="Radio">
  {#snippet template()}
    <div class="w-lg">
      <Field.Set>
        <Field.Label>Course Delivery Method</Field.Label>
        <Field.Description>Choose how your course will be delivered to students</Field.Description>
        <RadioGroup.Root bind:value={deliveryMethod}>
          <Field.Field orientation="horizontal">
            <RadioGroup.Item value="live-class" id="type-live" />
            <Field.Label for="type-live" class="font-normal">
              Live Class - Scheduled sessions with real-time interaction
            </Field.Label>
          </Field.Field>
          <Field.Field orientation="horizontal">
            <RadioGroup.Item value="self-paced" id="type-self-paced" />
            <Field.Label for="type-self-paced" class="font-normal">
              Self-Paced - Students learn at their own speed
            </Field.Label>
          </Field.Field>
          <Field.Field orientation="horizontal">
            <RadioGroup.Item value="hybrid" id="type-hybrid" />
            <Field.Label for="type-hybrid" class="font-normal">
              Hybrid - Combination of live sessions and self-paced content
            </Field.Label>
          </Field.Field>
        </RadioGroup.Root>
      </Field.Set>
    </div>
  {/snippet}
</Story>

<Story name="Switch">
  {#snippet template()}
    <div class="w-lg">
      <Field.Field orientation="horizontal">
        <Field.Content>
          <Field.Label for="publish-course">Publish Course</Field.Label>
          <Field.Description>
            Make this course visible to enrolled students. Unpublished courses are only visible to teachers and admins.
          </Field.Description>
        </Field.Content>
        <Switch id="publish-course" />
      </Field.Field>
    </div>
  {/snippet}
</Story>

<Story name="Choice Card">
  {#snippet template()}
    <div class="w-lg">
      <Field.Group>
        <Field.Set>
          <Field.Label for="delivery-method-p8w">Course Delivery Method</Field.Label>
          <Field.Description>Choose how students will access and interact with your course content</Field.Description>
          <RadioGroup.Root bind:value={deliveryMethod}>
            <Field.Label for="live-class-r2h">
              <Field.Field orientation="horizontal">
                <Field.Content>
                  <Field.Title>Live Class</Field.Title>
                  <Field.Description>
                    Scheduled sessions with real-time interaction. Perfect for bootcamps and structured learning
                    programs.
                  </Field.Description>
                </Field.Content>
                <RadioGroup.Item value="live-class" id="live-class-r2h" />
              </Field.Field>
            </Field.Label>
            <Field.Label for="self-paced-z4k">
              <Field.Field orientation="horizontal">
                <Field.Content>
                  <Field.Title>Self-Paced</Field.Title>
                  <Field.Description>
                    Students learn at their own speed. Access all content immediately and complete on their schedule.
                  </Field.Description>
                </Field.Content>
                <RadioGroup.Item value="self-paced" id="self-paced-z4k" />
              </Field.Field>
            </Field.Label>
          </RadioGroup.Root>
        </Field.Set>
      </Field.Group>
    </div>
  {/snippet}
</Story>

<Story name="Field Group">
  {#snippet template()}
    <div class="w-lg">
      <Field.Group>
        <Field.Set>
          <Field.Label>Course Updates</Field.Label>
          <Field.Description>
            Get notified when new lessons, assignments, or announcements are added to your enrolled courses.
          </Field.Description>
          <Field.Group data-slot="checkbox-group">
            <Field.Field orientation="horizontal">
              <Checkbox id="course-updates-email" checked disabled />
              <Field.Label for="course-updates-email" class="font-normal">Email notifications</Field.Label>
            </Field.Field>
          </Field.Group>
        </Field.Set>
        <Field.Separator />
        <Field.Set>
          <Field.Label>Assignment Reminders</Field.Label>
          <Field.Description>
            Get notified about upcoming assignment deadlines and when teachers grade your submissions.
            <a href="#/">Manage preferences</a>
          </Field.Description>
          <Field.Group data-slot="checkbox-group">
            <Field.Field orientation="horizontal">
              <Checkbox id="assignment-reminders-email" />
              <Field.Label for="assignment-reminders-email" class="font-normal">Email notifications</Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal">
              <Checkbox id="assignment-reminders-push" />
              <Field.Label for="assignment-reminders-push" class="font-normal">Push notifications</Field.Label>
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </Field.Group>
    </div>
  {/snippet}
</Story>

<Story name="Responsive Layout">
  {#snippet template()}
    <div class="w-full max-w-4xl">
      <form>
        <Field.Set>
          <Field.Legend>Teacher Profile</Field.Legend>
          <Field.Description>Update your teacher profile information</Field.Description>
          <Field.Separator />
          <Field.Group>
            <Field.Field orientation="responsive">
              <Field.Content>
                <Field.Label for="teacher-name">Name</Field.Label>
                <Field.Description>Your name as it will appear to students</Field.Description>
              </Field.Content>
              <Input id="teacher-name" placeholder="Dr. Jane Smith" required />
            </Field.Field>
            <Field.Separator />
            <Field.Field orientation="responsive">
              <Field.Content>
                <Field.Label for="teacher-bio">Bio</Field.Label>
                <Field.Description>
                  Write a brief bio about your teaching experience and expertise. This will be visible to students.
                </Field.Description>
              </Field.Content>
              <Textarea
                id="teacher-bio"
                placeholder="I'm an experienced educator with 10+ years of teaching web development..."
                required
                class="min-h-[100px] resize-none sm:min-w-[300px]"
              />
            </Field.Field>
            <Field.Separator />
            <Field.Field orientation="responsive">
              <Button type="submit">Save Profile</Button>
              <Button type="button" variant="outline">Cancel</Button>
            </Field.Field>
          </Field.Group>
        </Field.Set>
      </form>
    </div>
  {/snippet}
</Story>

<Story name="Validation and Errors">
  {#snippet template()}
    <div class="w-sm">
      <Field.Set>
        <Field.Group>
          <Field.Field data-invalid>
            <Field.Label for="student-email-invalid">Student Email</Field.Label>
            <Input id="student-email-invalid" type="email" aria-invalid placeholder="invalid-email" />
            <Field.Error>Enter a valid email address to enroll the student.</Field.Error>
          </Field.Field>
          <Field.Field>
            <Field.Label for="student-email-valid">Student Email</Field.Label>
            <Input id="student-email-valid" type="email" placeholder="student@example.com" />
            <Field.Description>This email address is valid and ready for enrollment.</Field.Description>
          </Field.Field>
        </Field.Group>
      </Field.Set>
    </div>
  {/snippet}
</Story>
