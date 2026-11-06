import { ic } from './ui.mjs';

export function frame(url, inner) {
  return `<div class="frame" role="img" aria-label="Illustrative product mockup"><div class="frame-bar"><i></i><i></i><i></i><span class="frame-url">${url}</span></div>${inner}</div>`;
}

function card(title, meta, pct, thumb = '') {
  return `<div class="m-card"><div class="m-thumb ${thumb}" style="padding:0"></div><div><b>${title}</b><span>${meta}</span><span class="bar"><i style="width:${pct}%"></i></span></div></div>`;
}

export function academy() {
  return frame(
    'learn.northwind.example',
    `<div class="m-top"><b class="m-logo"><i></i>Northwind Academy</b><span>Courses</span><span>My learning</span><span>Certificates</span><em class="m-btn">Sign in</em></div>
    <div class="m-banner"><small>Customer academy</small><h4>Get the most out of Northwind</h4><span>Short courses for admins and builders.</span><div class="m-search">Search courses…</div></div>
    <div class="m-cards">${card('Set up your workspace', '5 lessons · 40 min', 100)}${card('Automations basics', '7 lessons · 55 min', 45, 'b2')}${card('Admin certification', '9 lessons · 1 h 20', 12, 'b3')}</div>`
  );
}

export function editor() {
  return frame(
    'app.classroomio.com/courses/onboarding',
    `<div class="m-split">
      <div class="m-col"><span class="m-label">Outline</span><ul class="m-tree"><li>1. Welcome</li><li class="on">2. Connect your data</li><li class="sub">Lesson: Import a CSV</li><li class="sub">Exercise: Check your import</li><li>3. Invite your team</li><li>4. Final quiz</li></ul></div>
      <div class="m-col m-doc"><span class="m-pill">Lesson</span><h4>Import a CSV</h4><div class="m-block drafted"><span class="m-label">AI draft · review before publishing</span><div class="m-lines"><i></i><i></i><i></i></div></div><div class="m-block"><span class="m-label">Exercise</span><div class="m-lines"><i></i><i></i></div></div></div>
      <div class="m-col"><span class="m-label">AI assistant</span><div class="m-chat you">Draft a lesson on importing a CSV for new admins</div><div class="m-chat">Draft ready. Edit it, then publish when you are happy.</div><div class="m-step">${ic('check')}Outline</div><div class="m-step">${ic('check')}Lesson text</div><div class="m-step">${ic('check')}Exercise</div></div>
    </div>`
  );
}

export function analytics() {
  const bars = [30, 44, 38, 56, 62, 50, 72, 66, 80, 74]
    .map((height, index) => `<i class="${index > 6 ? 'hi' : ''}" style="height:${height}%"></i>`)
    .join('');
  return frame(
    'app.classroomio.com/analytics',
    `<div class="m-stats">
      <div class="m-stat"><small>Active learners</small><b>1,284</b><em>Sample data</em></div>
      <div class="m-stat"><small>Completion rate</small><b>68%</b><em>Sample data</em></div>
      <div class="m-stat"><small>Avg quiz score</small><b>82%</b><em>Sample data</em></div>
      <div class="m-stat"><small>Certificates issued</small><b>412</b><em>Sample data</em></div>
    </div>
    <div class="m-chart"><span class="m-label">Completions per week</span><div class="m-bars">${bars}</div></div>
    <div class="m-table">
      <div class="m-row"><span>Course</span><span>Learners</span><span>Completion</span></div>
      <div class="m-row"><b>Set up your workspace</b><span>864</span><span class="bar"><i style="width:84%"></i></span></div>
      <div class="m-row"><b>Automations basics</b><span>531</span><span class="bar"><i style="width:61%"></i></span></div>
      <div class="m-row"><b>Admin certification</b><span>287</span><span class="bar"><i style="width:43%"></i></span></div>
    </div>`
  );
}

