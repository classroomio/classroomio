<script lang="ts">
  import { browser } from '$app/environment';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import { Badge } from '@cio/ui/base/badge';
  import { cn } from '@cio/ui/tools';
  import { ZAPIER_TRIGGERS, type TZapierPartnerApp, type TZapierRecipe } from '@cio/utils/constants/zapier';

  import {
    getRecipeClassroomioStep,
    getRecipeDirection,
    getZapierExampleData,
    type ZapierRecipeDirection
  } from '$features/automation/utils/zapier-utils';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    app: TZapierPartnerApp;
    recipe: TZapierRecipe;
  }

  let { app, recipe }: Props = $props();

  const T = 'automation.zapier.app_page';
  const CYCLE_MS = 5200;
  const NEW_STATE_MS = 700;
  const RAN_STATE_MS = 2300;
  const SOURCE_ROWS = 4;
  const DEST_ROWS = 3;
  const AGE_LABELS = ['just now', '4 min ago', '26 min ago', '1 h ago'];
  const PREVIEW_COLORS = ['#f97066', '#4f8cff', '#22b07d', '#a77bff', '#f5a524'];

  type PreviewPerson = { name: string; email: string; course: string; color: string };

  const direction: ZapierRecipeDirection = getRecipeDirection(recipe);
  const classroomioStep = getRecipeClassroomioStep(recipe);
  const partnerStep =
    recipe.trigger.app === 'partner' ? recipe.trigger : recipe.action.app === 'partner' ? recipe.action : null;

  const classroomioLabel = $derived(
    classroomioStep?.type === 'read'
      ? $t(`automation.zapier.catalog_triggers.${classroomioStep.key}.label`)
      : classroomioStep
        ? $t(`automation.zapier.catalog_actions.${classroomioStep.key}.label`)
        : ''
  );
  const partnerLabel = $derived(
    partnerStep ? $t(`automation.zapier.partner_steps.${app.slug}.${partnerStep.key}`) : ''
  );

  const sourceLabel = $derived(
    direction === 'out'
      ? $t(`${T}.preview_source`, { screen: classroomioLabel })
      : $t(`${T}.preview_destination`, { app: app.name, action: partnerLabel })
  );
  const destinationLabel = $derived(
    direction === 'out'
      ? $t(`${T}.preview_destination`, { app: app.name, action: partnerLabel })
      : $t(`${T}.preview_source`, { screen: classroomioLabel })
  );

  const exampleTrigger =
    classroomioStep?.type === 'read'
      ? (ZAPIER_TRIGGERS.find((trigger) => trigger.key === classroomioStep.key) ?? null)
      : null;
  const exampleData = exampleTrigger ? getZapierExampleData(exampleTrigger.eventType) : {};
  const exampleStudent = (exampleData.student ?? {}) as Record<string, unknown>;
  const exampleCourse = (exampleData.course ?? {}) as Record<string, unknown>;

  const exampleName = typeof exampleStudent.name === 'string' ? exampleStudent.name : 'Amara Chen';
  const exampleEmail = typeof exampleStudent.email === 'string' ? exampleStudent.email : 'amara.chen@brightpath.io';
  const exampleTitle = typeof exampleCourse.title === 'string' ? exampleCourse.title : 'Product Fundamentals';
  const detailColumnKey = $derived(
    direction === 'out' && exampleCourse.title ? `${T}.preview_col_course` : `${T}.preview_col_email`
  );

  const samplePeople: PreviewPerson[] = [
    { name: exampleName, email: exampleEmail, course: exampleTitle, color: PREVIEW_COLORS[0] },
    { name: 'Jonas Lee', email: 'jonas.lee@northwind.io', course: 'Onboarding Basics', color: PREVIEW_COLORS[1] },
    { name: 'Priya Shah', email: 'priya.shah@acme.co', course: 'Security 101', color: PREVIEW_COLORS[2] },
    { name: 'Mateo Kim', email: 'mateo@kimstudio.dev', course: 'Product Fundamentals', color: PREVIEW_COLORS[3] },
    { name: 'Sofia Rossi', email: 'sofia.rossi@lumen.it', course: 'Onboarding Basics', color: PREVIEW_COLORS[4] }
  ];

  const prefersReducedMotion = browser ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : true;

  let nextPersonIndex = 1;
  let sourceRows = $state<PreviewPerson[]>([...samplePeople].slice(0, SOURCE_ROWS));
  let destRows = $state<PreviewPerson[]>(samplePeople.slice(0, DEST_ROWS));
  let stage = $state<'idle' | 'new' | 'running' | 'ran'>(prefersReducedMotion ? 'ran' : 'idle');

  const sourceAccent = $derived(direction === 'out' ? '#0542CC' : app.color);
  const destinationAccent = $derived(direction === 'out' ? app.color : '#0542CC');

  const stageLabel = $derived(
    stage === 'new'
      ? $t(`${T}.preview_state_new`)
      : stage === 'running'
        ? $t(`${T}.preview_state_running`)
        : stage === 'ran'
          ? $t(`${T}.preview_state_ran`)
          : $t(`${T}.preview_state_idle`)
  );

  function initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2);
  }

  function runStep(): PreviewPerson {
    const person = samplePeople[nextPersonIndex % samplePeople.length];
    nextPersonIndex += 1;

    sourceRows = [person, ...sourceRows].slice(0, SOURCE_ROWS);
    stage = 'new';

    return person;
  }

  $effect(() => {
    if (!browser || prefersReducedMotion) return;

    const timeoutIds = new Set<ReturnType<typeof setTimeout>>();

    function schedule(callback: () => void, delay: number) {
      const timeoutId = setTimeout(() => {
        timeoutIds.delete(timeoutId);
        callback();
      }, delay);

      timeoutIds.add(timeoutId);
    }

    const intervalId = setInterval(() => {
      if (document.hidden) return;

      const person = runStep();

      schedule(() => {
        stage = 'running';
      }, NEW_STATE_MS);

      schedule(() => {
        destRows = [person, ...destRows].slice(0, DEST_ROWS);
        stage = 'ran';
      }, RAN_STATE_MS);
    }, CYCLE_MS);

    return () => {
      clearInterval(intervalId);

      for (const timeoutId of timeoutIds) {
        clearTimeout(timeoutId);
      }
    };
  });
