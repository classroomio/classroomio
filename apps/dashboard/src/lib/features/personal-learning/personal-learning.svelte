<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Label from '@cio/ui/base/label';
  import { Textarea } from '@cio/ui/base/textarea';
  import * as Page from '@cio/ui/base/page';
  import { InputField } from '@cio/ui/custom/input-field';
  import { ScrollToTop } from '@cio/ui/custom/scroll-to-top';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import { t } from '$lib/utils/functions/translations';

  import { personalLearningApi } from './api/personal-learning.svelte';
  import {
    beginAccept,
    buildAcceptPayload,
    createPersonalLearningState,
    isSourceRetryableFailure,
    receiveAnswer,
    selectDailyMinutes,
    selectStudyDays,
    submitQuestion,
    visibleSessionIndexes
  } from './personal-learning-state';
  import type { DailyMinutes, PersonalLearningMessage, StudyDays } from './personal-learning-state';
  import type { PersonalLearningJourney, PersonalLearningJourneySession } from './utils/types';

  let state = $state(createPersonalLearningState());
  let journey = $state<PersonalLearningJourney | null>(null);
  let journeyId = $state<string | null>(null);
  let question = $state('');
  let sourceUrl = $state('');
  let consentChecked = $state(false);
  let isLoadingJourney = $state(false);
  let isRetrying = $state(false);
  let pollHandle = $state<ReturnType<typeof setInterval> | undefined>();
  let isPolling = false;

  const daysChoices: StudyDays[] = [1, 7, 30];
  const minuteChoices: DailyMinutes[] = [30, 60, 120];
  const firstSession = $derived(state.sessions.find(({ sessionIndex }) => sessionIndex === 1));
  const lessonPath = $derived(
    journey && firstSession?.status === 'ready' && firstSession.lessonId
      ? `/courses/${journey.courseId}/lessons/${firstSession.lessonId}`
      : null
  );
  const canChatAboutLesson = $derived(Boolean(journeyId && firstSession?.status === 'ready'));

  function statusLabel(status: string) {
    if (status === 'ready') return t.get('personalLearning.session.status.ready');
    if (status === 'failed') return t.get('personalLearning.session.status.failed');
    if (status === 'generating') return t.get('personalLearning.session.status.generating');
    if (status === 'sourcing') return t.get('personalLearning.session.status.sourcing');
    return t.get('personalLearning.session.status.queued');
  }

  function syncJourney(result: {
    journey: PersonalLearningJourney;
    messages: PersonalLearningMessage[];
    sessions: PersonalLearningJourneySession[];
  }) {
    journey = result.journey;
    journeyId = result.journey.id;
    state = {
      ...state,
      conversationId: result.journey.conversationId,
      messages: result.messages,
      sessions: result.sessions
    };
  }

  function stopPolling() {
    if (pollHandle) clearInterval(pollHandle);

    pollHandle = undefined;
  }

  async function refreshJourney() {
    if (!journeyId || isPolling) return;

    isPolling = true;
    const result = await personalLearningApi.getJourney(journeyId);
    isPolling = false;
    if (!result) return;

    syncJourney(result);
    if (result.sessions[0]?.status === 'ready' || result.sessions[0]?.status === 'failed') stopPolling();
  }

  function startPolling() {
    if (pollHandle) return;

    pollHandle = setInterval(() => void refreshJourney(), 2500);
  }

  async function loadJourney(id: string) {
    isLoadingJourney = true;
    const result = await personalLearningApi.getJourney(id);
    isLoadingJourney = false;
    if (!result) return;

    syncJourney(result);
    if (['queued', 'sourcing', 'generating'].includes(result.sessions[0]?.status ?? '')) startPolling();
  }

  function updateJourneyUrl(id: string) {
    const nextUrl = new URL(page.url);
    nextUrl.searchParams.set('journey', id);
    void goto(`${nextUrl.pathname}${nextUrl.search}`, { replaceState: true, noScroll: true });
  }

  async function sendQuestion() {
    const message = question.trim();
    const previousMessages = state.messages;
    const nextState = submitQuestion(state, message);
    if (nextState === state) return;

    consentChecked = false;
    state = nextState;
    question = '';
    const answer =
      canChatAboutLesson && journeyId
        ? await personalLearningApi.askAboutLesson(journeyId, message)
        : await personalLearningApi.ask(message, state.conversationId);

    if (!answer) {
      state = { ...state, isAnswering: false };
      return;
    }

    state = receiveAnswer(state, {
      answer: answer.answer,
      conversationId: 'conversationId' in answer ? answer.conversationId : undefined,
      offer: 'offer' in answer ? (answer.offer ?? null) : null
    });
    if ('messages' in answer) state = { ...state, messages: answer.messages };
  }

  async function acceptOffer() {
    const consent = buildAcceptPayload(state, consentChecked);
    if (!consent) return;

    state = beginAccept(state, consentChecked);
    const result = await personalLearningApi.accept({
      ...consent,
      language: typeof navigator === 'undefined' ? 'en' : navigator.language
    });
    if (!result) {
      state = { ...state, isAccepting: false };
      return;
    }

    journey = result.journey;
    journeyId = result.journey.id;
    consentChecked = false;
    state = {
      ...state,
      offer: null,
      isAccepting: false,
      sessions: [
        {
          sessionIndex: result.session.sessionIndex,
          status: result.session.status,
          lessonId: result.session.lessonId,
          failureCode: result.session.failureCode
        }
      ]
    };
    updateJourneyUrl(result.journey.id);
    startPolling();
  }

  async function dismissCurrentOffer() {
    if (!state.offer || !(await personalLearningApi.dismiss(state.offer.id))) return;

    consentChecked = false;
    state = { ...state, offer: null };
  }

  async function retryWithSource() {
    if (!journeyId || !sourceUrl.trim() || isRetrying) return;

    isRetrying = true;
    const result = await personalLearningApi.retryWithSources(journeyId, [sourceUrl.trim()]);
    isRetrying = false;
    if (!result) return;

    sourceUrl = '';
    state = { ...state, sessions: [result.session] };
    startPolling();
  }

  function updateStudyDays(days: StudyDays) {
    if (state.selectedStudyDays !== days) consentChecked = false;
    state = selectStudyDays(state, days);
  }

  function updateDailyMinutes(minutes: DailyMinutes) {
    if (state.dailyMinutes !== minutes) consentChecked = false;
    state = selectDailyMinutes(state, minutes);
  }

  onMount(() => {
    const existingJourneyId = page.url.searchParams.get('journey');
    if (existingJourneyId) void loadJourney(existingJourneyId);

    return stopPolling;
  });
