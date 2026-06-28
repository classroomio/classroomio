<script lang="ts">
  import { lessonApi, courseApi } from '$features/course/api';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import InfoIcon from '@lucide/svelte/icons/info';
  import { toast } from '@cio/ui/base/sonner';
  import { classroomio } from '$lib/utils/services/api';
  import { t } from '$lib/utils/functions/translations';
  import { getBrowserTimezone, instantToZonedWallClock, zonedWallClockToInstant } from '$lib/utils/functions/date';
  import { getVideoTitle, type LessonVideo } from './video/video-card-utils';

  type LessonCompletionPolicy = 'manual' | 'video_watch' | 'none';

  // ── Live session (Zoom link + scheduled time + timezone) ──────────────────
  const isLiveClass = $derived(courseApi.course?.type === 'LIVE_CLASS');
  const timezoneOptions = (() => {
    try {
      return (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? [];
    } catch {
      return [];
    }
  })();

  let sessionCallUrl = $state('');
  let sessionWallClock = $state('');
  let sessionTimezone = $state(getBrowserTimezone());
  let sessionInitializedFor = $state<string | null>(null);
  let isSavingSession = $state(false);
  let confirmOpen = $state(false);

  $effect(() => {
    const lesson = lessonApi.lesson;
    if (!lesson || sessionInitializedFor === lesson.id) return;

    const tz = courseApi.course?.metadata?.sessionTimezone || getBrowserTimezone();
    sessionTimezone = tz;
    sessionCallUrl = lesson.callUrl ?? '';
    sessionWallClock = instantToZonedWallClock(lesson.lessonAt, tz);
    sessionInitializedFor = lesson.id;
  });

  const hadPriorSession = $derived(Boolean(lessonApi.lesson?.lessonAt && lessonApi.lesson?.callUrl));

  function computeNewInstant(): string {
    return sessionWallClock ? zonedWallClockToInstant(sessionWallClock, sessionTimezone) : '';
  }

  function sessionChanged(): boolean {
    const currentTz = courseApi.course?.metadata?.sessionTimezone || getBrowserTimezone();

    return (
      sessionCallUrl !== (lessonApi.lesson?.callUrl ?? '') ||
      computeNewInstant() !== (lessonApi.lesson?.lessonAt ?? '') ||
      sessionTimezone !== currentTz
    );
  }

  async function persistSession() {
    const courseId = courseApi.course?.id;
    const lessonId = lessonApi.lesson?.id;
    if (!courseId || !lessonId) return;

    isSavingSession = true;
    try {
      await lessonApi.update(courseId, lessonId, {
        callUrl: sessionCallUrl || undefined,
        lessonAt: computeNewInstant() || undefined
      });

      const currentTz = courseApi.course?.metadata?.sessionTimezone || '';
      if (sessionTimezone && sessionTimezone !== currentTz) {
        await courseApi.update(courseId, {
          metadata: { ...(courseApi.course?.metadata ?? {}), sessionTimezone }
        });
      }

      sessionInitializedFor = null; // re-sync baselines from refreshed lesson/course
    } finally {
      isSavingSession = false;
    }
  }

  async function notifySessionUpdate() {
    const courseId = courseApi.course?.id;
    const lessonId = lessonApi.lesson?.id;
    if (!courseId || !lessonId) return;

    try {
      await classroomio.course[':courseId'].lesson[':lessonId']['notify-session-update'].$post({
        param: { courseId, lessonId }
      });
      toast.success(t.get('course.navItem.lessons.session.notified'));
    } catch {
      toast.error(t.get('course.navItem.lessons.session.notify_failed'));
    }
  }

  async function handleSaveSession() {
    if (!sessionChanged()) return;

    if (hadPriorSession) {
      confirmOpen = true;
      return;
    }

    await persistSession();
    toast.success(t.get('course.navItem.lessons.session.saved'));
  }

  async function confirmSaveAndNotify() {
    confirmOpen = false;
    await persistSession();
    await notifySessionUpdate();
  }

  const completionPolicy = $derived(lessonApi.lesson?.completionPolicy ?? 'manual');
  const videoWatchThreshold = $derived(lessonApi.lesson?.videoWatchThreshold ?? 95);
  const videos = $derived(lessonApi.lesson?.videos ?? []);

  const enforceableVideos = $derived(
    videos
      .map((video, index) => ({ video, index }))
      .filter(({ video }) => video.type === 'upload' && Boolean(video.assetId))
  );

  const showWatchVideosError = $derived(
    completionPolicy === 'video_watch' &&
      enforceableVideos.length > 0 &&
      !enforceableVideos.some(({ video }) => video.watchEnforced)
  );

  function policyTriggerLabel(policy: LessonCompletionPolicy): string {
    if (policy === 'video_watch') return t.get('course.navItem.lessons.completion_policy.video_watch_label');
    if (policy === 'none') return t.get('course.navItem.lessons.completion_policy.none_label');

    return t.get('course.navItem.lessons.completion_policy.manual_label');
  }

  function handleCompletionPolicyChange(value: string) {
    if (value !== 'manual' && value !== 'video_watch' && value !== 'none') return;

    lessonApi.updateLessonState('completionPolicy', value);
  }

  function handleVideoWatchThresholdChange(event: Event) {
    const parsed = Number((event.currentTarget as HTMLInputElement).value);
    if (Number.isNaN(parsed)) return;

    lessonApi.updateLessonState('videoWatchThreshold', parsed);
  }

  function toggleVideoWatchEnforced(index: number, checked: boolean) {
    const currentVideos = lessonApi.lesson?.videos;
    if (!currentVideos) return;

    const updatedVideos = currentVideos.map((video, videoIndex) =>
      videoIndex === index ? { ...video, watchEnforced: checked } : video
    );

    lessonApi.updateLessonState('videos', updatedVideos);
  }

  function isVideoWatchEnforced(video: LessonVideo): boolean {
    return Boolean(video.watchEnforced);
  }
</script>

<div class="p-4">
  <Field.Group class="w-full max-w-xl">
    {#if isLiveClass}
      <Field.Set>
        <Field.Legend>{$t('course.navItem.lessons.session.heading')}</Field.Legend>
        <Field.Description>{$t('course.navItem.lessons.session.intro')}</Field.Description>

        <Field.Field>
          <InputField
            type="url"
            label={$t('course.navItem.lessons.session.link_label')}
            placeholder="https://zoom.us/j/..."
            value={sessionCallUrl}
            onInputChange={(e) => (sessionCallUrl = (e.currentTarget as HTMLInputElement).value)}
          />
        </Field.Field>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
          <Field.Field class="sm:flex-1">
            <Field.Label for="session-datetime">{$t('course.navItem.lessons.session.datetime_label')}</Field.Label>
            <input
              id="session-datetime"
              type="datetime-local"
              class="ui:border-input ui:bg-background ui:text-foreground ui:shadow-xs ui:flex ui:h-9 ui:w-full ui:rounded-md ui:border ui:px-3 ui:py-1 ui:text-sm ui:outline-none"
              value={sessionWallClock}
              oninput={(e) => (sessionWallClock = (e.currentTarget as HTMLInputElement).value)}
            />
          </Field.Field>

          <Field.Field class="sm:flex-1">
            <Field.Label for="session-timezone">{$t('course.navItem.lessons.session.timezone_label')}</Field.Label>
            <select
              id="session-timezone"
              class="ui:border-input ui:bg-background ui:text-foreground ui:shadow-xs ui:flex ui:h-9 ui:w-full ui:rounded-md ui:border ui:px-3 ui:py-1 ui:text-sm ui:outline-none"
              value={sessionTimezone}
              onchange={(e) => (sessionTimezone = (e.currentTarget as HTMLSelectElement).value)}
            >
              {#each timezoneOptions as tz (tz)}
                <option value={tz}>{tz}</option>
              {/each}
            </select>
            <Field.Description>{$t('course.navItem.lessons.session.timezone_helper')}</Field.Description>
          </Field.Field>
        </div>

        <div>
          <Button size="sm" onclick={handleSaveSession} loading={isSavingSession}>
            {$t('course.navItem.lessons.session.save')}
          </Button>
        </div>
      </Field.Set>

      <Field.Separator />
    {/if}

    <Field.Set>
      <Field.Legend>{$t('course.navItem.lessons.settings.progression.heading')}</Field.Legend>
      <Field.Description>{$t('course.navItem.lessons.settings.progression.intro')}</Field.Description>
      <Field.Description class="ui:text-muted-foreground">
        {$t('course.navItem.lessons.settings.progression.students_only_note')}
      </Field.Description>

      <Field.Group>
        <Field.Field>
          <div class="flex items-center gap-1.5">
            <Field.Label for="lesson-completion-policy">
              {$t('course.navItem.lessons.completion_policy.label')}
            </Field.Label>
            <Tooltip.Provider>
              <Tooltip.Root>
                <Tooltip.Trigger aria-label={$t('course.navItem.lessons.settings.progression.option_guide_heading')}>
                  <InfoIcon size={14} class="ui:text-muted-foreground" />
                </Tooltip.Trigger>
                <Tooltip.Content side="right" class="max-w-xs">
                  <ul class="list-disc space-y-1 pl-4 text-xs">
                    <li>
                      <span class="font-medium">{$t('course.navItem.lessons.completion_policy.manual_label')}:</span>
                      {$t('course.navItem.lessons.completion_policy.manual_description')}
                    </li>
                    <li>
                      <span class="font-medium"
                        >{$t('course.navItem.lessons.completion_policy.video_watch_label')}:</span
                      >
                      {$t('course.navItem.lessons.completion_policy.video_watch_description')}
                    </li>
                    <li>
                      <span class="font-medium">{$t('course.navItem.lessons.completion_policy.none_label')}:</span>
                      {$t('course.navItem.lessons.completion_policy.none_description')}
                    </li>
                  </ul>
                </Tooltip.Content>
              </Tooltip.Root>
            </Tooltip.Provider>
          </div>
          <Select.Root type="single" value={completionPolicy} onValueChange={handleCompletionPolicyChange}>
            <Select.Trigger id="lesson-completion-policy" class="w-full max-w-xs">
              {policyTriggerLabel(completionPolicy)}
            </Select.Trigger>
            <Select.Content class="max-w-sm">
              <Select.Item value="manual">
                <div class="flex flex-col items-start gap-0.5">
                  <span>{$t('course.navItem.lessons.completion_policy.manual_label')}</span>
                  <span class="ui:text-muted-foreground text-xs">
                    {$t('course.navItem.lessons.completion_policy.manual_description')}
                  </span>
                </div>
              </Select.Item>
              <Select.Item value="video_watch">
                <div class="flex flex-col items-start gap-0.5">
                  <span>{$t('course.navItem.lessons.completion_policy.video_watch_label')}</span>
                  <span class="ui:text-muted-foreground text-xs">
                    {$t('course.navItem.lessons.completion_policy.video_watch_description')}
                  </span>
                </div>
              </Select.Item>
              <Select.Item value="none">
                <div class="flex flex-col items-start gap-0.5">
                  <span>{$t('course.navItem.lessons.completion_policy.none_label')}</span>
                  <span class="ui:text-muted-foreground text-xs">
                    {$t('course.navItem.lessons.completion_policy.none_description')}
                  </span>
                </div>
              </Select.Item>
            </Select.Content>
          </Select.Root>
        </Field.Field>

        {#if completionPolicy === 'video_watch'}
          <Field.Field>
            <InputField
              type="number"
              label={$t('course.navItem.lessons.completion_policy.watch_threshold')}
              value={String(videoWatchThreshold)}
              onInputChange={handleVideoWatchThresholdChange}
            />
          </Field.Field>

          <Field.Field>
            <Field.Label>{$t('course.navItem.lessons.settings.progression.watch_videos_heading')}</Field.Label>
            <Field.Description
              >{$t('course.navItem.lessons.settings.progression.watch_videos_helper')}</Field.Description
            >

            {#if enforceableVideos.length === 0}
              <Field.Description
                >{$t('course.navItem.lessons.settings.progression.watch_videos_empty')}</Field.Description
              >
            {:else}
              <Field.Group class="gap-3">
                {#each enforceableVideos as { video, index } (video.assetId ?? index)}
                  <Field.Field orientation="horizontal">
                    <Checkbox
                      id={`watch-enforced-${video.assetId}`}
                      checked={isVideoWatchEnforced(video)}
                      onCheckedChange={(checked) => toggleVideoWatchEnforced(index, checked === true)}
                    />
                    <Field.Label for={`watch-enforced-${video.assetId}`} class="font-normal">
                      {getVideoTitle(video, index)}
                    </Field.Label>
                  </Field.Field>
                {/each}
              </Field.Group>
            {/if}

            {#if showWatchVideosError}
              <Field.Error>{$t('course.navItem.lessons.settings.progression.watch_videos_required')}</Field.Error>
            {/if}
          </Field.Field>
        {/if}
      </Field.Group>
    </Field.Set>
  </Field.Group>
</div>

<Dialog.Root bind:open={confirmOpen}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.session.confirm_title')}</Dialog.Title>
      <Dialog.Description>{$t('course.navItem.lessons.session.confirm_body')}</Dialog.Description>
    </Dialog.Header>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (confirmOpen = false)} disabled={isSavingSession}>
        {$t('course.navItem.lessons.session.confirm_cancel')}
      </Button>
      <Button onclick={confirmSaveAndNotify} loading={isSavingSession}>
        {$t('course.navItem.lessons.session.confirm_save')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