</script>

<div
  class="grid w-full gap-4 min-[860px]:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)] min-[860px]:items-center"
  role="group"
  aria-label={$t(`${T}.preview_aria`)}
>
  <div class="ui:bg-card ui:border-border min-w-0 overflow-hidden rounded-[18px] border min-[860px]:min-h-[268px]">
    <div class="ui:border-border ui:bg-muted/55 flex items-center gap-2 border-b px-3.5 py-2.5">
      <span class="flex gap-1" aria-hidden="true">
        <span class="ui:bg-foreground/15 size-2 rounded-full"></span>
        <span class="ui:bg-foreground/15 size-2 rounded-full"></span>
        <span class="ui:bg-foreground/15 size-2 rounded-full"></span>
      </span>

      <span
        class="ml-1 flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
        style="background-color: {direction === 'out' ? '#0542CC' : app.color}"
        aria-hidden="true"
      >
        {direction === 'out' ? 'C' : app.name.slice(0, 1)}
      </span>

      <span class="truncate text-[12.5px] font-semibold">{sourceLabel}</span>

      <Badge variant="outline" class="ml-auto shrink-0 text-[10px]">{$t(`${T}.preview_example`)}</Badge>
    </div>

    <div class="px-2.5 pt-1.5 pb-2.5">
      <div
        class="ui:text-muted-foreground grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_76px] items-center gap-2.5 px-2 pt-2 pb-1.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase"
      >
        <span>{$t(`${T}.preview_col_person`)}</span>
        <span class="truncate">{$t(detailColumnKey)}</span>
        <span class="text-right">{$t(`${T}.preview_col_when`)}</span>
      </div>

      <div class="flex flex-col">
        {#each sourceRows as person, index (index)}
          <div
            class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_76px] items-center gap-2.5 rounded-[10px] border-l-[3px] border-l-transparent px-2 py-2.5 text-[13px]"
            style={index === 0 && stage !== 'idle'
              ? `background-color: ${sourceAccent}17; border-left-color: ${sourceAccent}`
              : undefined}
          >
            <span class="flex min-w-0 items-center gap-2">
              <span
                class="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style="background-color: {person.color}"
                aria-hidden="true"
              >
                {initials(person.name)}
              </span>
              <span class="truncate font-medium">{person.name}</span>
            </span>
            <span class="ui:text-muted-foreground truncate">
              {direction === 'out' ? person.course : person.email}
            </span>
            <span class="ui:text-muted-foreground truncate text-right text-xs">{AGE_LABELS[index] ?? ''}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <div class="flex items-center justify-center gap-2.5 min-[860px]:flex-col">
    <span
      class={cn(
        'relative flex size-9 items-center justify-center rounded-full bg-[#FF4F00] text-white transition-transform',
        stage === 'running' && 'scale-110'
      )}
      aria-hidden="true"
    >
      {#if stage === 'running'}
        <span class="absolute inset-0 animate-ping rounded-full bg-[#FF4F00]/40"></span>
      {/if}
      <ZapIcon class="custom relative size-4" />
    </span>

    <span class="ui:text-muted-foreground text-[11px] font-medium" aria-live="polite">{stageLabel}</span>

    <ArrowRightIcon class="custom ui:text-muted-foreground size-3 rotate-90 min-[860px]:rotate-0" aria-hidden="true" />
  </div>

  <div class="ui:bg-card ui:border-border min-w-0 overflow-hidden rounded-[18px] border min-[860px]:min-h-[268px]">
    <div class="ui:border-border ui:bg-muted/55 flex items-center gap-2 border-b px-3.5 py-2.5">
      <span class="flex gap-1" aria-hidden="true">
        <span class="ui:bg-foreground/15 size-2 rounded-full"></span>
        <span class="ui:bg-foreground/15 size-2 rounded-full"></span>
        <span class="ui:bg-foreground/15 size-2 rounded-full"></span>
      </span>

      <span
        class="ml-1 flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
        style="background-color: {direction === 'out' ? app.color : '#0542CC'}"
        aria-hidden="true"
      >
        {direction === 'out' ? app.name.slice(0, 1) : 'C'}
      </span>

      <span class="truncate text-[12.5px] font-semibold">{destinationLabel}</span>
    </div>

    <div class="px-2.5 pt-1.5 pb-2.5">
      <div
        class="ui:text-muted-foreground grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_76px] items-center gap-2.5 px-2 pt-2 pb-1.5 text-[10.5px] font-semibold tracking-[0.06em] uppercase"
      >
        <span>{$t(`${T}.preview_col_person`)}</span>
        <span class="truncate">{$t(`${T}.preview_col_course`)}</span>
        <span class="text-right">{$t(`${T}.preview_col_when`)}</span>
      </div>

      <div class="flex flex-col">
        {#each destRows as person, index (index)}
          <div
            class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_76px] items-center gap-2.5 rounded-[10px] border-l-[3px] border-l-transparent px-2 py-2.5 text-[13px]"
            style={index === 0 && stage === 'ran'
              ? `background-color: ${destinationAccent}17; border-left-color: ${destinationAccent}`
              : undefined}
          >
            <span class="flex min-w-0 items-center gap-2">
              <span
                class="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                style="background-color: {person.color}"
                aria-hidden="true"
              >
                {initials(person.name)}
              </span>
              <span class="truncate font-medium">{person.name}</span>
            </span>
            <span class="ui:text-muted-foreground truncate">{person.course}</span>
            <span class="ui:text-muted-foreground truncate text-right text-xs">{AGE_LABELS[index] ?? ''}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