export function cohort() {
  return frame(
    'learn.northwind.example/cohorts/spring',
    `<div class="m-top"><b class="m-logo"><i></i>Spring onboarding cohort</b><span class="m-pill">Week 3 of 6</span></div>
    <div class="m-two">
      <div class="m-pad"><span class="m-label">Cohort goal</span><b style="font-size:16px;color:var(--ink)">18 of 24 learners finished module 2</b><div class="m-meter"><i style="width:75%"></i></div>
        <span class="m-label" style="margin-top:6px">Members</span>
        <div class="m-person"><i class="m-av">AN</i><b>Amara N.</b><span class="m-pill">Module 3</span></div>
        <div class="m-person"><i class="m-av k2">DK</i><b>Daniel K.</b><span class="m-pill">Module 2</span></div>
        <div class="m-person"><i class="m-av k3">SL</i><b>Sofia L.</b><span class="m-pill sand">Not started</span></div>
      </div>
      <div class="m-pad" style="border-left:1px solid var(--sand-line);background:#fff"><span class="m-label">News feed</span>
        <div class="m-block"><b>Office hours on Thursday</b><div class="m-lines"><i></i><i></i></div></div>
        <div class="m-block"><b>Module 3 is open</b><div class="m-lines"><i></i><i></i></div></div>
      </div>
    </div>`
  );
}

export function plans() {
  const item = (text) => `<li>${ic('check')}${text}</li>`;
  return frame(
    'classroomio.com/pricing',
    `<div class="m-plans">
      <div class="m-plan"><span class="m-label">Free</span><b>$0</b><ul>${item('Up to 20 students')}${item('500K AI credits')}${item('MCP access')}</ul></div>
      <div class="m-plan hot"><span class="m-label">Early Adopter</span><b>$35<small style="font-size:11px;font-weight:500"> /mo</small></b><ul>${item('Up to 10,000 students')}${item('Custom domain and branding')}${item('Certificates')}${item('Unlimited collaborators')}</ul></div>
      <div class="m-plan"><span class="m-label">Enterprise</span><b>Quote</b><ul>${item('Unlimited students')}${item('SSO with OIDC')}${item('Up to 4 organizations')}</ul></div>
    </div>`
  );
}

export function certificate() {
  return frame(
    'app.classroomio.com/certificates/design',
    `<div class="m-two">
      <div><div class="m-cert"><span class="m-label">Northwind Academy</span><h4>Certificate of completion</h4><span>Awarded to</span><b style="font-size:15px;color:var(--ink)">Amara Nwosu</b><span>Admin certification</span><span class="seal">${ic('award')}</span></div></div>
      <div class="m-pad" style="border-left:1px solid var(--sand-line);background:#fff"><span class="m-label">Designer</span>
        <div class="m-field"><span>Title</span><b>Certificate of completion</b></div>
        <div class="m-field"><span>Signed by</span><b>Head of Education</b></div>
        <div class="m-field"><span>Logo</span><b>Uploaded</b></div>
        <div class="m-swatches"><i style="background:var(--blue)"></i><i style="background:var(--ink)"></i><i style="background:var(--sky)"></i><i style="background:var(--sand)"></i></div>
      </div>
    </div>`
  );
}

export function learner() {
  return frame(
    'learn.northwind.example/courses/automations',
    `<div class="m-lesson">
      <div class="m-pad"><span class="m-pill">Lesson 3 of 7</span><b style="font-size:16px;color:var(--ink)">Build your first automation</b><div class="m-video">${ic('play')}</div><div class="m-lines"><i></i><i></i><i></i></div><div class="bar"><i style="width:43%"></i></div><span class="muted">43% complete</span></div>
      <div class="m-col" style="border-right:0;border-left:1px solid var(--sand-line);background:#fff"><span class="m-label">AI tutor</span><div class="m-chat you">What triggers a run?</div><div class="m-chat">A run starts when the trigger in step 1 fires. Check lesson 2 for the trigger list.</div><span class="m-label" style="margin-top:6px">Next</span><div class="m-block"><b>Exercise: build and test</b></div></div>
    </div>`
  );
}

