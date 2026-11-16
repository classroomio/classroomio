<script lang="ts">
  import { onMount } from 'svelte';
  import {
    isPluginQuestionSettings,
    type ExerciseQuestionModel,
    type ExerciseRendererMode,
    type AnswerData,
    type QuestionPluginMode,
    type PluginQuestionSettingsEnvelope,
    type PluginCustomAnswerData
  } from '@cio/question-types';
  import { currentOrg } from '$lib/utils/store/org';
  import { courseApi } from '$features/course/api';
  import { pluginsApi } from '$features/plugins/api/plugins.svelte';
  import PluginHostFrame from '$features/plugins/components/plugin-host-frame.svelte';
  import { t } from '$lib/utils/functions/translations';
  import type {
    PluginActionEvent,
    PluginResourceContext,
    QuestionPluginResolutionData
  } from '$features/plugins/utils/types';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';
  import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

  interface Props {
    question: ExerciseQuestionModel;
    answer?: AnswerData | null;
    mode?: ExerciseRendererMode;
    disabled?: boolean;
    onAnswerChange?: (answer: AnswerData | null) => void;
    onQuestionChange?: (question: ExerciseQuestionModel) => void;
  }

  let {
    question,
    answer = null,
    mode = 'take',
    disabled = false,
    onAnswerChange = () => {},
    onQuestionChange = () => {}
  }: Props = $props();

  let containerElement = $state<HTMLDivElement | null>(null);
  let cachedHeight = $state<number>(320);
  let isInViewport = $state(true);
  let isResolving = $state(true);
  let resolutionData = $state<QuestionPluginResolutionData | null>(null);
  let resolutionError = $state<string | null>(null);
  let isFrameFocused = $state(false);
  let isFrameDirty = $state(false);

  const resolvedOrgId = $derived(
    $currentOrg.id || courseApi.course?.org?.id || courseApi.course?.group?.organizationId || ''
  );

  const effectiveMode = $derived.by<QuestionPluginMode>(() => {
    if (mode === 'view' || mode === 'take') return 'take';
    if (mode === 'edit') return 'edit';
    if (mode === 'preview') return 'preview';
    if (mode === 'review') return 'review';
    if (mode === 'submission') return 'submission';

    return 'take';
  });

  const isEnvelopeValid = $derived(isPluginQuestionSettings(question.settings));
  const envelope = $derived.by<PluginQuestionSettingsEnvelope | null>(() => {
    if (!isEnvelopeValid) return null;

    const settings = question.settings as { pluginQuestion: PluginQuestionSettingsEnvelope };
    return settings.pluginQuestion;
  });

  interface AvailableQuestionPlugin {
    pluginId: string;
    installationId: string;
    pluginVersion: string;
    artifactDigest: string;
    contributionId: string;
    title: string;
    description?: string;
  }

  let availableQuestionPlugins = $state<AvailableQuestionPlugin[]>([]);
  let isLoadingAvailable = $state(false);

  function extractQuestionPlugins(rawList: unknown): AvailableQuestionPlugin[] {
    const list: any[] = Array.isArray(rawList)
      ? rawList
      : Array.isArray((rawList as any)?.data)
        ? (rawList as any).data
        : Array.isArray(pluginsApi.installations)
          ? pluginsApi.installations
          : [];

    const items: AvailableQuestionPlugin[] = [];
    for (const inst of list) {
      if (!inst || inst.status !== 'active' || inst.orgApprovalStatus !== 'approved') continue;
      const manifest = inst.manifest as {
        name?: string;
        version?: string;
        description?: string;
        contributes?: {
          questionTypes?: Array<{ id: string; title?: string; description?: string }>;
        };
      } | null;
      const versionRecord = inst.versionRecord as { version?: string; artifactDigest?: string | null } | null;
      const digest = versionRecord?.artifactDigest;
      const version = versionRecord?.version ?? manifest?.version;
      const questionTypes = manifest?.contributes?.questionTypes;
      if (!digest || !version || !Array.isArray(questionTypes) || questionTypes.length === 0) continue;

      const firstContribution = questionTypes[0];
      const pluginTitle = manifest?.name ?? (inst as any).plugin?.name ?? firstContribution.title ?? 'Code Runner';

      items.push({
        pluginId: inst.pluginId,
        installationId: inst.id,
        pluginVersion: version,
        artifactDigest: digest,
        contributionId: firstContribution.id,
        title: pluginTitle,
        description: firstContribution.description ?? manifest?.description
      });
    }

    return items;
  }

  $effect(() => {
    const orgId = resolvedOrgId;
    if (!orgId || envelope || effectiveMode !== 'edit') return;

    if (pluginsApi.installations && pluginsApi.installations.length > 0) {
      const cached = extractQuestionPlugins(pluginsApi.installations);
      if (cached.length > 0) {
        availableQuestionPlugins = cached;
      }
    }

    isLoadingAvailable = true;
    void pluginsApi
      .listOrgInstallations(orgId)
      .then((res) => {
        availableQuestionPlugins = extractQuestionPlugins(res);
        isLoadingAvailable = false;
      })
      .catch(() => {
        isLoadingAvailable = false;
      });
  });

  function selectQuestionPlugin(p: AvailableQuestionPlugin) {
    const currentSettings = (question.settings ?? {}) as Record<string, unknown>;
    onQuestionChange({
      ...question,
      settings: {
        ...currentSettings,
        pluginQuestion: {
          pluginId: p.pluginId,
          installationId: p.installationId,
          pluginVersion: p.pluginVersion,
          artifactDigest: p.artifactDigest,
          contributionId: p.contributionId,
          configVersion: 1,
          publicConfig: {},
          gradingConfig: {}
        }
      }
    });
  }

  function resetQuestionPlugin() {
    const currentSettings = { ...(question.settings ?? {}) } as Record<string, unknown>;
    delete currentSettings.pluginQuestion;
    onQuestionChange({
      ...question,
      settings: currentSettings
    });
  }

  let resolvedResolutionKey = '';

  $effect(() => {
    const orgId = resolvedOrgId;
    if (!orgId || !envelope) {
      isResolving = false;
      return;
    }

    const resolutionKey = `${orgId}:${envelope.pluginId}:${envelope.pluginVersion}:${envelope.artifactDigest}:${envelope.contributionId}:${effectiveMode}`;
    if (resolutionKey === resolvedResolutionKey) return;

    resolvedResolutionKey = resolutionKey;
    isResolving = true;
    resolutionError = null;

    void pluginsApi
      .resolveQuestionPlugin(orgId, {
        pluginId: envelope.pluginId,
        installationId: envelope.installationId,
        pluginVersion: envelope.pluginVersion,
        artifactDigest: envelope.artifactDigest,
        contributionId: envelope.contributionId,
        mode: effectiveMode
      })
      .then((result) => {
        if (resolvedResolutionKey === resolutionKey) {
          resolutionData = result;
          isResolving = false;

          if (effectiveMode === 'edit' && result.artifactDigest && result.artifactDigest !== envelope.artifactDigest) {
            const currentSettings = (question.settings ?? {}) as Record<string, unknown>;
            const curPQ = (currentSettings.pluginQuestion ?? {}) as Record<string, unknown>;
            onQuestionChange({
              ...question,
              settings: {
                ...currentSettings,
                pluginQuestion: {
                  ...curPQ,
                  artifactDigest: result.artifactDigest
                }
              }
            });
          }
        }
      })
      .catch((err) => {
        if (resolvedResolutionKey === resolutionKey) {
          resolutionError = err?.message || 'Resolution failed';
          isResolving = false;
        }
      });
  });

  const pluginResourceContext = $derived.by<PluginResourceContext | undefined>(() => {
    if (!envelope) return undefined;

    const currentVal = answer && 'value' in answer ? (answer as PluginCustomAnswerData).value : null;

    return {
      type: 'question',
      id: String(question.id ?? question.key ?? 'new'),
      questionId: String(question.id ?? question.key ?? 'new'),
      mode: effectiveMode,
      publicConfig: envelope.publicConfig ?? {},
      authorConfig: effectiveMode === 'edit' ? envelope.gradingConfig : undefined,
      currentAnswer: currentVal,
      readOnly: disabled || effectiveMode === 'review' || effectiveMode === 'submission',
      points: question.points,
      contributionId: envelope.contributionId
    };
  });

  onMount(() => {
    if (!containerElement || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            isInViewport = true;
          } else {
            const hasFocus = containerElement?.contains(document.activeElement);
            if (hasFocus || isFrameFocused || isFrameDirty || isResolving) {
              return;
            }

            isInViewport = false;
          }
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(containerElement);

    return () => {
      observer.disconnect();
    };
  });

  async function handlePluginAction(event: PluginActionEvent) {
    if (!envelope) return;

    if (event.action === 'setAnswer') {
      const payload = event.data as { value: unknown };
      const updatedAnswer: PluginCustomAnswerData = {
        type: 'PLUGIN_CUSTOM',
        pluginId: envelope.pluginId,
        contributionId: envelope.contributionId,
        configVersion: envelope.configVersion ?? 1,
        value: payload.value
      };
      onAnswerChange(updatedAnswer);
    } else if (event.action === 'updatePublicConfig') {
      const payload = event.data as { value: unknown };
      const currentSettings = (question.settings ?? {}) as Record<string, unknown>;
      const currentPluginQuestion = (currentSettings.pluginQuestion ?? {}) as Record<string, unknown>;
      onQuestionChange({
        ...question,
        settings: {
          ...currentSettings,
          pluginQuestion: {
            ...currentPluginQuestion,
            publicConfig: payload.value as Record<string, unknown>
          }
        }
      });
    } else if (event.action === 'updateAuthorConfig') {
      const payload = event.data as { value: unknown };
      const currentSettings = (question.settings ?? {}) as Record<string, unknown>;
      const currentPluginQuestion = (currentSettings.pluginQuestion ?? {}) as Record<string, unknown>;
      onQuestionChange({
        ...question,
        settings: {
          ...currentSettings,
          pluginQuestion: {
            ...currentPluginQuestion,
            gradingConfig: payload.value as any
          }
        }
      });
    } else if (event.action === 'resize') {
      const payload = event.data as { height: number };
      if (Number.isFinite(payload?.height) && payload.height > 0) {
        cachedHeight = Math.ceil(payload.height);
      }
    }
  }
