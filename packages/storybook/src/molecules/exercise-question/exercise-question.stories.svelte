<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ExerciseQuestion } from '@cio/ui';
  import QuestionTypeModes from './question-type-modes.svelte';
  import {
    CHECKBOX_FIXTURE,
    FILE_UPLOAD_FIXTURE,
    FILL_BLANK_FIXTURE,
    HOTSPOT_FIXTURE,
    LINK_FIXTURE,
    MATCHING_FIXTURE,
    NUMERIC_FIXTURE,
    ORDERING_FIXTURE,
    RADIO_FIXTURE,
    SECTIONED_EXERCISE_FIXTURE,
    SHORT_ANSWER_FIXTURE,
    STAR_FIXTURE,
    TEXTAREA_FIXTURE,
    THUMBS_FIXTURE,
    TRUE_FALSE_FIXTURE,
    VIDEO_RECORDING_FIXTURE,
    WORD_BANK_FIXTURE
  } from './question-fixtures';

  const { Story } = defineMeta({
    title: 'Molecules/ExerciseQuestion',
    component: ExerciseQuestion.QuestionRenderer,
    parameters: {
      layout: 'padded'
    },
    tags: ['autodocs']
  });

  const sectionLabels = { section: 'Section', questions: 'questions', points: 'points' };
  const sectionOverviewLabels = { ...sectionLabels, back: 'Back', beginSection: 'Start section' };
  const autoGroupedSection = {
    ...SECTIONED_EXERCISE_FIXTURE[0],
    id: 'section-auto-grouped',
    title: 'Section 1',
    description: null,
    colorTheme: 'blue' as const
  };
</script>

