/* events.js — clickable Events prototype. Vanilla JS, hash routed, in-memory state. */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const DAY = 864e5;
  const HOUR = 36e5;
  const MIN = 6e4;
  const BASE = Date.parse('2026-10-14T09:00:00Z');
  const $ = (sel, root) => (root || document).querySelector(sel);
  const esc = (value) =>
    String(value == null ? '' : value).replace(
      /[&<>"']/g,
      (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]
    );
  const uid = (() => {
    let n = 100;
    return (prefix) => prefix + ++n;
  })();

  const ICONS = {
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    users:
      '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    circle: '<circle cx="12" cy="12" r="9"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    play: '<path d="M6 4l14 8-14 8z" fill="currentColor"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    map: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    video: '<path d="m22 8-6 4 6 4z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    share:
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/>',
    refresh:
      '<path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M21 21v-5h-5"/>',
    graduation: '<path d="m22 10-10-5L2 10l10 5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/>',
    warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    sparkle: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>'
  };
  const ico = (name, cls) => `<svg class="ico ${cls || ''}" viewBox="0 0 24 24">${ICONS[name] || ''}</svg>`;

  const PALETTE = ['#7c3aed', '#0891b2', '#db2777', '#ea580c', '#16a34a', '#2563eb', '#9333ea'];
  const colorFor = (text) => {
    let hash = 0;
    for (const ch of String(text)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[hash % PALETTE.length];
  };
  const initials = (name) =>
    String(name)
      .split(/\s+/)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  const avatar = (name, size) =>
    `<span class="avatar-sm ${size || ''}" style="background:${colorFor(name)}" title="${esc(name)}">${esc(initials(name))}</span>`;
  const COVERS = [
    'linear-gradient(135deg,#4c1d95,#7c3aed 60%,#c084fc)',
    'linear-gradient(135deg,#0c4a6e,#0891b2 60%,#67e8f9)',
    'linear-gradient(135deg,#831843,#db2777 60%,#f9a8d4)',
    'linear-gradient(135deg,#7c2d12,#ea580c 60%,#fdba74)',
    'linear-gradient(135deg,#14532d,#16a34a 60%,#86efac)'
  ];

  /* ---------- state ---------- */
  const TIMEZONES = ['America/New_York', 'Europe/London', 'Africa/Lagos', 'Asia/Kolkata'];

  function seedState() {
    const ev1Start = BASE + 3 * DAY + 5 * HOUR;
    return {
      simBase: BASE,
      anchor: Date.now(),
      tz: 'America/New_York',
      flags: { studentLimit: false, forceFull: false, signupDisabled: false },
      zoomConnected: true,
      session: null,
      inbox: null,
      sent: {},
      toastTimer: null,
      regResult: {},
      mailsRead: {},
      courses: [
        { id: 'c1', title: 'AI Agents Foundations', lessons: 12 },
        { id: 'c2', title: 'Customer Onboarding 101', lessons: 8 },
        { id: 'c3', title: 'Design Systems in Practice', lessons: 15 }
      ],
      enrollments: [],
      team: [
        {
          id: 'm1',
          name: 'Maya Okafor',
          role: 'Admin',
          email: 'maya@acme.edu',
          bio: 'Head of Learning at Acme Academy.'
        },
        { id: 'm2', name: 'Jordan Diallo', role: 'Teacher', email: 'jordan@acme.edu', bio: 'Instructional designer.' }
      ],
      events: [
        {
          id: 'ev1',
          slug: 'building-ai-agents-for-teams',
          title: 'Building AI Agents for Teams',
          description:
            'A hands-on 60 minute webinar on designing, evaluating and shipping AI agents that your whole team can rely on.\n\nYou will see a live build, a review of the common failure modes, and a Q&A with the hosts.',
          bullets: [
            'Pick the right first agent use case',
            'Evaluate agents before your users do',
            'Roll out safely across a team'
          ],
          format: 'webinar',
          delivery: 'online',
          location: '',
          startsAt: ev1Start,
          durationMinutes: 60,
          timezone: 'America/New_York',
          meetingUrl: 'https://zoom.us/j/84739201123',
          recording: null,
          accessMode: 'form',
          published: true,
          cancelled: false,
          tags: ['AI', 'Engineering'],
          hosts: [
            {
              id: 'h1',
              name: 'Maya Okafor',
              kind: 'member',
              role: 'manager',
              status: 'active',
              bio: 'Head of Learning at Acme Academy.',
              email: 'maya@acme.edu'
            },
            {
              id: 'h2',
              name: 'Dr. Lena Park',
              kind: 'guest',
              role: 'speaker',
              status: 'active',
              bio: 'Research lead, applied agents. Guest speaker.',
              email: 'lena@labs.example'
            }
          ],
          form: {
            name: 'AI Agents webinar registration',
            fields: ['Full name', 'Work email', 'Company', 'Job title', 'What do you hope to learn?'],
            capacity: 120,
            requireApproval: false,
            accessPolicy: 'public_registration'
          },
          reminders: { h24: true, h1: true },
          linkedCourseId: 'c1',
          courseEnrollment: 'on_registration',
          resources: [{ name: 'Agent design checklist.pdf', size: '1.2 MB' }],
          callout: {
            text: 'Want to go deeper? The AI Agents Foundations course covers everything in this session and more.',
            cta: 'View the course'
          },
          seedRegistered: 83,
          cover: 0
        },
        {
          id: 'ev2',
          slug: 'customer-onboarding-office-hours',
          title: 'Customer Onboarding Office Hours',
          description:
            'A recorded Q&A on setting up your first cohort, welcome flows and the most common onboarding mistakes. Watch any time, no sign-up needed.',
          bullets: [],
          format: 'meetup',
          delivery: 'online',
          location: '',
          startsAt: null,
          durationMinutes: null,
          timezone: 'America/New_York',
          meetingUrl: '',
          recording: { status: 'published', source: 'youtube', duration: '42:10' },
          accessMode: 'public',
          published: true,
          cancelled: false,
          tags: ['Onboarding'],
          hosts: [
            {
              id: 'h3',
              name: 'Jordan Diallo',
              kind: 'member',
              role: 'speaker',
              status: 'active',
              bio: 'Instructional designer.',
              email: 'jordan@acme.edu'
            }
          ],
          form: null,
          reminders: { h24: false, h1: false },
          linkedCourseId: '',
          courseEnrollment: 'none',
          resources: [{ name: 'Onboarding email templates.zip', size: '640 KB' }],
          callout: null,
          seedRegistered: 0,
          cover: 1
        },
        {
          id: 'ev3',
          slug: 'design-systems-workshop',
          title: 'Design Systems Workshop',
          description:
            'Two hours building a token-based design system from scratch. Includes the Figma file and the component checklist.',
          bullets: [],
          format: 'workshop',
          delivery: 'hybrid',
          location: 'Lagos + online',
          startsAt: BASE - 10 * DAY,
          durationMinutes: 120,
          timezone: 'Africa/Lagos',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
          recording: { status: 'published', source: 'zoom', duration: '1:54:02' },
          accessMode: 'form',
          published: true,
          cancelled: false,
          tags: ['Design'],
          hosts: [
            {
              id: 'h4',
              name: 'Sam Rivera',
              kind: 'guest',
              role: 'speaker',
              status: 'active',
              bio: 'Design systems lead.',
              email: 'sam@studio.example'
            }
          ],
          form: {
            name: 'Workshop registration',
            fields: ['Full name', 'Work email'],
            capacity: 60,
            requireApproval: false,
            accessPolicy: 'public_registration'
          },
          reminders: { h24: true, h1: true },
          linkedCourseId: 'c3',
          courseEnrollment: 'on_registration',
          resources: [{ name: 'Component checklist.pdf', size: '480 KB' }],
          callout: null,
          seedRegistered: 54,
          cover: 2
        },
        {
          id: 'ev4',
          slug: 'q4-product-roadmap-livestream',
          title: 'Q4 Product Roadmap Livestream',
          description: 'What is shipping next quarter, what we are cutting, and why. Ask the team anything.',
          bullets: [],
          format: 'livestream',
          delivery: 'online',
          location: '',
          startsAt: BASE + 20 * DAY + 6 * HOUR,
          durationMinutes: 45,
          timezone: 'America/New_York',
          meetingUrl: 'https://www.youtube.com/live/q4roadmap',
          recording: null,
          accessMode: 'form',
          published: true,
          cancelled: false,
          tags: ['Product'],
          hosts: [
            {
              id: 'h5',
              name: 'Maya Okafor',
              kind: 'member',
              role: 'manager',
              status: 'active',
              bio: 'Head of Learning at Acme Academy.',
              email: 'maya@acme.edu'
            }
          ],
          form: {
            name: 'Roadmap livestream registration',
            fields: ['Full name', 'Work email'],
            capacity: 500,
            requireApproval: false,
            accessPolicy: 'public_registration'
          },
          reminders: { h24: true, h1: true },
          linkedCourseId: '',
          courseEnrollment: 'none',
          resources: [],
          callout: null,
          seedRegistered: 212,
          cover: 3
        },
        {
          id: 'ev5',
          slug: 'sales-enablement-bootcamp',
          title: 'Sales Enablement Bootcamp',
          description: '',
          bullets: [],
          format: 'workshop',
          delivery: 'online',
          location: '',
          startsAt: null,
          durationMinutes: null,
          timezone: 'America/New_York',
          meetingUrl: '',
          recording: null,
          accessMode: 'form',
          published: false,
          cancelled: false,
          tags: [],
          hosts: [],
          form: null,
          reminders: { h24: true, h1: true },
          linkedCourseId: '',
          courseEnrollment: 'none',
          resources: [],
          callout: null,
          seedRegistered: 0,
          cover: 4
        }
      ],
      regs: {
        ev1: [
          {
            id: 'r1',
            name: 'Priya Natarajan',
            email: 'priya@northwind.example',
            company: 'Northwind',
            job: 'Product Lead',
            status: 'registered',
            at: BASE - 2 * DAY
          },
          {
            id: 'r2',
            name: 'Tomás Herrera',
            email: 'tomas@globex.example',
            company: 'Globex',
            job: 'Engineer',
            status: 'registered',
            at: BASE - 1 * DAY
          },
          {
            id: 'r3',
            name: 'Aisha Bello',
            email: 'aisha@initech.example',
            company: 'Initech',
            job: 'L&D Manager',
            status: 'awaiting_verification',
            at: BASE - 4 * HOUR
          }
        ],
        ev2: [],
        ev3: [],
        ev4: [],
        ev5: []
      },
      grants: [],
      mails: []
    };
  }

  let state = seedState();
  const ui = { draft: null, dirty: false, tab: 'all', drawer: false, editorNotice: '', mailFilter: '' };

  /* ---------- time ---------- */
  const now = () => state.simBase + (Date.now() - state.anchor);
  const fmtTime = (ts, tz) =>
    new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: tz || state.tz }).format(ts);
  const tzName = (ts, tz) =>
    new Intl.DateTimeFormat('en-US', { timeZoneName: 'short', timeZone: tz || state.tz })
      .formatToParts(ts)
      .find((part) => part.type === 'timeZoneName').value;
  const fmtRange = (ev, tz) => {
    const end = ev.startsAt + ev.durationMinutes * MIN;
    return `${fmtTime(ev.startsAt, tz)} – ${fmtTime(end, tz)} ${tzName(ev.startsAt, tz)}`;
  };
  const fmtDate = (ts, tz, short) =>
    new Intl.DateTimeFormat(
      'en-US',
      short
        ? { month: 'short', day: 'numeric', timeZone: tz || state.tz }
        : { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: tz || state.tz }
    ).format(ts);
  const fmtStamp = (ts) => `${fmtDate(ts, state.tz, true)}, ${fmtTime(ts)} ${tzName(ts)}`;
  const relative = (ms) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (days) return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours === 1 ? '' : 's'}`;
    if (hours) return `${hours} hour${hours === 1 ? '' : 's'} ${minutes} minute${minutes === 1 ? '' : 's'}`;
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  };
  const tzOffsetMs = (ts, tz) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
      .formatToParts(ts)
      .reduce((acc, part) => ((acc[part.type] = part.value), acc), {});
    return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - ts;
  };
  const toLocalInput = (ts, tz) => (ts == null ? '' : new Date(ts + tzOffsetMs(ts, tz)).toISOString().slice(0, 16));
  const fromLocalInput = (text, tz) => {
    if (!text) return null;
    const guess = Date.parse(text + ':00Z');
    return guess - tzOffsetMs(guess, tz);
  };

  /* ---------- derived ---------- */
  const getEvent = (id) => state.events.find((ev) => ev.id === id);
  const getEventBySlug = (slug) => state.events.find((ev) => ev.slug === slug);
  const recordingReady = (ev) => ev.recording && ev.recording.status === 'published';

  function derive(ev) {
    if (!ev.published) return 'draft';
    if (ev.cancelled) return 'cancelled';
    if (ev.startsAt == null) return recordingReady(ev) ? 'on-demand' : 'draft';
    const t = now();
    if (t < ev.startsAt) return 'upcoming';
    if (t < ev.startsAt + ev.durationMinutes * MIN) return 'live';
    return recordingReady(ev) ? 'on-demand' : 'replay-pending';
  }
  const STATE_LABEL = {
    draft: 'Draft',
    upcoming: 'Upcoming',
    live: 'Live now',
    'replay-pending': 'Replay pending',
    'on-demand': 'On demand',
    cancelled: 'Cancelled'
  };
  const statePill = (stateName) =>
    `<span class="pill ${stateName}">${stateName === 'live' ? '<span class="pulse"></span>' : ''}${STATE_LABEL[stateName]}</span>`;
  const REG_LABEL = {
    registered: 'Registered',
    awaiting_verification: 'Awaiting email confirmation',
    pending_approval: 'Pending approval',
    waitlisted: 'Waitlisted',
    rejected: 'Rejected',
    revoked: 'Revoked'
  };
  const regPill = (status) => `<span class="pill ${status}">${REG_LABEL[status] || status}</span>`;

  const regsOf = (evId) => state.regs[evId] || (state.regs[evId] = []);
  const registeredCount = (ev) => ev.seedRegistered + regsOf(ev.id).filter((row) => row.status === 'registered').length;
  const isFull = (ev) => ev.form && (state.flags.forceFull || registeredCount(ev) >= ev.form.capacity);
  const myReg = (ev) =>
    state.session
      ? regsOf(ev.id).find((row) => row.email === state.session.email && row.status === 'registered')
      : null;
  const hostsText = (ev) => ev.hosts.map((host) => host.name).join(', ') || 'No host yet';

  /* ---------- validation (mirrors PRD invariants) ---------- */
  function validate(draft) {
    const errors = [];
    const warnings = [];
    const scheduled = draft.startsAt != null;
    const checks = [];
    const add = (ok, label, error) => {
      checks.push({ ok, label });
      if (!ok && error) errors.push(label);
    };
    add(!!draft.title.trim(), 'Title', true);
    add(draft.hosts.length > 0, 'At least one host', true);
    if (draft.meetingUrl && !scheduled) {
      checks.push({ ok: false, label: 'Meeting link needs a start time' });
      errors.push('Meeting link needs a start time');
    }
    if (scheduled) add(draft.durationMinutes > 0, 'Duration is a positive number', true);
    if (scheduled) {
      add(true, 'Start time set (' + draft.timezone.split('/')[1].replace('_', ' ') + ' time)');
    } else {
      add(!!draft.recording && draft.recording.status === 'published', 'Playable recording (on-demand event)', true);
    }
    if (draft.accessMode === 'form') {
      add(!!draft.form, 'Registration form attached', true);
    } else {
      add(!scheduled && !draft.meetingUrl, 'Public replay has no schedule or meeting link', true);
    }
    if (draft.accessMode === 'public' && state.flags.signupDisabled) {
      warnings.push(
        'This org has sign-up disabled. Public playback needs no login, so anyone can watch even though sign-up is closed.'
      );
    }
    return { errors, warnings, checks };
  }

  /* ---------- emails ---------- */
  const orgHeader = '<div class="m-head"><span class="mark">A</span>Acme Academy</div>';
  const orgFoot =
    '<div class="m-foot">Sent by Acme Academy (via ClassroomIO.com). You are receiving this because you registered for an event.</div>';

  function mailBody(kind, ev, extra) {
    const when = ev && ev.startsAt ? `${fmtDate(ev.startsAt, state.tz)} · ${fmtRange(ev)}` : '';
    const wrap = (inner) => `<div class="mail-paper">${orgHeader}<div class="m-body">${inner}</div>${orgFoot}</div>`;
    switch (kind) {
      case 'access':
        return wrap(
          `<h2>Confirm your spot: ${esc(ev.title)}</h2><p>Thanks for registering${extra.name ? ', ' + esc(extra.name.split(' ')[0]) : ''}. Confirm your email to get access. This link works once and expires in 24 hours.</p><a class="m-btn" href="#/redeem/${extra.grantId}">Watch event</a><p style="color:#6b7280;font-size:13px">No meeting link or calendar invite is included until you confirm.</p>`
        );
      case 'calendar':
        return wrap(
          `<h2>You're in: ${esc(ev.title)}</h2><p><b>${esc(when)}</b></p><p>Join link: <a href="${esc(ev.meetingUrl)}" style="color:var(--org)">${esc(ev.meetingUrl)}</a></p><div class="attach">${ico('calendar')} ${esc(ev.slug)}.ics · alarms 24h and 1h before</div>${courseLine(ev)}`
        );
      case 'reminder24':
        return wrap(
          `<h2>Tomorrow: ${esc(ev.title)}</h2><p><b>${esc(when)}</b></p><p>Join link: <a href="${esc(ev.meetingUrl)}" style="color:var(--org)">${esc(ev.meetingUrl)}</a></p><a class="m-btn" href="#/site/events/${ev.slug}">Open event page</a>`
        );
      case 'reminder1':
        return wrap(
          `<h2>Starting in 1 hour: ${esc(ev.title)}</h2><p><b>${esc(when)}</b></p><a class="m-btn" href="${esc(ev.meetingUrl)}">Join now</a>`
        );
      case 'rescheduled':
        return wrap(
          `<h2>New time for ${esc(ev.title)}</h2><p>The schedule changed. Your reminders have been updated.</p><p><b>${esc(when)}</b></p><div class="attach">${ico('calendar')} ${esc(ev.slug)}.ics (updated, same event)</div>`
        );
      case 'cancelled':
        return wrap(
          `<h2>${esc(ev.title)} was cancelled</h2><p>We're sorry, this event will not take place. Your calendar entry has been removed.</p><div class="attach">${ico('calendar')} ${esc(ev.slug)}.ics (CANCEL)</div>`
        );
      case 'replay':
        return wrap(
          `<h2>The replay is ready: ${esc(ev.title)}</h2><p>Missed it or want to watch again? The recording and slides are on the event page.</p><a class="m-btn" href="#/site/events/${ev.slug}">Watch the replay</a>${courseLine(ev)}`
        );
      case 'rejected':
        return wrap(
          `<h2>About your registration</h2><p>Thanks for your interest in ${esc(ev.title)}. We couldn't confirm a spot this time.</p>`
        );
      default:
        return wrap('');
    }
  }
  function courseLine(ev) {
    const course = state.courses.find((item) => item.id === ev.linkedCourseId);
    if (!course || ev.courseEnrollment !== 'on_registration') return '';
    return `<p style="margin-top:14px;padding:12px;border-radius:8px;background:#f5f3ff">${ico('graduation')} You've also been enrolled in <b>${esc(course.title)}</b>. Your certificate comes from that course.</p>`;
  }

  const MAIL_SUBJECT = {
    access: (ev) => `Confirm your spot: ${ev.title}`,
    calendar: (ev) => `You're in: ${ev.title} (calendar invite)`,
    reminder24: (ev) => `Tomorrow: ${ev.title}`,
    reminder1: (ev) => `Starting in 1 hour: ${ev.title}`,
    rescheduled: (ev) => `New time: ${ev.title}`,
    cancelled: (ev) => `Cancelled: ${ev.title}`,
    replay: (ev) => `Replay ready: ${ev.title}`,
    rejected: (ev) => `About your registration: ${ev.title}`
  };

  function sendMail(kind, ev, to, extra) {
    const mail = { id: uid('mail'), kind, evId: ev.id, to, at: now(), extra: extra || {} };
    state.mails.push(mail);
    state.inbox = to;
    return mail;
  }
  const inboxMails = () => state.mails.filter((mail) => mail.to === state.inbox).sort((a, b) => b.at - a.at);
  const unreadCount = () => inboxMails().filter((mail) => !state.mailsRead[mail.id]).length;

  /* ---------- side effects ---------- */
  function issueGrant(ev, row) {
    const grant = { id: uid('grant'), evId: ev.id, regId: row.id, email: row.email, used: false };
    state.grants.push(grant);
    sendMail('access', ev, row.email, { grantId: grant.id, name: row.name });
    return grant;
  }

  function submitRegistration(ev, fields) {
    if (state.flags.studentLimit) return { kind: 'closed' };
    const email = fields.email.trim().toLowerCase();
    const rows = regsOf(ev.id);
    let row = rows.find((item) => item.email === email);
    if (row && row.status === 'registered') {
      issueGrant(ev, row);
      return { kind: 'check-email', email };
    }
    if (row && row.status === 'awaiting_verification') {
      row.status = 'awaiting_verification';
      issueGrant(ev, row);
      return { kind: 'check-email', email };
    }
    if (!row) {
      row = {
        id: uid('r'),
        name: fields.name,
        email,
        company: fields.company,
        job: fields.job,
        status: 'awaiting_verification',
        at: now()
      };
      rows.push(row);
    }
    if (isFull(ev)) {
      row.status = 'waitlisted';
      state.inbox = email;
      return { kind: 'waitlisted', email };
    }
    if (ev.form.requireApproval) {
      row.status = 'pending_approval';
      state.inbox = email;
      return { kind: 'pending_approval', email };
    }
    row.status = 'awaiting_verification';
    issueGrant(ev, row);
    return { kind: 'check-email', email };
  }

  function redeem(grantId) {
    const grant = state.grants.find((item) => item.id === grantId);
    if (!grant) return { ok: false, reason: 'invalid' };
    const ev = getEvent(grant.evId);
    const row = regsOf(ev.id).find((item) => item.id === grant.regId);
    if (grant.used) {
      state.session = { name: row.name, email: row.email };
      return { ok: true, ev, again: true };
    }
    if (state.flags.studentLimit) return { ok: false, reason: 'limit' };
    if (
      ev.form &&
      ev.form.accessPolicy === 'existing_members_only' &&
      !state.team.some((member) => member.email === row.email)
    ) {
      return { ok: false, reason: 'members-only' };
    }
    grant.used = true;
    row.status = 'registered';
    state.session = { name: row.name, email: row.email };
    state.inbox = row.email;
    if (
      ev.linkedCourseId &&
      ev.courseEnrollment === 'on_registration' &&
      !state.enrollments.includes(ev.linkedCourseId)
    ) {
      state.enrollments.push(ev.linkedCourseId);
    }
    if (ev.startsAt && ev.meetingUrl) sendMail('calendar', ev, row.email);
    tick();
    return { ok: true, ev, again: false };
  }

  function promoteWaitlist(ev) {
    const row = regsOf(ev.id).find((item) => item.status === 'waitlisted');
    if (row) (issueGrant(ev, row), (row.status = 'awaiting_verification'));
    return row;
  }

  function sendToRegistered(kind, ev, extra) {
    regsOf(ev.id)
      .filter((row) => row.status === 'registered')
      .forEach((row) => sendMail(kind, ev, row.email, extra));
  }

  function tick() {
    state.events.forEach((ev) => {
      if (!ev.published || ev.cancelled || !ev.startsAt || !ev.meetingUrl) return;
      const t = now();
      regsOf(ev.id)
        .filter((row) => row.status === 'registered')
        .forEach((row) => {
          [
            ['h24', 24 * HOUR, 'reminder24'],
            ['h1', HOUR, 'reminder1']
          ].forEach(([key, offset, kind]) => {
            const sentKey = `${ev.id}:${row.email}:${key}:${ev.startsAt}`;
            if (ev.reminders[key] && !state.sent[sentKey] && t >= ev.startsAt - offset && t < ev.startsAt) {
              state.sent[sentKey] = true;
              sendMail(kind, ev, row.email);
            }
          });
        });
    });
  }

  /* ---------- rendering plumbing ---------- */
  const view = () => $('#view');
  const toast = (message) => {
    const node = $('#toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  };
  const go = (hash) => {
    if (location.hash === hash) render();
    else location.hash = hash;
  };

  function persona(path) {
    if (path.startsWith('admin')) return 'admin';
    if (path.startsWith('site') || path.startsWith('redeem')) return 'site';
    if (path.startsWith('inbox')) return 'inbox';
    if (path.startsWith('lms')) return 'lms';
    return 'map';
  }

  function chrome(path) {
    const active = persona(path);
    const tab = (key, href, label, extra) =>
      `<a href="${href}" class="${active === key ? 'on' : ''}">${label}${extra || ''}</a>`;
    const unread = unreadCount();
    const clock = `${fmtDate(now(), state.tz, true)}, ${fmtTime(now())} ${tzName(now())}`;
    $('#chrome').innerHTML = `
      <div class="pb-title">Events prototype</div>
      <nav class="pb-tabs">
        ${tab('map', '#/', 'Map')}
        ${tab('admin', '#/admin/events', 'Admin')}
        ${tab('site', '#/site', 'Public site')}
        ${tab('inbox', '#/inbox', 'Inbox', unread ? `<span class="pb-count">${unread}</span>` : '')}
        ${tab('lms', '#/lms/events', 'Learner LMS')}
      </nav>
      <div class="pb-spacer"></div>
      <span class="pb-clock" id="pbClock" title="Simulated time">${esc(clock)}</span>
      <button id="drawerBtn" type="button">Controls</button>
      <button id="themeBtn" type="button" aria-label="Toggle theme">${ico('sun')}</button>`;
  }

  function drawer() {
    const ev1 = getEvent('ev1');
    const presets = [
      ['Today', 'Event is 3 days away', BASE],
      ['24 hours before', '24h reminder fires', ev1.startsAt - 24 * HOUR + 2 * MIN],
      ['1 hour before', '1h reminder fires', ev1.startsAt - HOUR + 2 * MIN],
      ['Live now', 'Join link, live state', ev1.startsAt + 12 * MIN],
      ['Ended, no replay', 'Replay pending', ev1.startsAt + 90 * MIN]
    ];
    const flag = (key, label, hint) =>
      `<label class="flag"><span><b>${label}</b><br><span class="text-muted small">${hint}</span></span><span class="switch"><input type="checkbox" data-flag="${key}" ${state.flags[key] ? 'checked' : ''}><span class="track"></span><span class="knob"></span></span></label>`;
    $('#drawer').innerHTML = `
      <h4>Time travel (event 1)</h4>
      ${presets.map((preset, index) => `<button class="preset" type="button" data-preset="${index}">${preset[0]}<small>${preset[1]}</small></button>`).join('')}
      <h4>Viewer timezone</h4>
      <select class="select" id="tzSelect">${TIMEZONES.map((tz) => `<option ${tz === state.tz ? 'selected' : ''}>${tz}</option>`).join('')}</select>
      <h4>Scenarios</h4>
      ${flag('studentLimit', 'Org student limit reached', 'Blocks registration before any email is sent')}
      ${flag('forceFull', 'Event is at capacity', 'New registrations are waitlisted')}
      ${flag('signupDisabled', 'Org sign-up disabled', 'Shows the public-playback warning in the editor')}
      <h4>Prototype</h4>
      <button class="preset" type="button" id="resetBtn">Reset everything<small>Back to the seed data</small></button>`;
    $('#drawer').classList.toggle('open', ui.drawer);
  }

  /* ---------- admin ---------- */
  function adminShell(active, crumbs, bodyHtml, actions) {
    const nav = (href, icon, label, isActive, badge) =>
      `<a class="nav-item ${isActive ? 'active' : ''}" href="${href}">${ico(icon)}${label}${badge ? `<span class="nav-tail text-muted small">${badge}</span>` : ''}</a>`;
    return `
    <div class="app">
      <aside class="sidebar">
        <div class="brand"><div class="brand-mark">A</div><div class="brand-name">Acme Academy</div></div>
        ${nav('#/admin/events', 'home', 'Home', false)}
        <div class="nav-label">Content</div>
        ${nav('#/admin/events', 'book', 'Courses', false)}
        ${nav('#/admin/events', 'calendar', 'Events', active === 'events', state.events.filter((ev) => ev.published).length)}
        <div class="nav-label">People</div>
        ${nav('#/admin/events', 'users', 'Students', false)}
        ${nav('#/admin/events', 'settings', 'Settings', false)}
        <div class="sidebar-foot"><div class="avatar">MO</div><div class="who"><div class="nm">Maya Okafor</div><div class="rl">Admin</div></div></div>
      </aside>
      <div class="main">
        <header class="topbar"><nav class="crumbs">${crumbs}</nav><div class="top-actions">${actions || ''}</div></header>
        <div class="content"><div class="wrap">${bodyHtml}</div></div>
      </div>
    </div>`;
  }

  function viewAdminList() {
    const cards = state.events
      .map((ev) => {
        const st = derive(ev);
        const regs = ev.form || ev.seedRegistered ? `${registeredCount(ev)} registered` : 'Public replay';
        return `<div class="ev-card" data-go="#/admin/events/${ev.id}">
          <div class="cover sm" style="background:${COVERS[ev.cover % COVERS.length]}"><span class="cover-fmt format-badge">${esc(ev.format)}</span>${esc(ev.title)}</div>
          <div class="row-wrap">${statePill(st)}${ev.published ? '<span class="pill">Published</span>' : '<span class="pill">Not published</span>'}${ev.linkedCourseId ? `<span class="pill">${ico('graduation')} Course linked</span>` : ''}</div>
          <div class="meta">${ev.startsAt ? `${fmtDate(ev.startsAt, state.tz, true)} · ${fmtRange(ev)}` : 'On demand'}</div>
          <div class="row"><span class="row avatar-stack">${ev.hosts.map((host) => avatar(host.name)).join('') || '<span class="text-muted small">No hosts</span>'}</span><span class="grow"></span><span class="text-muted small">${regs}</span></div>
        </div>`;
      })
      .join('');
    return adminShell(
      'events',
      '<span class="here">Events</span>',
      `<div class="page-head"><div><h1 class="page-title">Events</h1><p class="page-sub">Webinars, livestreams and workshops. Events never appear in the Courses list.</p></div><button class="btn btn-primary" data-act="create-event">${ico('plus')} Create event</button></div>
       <div class="ev-grid">${cards}</div>`
    );
  }

  function validateNotice(v) {
    return v.warnings.map((text) => `<div class="notice warn">${ico('warn')}<div>${esc(text)}</div></div>`).join('');
  }

  function viewAdminEditor(id) {
    const ev = getEvent(id);
    if (!ev) return adminShell('events', '<span class="here">Not found</span>', '<p>Event not found.</p>');
    if (!ui.draft || ui.draft.id !== id) {
      ui.draft = structuredClone(ev);
      ui.dirty = false;
    }
    const d = ui.draft;
    const v = validate(d);
    const st = derive(d);
    const course = state.courses.find((item) => item.id === d.linkedCourseId);
    const rec = d.recording;
    const recHtml = !rec
      ? `<div class="recording-box"><div class="thumb">${ico('video')}</div><div class="grow"><b>No recording yet</b><div class="text-muted small">After the event, sync it from Zoom, upload a video or paste a YouTube link.</div></div></div>
         <div class="row-wrap mt-2"><button class="btn btn-outline btn-sm" data-act="rec-upload">${ico('upload')} Upload video</button><button class="btn btn-outline btn-sm" data-act="rec-youtube">${ico('link')} Paste YouTube link</button></div>
         <div class="notice mt-2">${ico('refresh')}<div><b>Zoom sync</b>: ${state.zoomConnected ? 'Connected as maya@acme.edu. When the cloud recording finishes, it is downloaded here for your review.' : 'Not connected.'}
         <div class="mt-1"><button class="btn btn-secondary btn-sm" data-act="zoom-toggle">${state.zoomConnected ? 'Disconnect Zoom' : 'Connect Zoom'}</button> <button class="btn btn-outline btn-sm" data-act="zoom-webhook" ${state.zoomConnected ? '' : 'disabled'}>Simulate recording.completed</button></div></div></div>`
      : rec.status === 'review'
        ? `<div class="recording-box"><div class="thumb">${ico('play')}</div><div class="grow"><b>Recording synced from Zoom</b> <span class="pill replay-pending">Needs review</span><div class="text-muted small">${esc(rec.duration)} · Not visible to anyone yet. Check for private Q&A before publishing.</div></div><button class="btn btn-primary btn-sm" data-act="rec-publish">Publish replay</button></div>`
        : `<div class="recording-box"><div class="thumb">${ico('play')}</div><div class="grow"><b>Replay published</b> <span class="pill on-demand">${esc(rec.source)}</span><div class="text-muted small">${esc(rec.duration)} · Registrants were emailed that the replay is ready.</div></div><button class="btn btn-outline btn-sm" data-act="rec-remove">Remove</button></div>`;

    const hostsHtml = d.hosts
      .map(
        (
          host
        ) => `<div class="host-row">${avatar(host.name, 'avatar-md')}<div class="grow"><b>${esc(host.name)}</b> ${host.kind === 'guest' ? '<span class="pill">Guest</span>' : '<span class="pill">Team member</span>'} ${host.status === 'invited' ? '<span class="pill pending_approval">Invite sent</span>' : ''}<div class="text-muted small">${esc(host.bio || host.email)}</div></div>
          <select class="select" style="width:190px" data-host-role="${host.id}"><option value="speaker" ${host.role === 'speaker' ? 'selected' : ''}>Speaker (display)</option><option value="manager" ${host.role === 'manager' ? 'selected' : ''}>Manager (can edit)</option></select>
          <button class="icon-btn" data-act="host-remove" data-id="${host.id}" aria-label="Remove host">${ico('x')}</button></div>`
      )
      .join('');
    const teamOptions = state.team.filter((member) => !d.hosts.some((host) => host.email === member.email));

    const regSection =
      d.accessMode === 'public'
        ? `<div class="notice">${ico('lock')}<div>Public replay: anyone can watch the recording without logging in. There is no registration form for this event.</div></div>`
        : d.form
          ? `<div class="host-row">${ico('file')}<div class="grow"><b>${esc(d.form.name)}</b><div class="chips mt-1">${d.form.fields.map((field) => `<span class="tag">${esc(field)}</span>`).join('')}</div></div><button class="btn btn-outline btn-sm" data-act="form-change">Change form</button></div>
             <div class="two">
               <div class="field"><label class="label">Capacity</label><input class="input" type="number" min="1" data-field="form.capacity" value="${d.form.capacity}"><div class="hint">Over capacity, registrations are waitlisted automatically.</div></div>
               <div class="field"><label class="label">Who can register</label><select class="select" data-field="form.accessPolicy" data-rerender><option value="public_registration" ${d.form.accessPolicy === 'public_registration' ? 'selected' : ''}>Anyone (creates an account if needed)</option><option value="existing_members_only" ${d.form.accessPolicy === 'existing_members_only' ? 'selected' : ''}>Existing members only</option></select><div class="hint">${d.form.accessPolicy === 'existing_members_only' ? 'Non-members get no usable access.' : 'Registration doubles as lead capture.'}</div></div>
             </div>
             <div class="f-row"><div><div class="t">Require approval</div><div class="text-muted small">Registrations wait for you before an access email is sent.</div></div><label class="switch"><input type="checkbox" data-field="form.requireApproval" ${d.form.requireApproval ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label></div>`
          : `<div class="notice warn">${ico('warn')}<div>No registration form attached. Registration is required for scheduled events.</div></div><div><button class="btn btn-secondary btn-sm" data-act="form-create">${ico('plus')} Create registration form</button></div>`;

    const courseSection = `
      <div class="field"><label class="label">Course</label><select class="select" data-field="linkedCourseId" data-rerender><option value="">None</option>${state.courses.map((item) => `<option value="${item.id}" ${item.id === d.linkedCourseId ? 'selected' : ''}>${esc(item.title)}</option>`).join('')}</select>
      <div class="hint">Registrants are enrolled in this course and earn its certificate. The event keeps its own page and registration record.</div></div>
      ${
        course
          ? `<div class="f-row"><div><div class="t">Enroll on registration</div><div class="text-muted small">Applies to future registrants once they confirm their email. Seats still count against the org's student limit.</div></div><label class="switch"><input type="checkbox" data-field="courseEnrollment" ${d.courseEnrollment === 'on_registration' ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label></div>
             <div><button class="btn btn-outline btn-sm" data-act="enroll-existing">Enroll ${regsOf(d.id).filter((row) => row.status === 'registered').length + d.seedRegistered} existing registrants</button></div>`
          : ''
      }`;

    const body = `
      <div class="page-head"><div><h1 class="page-title">${esc(d.title || 'Untitled event')}</h1><p class="page-sub">${statePill(st)} ${d.published ? 'Published' : 'Not published'} · ${registeredCount(d)} registered</p></div>
        <div class="row-wrap"><a class="btn btn-outline" href="#/admin/events/${d.id}/guests">${ico('users')} Guest list</a><a class="btn btn-outline" href="#/site/events/${d.slug}">Preview page</a>
        ${d.published ? `<button class="btn btn-secondary" data-act="unpublish">Unpublish</button>` : `<button class="btn btn-primary" data-act="publish" ${v.errors.length ? 'disabled' : ''}>Publish</button>`}</div></div>
      ${ui.editorNotice ? `<div class="notice ok mt-2">${ico('check')}<div>${esc(ui.editorNotice)}</div></div>` : ''}
      <div class="editor-grid mt-3">
        <div>
          <div class="fset"><div class="flegend">Details</div><div class="fdesc">What people see on the event page and in the catalog.</div>
            <div class="fgroup">
              <div class="field"><label class="label">Title</label><input class="input" data-field="title" value="${esc(d.title)}" placeholder="Event title"></div>
              <div class="two">
                <div class="field"><label class="label">Format</label><select class="select" data-field="format">${['webinar', 'livestream', 'workshop', 'meetup', 'session'].map((f) => `<option ${f === d.format ? 'selected' : ''}>${f}</option>`).join('')}</select><div class="hint">Badge and filter only. It never changes behavior.</div></div>
                <div class="field"><label class="label">Delivery</label><select class="select" data-field="delivery" data-rerender>${['online', 'in_person', 'hybrid'].map((f) => `<option value="${f}" ${f === d.delivery ? 'selected' : ''}>${f.replace('_', ' ')}</option>`).join('')}</select></div>
              </div>
              ${d.delivery !== 'online' ? `<div class="field"><label class="label">Location</label><input class="input" data-field="location" value="${esc(d.location)}" placeholder="Venue or city"><div class="hint">Display only. No venue management or check-in in v1.</div></div>` : ''}
              <div class="field"><label class="label">Description</label><textarea class="textarea" data-field="description" rows="4">${esc(d.description)}</textarea></div>
              <div class="field"><label class="label">Tags</label><input class="input" data-field="tagsText" value="${esc(d.tags.join(', '))}" placeholder="AI, Engineering"></div>
            </div></div>

          <div class="fset"><div class="flegend">Hosts</div><div class="fdesc">Team members or guest speakers. Guests get an email invite and do not need an account in your organization.</div>
            <div class="fgroup">${hostsHtml || '<div class="notice warn">' + ico('warn') + '<div>Add at least one host to publish.</div></div>'}
              <div class="row-wrap">
                <select class="select" style="width:220px" id="addTeamHost"><option value="">Add team member…</option>${teamOptions.map((member) => `<option value="${member.id}">${esc(member.name)} (${member.role})</option>`).join('')}</select>
                <span class="text-muted small">or invite a guest</span>
                <input class="input" style="width:190px" id="guestName" placeholder="Guest name"><input class="input" style="width:210px" id="guestEmail" placeholder="guest@email.com"><button class="btn btn-secondary btn-sm" data-act="host-invite">Send invite</button>
              </div></div></div>

          <div class="fset"><div class="flegend">Schedule and join link</div><div class="fdesc">Paste any Zoom, Meet, Teams or YouTube Live link. ClassroomIO does not host the video call. Times are saved in <b>${esc(d.timezone)}</b>.</div>
            <div class="fgroup"><div class="two">
              <div class="field"><label class="label">Starts</label><input class="input" type="datetime-local" data-field="startsAtInput" data-rerender value="${toLocalInput(d.startsAt, d.timezone)}"></div>
              <div class="field"><label class="label">Duration (minutes)</label><input class="input" type="number" min="1" data-field="durationMinutes" value="${d.durationMinutes || ''}" placeholder="60"></div>
              <div class="field"><label class="label">Timezone</label><select class="select" data-field="timezone" data-rerender>${TIMEZONES.map((tz) => `<option ${tz === d.timezone ? 'selected' : ''}>${tz}</option>`).join('')}</select></div>
              <div class="field"><label class="label">Meeting link</label><input class="input" data-field="meetingUrl" data-rerender-blur value="${esc(d.meetingUrl)}" placeholder="https://zoom.us/j/…"><div class="hint">Never shown to anonymous visitors.</div></div>
            </div>
            ${d.startsAt != null ? `<div><button class="btn btn-ghost btn-sm" data-act="clear-schedule">Remove schedule (make on-demand)</button></div>` : ''}
            </div></div>

          <div class="fset"><div class="flegend">Recording and resources</div><div class="fdesc">The recording and slides follow the same access rule as the event.</div>
            <div class="fgroup">${recHtml}
              ${d.resources.map((res) => `<div class="resource">${ico('file')}<div class="grow">${esc(res.name)}<div class="text-muted small">${esc(res.size)}</div></div></div>`).join('')}
              <div><button class="btn btn-outline btn-sm" data-act="resource-add">${ico('plus')} Add resource</button></div>
            </div></div>

          <div class="fset"><div class="flegend">Access</div><div class="fdesc">Who can watch and join.</div>
            <div class="fgroup">
              <label class="radio-card ${d.accessMode === 'form' ? 'on' : ''}"><input type="radio" name="am" value="form" data-field="accessMode" data-rerender ${d.accessMode === 'form' ? 'checked' : ''}><div><b>Registration required</b><div class="text-muted small">Recording, resources and meeting link appear after the visitor confirms their email.</div></div></label>
              <label class="radio-card ${d.accessMode === 'public' ? 'on' : ''}"><input type="radio" name="am" value="public" data-field="accessMode" data-rerender ${d.accessMode === 'public' ? 'checked' : ''}><div><b>Public replay</b><div class="text-muted small">On-demand recordings only. Anyone can watch without logging in. Not available for scheduled events.</div></div></label>
              ${validateNotice(v)}
              <div class="fgroup">${regSection}</div>
            </div></div>

          <div class="fset"><div class="flegend">Reminders</div><div class="fdesc">Sent by email to confirmed registrants only. Changing the start time recomputes them and sends an updated calendar file.</div>
            <div class="fgroup">
              <div class="f-row"><div class="t">24 hours before</div><label class="switch"><input type="checkbox" data-field="reminders.h24" ${d.reminders.h24 ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label></div>
              <div class="f-row"><div class="t">1 hour before</div><label class="switch"><input type="checkbox" data-field="reminders.h1" ${d.reminders.h1 ? 'checked' : ''}><span class="track"></span><span class="knob"></span></label></div>
              <div class="row-wrap"><button class="btn btn-outline btn-sm" data-act="email-all">${ico('mail')} Email all registrants</button></div>
            </div></div>

          <div class="fset"><div class="flegend">Linked course</div><div class="fdesc">Turn registrants into learners. Certificates come from the course, not the event.</div><div class="fgroup">${courseSection}</div></div>

          <div class="fset"><div class="flegend">Danger zone</div><div class="fdesc">Cancelling keeps the page, closes registration, emails registrants and removes their calendar entry.</div>
            <button class="btn btn-destructive btn-sm" data-act="cancel-event" ${d.cancelled || !d.published ? 'disabled' : ''}>Cancel event</button></div>
        </div>

        <aside class="sticky-aside">
          <div class="card card-pad"><div class="sec-title">Publish readiness</div><div class="mt-2">${v.checks.map((check) => `<div class="check ${check.ok ? 'ok' : 'no'}">${ico(check.ok ? 'check' : 'circle')}<span>${esc(check.label)}</span></div>`).join('')}</div></div>
          <div class="card card-pad"><div class="sec-title">Lifecycle</div><div class="mt-2">${statePill(st)}<p class="text-muted small mt-2">Derived from the schedule and recording. Never stored, so it can't go stale.</p></div></div>
          <div class="card card-pad"><div class="sec-title">What registrants get</div>
            <div class="check ok">${ico('mail')}<span>Access email with one-time link</span></div>
            <div class="check ${d.startsAt && d.meetingUrl ? 'ok' : 'no'}">${ico('calendar')}<span>Calendar invite after confirming</span></div>
            <div class="check ${d.startsAt && (d.reminders.h24 || d.reminders.h1) ? 'ok' : 'no'}">${ico('bell')}<span>Reminders${d.reminders.h24 ? ' (24h' : ''}${d.reminders.h1 ? (d.reminders.h24 ? ', 1h)' : ' (1h)') : d.reminders.h24 ? ')' : ''}</span></div>
            <div class="check ${course ? 'ok' : 'no'}">${ico('graduation')}<span>${course ? 'Enrolled in ' + esc(course.title) : 'No course linked'}</span></div>
          </div>
        </aside>
      </div>
      ${ui.dirty ? savebar() : ''}`;
    return adminShell(
      'events',
      `<a href="#/admin/events">Events</a><span class="sep">/</span><span class="here">${esc(d.title || 'New event')}</span>`,
      body
    );
  }
  const savebar = () =>
    `<div class="savebar" id="savebar"><span class="small"><b>Unsaved changes</b></span><button class="btn btn-secondary btn-sm" data-act="discard">Discard</button><button class="btn btn-primary btn-sm" data-act="save">Save changes</button></div>`;

  function viewAdminGuests(id) {
    const ev = getEvent(id);
    const rows = regsOf(id);
    const by = (status) => rows.filter((row) => row.status === status).length;
    const gl = rows
      .slice()
      .reverse()
      .map((row) => {
        let action = '<span class="text-muted small">—</span>';
        if (row.status === 'pending_approval')
          action = `<button class="btn btn-primary btn-sm" data-act="approve" data-id="${row.id}">Approve</button> <button class="btn btn-outline btn-sm" data-act="reject" data-id="${row.id}">Reject</button>`;
        if (row.status === 'waitlisted')
          action = `<button class="btn btn-secondary btn-sm" data-act="promote" data-id="${row.id}">Promote</button>`;
        if (row.status === 'awaiting_verification')
          action = `<button class="btn btn-outline btn-sm" data-act="resend" data-id="${row.id}">Resend</button>`;
        if (row.status === 'registered')
          action = `<button class="btn btn-ghost btn-sm" data-act="revoke" data-id="${row.id}">Revoke</button>`;
        return `<div class="gl-row"><div><b>${esc(row.name)}</b></div><div class="text-muted">${esc(row.email)}</div><div>${esc(row.company || '—')}</div><div>${esc(row.job || '—')}</div><div>${regPill(row.status)}</div><div>${action}</div></div>`;
      })
      .join('');
    return adminShell(
      'events',
      `<a href="#/admin/events">Events</a><span class="sep">/</span><a href="#/admin/events/${id}">${esc(ev.title)}</a><span class="sep">/</span><span class="here">Guest list</span>`,
      `<div class="page-head"><div><h1 class="page-title">Guest list</h1><p class="page-sub">${esc(ev.title)}. Answers come from the attached registration form.</p></div><div class="row-wrap"><button class="btn btn-outline" data-act="export">Export CSV</button><button class="btn btn-outline" data-act="email-all-guests">${ico('mail')} Email all registrants</button></div></div>
       <div class="stat-row mt-3"><div class="stat"><b>${registeredCount(ev)}</b>Registered${ev.form ? ` of ${ev.form.capacity}` : ''}</div><div class="stat"><b>${by('pending_approval')}</b>Pending approval</div><div class="stat"><b>${by('waitlisted')}</b>Waitlisted</div><div class="stat"><b>${by('awaiting_verification')}</b>Awaiting confirmation</div></div>
       <div class="notice mt-3">${ico('users')}<div>Showing the most recent registrations. ${ev.seedRegistered} earlier registrants are not listed in this prototype.</div></div>
       <div class="table-wrap mt-3"><div class="gl-head"><div>Name</div><div>Email</div><div>Company</div><div>Job title</div><div>Status</div><div></div></div>${gl || '<div class="gl-row"><span class="text-muted">No registrations yet.</span></div>'}</div>`
    );
  }

  /* ---------- public site ---------- */
  function siteShell(active, inner, wide) {
    const user = state.session
      ? `<a href="#/lms/events" class="row">${avatar(state.session.name)}<span class="small">${esc(state.session.name)}</span></a>`
      : `<button class="btn btn-outline btn-sm" data-act="signin">Sign in</button>`;
    const hasEvents = state.events.some((ev) => ev.published);
    return `<div class="site">
      <header class="site-head"><a class="site-brand" href="#/site"><span class="mark">A</span>Acme Academy</a>
        <nav class="site-nav"><a href="#/site">Home</a><a href="#/site">Courses</a>${hasEvents ? `<a href="#/site/events" class="${active === 'events' ? 'on' : ''}">Events</a>` : ''}</nav>${user}</header>
      ${inner}</div>`;
  }

  function ctaFor(ev) {
    const st = derive(ev);
    const reg = myReg(ev);
    if (st === 'cancelled') return { label: 'Event cancelled', disabled: true };
    if (st === 'draft') return { label: 'Not available', disabled: true };
    if (st === 'replay-pending') return { label: 'Replay coming soon', disabled: true };
    if (st === 'on-demand')
      return ev.accessMode === 'public' || reg ? { label: 'Watch now' } : { label: 'Register to watch' };
    if (reg) return st === 'live' ? { label: 'Join now' } : { label: 'Registered ✓', soft: true };
    return { label: st === 'live' ? 'Register to join' : 'Register' };
  }

  function pubCard(ev) {
    const st = derive(ev);
    const cta = ctaFor(ev);
    return `<div class="pub-card" data-go="#/site/events/${ev.slug}">
      <div class="cover" style="background:${COVERS[ev.cover % COVERS.length]}"><span class="cover-fmt format-badge">${esc(ev.format)}</span>${esc(ev.title)}</div>
      <div class="row-wrap">${statePill(st)}<span class="text-muted small">${ev.startsAt ? `${fmtDate(ev.startsAt, state.tz, true)} · ${fmtRange(ev)}` : 'On demand · ' + (ev.recording ? ev.recording.duration : '')}</span></div>
      <h3>${esc(ev.title)}</h3>
      <div class="row"><span class="avatar-stack">${ev.hosts.map((host) => avatar(host.name)).join('')}</span><span class="text-muted small">${esc(hostsText(ev))}</span></div>
      <div class="row-wrap">${ev.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
      <div><span class="btn ${cta.disabled ? 'btn-secondary' : cta.soft ? 'btn-secondary' : 'btn-primary'} btn-sm" ${cta.disabled ? 'style="opacity:.6"' : ''}>${esc(cta.label)}</span></div>
    </div>`;
  }

  function viewSiteLanding() {
    const events = state.events.filter((ev) => ev.published && derive(ev) !== 'draft').slice(0, 3);
    return siteShell(
      'home',
      `<section class="hero-land"><h1>Learn from the people building what's next.</h1><p class="text-muted" style="max-width:520px;font-size:16px">Courses, live events and on-demand sessions from Acme Academy.</p><div class="row-wrap mt-3"><a class="btn btn-primary btn-lg" href="#/site/events">Browse events</a><button class="btn btn-outline btn-lg">Explore courses</button></div></section>
       <div class="site-wrap">
         <div class="row"><h2 class="sec-title-lg grow">Courses</h2></div>
         <div class="ev-grid mt-3">${state.courses
           .slice(0, 3)
           .map(
             (course, index) =>
               `<div class="pub-card"><div class="course-ph" style="background:${COVERS[(index + 2) % 5]};color:#fff">${esc(course.title)}</div><div class="text-muted small">${course.lessons} lessons</div></div>`
           )
           .join('')}</div>
         <div class="row mt-4"><h2 class="sec-title-lg grow">Upcoming events &amp; sessions</h2><a class="btn btn-outline btn-sm" href="#/site/events">View all ${ico('arrow')}</a></div>
         <div class="ev-grid mt-3">${events.map(pubCard).join('')}</div>
         <p class="text-muted small mt-3">Events section is enabled in Landing page settings. It sits after Courses in all themes.</p>
       </div>`
    );
  }

  function viewSiteCatalog() {
    const all = state.events.filter((ev) => ev.published && derive(ev) !== 'draft');
    const match = (ev) => {
      const st = derive(ev);
      if (ui.tab === 'upcoming') return st === 'upcoming';
      if (ui.tab === 'live') return st === 'live';
      if (ui.tab === 'past') return st === 'on-demand' || st === 'replay-pending' || st === 'cancelled';
      return true;
    };
    const order = { live: 0, upcoming: 1, 'on-demand': 2, 'replay-pending': 3, cancelled: 4 };
    const list = all
      .filter(match)
      .sort((a, b) => order[derive(a)] - order[derive(b)] || (a.startsAt || 0) - (b.startsAt || 0));
    const tabs = [
      ['all', 'All'],
      ['upcoming', 'Upcoming'],
      ['live', 'Live now'],
      ['past', 'Past']
    ];
    return siteShell(
      'events',
      `<div class="site-wrap"><div class="row-wrap"><h1 class="sec-title-lg grow" style="font-size:30px">Events</h1><div class="tabs">${tabs.map(([key, label]) => `<button data-tab="${key}" class="${ui.tab === key ? 'on' : ''}">${label}</button>`).join('')}</div></div>
       <p class="text-muted mt-1">Times shown in your timezone (${esc(state.tz)}).</p>
       <div class="ev-grid mt-3">${list.map(pubCard).join('') || '<p class="text-muted">Nothing here right now.</p>'}</div></div>`
    );
  }

  function statusLine(ev, st) {
    if (st === 'upcoming') return `Live in ${relative(ev.startsAt - now())}`;
    if (st === 'live') return 'Live now';
    if (st === 'cancelled') return 'This event was cancelled';
    if (st === 'replay-pending') return 'Event has finished. Replay coming soon';
    return 'Event has finished';
  }

  function registrationCard(ev) {
    const result = state.regResult[ev.id];
    if (result && result.kind === 'check-email') {
      return `<div class="reg-card"><span class="center-icon">${ico('mail')}</span><h3 style="margin-top:12px">Check your email</h3><p class="text-muted">If we can register <b>${esc(result.email)}</b>, a confirmation link is on its way. Open it to unlock the event.</p>
        <div class="row-wrap mt-2"><button class="btn btn-primary" data-go="#/inbox">Open inbox (prototype)</button><button class="btn btn-ghost" data-act="resend-self">Resend email</button></div></div>`;
    }
    if (result && result.kind === 'waitlisted') {
      return `<div class="reg-card"><span class="center-icon">${ico('clock')}</span><h3 style="margin-top:12px">You're on the waitlist</h3><p class="text-muted">This event is full. We'll email <b>${esc(result.email)}</b> if a spot opens up.</p></div>`;
    }
    if (result && result.kind === 'pending_approval') {
      return `<div class="reg-card"><span class="center-icon">${ico('check')}</span><h3 style="margin-top:12px">Request received</h3><p class="text-muted">The organizers review each registration. You'll get an email with next steps.</p></div>`;
    }
    const st = derive(ev);
    if (st === 'replay-pending' || st === 'cancelled') {
      return `<div class="reg-card"><h3>Registration closed</h3><p class="text-muted">${st === 'cancelled' ? 'This event was cancelled.' : 'This event has finished. The replay will appear on this page.'}</p></div>`;
    }
    const full = isFull(ev);
    const label = full
      ? 'Join the waitlist'
      : ev.form.requireApproval
        ? 'Request to join'
        : st === 'on-demand'
          ? 'Register to watch the replay'
          : 'Register';
    return `<form class="reg-card" id="regForm"><h3>${st === 'on-demand' ? 'Watch the replay' : 'Reserve your spot'}</h3><p class="text-muted small">${esc(ev.form.name)}${full ? ' · This event is at capacity.' : ''}</p>
      ${state.flags.studentLimit ? `<div class="notice err mt-2">${ico('warn')}<div>Registration is currently closed for this organization. Please contact the organizers.</div></div>` : ''}
      <div class="fgroup mt-2">
        <div class="field"><label class="label">Full name</label><input class="input" name="name" required value="Jamie Chen"></div>
        <div class="field"><label class="label">Work email</label><input class="input" name="email" type="email" required value="jamie@example.com"></div>
        <div class="two"><div class="field"><label class="label">Company</label><input class="input" name="company" value="Contoso"></div><div class="field"><label class="label">Job title</label><input class="input" name="job" value="Training Manager"></div></div>
        <div class="field"><label class="label">What do you hope to learn?</label><textarea class="textarea" name="goal" rows="2"></textarea></div>
        <button class="btn btn-primary btn-lg" type="submit" ${state.flags.studentLimit ? 'disabled' : ''}>${label}</button>
      </div></form>`;
  }

  function viewSiteEvent(slug) {
    const ev = getEventBySlug(slug);
    if (!ev || !ev.published) return siteShell('events', `<div class="site-wrap"><h2>Event not found</h2></div>`);
    const st = derive(ev);
    const reg = myReg(ev);
    const cta = ctaFor(ev);
    const open = ev.accessMode === 'public' ? recordingReady(ev) : !!reg;
    const course = state.courses.find((item) => item.id === ev.linkedCourseId);
    const showRecording = recordingReady(ev) && open;

    let media = '';
    if (st === 'upcoming' || st === 'live') {
      if (reg && st === 'live') {
        media = `<div class="reg-card" style="background:linear-gradient(135deg,var(--org-soft),transparent)"><span class="pill live"><span class="pulse"></span>Live now</span><h3 style="margin-top:10px">The event has started</h3><a class="btn btn-primary btn-lg mt-2" href="${esc(ev.meetingUrl)}" target="_blank" rel="noopener">${ico('video')} Join the call</a><p class="text-muted small mt-2">${esc(ev.meetingUrl)}</p></div>`;
      } else if (reg) {
        media = `<div class="reg-card"><span class="pill registered">${ico('check')} You're registered</span><h3 style="margin-top:10px">Your join link</h3><p class="text-muted">Only registered attendees see this. We'll also email reminders.</p><div class="resource">${ico('link')}<div class="grow">${esc(ev.meetingUrl)}</div><button class="btn btn-outline btn-sm" data-act="copy-link">Copy</button></div></div>`;
      } else {
        media = registrationCard(ev);
      }
    } else if (st === 'on-demand') {
      media = showRecording
        ? `<div class="player"><span class="badge-tl pill on-demand">On demand · ${esc(ev.recording.duration)}</span><span class="play" data-act="play">${ico('play')}</span><div class="bar"><i id="playbar"></i></div></div>`
        : `<div class="gate">${ico('lock')}<b>Register to watch the replay</b><span class="small">Confirm your email and the recording unlocks on this page.</span></div>${registrationCard(ev)}`;
    } else if (st === 'replay-pending') {
      media = `<div class="gate">${ico('clock')}<b>Event has finished</b><span class="small">The replay is coming soon. This page will update automatically.</span></div>`;
    } else {
      media = `<div class="gate">${ico('x')}<b>This event was cancelled</b></div>`;
    }

    const cd =
      st === 'upcoming' ? `<div class="countdown" data-cd="${ev.id}">${cdHtml(ev.startsAt - now())}</div>` : '';
    const hero = `<div class="event-hero">
      <div class="cover" style="background:${COVERS[ev.cover % COVERS.length]};font-size:28px"><span class="cover-fmt format-badge">${esc(ev.format)}</span>${esc(ev.title)}</div>
      <div>${ev.startsAt ? `<div class="text-muted">${esc(fmtDate(ev.startsAt, state.tz))} · <b>${esc(fmtRange(ev))}</b></div>` : '<div class="text-muted">On demand</div>'}
        <h1>${esc(ev.title)}</h1>
        <div class="row-wrap">${statePill(st)}${ev.tags.map((tag) => `<span class="tag">${esc(tag)}</span>`).join('')}</div>
        <div class="mt-3"><button class="btn ${cta.disabled || cta.soft ? 'btn-secondary' : 'btn-primary'} btn-lg" data-act="cta" ${cta.disabled ? 'disabled' : ''}>${esc(cta.label)}</button></div>
        ${cd}</div></div>`;

    const resources = ev.resources.length
      ? `<h3 class="sec-title-lg mt-4" style="font-size:18px">Resources</h3><div class="fgroup mt-2">${ev.resources
          .map(
            (res) =>
              `<div class="resource">${ico('file')}<div class="grow">${esc(res.name)}<div class="text-muted small">${esc(res.size)}</div></div>${open || ev.accessMode === 'public' ? `<button class="btn btn-outline btn-sm" data-act="download">Download</button>` : `<span class="pill">${ico('lock')} Registrants only</span>`}</div>`
          )
          .join('')}</div>`
      : '';

    const hosts = ev.hosts
      .map(
        (host) =>
          `<div class="host-card">${avatar(host.name, 'avatar-lg')}<div><b>${esc(host.name)}</b>${host.kind === 'guest' ? ' <span class="pill">Guest speaker</span>' : ''}<div class="text-muted small">${esc(host.bio)}</div></div></div>`
      )
      .join('');

    const sideLines = [
      ev.startsAt ? `<div class="side-line">${ico('clock')}<div><b>${esc(statusLine(ev, st))}</b></div></div>` : '',
      ev.startsAt
        ? `<div class="side-line">${ico('calendar')}<div>${esc(fmtDate(ev.startsAt, state.tz))}<br><span class="text-muted">${esc(fmtRange(ev))}</span></div></div>`
        : '',
      `<div class="side-line">${ico('map')}<div>${ev.delivery === 'online' ? 'Online' : esc(ev.location || ev.delivery.replace('_', ' '))}</div></div>`,
      `<div class="side-line">${ico('users')}<div>${registeredCount(ev) + (ev.form ? '' : 0)} registered${ev.form ? ` · ${Math.max(0, ev.form.capacity - registeredCount(ev))} spots left` : ''}</div></div>`
    ].join('');

    const body = `<div class="event-body"><div>
        ${media}
        <div class="prose mt-4">${ev.description
          .split('\n\n')
          .map((p) => `<p>${esc(p)}</p>`)
          .join(
            ''
          )}${ev.bullets.length ? `<h3>What you'll learn</h3><ul>${ev.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}</div>
        ${resources}
        ${ev.callout ? `<div class="callout mt-4"><div>${esc(ev.callout.text)}</div><button class="btn btn-primary" data-act="callout">${esc(ev.callout.cta)}</button></div>` : ''}
        ${reg && course && ev.courseEnrollment === 'on_registration' ? `<div class="notice ok mt-3">${ico('graduation')}<div>You've been enrolled in <b>${esc(course.title)}</b>. <a class="text-primary" href="#/lms/learning"><u>Open your course</u></a>. Your certificate comes from the course.</div></div>` : ''}
        <h3 class="sec-title-lg mt-4" style="font-size:18px">Hosted by</h3><div class="fgroup mt-2">${hosts}</div>
      </div>
      <aside class="event-side">${sideLines}
        <button class="btn ${cta.disabled || cta.soft ? 'btn-secondary' : 'btn-primary'}" data-act="cta" ${cta.disabled ? 'disabled' : ''}>${esc(cta.label)}</button>
        ${reg && ev.startsAt ? `<button class="btn btn-outline" data-act="add-cal">${ico('calendar')} Add to calendar</button>` : ''}
        <div class="row-wrap"><span class="text-muted small">Share</span><button class="icon-btn" data-act="share" aria-label="Share on LinkedIn">in</button><button class="icon-btn" data-act="share" aria-label="Share on X">X</button><button class="icon-btn" data-act="share" aria-label="Share by email">${ico('mail')}</button></div>
      </aside></div>`;
    return siteShell('events', `<div class="site-wrap">${hero}${body}</div>`);
  }
  function cdHtml(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    const part = (value, label) =>
      `<div class="cd"><b>${String(value).padStart(2, '0')}</b><span>${label}</span></div>`;
    return (
      part(Math.floor(total / 86400), 'days') +
      part(Math.floor((total % 86400) / 3600), 'hours') +
      part(Math.floor((total % 3600) / 60), 'minutes') +
      part(total % 60, 'seconds')
    );
  }

  function viewRedeem(grantId) {
    const grant = state.grants.find((item) => item.id === grantId);
    if (!grant)
      return siteShell(
        'events',
        `<div class="center-card"><span class="center-icon">${ico('x')}</span><h2>This link isn't valid</h2><p class="text-muted">It may have expired or been replaced. Request a new link from the event page.</p></div>`
      );
    const ev = getEvent(grant.evId);
    return siteShell(
      'events',
      `<div class="center-card"><span class="center-icon">${ico('mail')}</span><h2>${grant.used ? 'Already confirmed' : 'Confirm your email'}</h2>
       <p class="text-muted">${grant.used ? 'This link has been used. Continue to the event page.' : `You're about to unlock <b>${esc(ev.title)}</b> as <b>${esc(grant.email)}</b>.`}</p>
       <button class="btn btn-primary btn-lg mt-2" data-act="redeem" data-id="${grant.id}" style="width:100%">${grant.used ? 'Continue to event' : 'Watch event'}</button>
       <p class="text-muted small mt-2">Opening this page doesn't use up the link. Email scanners can't confirm for you. Only this button does.</p></div>`
    );
  }

  /* ---------- inbox ---------- */
  function viewInbox(mailId) {
    const mails = inboxMails();
    if (!state.inbox) {
      return `<div class="inbox"><div class="inbox-list"><div class="inbox-head"><b>Inbox</b></div></div><div class="mail-view"><div class="center-card"><span class="center-icon">${ico('mail')}</span><h2>No mail yet</h2><p class="text-muted">Register for an event on the public site and the emails appear here.</p><a class="btn btn-primary" href="#/site/events/building-ai-agents-for-teams">Go to the webinar</a></div></div></div>`;
    }
    const sel = mails.find((mail) => mail.id === mailId) || mails[0];
    if (sel) state.mailsRead[sel.id] = true;
    const list = mails
      .map((mail) => {
        const ev = getEvent(mail.evId);
        return `<a class="mail-item ${sel && sel.id === mail.id ? 'on' : ''}" href="#/inbox/${mail.id}"><div class="subj">${state.mailsRead[mail.id] ? '' : '● '}${esc(MAIL_SUBJECT[mail.kind](ev))}</div><div class="snip">Acme Academy · ${esc(fmtStamp(mail.at))}</div></a>`;
      })
      .join('');
    const detail = sel
      ? `<div class="mail-meta"><b>To:</b> ${esc(sel.to)}<br><b>From:</b> Acme Academy (via ClassroomIO.com)<br><b>Sent:</b> ${esc(fmtStamp(sel.at))}</div>${mailBody(sel.kind, getEvent(sel.evId), sel.extra)}`
      : '';
    return `<div class="inbox"><div class="inbox-list"><div class="inbox-head"><b>${esc(state.inbox)}</b><div class="text-muted small">${mails.length} message${mails.length === 1 ? '' : 's'}</div></div>${list}</div><div class="mail-view">${detail}</div></div>`;
  }

  /* ---------- LMS ---------- */
  function lmsShell(active, bodyHtml) {
    const nav = (href, icon, label, isActive) =>
      `<a class="nav-item ${isActive ? 'active' : ''}" href="${href}">${ico(icon)}${label}</a>`;
    return `<div class="app"><aside class="sidebar"><div class="brand"><div class="brand-mark">A</div><div class="brand-name">Acme Academy</div></div>
      ${nav('#/lms/learning', 'book', 'My Learning', active === 'learning')}${nav('#/lms/events', 'calendar', 'Events', active === 'events')}${nav('#/site', 'home', 'Back to site', false)}
      <div class="sidebar-foot"><div class="avatar">${state.session ? esc(initials(state.session.name)) : '?'}</div><div class="who"><div class="nm">${state.session ? esc(state.session.name) : 'Signed out'}</div><div class="rl">Student</div></div></div></aside>
      <div class="main"><div class="content"><div class="wrap">${bodyHtml}</div></div></div></div>`;
  }
  function viewLmsEvents() {
    if (!state.session) {
      return lmsShell(
        'events',
        `<div class="center-card" style="margin:40px auto"><span class="center-icon">${ico('calendar')}</span><h2>Sign in to see your events</h2><p class="text-muted">Register for an event and confirm your email first. That signs you in.</p><a class="btn btn-primary" href="#/site/events/building-ai-agents-for-teams">Go to the webinar</a></div>`
      );
    }
    const mine = state.events.filter((ev) => ev.published && myReg(ev));
    const lib = state.events.filter((ev) => ev.published && derive(ev) === 'on-demand' && !mine.includes(ev));
    const cards = (list) =>
      list.length
        ? `<div class="ev-grid mt-2">${list.map(pubCard).join('')}</div>`
        : '<p class="text-muted mt-2">Nothing here yet.</p>';
    return lmsShell(
      'events',
      `<div class="page-head"><div><h1 class="page-title">Events</h1><p class="page-sub">Cards open the event page on your academy site.</p></div></div><div class="sec-title">Registered</div>${cards(mine)}<div class="sec-title mt-4">On-demand library</div>${cards(lib)}`
    );
  }
  function viewLmsLearning() {
    if (!state.session) return viewLmsEvents();
    const courses = state.courses.filter((course) => state.enrollments.includes(course.id));
    return lmsShell(
      'learning',
      `<div class="page-head"><div><h1 class="page-title">My Learning</h1><p class="page-sub">Events never appear here. Only courses do.</p></div></div>
       ${courses.length ? `<div class="ev-grid mt-2">${courses.map((course, index) => `<div class="ev-card"><div class="cover sm" style="background:${COVERS[(index + 2) % 5]}">${esc(course.title)}</div><div class="row-wrap"><span class="pill registered">Enrolled</span><span class="text-muted small">${course.lessons} lessons</span></div><div class="progress progress-thin"><div style="width:0%"></div></div><div class="text-muted small">0% complete · Enrolled through an event registration. Certificate on completion.</div></div>`).join('')}</div>` : '<div class="notice mt-2">' + ico('book') + '<div>No courses yet. Registering for an event linked to a course enrolls you automatically.</div></div>'}`
    );
  }

  /* ---------- map ---------- */
  function viewMap() {
    const steps = [
      [
        'Create the event',
        'Admin builds the webinar: hosts (including a guest speaker), schedule, join link, registration form, reminders and a linked course. Publish readiness updates live.',
        '#/admin/events/ev1',
        'Open editor'
      ],
      [
        'Discover it',
        'The event appears on the landing page, in the /events catalog with filters, and gets a branded detail page with a countdown and your local timezone.',
        '#/site',
        'Open public site'
      ],
      [
        'Register',
        'Fill in the form as a visitor. The page says "check your email" without revealing whether an account exists. Try the scenarios in Controls: at capacity, org limit reached.',
        '#/site/events/building-ai-agents-for-teams',
        'Open event page'
      ],
      [
        'Confirm from the inbox',
        'The access email has only a link: no meeting URL, no calendar file. Opening it shows an interstitial; only the button redeems.',
        '#/inbox',
        'Open inbox'
      ],
      [
        'Registered',
        'After redeeming you are signed in, enrolled in the linked course, and get the calendar email with the join link. The event page now shows the link and Add to calendar.',
        '#/site/events/building-ai-agents-for-teams',
        'Back to event'
      ],
      [
        'Time travel',
        'Controls → 24 hours before, then 1 hour before. Reminder emails arrive. Then Live now (join call), then Ended with no replay.',
        '#/inbox',
        'Watch the inbox'
      ],
      [
        'Reschedule or cancel',
        'In the editor, change the start time and save: registrants are emailed with an updated .ics and reminders are recomputed. Cancel does the same with a CANCEL.',
        '#/admin/events/ev1',
        'Open editor'
      ],
      [
        'Sync the recording',
        'After the event, simulate the Zoom recording.completed webhook, review the replay, publish it. Registrants get a replay-ready email and the page flips to on demand.',
        '#/admin/events/ev1',
        'Open editor'
      ],
      [
        'Manage guests',
        'Approve or reject (turn on "Require approval"), promote waitlisted people, resend confirmations, revoke.',
        '#/admin/events/ev1/guests',
        'Open guest list'
      ],
      [
        'Learner view',
        'The event appears under LMS Events. The linked course appears under My Learning. The event itself never does.',
        '#/lms/events',
        'Open LMS'
      ]
    ];
    return `<div class="map-wrap"><h1>Events: end-to-end prototype</h1><p class="text-muted">Clickable mock of <a class="text-primary" href="../../prd/events/README.md"><u>prd/events/README.md</u></a>. Nothing here is wired to the app. Use <b>Controls</b> (top right) to move time and flip scenarios.</p>
      <div class="mt-3">${steps.map((step, index) => `<div class="map-step"><span class="n">${index + 1}</span><div><b>${step[0]}</b><p>${step[1]}</p></div><a class="btn btn-outline btn-sm" href="${step[2]}">${step[3]}</a></div>`).join('')}</div></div>`;
  }

  /* ---------- router ---------- */
  function render() {
    const path = location.hash.replace(/^#\/?/, '');
    const parts = path.split('/');
    chrome(path);
    drawer();
    let html;
    if (parts[0] === 'admin') {
      if (parts[2] && parts[3] === 'guests') html = viewAdminGuests(parts[2]);
      else if (parts[2]) html = viewAdminEditor(parts[2]);
      else {
        ui.draft = null;
        ui.dirty = false;
        ui.editorNotice = '';
        html = viewAdminList();
      }
    } else if (parts[0] === 'site') {
      if (parts[1] === 'events' && parts[2]) html = viewSiteEvent(parts[2]);
      else if (parts[1] === 'events') html = viewSiteCatalog();
      else html = viewSiteLanding();
    } else if (parts[0] === 'redeem') html = viewRedeem(parts[1]);
    else if (parts[0] === 'inbox') html = viewInbox(parts[1]);
    else if (parts[0] === 'lms') html = parts[1] === 'learning' ? viewLmsLearning() : viewLmsEvents();
    else html = viewMap();
    view().innerHTML = html;
    if (parts[0] !== 'admin' || !parts[2]) window.scrollTo(0, 0);
  }

  /* ---------- actions ---------- */
  function commitDraft() {
    const draft = ui.draft;
    const ev = getEvent(draft.id);
    const rescheduled = ev.published && ev.startsAt !== draft.startsAt;
    draft.tags = draft.tags.filter(Boolean);
    Object.assign(ev, structuredClone(draft));
    if (rescheduled && ev.startsAt) {
      Object.keys(state.sent).forEach((key) => key.startsWith(ev.id + ':') && delete state.sent[key]);
      sendToRegistered('rescheduled', ev);
    }
    ui.dirty = false;
    ui.editorNotice = rescheduled
      ? 'Saved. Registrants were emailed the new time with an updated calendar file, and reminders were recomputed.'
      : 'Saved.';
    tick();
  }

  function setPath(obj, path, value) {
    const keys = path.split('.');
    const last = keys.pop();
    const target = keys.reduce((acc, key) => acc[key], obj);
    target[last] = value;
  }

  function onEditorChange(el) {
    const draft = ui.draft;
    if (!draft || !el.dataset.field) return;
    const field = el.dataset.field;
    let value =
      el.type === 'checkbox'
        ? el.checked
        : el.type === 'number'
          ? el.value === ''
            ? null
            : Number(el.value)
          : el.value;
    if (field === 'courseEnrollment') value = el.checked ? 'on_registration' : 'none';
    if (field === 'tagsText') {
      draft.tags = String(value)
        .split(',')
        .map((tag) => tag.trim());
    } else if (field === 'startsAtInput') {
      draft.startsAt = fromLocalInput(value, draft.timezone);
      if (draft.startsAt && !draft.durationMinutes) draft.durationMinutes = 60;
      if (!draft.startsAt) draft.durationMinutes = null;
      enforceAccess(draft);
    } else if (field === 'timezone') {
      const wall = toLocalInput(draft.startsAt, draft.timezone);
      draft.timezone = value;
      if (draft.startsAt) draft.startsAt = fromLocalInput(wall, value);
    } else if (field === 'meetingUrl') {
      draft.meetingUrl = value;
      enforceAccess(draft);
    } else if (field === 'accessMode') {
      draft.accessMode = value;
      if (value === 'public') {
        if (draft.startsAt != null || draft.meetingUrl) {
          draft.accessMode = 'form';
          ui.editorNotice =
            'Scheduled events and events with a meeting link must require registration, so we kept it on "Registration required".';
        }
      } else if (!draft.form) {
        draft.form = null;
      }
    } else {
      setPath(draft, field, value);
    }
    ui.dirty = true;
    if (el.hasAttribute('data-rerender') || field === 'accessMode') {
      render();
    } else {
      refreshAside();
    }
  }
  function enforceAccess(draft) {
    if ((draft.startsAt != null || draft.meetingUrl) && draft.accessMode === 'public') {
      draft.accessMode = 'form';
      ui.editorNotice = 'Switched to "Registration required": a scheduled event or meeting link cannot be public.';
    }
  }
  function refreshAside() {
    if (!ui.draft) return;
    const scrollY = window.scrollY;
    const active = document.activeElement;
    const key = active && active.dataset ? active.dataset.field : null;
    const caret = active && active.selectionStart != null ? active.selectionStart : null;
    render();
    window.scrollTo(0, scrollY);
    if (key) {
      const next = document.querySelector(`[data-field="${key}"]`);
      if (next) {
        next.focus();
        if (caret != null && next.setSelectionRange && next.type !== 'number' && next.type !== 'datetime-local')
          next.setSelectionRange(caret, caret);
      }
    }
  }

  function handleAction(act, el) {
    const ev1 = ui.draft ? getEvent(ui.draft.id) : null;
    switch (act) {
      case 'create-event': {
        const id = uid('ev');
        state.events.unshift({
          id,
          slug: 'new-event-' + id,
          title: '',
          description: '',
          bullets: [],
          format: 'webinar',
          delivery: 'online',
          location: '',
          startsAt: null,
          durationMinutes: null,
          timezone: 'America/New_York',
          meetingUrl: '',
          recording: null,
          accessMode: 'form',
          published: false,
          cancelled: false,
          tags: [],
          hosts: [],
          form: null,
          reminders: { h24: true, h1: true },
          linkedCourseId: '',
          courseEnrollment: 'none',
          resources: [],
          callout: null,
          seedRegistered: 0,
          cover: state.events.length % 5
        });
        state.regs[id] = [];
        go('#/admin/events/' + id);
        break;
      }
      case 'save':
        commitDraft();
        render();
        toast('Event saved');
        break;
      case 'discard':
        ui.draft = null;
        ui.dirty = false;
        ui.editorNotice = '';
        render();
        break;
      case 'publish':
        ui.draft.published = true;
        if (!ui.draft.slug || ui.draft.slug.startsWith('new-event'))
          ui.draft.slug = ui.draft.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        commitDraft();
        ui.editorNotice = 'Published. It now appears in the catalog and on the landing page.';
        render();
        break;
      case 'unpublish':
        ui.draft.published = false;
        commitDraft();
        render();
        break;
      case 'cancel-event': {
        ui.draft.cancelled = true;
        const ev = getEvent(ui.draft.id);
        Object.assign(ev, structuredClone(ui.draft));
        ui.dirty = false;
        sendToRegistered('cancelled', ev);
        ui.editorNotice =
          'Event cancelled. Registrants were emailed and their calendar entries cancelled. No more reminders will go out.';
        render();
        break;
      }
      case 'host-remove':
        ui.draft.hosts = ui.draft.hosts.filter((host) => host.id !== el.dataset.id);
        ui.dirty = true;
        render();
        break;
      case 'host-invite': {
        const name = $('#guestName').value.trim();
        const email = $('#guestEmail').value.trim();
        if (!name || !email) return toast('Enter a guest name and email');
        ui.draft.hosts.push({
          id: uid('h'),
          name,
          kind: 'guest',
          role: 'speaker',
          status: 'invited',
          bio: 'Invitation sent to ' + email,
          email
        });
        ui.dirty = true;
        toast('Invite sent. Guests do not become org members.');
        render();
        break;
      }
      case 'clear-schedule':
        ui.draft.startsAt = null;
        ui.draft.durationMinutes = null;
        ui.draft.meetingUrl = '';
        ui.dirty = true;
        render();
        break;
      case 'form-create':
      case 'form-change':
        ui.draft.form = {
          name: ui.draft.title ? ui.draft.title + ' registration' : 'Event registration',
          fields: ['Full name', 'Work email', 'Company'],
          capacity: 100,
          requireApproval: false,
          accessPolicy: 'public_registration'
        };
        ui.dirty = true;
        toast('Form attached (prototype: opens the Forms attach picker in the real app)');
        render();
        break;
      case 'rec-upload':
      case 'rec-youtube':
        ui.draft.recording = {
          status: 'published',
          source: act === 'rec-upload' ? 'upload' : 'youtube',
          duration: '58:12'
        };
        ui.dirty = true;
        render();
        break;
      case 'rec-remove':
        ui.draft.recording = null;
        ui.dirty = true;
        render();
        break;
      case 'rec-publish': {
        ui.draft.recording.status = 'published';
        const ev = getEvent(ui.draft.id);
        Object.assign(ev, structuredClone(ui.draft));
        ui.dirty = false;
        sendToRegistered('replay', ev);
        ui.editorNotice = 'Replay published. Confirmed registrants were emailed.';
        render();
        break;
      }
      case 'zoom-toggle':
        state.zoomConnected = !state.zoomConnected;
        render();
        break;
      case 'zoom-webhook': {
        const ev = getEvent(ui.draft.id);
        ev.recording = { status: 'review', source: 'zoom', duration: '58:12' };
        ui.draft.recording = structuredClone(ev.recording);
        ui.editorNotice =
          'Zoom sent recording.completed. The video was downloaded into your media library and is waiting for your review.';
        render();
        break;
      }
      case 'resource-add':
        ui.draft.resources.push({ name: 'Slides.pdf', size: '2.1 MB' });
        ui.dirty = true;
        render();
        break;
      case 'enroll-existing':
        toast('Enrolled all existing registrants (respecting the org student limit)');
        break;
      case 'email-all':
      case 'email-all-guests':
        toast('Compose a message to all confirmed registrants (prototype)');
        break;
      case 'export':
        toast('Downloaded registrations.csv');
        break;
      case 'approve':
      case 'promote':
      case 'resend': {
        const evId = location.hash.split('/')[3];
        const ev = getEvent(evId);
        const row = regsOf(evId).find((item) => item.id === el.dataset.id);
        row.status = 'awaiting_verification';
        issueGrant(ev, row);
        state.inbox = state.inbox || row.email;
        render();
        toast(act === 'resend' ? 'Replacement link sent, previous link revoked' : 'Access email sent to ' + row.email);
        break;
      }
      case 'reject': {
        const evId = location.hash.split('/')[3];
        const ev = getEvent(evId);
        const row = regsOf(evId).find((item) => item.id === el.dataset.id);
        row.status = 'rejected';
        sendMail('rejected', ev, row.email);
        render();
        break;
      }
      case 'revoke': {
        const evId = location.hash.split('/')[3];
        const row = regsOf(evId).find((item) => item.id === el.dataset.id);
        row.status = 'revoked';
        const ev = getEvent(evId);
        if (state.session && state.session.email === row.email) state.session = null;
        if (ev.form && isFull(ev) === false) promoteWaitlist(ev);
        render();
        toast('Access revoked. If someone is waitlisted, they were promoted.');
        break;
      }
      case 'signin':
        toast('Registered attendees are signed in when they confirm their email');
        break;
      case 'cta':
        handleCta();
        break;
      case 'resend-self': {
        const slug = location.hash.split('/')[3];
        const ev = getEventBySlug(slug);
        const row = regsOf(ev.id).find((item) => item.email === state.inbox);
        if (row) {
          issueGrant(ev, row);
          toast('If this address can register, a new link was sent. Older links stop working.');
        }
        break;
      }
      case 'redeem': {
        const result = redeem(el.dataset.id);
        if (!result.ok) {
          const reasons = {
            limit: 'Registration is closed for this organization.',
            'members-only': 'This event is for existing members only.',
            invalid: 'This link is not valid.'
          };
          toast(reasons[result.reason]);
          break;
        }
        go('#/site/events/' + result.ev.slug);
        toast(result.again ? 'Welcome back' : "You're registered. Check your inbox for the calendar invite.");
        break;
      }
      case 'play': {
        const bar = $('#playbar');
        if (bar) {
          bar.style.transition = 'width 3s linear';
          bar.style.width = '62%';
        }
        break;
      }
      case 'add-cal':
        toast('Downloaded event.ics (title, time, join link, alarms at 24h and 1h)');
        break;
      case 'copy-link':
        toast('Join link copied');
        break;
      case 'download':
        toast('Downloading resource');
        break;
      case 'share':
        toast('Opens a share dialog with the public event URL');
        break;
      case 'callout':
        go('#/lms/learning');
        break;
      default:
        break;
    }
    void ev1;
  }

  function handleCta() {
    const slug = location.hash.split('/')[3];
    const ev = getEventBySlug(slug);
    const st = derive(ev);
    const reg = myReg(ev);
    if (reg && st === 'live') return void window.open(ev.meetingUrl, '_blank');
    if (reg)
      return toast(st === 'upcoming' ? 'You are registered. The join link is on this page.' : 'Scroll up to watch');
    const form = $('#regForm');
    if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    else if (ev.accessMode === 'public') toast('Press play on the video');
  }

  /* ---------- events ---------- */
  document.addEventListener('click', (event) => {
    const actEl = event.target.closest('[data-act]');
    if (actEl) {
      event.preventDefault();
      handleAction(actEl.dataset.act, actEl);
      return;
    }
    const goEl = event.target.closest('[data-go]');
    if (goEl) {
      go(goEl.dataset.go);
      return;
    }
    const tabEl = event.target.closest('[data-tab]');
    if (tabEl) {
      ui.tab = tabEl.dataset.tab;
      render();
      return;
    }
    const preset = event.target.closest('[data-preset]');
    if (preset) {
      const ev1 = getEvent('ev1');
      const times = [
        BASE,
        ev1.startsAt - 24 * HOUR + 2 * MIN,
        ev1.startsAt - HOUR + 2 * MIN,
        ev1.startsAt + 12 * MIN,
        ev1.startsAt + 90 * MIN
      ];
      state.simBase = times[Number(preset.dataset.preset)];
      state.anchor = Date.now();
      tick();
      render();
      toast('Time moved to ' + fmtStamp(now()));
      return;
    }
    if (event.target.closest('#drawerBtn')) {
      ui.drawer = !ui.drawer;
      $('#drawer').classList.toggle('open', ui.drawer);
      return;
    }
    if (event.target.closest('#themeBtn')) {
      document.documentElement.classList.toggle('dark');
      try {
        localStorage.cioTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      } catch (err) {
        /* storage unavailable */
      }
      return;
    }
    if (event.target.closest('#resetBtn')) {
      state = seedState();
      ui.draft = null;
      ui.dirty = false;
      ui.editorNotice = '';
      go('#/');
      render();
      toast('Prototype reset');
    }
  });

  document.addEventListener('change', (event) => {
    const el = event.target;
    if (el.dataset.flag) {
      state.flags[el.dataset.flag] = el.checked;
      render();
      return;
    }
    if (el.id === 'tzSelect') {
      state.tz = el.value;
      render();
      return;
    }
    if (el.id === 'addTeamHost' && el.value && ui.draft) {
      const member = state.team.find((item) => item.id === el.value);
      ui.draft.hosts.push({
        id: uid('h'),
        name: member.name,
        kind: 'member',
        role: 'manager',
        status: 'active',
        bio: member.bio,
        email: member.email
      });
      ui.dirty = true;
      render();
      return;
    }
    if (el.dataset.hostRole && ui.draft) {
      ui.draft.hosts.find((host) => host.id === el.dataset.hostRole).role = el.value;
      ui.dirty = true;
      refreshAside();
      return;
    }
    if (el.dataset.field && el.type !== 'text' && el.tagName !== 'TEXTAREA') {
      onEditorChange(el);
    }
  });

  document.addEventListener('input', (event) => {
    const el = event.target;
    if (!el.dataset.field) return;
    if (el.type === 'text' || el.tagName === 'TEXTAREA') {
      const draft = ui.draft;
      if (!draft) return;
      if (el.dataset.field === 'tagsText') draft.tags = el.value.split(',').map((tag) => tag.trim());
      else if (el.dataset.field === 'meetingUrl') {
        draft.meetingUrl = el.value;
        enforceAccess(draft);
      } else setPath(draft, el.dataset.field, el.value);
      ui.dirty = true;
      softRefresh();
    }
  });

  function softRefresh() {
    const bar = $('#savebar');
    if (ui.dirty && !bar) document.body.insertAdjacentHTML('beforeend', savebar());
    const draft = ui.draft;
    if (!draft) return;
    const v = validate(draft);
    const aside = $('.sticky-aside .card .mt-2');
    if (aside)
      aside.innerHTML = v.checks
        .map(
          (check) =>
            `<div class="check ${check.ok ? 'ok' : 'no'}">${ico(check.ok ? 'check' : 'circle')}<span>${esc(check.label)}</span></div>`
        )
        .join('');
    const publishBtn = document.querySelector('[data-act="publish"]');
    if (publishBtn) publishBtn.disabled = v.errors.length > 0;
  }

  document.addEventListener('submit', (event) => {
    if (event.target.id !== 'regForm') return;
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.target));
    const slug = location.hash.split('/')[3];
    const ev = getEventBySlug(slug);
    const result = submitRegistration(ev, data);
    state.regResult[ev.id] = result;
    render();
    if (result.kind === 'closed') toast('Registration is closed for this organization');
  });

  window.addEventListener('hashchange', () => {
    ui.editorNotice = location.hash.includes('/admin/events/') ? ui.editorNotice : '';
    render();
  });

  /* ---------- clock ---------- */
  let lastSignature = '';
  setInterval(() => {
    const clockEl = $('#pbClock');
    if (clockEl) clockEl.textContent = `${fmtDate(now(), state.tz, true)}, ${fmtTime(now())} ${tzName(now())}`;
    document.querySelectorAll('[data-cd]').forEach((node) => {
      const ev = getEvent(node.dataset.cd);
      node.innerHTML = cdHtml(ev.startsAt - now());
    });
    const before = state.mails.length;
    tick();
    const signature = state.events.map((ev) => derive(ev)).join(',') + ':' + state.mails.length;
    if (signature !== lastSignature) {
      lastSignature = signature;
      const active = document.activeElement;
      const typing = active && /INPUT|TEXTAREA|SELECT/.test(active.tagName) && view().contains(active);
      if (!typing) render();
      if (state.mails.length > before) toast('New email in the inbox');
    }
  }, 1000);

  try {
    if (localStorage.cioTheme === 'dark') document.documentElement.classList.add('dark');
  } catch (err) {
    /* storage unavailable */
  }
  if (!location.hash) location.hash = '#/';
  render();
  lastSignature = state.events.map((ev) => derive(ev)).join(',') + ':' + state.mails.length;

  window.__eventsProto = { state: () => state, go, derive };
})();