export function catalog() {
  const row = (title, state, count) =>
    `<div class="m-row"><b>${title}</b><span class="m-pill ${state === 'Draft' ? 'sand' : ''}">${state}</span><span>${count}</span></div>`;
  return frame(
    'app.classroomio.com/courses',
    `<div class="m-top"><b class="m-logo"><i></i>Courses</b><span class="m-pill">Unlimited courses on every plan</span><em class="m-btn">New course</em></div>
    <div class="m-table" style="margin-top:14px">
      <div class="m-row"><span>Course</span><span>Status</span><span>Students</span></div>
      ${row('Set up your workspace', 'Published', 864)}
      ${row('Automations basics', 'Published', 531)}
      ${row('Admin certification', 'Published', 287)}
      ${row('Reporting for managers', 'Draft', 0)}
      ${row('API quick start', 'Draft', 0)}
    </div>`
  );
}

export function seats() {
  return frame(
    'app.classroomio.com/settings/team',
    `<div class="m-top"><b class="m-logo"><i></i>Team</b><span class="m-pill">Unlimited collaborators</span><em class="m-btn">Invite</em></div>
    <div class="m-pad">
      <div class="m-person"><i class="m-av">MR</i><b>Maya R.</b><span class="m-pill">Customer education</span></div>
      <div class="m-person"><i class="m-av k2">JT</i><b>Jonas T.</b><span class="m-pill">Support</span></div>
      <div class="m-person"><i class="m-av k3">PA</i><b>Priya A.</b><span class="m-pill">Product</span></div>
      <div class="m-person"><i class="m-av k4">LC</i><b>Luis C.</b><span class="m-pill">Customer success</span></div>
    </div>`
  );
}

export function mini(kind) {
  if (kind === 'plans') {
    return `<div class="m-mini"><span class="m-label">Published plans</span><b>$0 · $35 · Quote</b><span>Free, Early Adopter and Enterprise. All on one page.</span></div>`;
  }
  if (kind === 'capacity') {
    return `<div class="m-mini"><span class="m-label">Student capacity</span><b>3,420 / 10,000</b><div class="m-meter"><i style="width:34%"></i></div><span>Archive a student to free a seat.</span></div>`;
  }
  if (kind === 'domain') {
    return `<div class="m-mini"><span class="m-label">Custom domain</span><b style="font-size:15px;font-family:var(--font-mono)">learn.northwind.example</b><div class="m-dns"><span class="m-pill">Verified</span><div class="m-swatches"><i style="background:var(--blue)"></i><i style="background:var(--ink)"></i><i style="background:var(--sky)"></i></div></div></div>`;
  }
  if (kind === 'price') {
    return `<div class="m-mini"><span class="m-label">Published plans</span><div style="display:flex;gap:18px"><div><b>Paid plan</b><br><span>your domain, branding and certificates</span></div><div><b>Free plan</b><br><span>build first, up to 20 students</span></div></div></div>`;
  }
  if (kind === 'structure') {
    return `<div class="m-mini"><span class="m-label">Available to your customers</span><div class="m-line"><b>Learning paths</b><span class="m-pill">Courses</span></div><div class="m-line"><b>Cohorts</b><span class="m-pill">Group</span></div><div class="m-line"><b>Live sessions</b><span class="m-pill">Scheduled</span></div></div>`;
  }
  if (kind === 'billing') {
    return `<div class="m-mini"><span class="m-label">Early Adopter</span><div class="m-toggle"><span class="on">Monthly</span><span>Yearly</span></div><b>$35 <small style="font-size:12px;font-weight:500">per month</small></b><span>Or $350 per year.</span></div>`;
  }
  if (kind === 'certificate') {
    return `<div class="m-mini"><span class="m-label">Certificate issued</span><b style="font-size:16px">Admin certification</b><span>Amara Nwosu · Northwind Academy</span><span class="m-pill" style="width:fit-content">Issued on completion</span></div>`;
  }
  if (kind === 'team') {
    return `<div class="m-mini"><span class="m-label">Collaborators</span><div style="display:flex"><i class="m-av">MR</i><i class="m-av k2" style="margin-left:-6px">JT</i><i class="m-av k3" style="margin-left:-6px">PA</i><i class="m-av k4" style="margin-left:-6px">LC</i></div><span>Support, product and success can all edit courses.</span></div>`;
  }
  return '';
}

