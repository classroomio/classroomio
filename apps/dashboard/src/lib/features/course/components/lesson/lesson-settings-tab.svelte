<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { InputField } from '@cio/ui/custom/input-field';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import * as Field from '@cio/ui/base/field';
  import * as Select from '@cio/ui/base/select';
  import { t } from '$lib/utils/functions/translations';
  import { getVideoTitle, isHlsUploadVideo, type LessonVideo } from './video/video-card-utils';

  type LessonCompletionPolicy = 'manual' | 'video_watch' | 'none';

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
    <Field.Set>
      <Field.Legend>{$t('course.navItem.lessons.settings.progression.heading')}</Field.Legend>
      <Field.Description>{$t('course.navItem.lessons.settings.progression.intro')}</Field.Description>
      <Field.Description class="ui:text-muted-foreground">
        {$t('course.navItem.lessons.settings.progression.students_only_note')}
      </Field.Description>

      <Field.Group>
        <Field.Field>
          <Field.Label for="lesson-completion-policy">
            {$t('course.navItem.lessons.completion_policy.label')}
          </Field.Label>
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

        <div class="space-y-2 text-sm">
          <p class="font-medium">{$t('course.navItem.lessons.settings.progression.option_guide_heading')}</p>
          <ul class="ui:text-muted-foreground list-disc space-y-1 pl-5">
            <li>
              <span class="ui:text-foreground font-medium">
                {$t('course.navItem.lessons.completion_policy.manual_label')}:
              </span>
              {$t('course.navItem.lessons.completion_policy.manual_description')}
            </li>
            <li>
              <span class="ui:text-foreground font-medium">
                {$t('course.navItem.lessons.completion_policy.video_watch_label')}:
              </span>
              {$t('course.navItem.lessons.completion_policy.video_watch_description')}
            </li>
            <li>
              <span class="ui:text-foreground font-medium">
                {$t('course.navItem.lessons.completion_policy.none_label')}:
              </span>
              {$t('course.navItem.lessons.completion_policy.none_description')}
            </li>
          </ul>
        </div>

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
                      {#if isHlsUploadVideo(video)}
                        <span class="ui:text-muted-foreground ml-1 text-xs">(HLS)</span>
                      {/if}
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
