<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { LiveSessionCard } from '@cio/ui/custom/live-session-card';

  const { Story } = defineMeta({
    title: 'Molecules/LiveSessionCard',
    component: LiveSessionCard,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<script>
  const labels = {
    liveNow: 'Live now',
    liveSession: 'Live Session',
    providerFallback: 'Live session',
    started: 'Started',
    minAgo: 'min ago',
    joinNow: 'Join now',
    copyLink: 'Copy link',
    copy: 'Copy',
    addToCalendar: 'Add to calendar',
    addGoogle: 'Google Calendar',
    addOutlook: 'Outlook.com',
    addOffice365: 'Office 365',
    addYahoo: 'Yahoo Calendar',
    addApple: 'Apple Calendar (.ics)',
    startsIn: 'Starts in',
    sessionEnded: 'Session ended'
  };

  const callUrl = 'https://zoom.us/j/1234567890';
  const day = 24 * 60 * 60 * 1000;
  const minute = 60 * 1000;

  const upcomingAt = new Date(Date.now() + 2 * day).toISOString();
  const liveAt = new Date(Date.now() - 12 * minute).toISOString();
  const endedAt = new Date(Date.now() - 3 * day).toISOString();
</script>

<Story name="Upcoming">
  {#snippet template()}
    <div class="w-[440px] p-8">
      <LiveSessionCard
        title="Compliance Essentials Webinar"
        {callUrl}
        lessonAt={upcomingAt}
        timezone="America/New_York"
        {labels}
        status="upcoming"
      />
    </div>
  {/snippet}
</Story>

<Story name="Live now">
  {#snippet template()}
    <div class="w-[440px] p-8">
      <LiveSessionCard
        title="Compliance Essentials Webinar"
        {callUrl}
        lessonAt={liveAt}
        timezone="America/New_York"
        {labels}
        status="live"
      />
    </div>
  {/snippet}
</Story>

<Story name="Ended">
  {#snippet template()}
    <div class="w-[440px] p-8">
      <LiveSessionCard
        title="Compliance Essentials Webinar"
        {callUrl}
        lessonAt={endedAt}
        timezone="America/New_York"
        {labels}
        status="ended"
      />
    </div>
  {/snippet}
</Story>