export function api() {
  return frame(
    'app.classroomio.com/settings/api',
    `<pre class="m-code"><span class="c">// webhook payload sent to your endpoint</span>
{
  <span class="k">"event"</span>: <span class="s">"course.completed"</span>,
  <span class="k">"learner"</span>: <span class="s">"amara@example.com"</span>,
  <span class="k">"course"</span>: <span class="s">"Admin certification"</span>,
  <span class="k">"completedAt"</span>: <span class="s">"2026-10-21T09:14:00Z"</span>
}</pre>
    <div class="m-prompt"><span class="m-label" style="color:var(--sky)">MCP · agent drafting</span><span>Create onboarding training for this week's new customers<i class="caret"></i></span></div>`
  );
}

export const VIZ = { academy, editor, analytics, cohort, plans, certificate, learner, catalog, seats, api };

export function viz(name) {
  const make = VIZ[name];
  if (!make) throw new Error(`Unknown mockup: ${name}`);
  return make();
}

export function featureViz(name) {
  const strip = (inner) => `<div class="m-pad">${inner}</div>`;
  const table = {
    ai: strip(
      `<div class="m-chat you">Draft a lesson on importing a CSV</div><div class="m-block drafted"><span class="m-label">Draft ready · review before publishing</span><div class="m-lines"><i></i><i></i><i></i></div></div>`
    ),
    tutor: strip(
      `<div class="m-chat you">What triggers a run?</div><div class="m-chat">A run starts when the trigger in step 1 fires.</div>`
    ),
    domain: strip(mini('domain')),
    certs: strip(mini('certificate')),
    analytics: strip(
      `<div class="m-stat"><small>Completion rate</small><b>68%</b><em>Sample data</em></div><div class="m-bars" style="height:46px">${[30, 44, 38, 56, 62, 72].map((height, index) => `<i class="${index > 3 ? 'hi' : ''}" style="height:${height}%"></i>`).join('')}</div>`
    ),
    api: `<pre class="m-code">{ <span class="k">"event"</span>: <span class="s">"course.completed"</span>,
  <span class="k">"learner"</span>: <span class="s">"amara@example.com"</span> }</pre>`,
    mcp: `<div class="m-prompt"><span class="m-label" style="color:var(--sky)">MCP · agent drafting</span><span>Set up onboarding training for this week<i class="caret"></i></span></div>`,
    cohorts: strip(
      `<div class="m-meter"><i style="width:75%"></i></div><span>18 of 24 finished module 2</span><div class="m-block"><b>News feed: office hours Thursday</b></div>`
    ),
    seats: strip(mini('team')),
    structure: strip(mini('structure')),
    price: strip(mini('price')),
    capacity: strip(mini('capacity')),
    free: strip(
      `<div class="m-plan"><span class="m-label">Free</span><b>$0</b><span>Up to 20 students · 500K AI credits</span></div>`
    ),
    monthly: strip(mini('billing')),
    courses: strip(
      `<div class="m-line"><b>Set up your workspace</b><span class="m-pill">Published</span></div><div class="m-line"><b>Automations basics</b><span class="m-pill">Published</span></div><span class="m-pill sand" style="width:fit-content">Unlimited courses</span>`
    ),
    exercises: strip(
      `<div class="m-block"><span class="m-label">Exercise</span><b>Which step starts a run?</b></div><div class="m-person"><i class="m-av k2">✓</i><b>Auto-graded</b></div>`
    ),
    templates: strip(
      `<div class="m-block"><span class="m-label">Template</span><b>Onboarding course</b></div><span class="muted">Reuse it for each product line.</span>`
    ),
    plans: strip(mini('plans'))
  };
  return table[name] || '';
}
