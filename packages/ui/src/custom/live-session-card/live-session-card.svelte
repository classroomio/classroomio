<script lang="ts" module>
  export interface LiveSessionLabels {
    liveNow: string;
    liveSession: string;
    providerFallback: string;
    started: string;
    minAgo: string;
    joinNow: string;
    copyLink: string;
    copy: string;
    addToCalendar: string;
    addGoogle: string;
    addOutlook: string;
    addOffice365: string;
    addYahoo: string;
    addApple: string;
    startsIn: string;
    sessionEnded: string;
  }
</script>

<script lang="ts">
  import { onDestroy } from 'svelte';
  import { Button } from '../../base/button';
  import { CopyButton } from '../../base/copy-button';
  import * as ButtonGroup from '../../base/button-group';
  import * as DropdownMenu from '../../base/dropdown-menu';
  import { RadioIcon } from '../moving-icons';
  import VideoIcon from '@lucide/svelte/icons/video';
  import CalendarPlusIcon from '@lucide/svelte/icons/calendar-plus';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import HourglassIcon from '@lucide/svelte/icons/hourglass';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

  interface Props {
    title: string;
    callUrl: string;
    lessonAt: string;
    labels: LiveSessionLabels;
    timezone?: string | null;
    durationMinutes?: number;
    status?: 'live' | 'upcoming' | 'ended';
  }

  let {
    title,
    callUrl,
    lessonAt,
    labels,
    timezone = null,
    durationMinutes = 60,
    status: statusOverride = undefined
  }: Props = $props();

  let now = $state(Date.now());
  const ticker = setInterval(() => (now = Date.now()), 30_000);
  onDestroy(() => clearInterval(ticker));

  const startMs = $derived(new Date(lessonAt).getTime());
  const endMs = $derived(startMs + durationMinutes * 60_000);
  const status = $derived(statusOverride ?? (now < startMs ? 'upcoming' : now < endMs ? 'live' : 'ended'));

  const tz = $derived(timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const dateLabel = $derived(
    new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(new Date(lessonAt))
  );

  const provider = $derived.by(() => {
    try {
      const host = new URL(callUrl).hostname;
      if (host.includes('zoom')) return 'Zoom';
      if (host.includes('meet.google')) return 'Google Meet';
      if (host.includes('teams')) return 'Microsoft Teams';
      if (host.includes('webex')) return 'Webex';
      return labels.providerFallback;
    } catch {
      return labels.providerFallback;
    }
  });

  function duration(ms: number): string {
    let secs = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(secs / 86400);
    secs -= days * 86400;
    const hours = Math.floor(secs / 3600);
    secs -= hours * 3600;
    const mins = Math.floor(secs / 60);
    const parts: string[] = [];
    if (days) parts.push(`${days}d`);
    if (hours || days) parts.push(`${hours}h`);
    parts.push(`${mins}m`);
    return parts.join(' ');
  }

  const startsIn = $derived(duration(startMs - now));
  const startedAgo = $derived(`${Math.max(1, Math.floor((now - startMs) / 60_000))} ${labels.minAgo}`);

  function pad(value: number): string {
    return String(value).padStart(2, '0');
  }

  function toIcsUtc(ms: number): string {
    const d = new Date(ms);
    return (
      `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
      `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
    );
  }

  function icsEscape(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  function addToCalendar() {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ClassroomIO//Live Session//EN',
      'BEGIN:VEVENT',
      `UID:session-${startMs}@classroomio`,
      `DTSTAMP:${toIcsUtc(now)}`,
      `DTSTART:${toIcsUtc(startMs)}`,
      `DTEND:${toIcsUtc(endMs)}`,
      `SUMMARY:${icsEscape(title)}`,
      `DESCRIPTION:${icsEscape(`Join your live session: ${callUrl}`)}`,
      `URL:${icsEscape(callUrl)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder',
      'TRIGGER:-PT1H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'session.ics';
    link.click();
    URL.revokeObjectURL(url);
  }

  const calendarDetails = $derived(`Join your live session: ${callUrl}`);

  const googleCalendarUrl = $derived(
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      `&text=${encodeURIComponent(title)}` +
      `&dates=${toIcsUtc(startMs)}/${toIcsUtc(endMs)}` +
      `&details=${encodeURIComponent(calendarDetails)}` +
      `&location=${encodeURIComponent(callUrl)}`
  );

  const outlookCalendarUrl = $derived(
    'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
      `&subject=${encodeURIComponent(title)}` +
      `&body=${encodeURIComponent(calendarDetails)}` +
      `&startdt=${new Date(startMs).toISOString()}` +
      `&enddt=${new Date(endMs).toISOString()}` +
      `&location=${encodeURIComponent(callUrl)}`
  );

  const office365CalendarUrl = $derived(
    'https://outlook.office.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent' +
      `&subject=${encodeURIComponent(title)}` +
      `&body=${encodeURIComponent(calendarDetails)}` +
      `&startdt=${new Date(startMs).toISOString()}` +
      `&enddt=${new Date(endMs).toISOString()}` +
      `&location=${encodeURIComponent(callUrl)}`
  );

  const yahooCalendarUrl = $derived(
    'https://calendar.yahoo.com/?v=60&view=d&type=20' +
      `&title=${encodeURIComponent(title)}` +
      `&st=${toIcsUtc(startMs)}&et=${toIcsUtc(endMs)}` +
      `&desc=${encodeURIComponent(calendarDetails)}` +
      `&in_loc=${encodeURIComponent(callUrl)}`
  );

  function openCalendar(url: string) {
    window.open(url, '_blank', 'noreferrer');
  }
</script>

{#snippet heading()}
  <h3 class="ui:mt-0.5 ui:flex ui:items-center ui:gap-1.5 ui:text-sm ui:font-semibold">
    {labels.liveSession}
    <RadioIcon size={13} color="#ef4444" />
  </h3>
{/snippet}

{#snippet addToCalendarGroup()}
  <ButtonGroup.Root>
    <Button variant="outline" size="xs" onclick={() => openCalendar(googleCalendarUrl)}>
      <CalendarPlusIcon size={13} />
      {labels.addToCalendar}
    </Button>
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        {#snippet child({ props })}
          <Button {...props} type="button" variant="outline" size="xs" aria-label={labels.addToCalendar}>
            <ChevronDownIcon size={13} />
          </Button>
        {/snippet}
      </DropdownMenu.Trigger>
      <DropdownMenu.Content align="start">
        <DropdownMenu.Item onclick={() => openCalendar(googleCalendarUrl)}>{labels.addGoogle}</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => openCalendar(outlookCalendarUrl)}>{labels.addOutlook}</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => openCalendar(office365CalendarUrl)}>{labels.addOffice365}</DropdownMenu.Item>
        <DropdownMenu.Item onclick={() => openCalendar(yahooCalendarUrl)}>{labels.addYahoo}</DropdownMenu.Item>
        <DropdownMenu.Separator />
        <DropdownMenu.Item onclick={addToCalendar}>{labels.addApple}</DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  </ButtonGroup.Root>
{/snippet}

<div class="ui:bg-card ui:text-card-foreground ui:border-primary/30 ui:rounded-md ui:border ui:p-3">
  {#if status === 'live'}
    <div
      class="ui:text-red-600 ui:flex ui:items-center ui:gap-1.5 ui:text-[11px] ui:font-semibold ui:tracking-wide ui:uppercase"
    >
      <span class="ui:inline-block ui:h-2 ui:w-2 ui:rounded-full ui:bg-red-500"></span>
      {labels.liveNow}
    </div>
    {@render heading()}
    <div
      class="ui:text-muted-foreground ui:mt-1 ui:flex ui:flex-wrap ui:items-center ui:gap-x-3 ui:gap-y-0.5 ui:text-xs"
    >
      <span class="ui:flex ui:items-center ui:gap-1"><ClockIcon size={12} /> {labels.started} {startedAgo}</span>
      <span class="ui:flex ui:items-center ui:gap-1"><VideoIcon size={12} /> {provider}</span>
    </div>

    <div class="ui:mt-3 ui:flex ui:flex-wrap ui:items-center ui:gap-2">
      <a href={callUrl} target="_blank" rel="noreferrer">
        <Button size="xs"><VideoIcon size={13} />{labels.joinNow}</Button>
      </a>
      <CopyButton text={callUrl} variant="outline" size="xs">
        {labels.copyLink}
      </CopyButton>
    </div>

    <div class="ui:mt-2.5 ui:flex ui:items-center ui:gap-2">
      <p class="ui:bg-muted ui:text-muted-foreground ui:flex-1 ui:truncate ui:rounded ui:px-2.5 ui:py-1.5 ui:text-xs">
        {callUrl}
      </p>
      <CopyButton text={callUrl} variant="outline" size="xs">
        {labels.copy}
      </CopyButton>
    </div>
  {:else if status === 'upcoming'}
    {@render heading()}
    <div
      class="ui:text-muted-foreground ui:mt-1 ui:flex ui:flex-wrap ui:items-center ui:gap-x-3 ui:gap-y-0.5 ui:text-xs"
    >
      <span class="ui:flex ui:items-center ui:gap-1"><ClockIcon size={12} /> {dateLabel}</span>
      <span class="ui:flex ui:items-center ui:gap-1"><VideoIcon size={12} /> {provider}</span>
    </div>

    <div class="ui:mt-3 ui:flex ui:flex-wrap ui:items-center ui:gap-2">
      {@render addToCalendarGroup()}
      <CopyButton text={callUrl} variant="outline" size="xs">
        {labels.copyLink}
      </CopyButton>
    </div>

    <div
      class="ui:text-muted-foreground ui:border-primary/30 ui:mt-3 ui:flex ui:items-center ui:gap-1.5 ui:border-t ui:pt-2.5 ui:text-xs"
    >
      <HourglassIcon size={12} />
      {labels.startsIn}
      <span class="ui:text-foreground ui:font-semibold">{startsIn}</span>
    </div>
  {:else}
    <div class="ui:text-muted-foreground ui:text-[11px] ui:font-semibold ui:tracking-wide ui:uppercase">
      {labels.sessionEnded}
    </div>
    {@render heading()}
    <div class="ui:text-muted-foreground ui:mt-1 ui:flex ui:items-center ui:gap-1 ui:text-xs">
      <ClockIcon size={12} />
      {dateLabel}
    </div>
  {/if}
</div>