<Story name="Checkbox">
  {#snippet template()}
    <QuestionTypeModes
      question={CHECKBOX_FIXTURE.question}
      answer={CHECKBOX_FIXTURE.answer}
      wrongAnswer={CHECKBOX_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="Exercise Sections - Section Intro">
  {#snippet template()}
    <div class="ui:max-w-5xl">
      <ExerciseQuestion.SectionOverview
        sectionTitle={SECTIONED_EXERCISE_FIXTURE[0].title}
        sectionDescription={SECTIONED_EXERCISE_FIXTURE[0].description}
        sectionNumber={1}
        totalSections={SECTIONED_EXERCISE_FIXTURE.length}
        questionCount={SECTIONED_EXERCISE_FIXTURE[0].questions.length}
        totalPoints={10}
        colorTheme={SECTIONED_EXERCISE_FIXTURE[0].colorTheme}
        onBegin={() => {}}
        onBack={() => {}}
        labels={sectionOverviewLabels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Exercise Sections - Auto Grouped Existing Questions">
  {#snippet template()}
    <div class="ui:max-w-5xl">
      <ExerciseQuestion.SectionOverview
        sectionTitle={autoGroupedSection.title}
        sectionDescription={autoGroupedSection.description}
        sectionNumber={1}
        totalSections={2}
        questionCount={autoGroupedSection.questions.length}
        totalPoints={10}
        colorTheme={autoGroupedSection.colorTheme}
        onBegin={() => {}}
        onBack={() => {}}
        labels={sectionOverviewLabels}
      />
    </div>
  {/snippet}
</Story>

<Story name="Exercise Sections - Question In Progress">
  {#snippet template()}
    <div class="ui:grid ui:max-w-5xl ui:gap-6 ui:lg:grid-cols-[190px_minmax(0,1fr)]">
      <ExerciseQuestion.SectionNavigationSidebar
        sections={SECTIONED_EXERCISE_FIXTURE.map((section, sectionIndex) => ({
          id: section.id,
          title: section.title,
          isCurrent: sectionIndex === 0,
          questions: section.questions.map((question, questionIndex) => ({
            key: String(question.id),
            label: `Q${questionIndex + 1}`,
            isAnswered: questionIndex === 0,
            isCurrent: sectionIndex === 0 && questionIndex === 1
          }))
        }))}
      />

      <section class="ui:space-y-4">
        <ExerciseQuestion.SectionHeader
          title={SECTIONED_EXERCISE_FIXTURE[0].title}
          description={SECTIONED_EXERCISE_FIXTURE[0].description}
          sectionNumber={1}
          totalSections={SECTIONED_EXERCISE_FIXTURE.length}
          colorTheme={SECTIONED_EXERCISE_FIXTURE[0].colorTheme}
          questionCount={SECTIONED_EXERCISE_FIXTURE[0].questions.length}
          totalPoints={10}
          labels={sectionLabels}
        />

        <ExerciseQuestion.QuestionRenderer
          contract={{
            mode: 'take',
            question: SECTIONED_EXERCISE_FIXTURE[0].questions[1],
            answer: TRUE_FALSE_FIXTURE.answer,
            disabled: false
          }}
        />
      </section>
    </div>
  {/snippet}
</Story>

<Story name="Exercise Sections - Grading View">
  {#snippet template()}
    <div class="ui:max-w-4xl ui:space-y-8">
      {#each SECTIONED_EXERCISE_FIXTURE as section, sectionIndex (section.id)}
        <section class="ui:space-y-4">
          <ExerciseQuestion.SectionHeader
            title={section.title}
            description={section.description}
            sectionNumber={sectionIndex + 1}
            totalSections={SECTIONED_EXERCISE_FIXTURE.length}
            colorTheme={section.colorTheme}
            questionCount={section.questions.length}
            totalPoints={section.questions.length * 5}
            labels={sectionLabels}
          />

          <ExerciseQuestion.QuestionList
            contract={{
              mode: 'review',
              questions: section.questions.map((question, questionIndex) => ({
                ...question,
                title: `${questionIndex + 1}. ${question.title}`
              })),
              answersByKey: {
                'q-radio': RADIO_FIXTURE.answer,
                'q-true-false': TRUE_FALSE_FIXTURE.answer,
                'q-short-answer': SHORT_ANSWER_FIXTURE.answer,
                'q-ordering': ORDERING_FIXTURE.answer
              },
              disabled: true
            }}
            itemClass="ui:mb-4"
          />

          <div class="ui:flex ui:justify-end ui:border-t ui:pt-3 ui:text-sm ui:font-medium">
            Section subtotal: {section.questions.length * 4}/{section.questions.length * 5}
          </div>
        </section>
      {/each}
    </div>
  {/snippet}
</Story>

<Story name="FileUpload">
  {#snippet template()}
    <QuestionTypeModes
      question={FILE_UPLOAD_FIXTURE.question}
      answer={FILE_UPLOAD_FIXTURE.answer}
      wrongAnswer={FILE_UPLOAD_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story
  name="VideoRecording"
  parameters={{
    docs: {
      description: {
        story:
          'Browser-recorded video answer with a circular student recording UI, upload states, retakes, and manual grading metadata.'
      }
    }
  }}
>
  {#snippet template()}
    <QuestionTypeModes
      question={VIDEO_RECORDING_FIXTURE.question}
      answer={VIDEO_RECORDING_FIXTURE.answer}
      viewAnswer={null}
    />
  {/snippet}
</Story>

<Story name="FillBlank">
  {#snippet template()}
    <QuestionTypeModes
      question={FILL_BLANK_FIXTURE.question}
      answer={FILL_BLANK_FIXTURE.answer}
      wrongAnswer={FILL_BLANK_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="WordBank">
  {#snippet template()}
    <QuestionTypeModes
      question={WORD_BANK_FIXTURE.question}
      answer={WORD_BANK_FIXTURE.answer}
      wrongAnswer={WORD_BANK_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story
  name="Hotspot"
  parameters={{
    docs: {
      description: {
        story:
          '**Hidden in the app** – This question type is not shown in the exercise editor dropdown. Still in development.'
      }
    }
  }}
>
  {#snippet template()}
    <div
      class="ui:mb-4 ui:rounded-md ui:border ui:border-amber-500/50 ui:bg-amber-500/10 ui:px-4 ui:py-3 ui:text-sm ui:text-amber-800 ui:dark:text-amber-200"
    >
      <strong>Hidden – still in development.</strong> Not available in the exercise editor.
    </div>
    <QuestionTypeModes
      question={HOTSPOT_FIXTURE.question}
      answer={HOTSPOT_FIXTURE.answer}
      wrongAnswer={HOTSPOT_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="Link">
  {#snippet template()}
    <QuestionTypeModes
      question={LINK_FIXTURE.question}
      answer={LINK_FIXTURE.answer}
      wrongAnswer={LINK_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story
  name="Matching"
  parameters={{
    docs: {
      description: {
        story:
          '**Hidden in the app** – This question type is not shown in the exercise editor dropdown. Still in development.'
      }
    }
  }}
>
  {#snippet template()}
    <div
      class="ui:mb-4 ui:rounded-md ui:border ui:border-amber-500/50 ui:bg-amber-500/10 ui:px-4 ui:py-3 ui:text-sm ui:text-amber-800 ui:dark:text-amber-200"
    >
      <strong>Hidden – still in development.</strong> Not available in the exercise editor.
    </div>
    <QuestionTypeModes
      question={MATCHING_FIXTURE.question}
      answer={MATCHING_FIXTURE.answer}
      wrongAnswer={MATCHING_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="Numeric">
  {#snippet template()}
    <QuestionTypeModes
      question={NUMERIC_FIXTURE.question}
      answer={NUMERIC_FIXTURE.answer}
      wrongAnswer={NUMERIC_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story
  name="Star"
  parameters={{
    docs: {
      description: {
        story: '**Premium in the app** – Gated behind a paid plan in the exercise editor.'
      }
    }
  }}
>
  {#snippet template()}
    <QuestionTypeModes
      question={STAR_FIXTURE.question}
      answer={STAR_FIXTURE.answer}
      wrongAnswer={STAR_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="Ordering">
  {#snippet template()}
    <QuestionTypeModes
      question={ORDERING_FIXTURE.question}
      answer={ORDERING_FIXTURE.answer}
      wrongAnswer={ORDERING_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="Radio">
  {#snippet template()}
    <QuestionTypeModes
      question={RADIO_FIXTURE.question}
      answer={RADIO_FIXTURE.answer}
      wrongAnswer={RADIO_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="ShortAnswer">
  {#snippet template()}
    <QuestionTypeModes
      question={SHORT_ANSWER_FIXTURE.question}
      answer={SHORT_ANSWER_FIXTURE.answer}
      wrongAnswer={SHORT_ANSWER_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="Textarea">
  {#snippet template()}
    <QuestionTypeModes
      question={TEXTAREA_FIXTURE.question}
      answer={TEXTAREA_FIXTURE.answer}
      wrongAnswer={TEXTAREA_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="Thumbs">
  {#snippet template()}
    <QuestionTypeModes
      question={THUMBS_FIXTURE.question}
      answer={THUMBS_FIXTURE.answer}
      wrongAnswer={THUMBS_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>

<Story name="TrueFalse">
  {#snippet template()}
    <QuestionTypeModes
      question={TRUE_FALSE_FIXTURE.question}
      answer={TRUE_FALSE_FIXTURE.answer}
      wrongAnswer={TRUE_FALSE_FIXTURE.wrongAnswer}
    />
  {/snippet}
</Story>
