<script lang="ts">
  import { LiveSessionCard, type LiveSessionLabels } from '@cio/ui/custom/live-session-card';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    title: string;
    callUrl: string;
    lessonAt: string;
    timezone?: string | null;
    durationMinutes?: number;
  }

  let { title, callUrl, lessonAt, timezone = null, durationMinutes = 60 }: Props = $props();

  const labels: LiveSessionLabels = {
    liveNow: t.get('course.navItem.lessons.session.live_now'),
    liveSession: t.get('course.navItem.lessons.session.live_event'),
    providerFallback: t.get('course.navItem.lessons.session.live_session'),
    started: t.get('course.navItem.lessons.session.started'),
    minAgo: t.get('course.navItem.lessons.session.min_ago'),
    joinNow: t.get('course.navItem.lessons.session.join_now'),
    copyLink: t.get('course.navItem.lessons.session.copy_link'),
    copy: t.get('course.navItem.lessons.session.copy'),
    addToCalendar: t.get('course.navItem.lessons.session.add_to_calendar'),
    addGoogle: t.get('course.navItem.lessons.session.add_google'),
    addOutlook: t.get('course.navItem.lessons.session.add_outlook'),
    addOffice365: t.get('course.navItem.lessons.session.add_office365'),
    addYahoo: t.get('course.navItem.lessons.session.add_yahoo'),
    addApple: t.get('course.navItem.lessons.session.add_apple'),
    startsIn: t.get('course.navItem.lessons.session.starts_in'),
    sessionEnded: t.get('course.navItem.lessons.session.session_ended')
  };
</script>

<LiveSessionCard {title} {callUrl} {lessonAt} {timezone} {durationMinutes} {labels} />