</script>

<div
  bind:this={containerElement}
  class="question-plugin-adapter relative w-full"
  style={isEnvelopeValid ? `min-height: ${cachedHeight}px` : undefined}
>
  {#if !isEnvelopeValid}
    {#if effectiveMode === 'edit' && availableQuestionPlugins.length > 0}
      <div class="border-border bg-card rounded-lg border p-4">
        <h4 class="text-foreground mb-3 text-sm font-semibold">
          {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.select_title')}
        </h4>
        <div class="flex flex-col gap-2">
          {#each availableQuestionPlugins as qPlugin}
            <button
              type="button"
              class="border-border bg-background hover:bg-muted/60 hover:border-primary/40 text-foreground flex w-full cursor-pointer items-center justify-between rounded-md border px-3.5 py-2.5 text-left text-sm font-medium transition"
              onclick={() => selectQuestionPlugin(qPlugin)}
            >
              <span>{qPlugin.title}</span>
              <ChevronRightIcon class="text-muted-foreground h-4 w-4 shrink-0" />
            </button>
          {/each}
        </div>
      </div>
    {:else if effectiveMode === 'edit' && isLoadingAvailable}
      <div class="border-border bg-card flex flex-col items-center justify-center rounded-lg border p-6 text-center">
        <LoaderCircleIcon class="text-primary mb-2 h-6 w-6 animate-spin" />
        <p class="text-muted-foreground text-xs font-medium">
          {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.checking_plugins')}
        </p>
      </div>
    {:else if effectiveMode === 'edit'}
      <div
        class="border-border bg-muted/30 flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center"
      >
        <TriangleAlertIcon class="text-muted-foreground mb-2 h-6 w-6" />
        <h4 class="text-foreground text-sm font-semibold">
          {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.no_plugins')}
        </h4>
        <p class="text-muted-foreground mt-1 max-w-sm text-xs">
          {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.no_plugins_description')}
        </p>
        {#if $currentOrg.siteName}
          <a
            href="/org/{$currentOrg.siteName}/plugins"
            class="border-border bg-background hover:bg-muted text-foreground mt-3 inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium shadow-xs"
          >
            {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.browse_plugins')}
          </a>
        {/if}
      </div>
    {:else}
      <div
        class="border-border bg-muted/40 flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
        style="min-height: {cachedHeight}px"
      >
        <TriangleAlertIcon class="text-muted-foreground mb-3 h-8 w-8" />
        <p class="text-foreground text-sm font-medium">
          {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.unconfigured')}
        </p>
      </div>
    {/if}
  {:else if isResolving}
    <div
      class="border-border bg-card flex flex-col items-center justify-center rounded-lg border p-8 text-center"
      style="min-height: {cachedHeight}px"
    >
      <LoaderCircleIcon class="text-primary mb-3 h-7 w-7 animate-spin" />
      <p class="text-muted-foreground text-sm">
        {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.loading')}
      </p>
    </div>
  {:else if (resolutionData?.lifecycleState ?? resolutionData?.state) === 'disabled'}
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/5 p-8 text-center text-amber-700 dark:text-amber-400"
      style="min-height: {cachedHeight}px"
    >
      <TriangleAlertIcon class="mb-3 h-8 w-8 text-amber-500" />
      <p class="text-sm font-medium">
        {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.disabled')}
      </p>
    </div>
  {:else if (resolutionData?.lifecycleState ?? resolutionData?.state) === 'uninstalled'}
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/5 p-8 text-center text-amber-700 dark:text-amber-400"
      style="min-height: {cachedHeight}px"
    >
      <TriangleAlertIcon class="mb-3 h-8 w-8 text-amber-500" />
      <p class="text-sm font-medium">
        {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.uninstalled')}
      </p>
    </div>
  {:else if (resolutionData?.lifecycleState ?? resolutionData?.state) === 'revoked'}
    <div
      class="border-destructive/20 bg-destructive/5 text-destructive flex flex-col items-center justify-center rounded-lg border p-8 text-center"
      style="min-height: {cachedHeight}px"
    >
      <ShieldAlertIcon class="text-destructive mb-3 h-8 w-8" />
      <p class="text-sm font-medium">
        {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.revoked')}
      </p>
    </div>
  {:else if (resolutionData?.lifecycleState ?? resolutionData?.state) === 'unavailable' || !resolutionData?.artifactUrl}
    <div
      class="border-border bg-muted/30 text-muted-foreground flex flex-col items-center justify-center rounded-lg border p-8 text-center"
      style="min-height: {cachedHeight}px"
    >
      <TriangleAlertIcon class="text-muted-foreground mb-3 h-8 w-8" />
      <p class="text-sm font-medium">
        {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.unavailable')}
      </p>
    </div>
  {:else if !isInViewport}
    <div
      class="border-border/50 bg-muted/20 flex items-center justify-center rounded-lg border"
      style="min-height: {cachedHeight}px"
    >
      <span class="text-muted-foreground text-xs">Virtualizing question frame...</span>
    </div>
  {:else}
    {#if effectiveMode === 'edit'}
      <div
        class="border-border/60 bg-muted/40 mb-3 flex items-center justify-between rounded-md border px-3 py-1.5 text-xs"
      >
        <div class="flex items-center gap-2">
          <span class="text-muted-foreground font-medium">
            {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.plugin_label')}:
          </span>
          <span class="text-foreground font-semibold">
            {resolutionData.contribution?.title ?? envelope.contributionId}
          </span>
          <span
            class="border-border/60 bg-background text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]"
          >
            v{envelope.pluginVersion}
          </span>
        </div>
        <button
          type="button"
          class="text-primary cursor-pointer text-xs font-medium transition hover:underline"
          onclick={resetQuestionPlugin}
        >
          {$t('course.navItem.lessons.exercises.all_exercises.edit_mode.plugin_question.change_plugin')}
        </button>
      </div>
    {/if}
    <PluginHostFrame
      installationId={resolutionData.installationId ?? envelope.installationId}
      pluginId={envelope.pluginId}
      version={envelope.pluginVersion}
      contributionId={envelope.contributionId}
      grantedScopes={resolutionData.grantedScopes ?? []}
      organizationId={resolvedOrgId}
      srcUrl={resolutionData.artifactUrl}
      title={resolutionData.contribution?.title ?? 'Question Plugin'}
      className="block w-full border-0 transition-opacity duration-200"
      target="exercise.question"
      resource={pluginResourceContext}
      onAction={handlePluginAction}
    />
  {/if}
</div>