</script>

<svelte:head>
  <title>{$t('personalLearning.title')} - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-4xl px-4">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('personalLearning.title')}</Page.Title>
      <Page.Subtitle>{$t('personalLearning.subtitle')}</Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body class="space-y-6 pb-24">
    {#snippet child()}
      <section
        class="ui:bg-card rounded-2xl border p-5 shadow-sm sm:p-7"
        aria-label={$t('personalLearning.chat.heading')}
      >
        <div class="mb-5 flex items-start gap-3">
          <div class="ui:bg-primary/10 ui:text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
            <BookOpenIcon size={19} />
          </div>
          <div>
            <h2 class="text-lg font-semibold">{$t('personalLearning.chat.heading')}</h2>
            <p class="ui:text-muted-foreground mt-1 text-sm">{$t('personalLearning.chat.description')}</p>
          </div>
        </div>

        <div class="space-y-3" aria-live="polite">
          {#each state.messages as message, index (`${index}-${message.role}`)}
            <div class="flex {message.role === 'user' ? 'justify-end' : 'justify-start'}">
              <p
                class="max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 whitespace-pre-wrap {message.role === 'user'
                  ? 'ui:bg-primary ui:text-primary-foreground'
                  : 'ui:bg-muted/70'}"
              >
                {message.content}
              </p>
            </div>
          {/each}
          {#if state.isAnswering}
            <p class="ui:text-muted-foreground flex items-center gap-2 text-sm">
              <LoaderCircleIcon size={16} class="animate-spin" />
              {$t('personalLearning.chat.thinking')}
            </p>
          {/if}
        </div>

        {#if state.offer && !journeyId}
          <div class="ui:bg-muted/30 mt-5 rounded-xl border p-4 sm:p-5" data-testid="personal-learning-offer">
            <div class="flex items-center gap-2 font-semibold">
              <BookOpenIcon size={17} class="ui:text-primary" />
              {$t('personalLearning.offer.heading')}
            </div>
            <p class="ui:text-muted-foreground mt-2 text-sm">{state.offer.reason}</p>

            <div class="mt-5 space-y-4">
              <div class="space-y-2">
                <Label.Root for="personal-learning-goal">{$t('personalLearning.offer.goal_label')}</Label.Root>
                <TextareaField
                  id="personal-learning-goal"
                  bind:value={state.goalDraft}
                  maxlength={2000}
                  rows={2}
                  testId="personal-learning-goal"
                  oninput={() => (consentChecked = false)}
                />
              </div>

              <fieldset>
                <legend class="mb-2 text-sm font-medium">{$t('personalLearning.offer.days_label')}</legend>
                <div class="grid grid-cols-3 gap-2">
                  {#each daysChoices as days (days)}
                    <Button
                      type="button"
                      testId={`personal-learning-days-${days}`}
                      variant={state.selectedStudyDays === days ? 'default' : 'outline'}
                      class="h-auto min-h-12 flex-col gap-0 py-2"
                      onclick={() => updateStudyDays(days)}
                    >
                      <span class="text-base font-semibold">{days}</span>
                      <span class="text-xs font-normal">{$t('personalLearning.offer.days_unit')}</span>
                    </Button>
                  {/each}
                </div>
              </fieldset>

              <fieldset>
                <legend class="mb-2 text-sm font-medium">{$t('personalLearning.offer.minutes_label')}</legend>
                <div class="grid grid-cols-3 gap-2">
                  {#each minuteChoices as minutes (minutes)}
                    <Button
                      type="button"
                      testId={`personal-learning-minutes-${minutes}`}
                      variant={state.dailyMinutes === minutes ? 'default' : 'outline'}
                      onclick={() => updateDailyMinutes(minutes)}
                    >
                      {minutes}
                      {$t('personalLearning.offer.minutes_unit')}
                    </Button>
                  {/each}
                </div>
              </fieldset>

              <div class="ui:bg-background flex items-start gap-2 rounded-lg border p-3">
                <Checkbox
                  bind:checked={consentChecked}
                  id="personal-learning-consent"
                  data-testid="personal-learning-consent"
                />
                <Label.Root for="personal-learning-consent" class="cursor-pointer text-sm leading-5">
                  {$t('personalLearning.offer.consent')}
                </Label.Root>
              </div>
              <p class="ui:text-muted-foreground text-xs">{$t('personalLearning.offer.disclaimer')}</p>

              <div class="flex flex-wrap gap-2">
                <Button
                  onclick={acceptOffer}
                  testId="personal-learning-accept"
                  disabled={!consentChecked || state.isAccepting || state.isAnswering}
                  loading={state.isAccepting}
                >
                  {$t('personalLearning.offer.accept')}
                </Button>
                <Button
                  variant="outline"
                  testId="personal-learning-dismiss"
                  onclick={dismissCurrentOffer}
                  disabled={state.isAccepting}
                >
                  {$t('personalLearning.offer.dismiss')}
                </Button>
              </div>
            </div>
          </div>
        {/if}

        {#if !journeyId || canChatAboutLesson}
          <form
            class="mt-5 flex flex-col gap-2 sm:flex-row sm:items-end"
            onsubmit={(event) => {
              event.preventDefault();
              void sendQuestion();
            }}
          >
            <Textarea
              bind:value={question}
              rows={2}
              maxlength={4000}
              data-testid="personal-learning-question"
              placeholder={canChatAboutLesson
                ? $t('personalLearning.tutor.placeholder')
                : $t('personalLearning.chat.placeholder')}
              aria-label={canChatAboutLesson
                ? $t('personalLearning.tutor.placeholder')
                : $t('personalLearning.chat.placeholder')}
              disabled={state.isAnswering || (!journeyId && state.isAccepting)}
              class="min-h-12 resize-y"
            />
            <Button
              type="submit"
              testId="personal-learning-send"
              disabled={!question.trim() || state.isAnswering || (!journeyId && state.isAccepting)}
            >
              {$t('personalLearning.chat.send')}
            </Button>
          </form>
        {/if}
      </section>

      {#if isLoadingJourney}
        <div class="ui:text-muted-foreground flex items-center gap-2 rounded-xl border p-4 text-sm" role="status">
          <LoaderCircleIcon size={17} class="animate-spin" />
          {$t('personalLearning.session.loading')}
        </div>
      {/if}

      {#if journeyId && journey}
        <section class="ui:bg-card rounded-2xl border p-5 shadow-sm sm:p-7" data-testid="personal-learning-journey">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                class="ui:text-primary text-xs font-semibold tracking-wide uppercase"
                data-testid="personal-learning-private-label"
              >
                {$t('personalLearning.course.private_label')}
              </p>
              <h2 class="mt-1 text-xl font-semibold">{journey.goal}</h2>
              <p class="ui:text-muted-foreground mt-1 text-sm">
                {$t('personalLearning.course.plan_summary', {
                  days: journey.targetStudyDays,
                  minutes: journey.dailyMinutes
                })}
              </p>
            </div>
            {#if lessonPath}
              <Button href={lessonPath} testId="personal-learning-open-lesson">
                <ExternalLinkIcon size={16} />
                {$t('personalLearning.session.open_lesson')}
              </Button>
            {/if}
          </div>

          {#if visibleSessionIndexes(state).length > 0}
            <div class="mt-5 space-y-3">
              {#each visibleSessionIndexes(state) as sessionIndex (sessionIndex)}
                {@const session = state.sessions.find((item) => item.sessionIndex === sessionIndex)}
                {#if session}
                  <div
                    class="ui:bg-muted/30 rounded-xl border p-4"
                    data-testid={`personal-learning-session-${sessionIndex}`}
                  >
                    <div class="flex items-center justify-between gap-3">
                      <h3 class="font-medium">
                        {$t('personalLearning.session.title', { number: session.sessionIndex })}
                      </h3>
                      <span
                        class="ui:bg-background ui:text-muted-foreground rounded-full px-3 py-1 text-xs"
                        role="status"
                      >
                        {statusLabel(session.status)}
                      </span>
                    </div>
                    {#if ['queued', 'sourcing', 'generating'].includes(session.status)}
                      <p class="ui:text-muted-foreground mt-2 flex items-center gap-2 text-sm">
                        <LoaderCircleIcon size={15} class="animate-spin" />
                        {$t('personalLearning.session.progress')}
                      </p>
                    {:else if session.status === 'failed'}
                      <p class="ui:text-muted-foreground mt-2 text-sm">
                        {#if session.failureCode === 'LEARNING_SOURCE_QUOTA_EXCEEDED'}
                          {$t('personalLearning.session.source_quota_copy')}
                        {:else}
                          {$t('personalLearning.session.failed_copy')}
                        {/if}
                      </p>
                      {#if isSourceRetryableFailure(session.failureCode)}
                        <div class="mt-4 flex flex-col gap-2 sm:flex-row">
                          <InputField
                            bind:value={sourceUrl}
                            type="url"
                            name="personal-learning-source-url"
                            label={$t('personalLearning.session.source_url_label')}
                            placeholder={$t('personalLearning.session.source_url_placeholder')}
                            testId="personal-learning-source-url"
                            isDisabled={isRetrying}
                          />
                          <Button
                            onclick={retryWithSource}
                            testId="personal-learning-retry"
                            disabled={!sourceUrl.trim() || isRetrying}
                            loading={isRetrying}
                          >
                            {$t('personalLearning.session.retry')}
                          </Button>
                        </div>
                      {/if}
                    {:else if lessonPath}
                      <p class="ui:text-muted-foreground mt-2 text-sm">{$t('personalLearning.session.ready_copy')}</p>
                    {/if}
                  </div>
                {/if}
              {/each}
            </div>
          {:else}
            <div
              class="ui:bg-muted/30 ui:text-muted-foreground mt-5 flex items-center gap-2 rounded-xl border p-4 text-sm"
              role="status"
            >
              <LoaderCircleIcon size={16} class="animate-spin" />
              {$t('personalLearning.session.progress')}
            </div>
          {/if}
        </section>
      {/if}

      {#if personalLearningApi.error}
        <p
          class="ui:border-destructive/30 ui:bg-destructive/5 ui:text-destructive rounded-lg border p-3 text-sm"
          role="alert"
        >
          {$t('personalLearning.errors.request')}
        </p>
      {/if}
    {/snippet}
  </Page.Body>
</Page.Root>

<ScrollToTop label={$t('common.scroll_to_top')} />
