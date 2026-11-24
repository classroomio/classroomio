/* course.js — instructor course pages. Every list page reads ?cohortId= (All cohorts · Direct · one cohort). */

const PAGE = params.get('page') || 'people';
const PAGE_LABEL = {
  newsfeed: 'News Feed',
  content: 'Content',
  attendance: 'Attendance',
  analytics: 'Analytics',
  submissions: 'Submissions',
  marks: 'Marks',
  people: 'People',
  settings: 'Settings'
};
const EXERCISES = ALL_ITEMS.filter((item) => item.kind === 'exercise');
const LIVE = ALL_ITEMS.filter((item) => item.kind === 'live');

const avg = (values) => (values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0);
const gradesOf = (student) => student.grades.filter((grade) => grade !== null);
const avgGrade = (students) => avg(students.flatMap(gradesOf));

/** Retake: one learner enrolled in Cohort 4 (previous) and Cohort 7 (current). */
const RETAKE_NAME = STUDENTS.find((student) => student.cohortId === 'c7').name;

function scopeLine(cohortId) {
  if (cohortId === 'all')
    return `All cohorts · ${plural(TOTAL_STUDENTS, 'student')} across ${COHORTS.length} cohorts and Direct`;
  if (cohortId === 'direct')
    return `Direct · ${plural(DIRECT.students, 'student')} enrolled through invites, free enroll or payment`;
  const cohort = cohortById(cohortId);
  return `${STATUS_LABEL[cohort.status]} · ${cohortRange(cohort)} · ${plural(cohort.students, 'student')}`;
}

function statusAlert(cohortId) {
  const cohort = cohortById(cohortId);
  if (!cohort || cohort.status === 'active' || cohort.status === 'direct') return '';

  const word = cohort.status === 'archived' ? 'archived' : 'inactive';
  return `<div class="alert alert-warning" style="margin-bottom:16px">${ICONS.info}<div class="alert-title">${cohort.name} is ${word}</div><div class="alert-description">Its students can no longer open the course through this cohort. Their progress and grades stay here, and staff keep access.</div></div>`;
}

function pageHead(title, { actions = '', sub = true } = {}) {
  const cohortId = currentCohortId();
  return `<div class="ph"><div class="grow"><h1 class="page-title">${title}</h1>${sub ? `<p>${scopeLine(cohortId)}</p>` : ''}</div>${actions}<button class="icon-btn" aria-label="Refresh">${ICONS.refresh}</button></div>${sub ? statusAlert(cohortId) : ''}`;
}

/* ------------------------------------------------------------------ people */

function renderPeople(cohortId) {
  const students = studentsIn(cohortId);
  const showCohort = cohortId === 'all';
  const rows = students
    .slice(0, 14)
    .map((student) => {
      const isRetake = student.name === RETAKE_NAME && ['c7', 'all'].includes(cohortId);
      const stage =
        student.progress === 0
          ? '<span class="badge badge-muted">Not started</span>'
          : `<span class="mut">${CONTENT[Math.min(5, Math.floor(student.progress / 17))].title.split(' · ')[1]}</span>`;
      return `<tr><td><div class="person"><span class="pic">${student.initials}</span><div><div>${student.name} <span class="badge badge-outline" style="font-size:11px">Student</span>${isRetake ? ' <span class="badge badge-primary-soft" style="font-size:11px" title="Also enrolled in Cohort 4 · Sep 26">Retake</span>' : ''}</div><div class="em">${student.email}</div></div></div></td>${showCohort ? `<td>${cohortCell(student.cohortId)}</td>` : ''}<td><div class="mini-prog"><div class="progress"><span style="width:${student.progress}%"></span></div><span class="tnum" style="font-size:12.5px">${student.progress}%</span></div></td><td>${stage}</td><td class="mut">${student.lastLogin}</td><td class="mut">${student.enrolled}</td><td><button class="icon-btn" style="border:none;box-shadow:none" aria-label="Actions">${ICONS.more}</button></td></tr>`;
    })
    .join('');
  const tutors = `<tr><td><div class="person"><span class="pic">KA</span><div><div>Kemi Adebayo <span class="badge badge-outline" style="font-size:11px">Tutor</span></div><div class="em">k********@udemy-test.demo</div></div></div></td>${showCohort ? '<td class="mut">All cohorts</td>' : ''}<td class="mut">—</td><td class="mut">—</td><td class="mut">Nov 15</td><td class="mut">Jul 5</td><td></td></tr>`;
  return `${pageHead('People', { actions: '<button class="btn btn-primary btn-sm" id="add-people" data-testid="course-people-add">Add</button>' })}
    <div class="pbar"><span class="grow"></span><div class="searchbox">${ICONS.search}Search people</div><button class="btn btn-outline btn-sm">${ICONS.filter}Filter</button></div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th>${showCohort ? '<th>Cohort</th>' : ''}<th>Progress</th><th>Stage</th><th>Last Login At</th><th>Enrolled At</th><th></th></tr></thead><tbody>${tutors}${rows}</tbody></table></div>
    <div class="tfoot-row"><span>Showing 1–${Math.min(14, students.length)} of ${students.length} students</span><span class="frow"><button class="btn btn-outline btn-sm" disabled>Previous</button><button class="btn btn-outline btn-sm" ${students.length <= 14 ? 'disabled' : ''}>Next</button></span></div>`;
}

function openAddPeople() {
  const cohortId = currentCohortId();
  const options = [...COHORTS.filter((cohort) => cohort.status === 'active').reverse(), DIRECT]
    .map(
      (cohort) =>
        `<option value="${cohort.id}" ${cohort.id === cohortId ? 'selected' : ''}>${cohort.name}${cohort.id === 'direct' ? ' (no cohort)' : ''}</option>`
    )
    .join('');
  const preset = cohortById(cohortId);
  const blockedCohort = preset && preset.status !== 'active' && preset.status !== 'direct';
  openDialog(
    `<div class="dialog-head"><h2 class="dialog-title">Add people</h2><p class="dialog-desc">Invite students by email or share the invite link.</p></div>
    <div class="dialog-body">
      ${blockedCohort ? `<div class="alert alert-warning" style="margin-bottom:14px">${ICONS.info}<div class="alert-title">${preset.name} is ${preset.status}</div><div class="alert-description">New students can’t join it. Pick an active cohort.</div></div>` : ''}
      <div class="field"><label class="label">Enroll into</label><select class="select" id="ap-cohort">${cohortId === 'all' || blockedCohort ? '<option value="" selected disabled>Choose a cohort or Direct</option>' : ''}${options}</select><p class="hint" id="ap-hint"></p></div>
      <div class="field"><label class="label">Emails</label><textarea class="textarea" placeholder="ada@example.com, tunde@example.com"></textarea></div>
    </div>
    <div class="dialog-foot"><button class="btn btn-outline btn-sm" data-close>Cancel</button><button class="btn btn-primary btn-sm" id="ap-send">Send invites</button></div>`,
    {
      onMount(root, close) {
        const select = root.querySelector('#ap-cohort');
        const hint = root.querySelector('#ap-hint');
        const send = root.querySelector('#ap-send');
        const sync = () => {
          const chosen = cohortById(select.value);
          send.disabled = !chosen;
          hint.textContent = !chosen
            ? 'Each student joins one cohort on this course, or Direct.'
            : chosen.id === 'direct'
              ? 'They join the course without a cohort and follow the course schedule.'
              : `They join ${chosen.name}’s roster and follow its schedule.`;
        };
        select.addEventListener('change', sync);
        sync();
        send.addEventListener('click', () => {
          close();
          toast(`Invites sent · joining ${cohortById(select.value).name}`);
        });
      }
    }
  );
}

/* ------------------------------------------------------------- submissions */

function renderSubmissions(cohortId) {
  const students = studentsIn(cohortId);
  const cards = [];
  students.forEach((student, index) => {
    EXERCISES.forEach((exercise, exIndex) => {
      if (student.grades[exIndex] === null && !(index % 4 === 0 && exIndex < 5)) return;

      const status =
        student.grades[exIndex] === null
          ? index % 8 === 0
            ? 'submitted'
            : 'progress'
          : index % 9 === 0 && exIndex === 3
            ? 'submitted'
            : 'graded';
      cards.push({ student, exercise, status });
    });
  });
  const column = (key, title) => {
    const list = cards.filter((card) => card.status === key);
    return `<div class="kcol"><h4><span class="n">${list.length}</span>${title}</h4>${list
      .slice(0, 6)
      .map(
        ({ student, exercise }) =>
          `<div class="kcard"><div class="person"><span class="pic" style="width:24px;height:24px;font-size:10px">${student.initials}</span><span style="font-size:13.5px">${student.name}</span></div><div class="ex">${exercise.title}</div><div class="when"><span>${fmtDate(generatedDate(exercise, cohortById(student.cohortId)))}</span>${cohortId === 'all' ? `<span>${cohortById(student.cohortId).name.split(' · ')[0]}</span>` : ''}</div></div>`
      )
      .join(
        ''
      )}${list.length > 6 ? `<div class="muted" style="font-size:12.5px;padding:4px 2px">+ ${list.length - 6} more</div>` : ''}</div>`;
  };
  return `${pageHead('Submitted Exercises')}
    <div class="pbar"><span style="color:var(--muted-foreground)">${ICONS.filter}</span><button class="btn btn-outline btn-sm">Student ${ICONS.chevDown}</button><button class="btn btn-outline btn-sm">Exercise ${ICONS.chevDown}</button><button class="btn btn-ghost btn-sm" style="text-decoration:underline;color:var(--muted-foreground)">Reset</button></div>
    <p class="muted" style="font-size:13px;margin:0 0 12px">${cards.length} of ${cards.length} submissions</p>
    <div class="kanban">${column('submitted', 'Submitted')}${column('progress', 'In Progress')}${column('graded', 'Graded')}</div>`;
}

/* ------------------------------------------------------------------- marks */

function renderMarks(cohortId) {
  const students = studentsIn(cohortId);
  const showCohort = cohortId === 'all';
  const head = EXERCISES.map(
    (exercise) =>
      `<th class="center" title="${exercise.title}" style="max-width:110px;overflow:hidden;text-overflow:ellipsis">${exercise.title}</th>`
  ).join('');
  const rows = students
    .slice(0, 16)
    .map((student) => {
      const cells = student.grades
        .map((grade) =>
          grade === null
            ? '<td class="center mut">-</td>'
            : `<td class="center tnum" style="${grade < 60 ? 'color:var(--destructive);background:color-mix(in oklab,var(--destructive) 7%,transparent)' : ''}">${grade}</td>`
        )
        .join('');
      const average = avg(gradesOf(student));
      return `<tr><td><div class="person"><span class="pic" style="width:24px;height:24px;font-size:10px">${student.initials}</span>${student.name}</div></td>${showCohort ? `<td>${cohortCell(student.cohortId)}</td>` : ''}${cells}<td class="center tnum"><b>${average || '-'}</b></td></tr>`;
    })
    .join('');
  return `${pageHead('Marks', { actions: '<div class="bgroup"><button class="btn btn-outline btn-sm">' + ICONS.download + 'Export as CSV</button><button class="btn btn-outline btn-sm" aria-label="Export options">' + ICONS.chevDown + '</button></div>' })}
    <div class="tbl-wrap" style="overflow:auto"><table class="tbl"><thead><tr><th>Student</th>${showCohort ? '<th>Cohort</th>' : ''}${head}<th class="center">Avg grade</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="tfoot-row"><span>Showing ${Math.min(16, students.length)} of ${students.length} students${cohortId === 'all' ? '' : ` · due dates follow ${cohortById(cohortId).name}’s schedule`}</span></div>`;
}

/* -------------------------------------------------------------- attendance */

function renderAttendance(cohortId) {
  if (cohortId === 'all') {
    const rows = [...COHORTS].reverse().map((cohort) => {
      const students = studentsIn(cohort.id);
      const held = LIVE.filter((item) => generatedDate(item, cohort) <= TODAY).length;
      return `<tr data-pick="${cohort.id}" style="cursor:pointer"><td>${cohortCell(cohort.id)}</td><td class="mut">${cohortRange(cohort)}</td><td class="num">${held} of ${LIVE.length}</td><td class="num">${held ? `${avg(students.map((student) => student.attendance))}%` : '—'}</td><td class="num">${students.length}</td><td style="width:40px">${ICONS.chevRight}</td></tr>`;
    });
    return `${pageHead('Attendance')}
      <div class="alert alert-information" style="margin-bottom:16px">${ICONS.info}<div class="alert-title">Attendance is taken per cohort</div><div class="alert-description">Each cohort meets on its own dates. Pick a cohort to mark attendance.</div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cohort</th><th>Runs</th><th class="num">Sessions held</th><th class="num">Avg attendance</th><th class="num">Students</th><th></th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  }

  const cohort = cohortById(cohortId);
  const sessions = LIVE.map((item) => ({
    item,
    date:
      item.id === 'l33' && cohortId !== 'direct'
        ? new Date(resolveField('l33', cohortId, 'lessonAt').value)
        : generatedDate(item, cohort)
  }));
  const head = sessions
    .map(
      ({ item, date }) =>
        `<th class="center" style="line-height:1.25">${item.title.replace('Live session: ', '')}<br /><span class="mut" style="font-weight:400;font-size:11.5px">${fmtDay(date)}</span></th>`
    )
    .join('');
  const rows = studentsIn(cohortId)
    .slice(0, 14)
    .map((student, row) => {
      const cells = sessions
        .map(({ date }, col) => {
          if (date > TODAY) return '<td class="center mut">—</td>';
          const present = (row * 3 + col * 7) % 10 < student.attendance / 10;
          return `<td class="center"><input type="checkbox" class="cbx" ${present ? 'checked' : ''} aria-label="Present" /></td>`;
        })
        .join('');
      return `<tr><td><div class="person"><span class="pic" style="width:24px;height:24px;font-size:10px">${student.initials}</span>${student.name}</div></td>${cells}</tr>`;
    })
    .join('');
  return `${pageHead('Attendance')}<div class="tbl-wrap" style="overflow:auto"><table class="tbl"><thead><tr><th>Student</th>${head}</tr></thead><tbody>${rows}</tbody></table></div><div class="tfoot-row"><span>Session dates are ${cohort.name}’s. Future sessions open on the day.</span></div>`;
}

/* --------------------------------------------------------------- analytics */

function renderAnalytics(cohortId) {
  const students = studentsIn(cohortId);
  const completed = students.filter((student) => student.progress >= 95).length;
  const atRisk = students.filter((student) => student.progress < 25 && student.cohortId !== 'c7').length;
  const stats = `<div class="stats">
    <div class="stat"><div class="k">Students</div><div class="v">${students.length}</div><div class="d">${cohortId === 'all' ? `${COHORTS.filter((cohort) => cohort.status === 'active').length} active cohorts` : cohortById(cohortId).name}</div></div>
    <div class="stat"><div class="k">Avg progress</div><div class="v">${avg(students.map((student) => student.progress))}%</div><div class="d">of ${LESSON_COUNT} lessons</div></div>
    <div class="stat"><div class="k">Avg grade</div><div class="v">${avgGrade(students)}%</div><div class="d">${EXERCISE_COUNT} exercises</div></div>
    <div class="stat"><div class="k">Completed</div><div class="v">${completed}</div><div class="d">${atRisk} at risk</div></div></div>`;

  if (cohortId !== 'all') {
    const bars = CONTENT.map((section, index) => {
      const share = Math.max(
        0,
        Math.min(100, avg(students.map((student) => Math.max(0, Math.min(100, (student.progress - index * 16.6) * 6)))))
      );
      return `<div class="frow" style="padding:7px 0;font-size:13.5px"><span style="width:220px">${section.title}</span><div class="progress" style="max-width:none"><span style="width:${share}%"></span></div><span class="tnum muted" style="width:46px;text-align:right">${share}%</span></div>`;
    }).join('');
    return `${pageHead('Analytics')}${stats}<div class="sec-label">Completion by week</div><div class="scard" style="padding:10px 18px">${bars}</div>`;
  }

  const rows = [...COHORTS]
    .reverse()
    .concat([DIRECT])
    .map((cohort) => {
      const list = studentsIn(cohort.id);
      return `<tr data-pick="${cohort.id}" style="cursor:pointer"><td>${cohortCell(cohort.id)}</td><td><span class="badge ${cohort.status === 'active' ? 'badge-success-soft' : 'badge-muted'}">${STATUS_LABEL[cohort.status]}</span></td><td class="num">${list.length}</td><td><div class="mini-prog"><div class="progress"><span style="width:${avg(list.map((student) => student.progress))}%"></span></div><span class="tnum" style="font-size:12.5px">${avg(list.map((student) => student.progress))}%</span></div></td><td class="num">${avgGrade(list) || '—'}%</td><td class="num">${list.filter((student) => student.progress >= 95).length}</td><td style="width:40px">${ICONS.chevRight}</td></tr>`;
    })
    .join('');
  return `${pageHead('Analytics')}${stats}<div class="sec-label">Cohorts taking this course</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cohort</th><th>Status</th><th class="num">Students</th><th>Avg progress</th><th class="num">Avg grade</th><th class="num">Completed</th><th></th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/* ---------------------------------------------------------------- newsfeed */

function renderNewsfeed(cohortId) {
  const posts = POSTS.filter((post) => postVisibleIn(post, cohortId));
  const list = posts
    .map(
      (post) =>
        `<div class="post"><div class="top"><span class="avatar" style="width:28px;height:28px;font-size:11px">${post.author
          .split(' ')
          .map((part) => part[0])
          .join(
            ''
          )}</span><div class="grow"><div style="font-size:13.5px;font-weight:500">${post.author}</div><div class="t">${post.when}</div></div>${audienceBadge(post.audience)}</div><p>${post.body}</p><div class="foot"><span class="frow" style="gap:5px">${ICONS.heart}${post.likes}</span><span class="frow" style="gap:5px">${ICONS.message}${post.comments}</span></div></div>`
    )
    .join('');
  const hint =
    cohortId === 'all'
      ? ''
      : `<p class="muted" style="font-size:12.5px;margin:-8px 0 14px">Showing posts for ${cohortById(cohortId).name} and posts to everyone.</p>`;
  return `${pageHead('News Feed', { actions: '<button class="btn btn-primary btn-sm" id="add-post">Add</button>' })}${hint}<div id="posts">${list || '<div class="empty"><h3>No post yet</h3><p>Make a post to your class.</p></div>'}</div>`;
}

function openAddPost() {
  const cohortId = currentCohortId();
  const options = [
    `<option value="all" ${cohortId === 'all' ? 'selected' : ''}>Everyone on this course</option>`,
    ...[...COHORTS]
      .reverse()
      .concat([DIRECT])
      .map(
        (cohort) =>
          `<option value="${cohort.id}" ${cohort.id === cohortId ? 'selected' : ''}>${cohort.name}${cohort.id === 'direct' ? ' (no cohort)' : ''} · ${cohort.students}</option>`
      )
  ].join('');
  openDialog(
    `<div class="dialog-head"><h2 class="dialog-title">New post</h2></div>
     <div class="dialog-body"><div class="field"><label class="label">Post to</label><select class="select" id="np-aud">${options}</select><p class="hint" id="np-hint"></p></div><div class="field"><textarea class="textarea" id="np-body" placeholder="Share an update with your class">Reminder: office hours are Thursday at 5pm.</textarea></div></div>
     <div class="dialog-foot"><button class="btn btn-outline btn-sm" data-close>Cancel</button><button class="btn btn-primary btn-sm" id="np-post">Post</button></div>`,
    {
      onMount(root, close) {
        const audience = root.querySelector('#np-aud');
        const hint = root.querySelector('#np-hint');
        const sync = () => {
          const target = audience.value === 'all' ? null : cohortById(audience.value);
          hint.textContent = target
            ? `Only ${target.name}’s ${target.students} students and staff see it.`
            : `All ${TOTAL_STUDENTS} students see it, in every cohort.`;
        };
        audience.addEventListener('change', sync);
        sync();
        root.querySelector('#np-post').addEventListener('click', () => {
          POSTS.unshift({
            id: `p${Date.now()}`,
            author: 'Admin Test',
            audience: audience.value,
            when: 'Just now',
            body: root.querySelector('#np-body').value,
            likes: 0,
            comments: 0
          });
          close();
          render();
          toast(`Posted to ${audience.value === 'all' ? 'everyone' : cohortById(audience.value).name}`);
        });
      }
    }
  );
}

/* ----------------------------------------------------------------- content */

function renderContent() {
  const sections = CONTENT.map(
    (section, index) =>
      `<div class="sec-label" style="display:flex;gap:8px;margin-top:${index ? 18 : 0}px">${index + 1}. ${section.title.split(' · ')[1]}<span class="muted" style="margin-left:auto;font-weight:400;font-size:12px">${section.items.length} items</span></div><div class="tbl-wrap">${section.items
        .map((item) => {
          const meta =
            item.kind === 'live'
              ? `<span class="muted" style="font-size:12px">${ICONS.calendar.replace('<svg', '<svg style="width:12px;height:12px;vertical-align:-2px"')} Scheduled per cohort</span>`
              : item.kind === 'exercise'
                ? `<span class="muted" style="font-size:12px">${item.questions} questions · due per cohort</span>`
                : '';
          return `<a href="lesson.html?item=${item.id}" class="frow" style="padding:10px 14px;border-bottom:1px solid var(--border);font-size:13.5px">${ICONS[item.kind === 'exercise' ? 'exercise' : item.kind === 'live' ? 'live' : 'lesson'].replace('<svg', `<svg style="color:${item.kind === 'exercise' ? 'var(--success)' : '#3b82f6'}"`)}<span class="grow">${item.title}</span>${meta}</a>`;
        })
        .join('')}</div>`
  ).join('');
  return `<div class="ph"><div class="grow"><h1 class="page-title">${COURSE.title}</h1><p>${LESSON_COUNT} lessons · ${EXERCISE_COUNT} exercises · shared by ${COHORTS.length} cohorts</p></div><button class="btn btn-outline btn-sm">${ICONS.plus}Add</button></div>${sections}`;
}

/* ---------------------------------------------------------------- settings */

function renderSettings() {
  return `<div class="ph"><div class="grow"><h1 class="page-title">Settings</h1></div><button class="icon-btn" aria-label="Refresh">${ICONS.refresh}</button></div>
    <div class="sec-label" style="margin-top:0">General</div>
    <div class="scard"><dl class="kv"><dt>Course title</dt><dd>${COURSE.title}</dd><dt>Course type</dt><dd>${COURSE.type}</dd><dt>Course link</dt><dd class="muted">localhost:5173/course/data-analysis</dd></dl></div>
    <div class="sec-label" id="merge-history">Merge history</div>
    <div data-merge-view="merged" class="scard">
      <h3>Merged copies</h3><p class="sd">Undo restores every copy as it was at merge time, with its students and activity.</p>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Merged</th><th>By</th><th>Courses</th><th>Undo until</th><th></th></tr></thead><tbody>
        <tr><td>Nov 16, 2026</td><td>Admin Test</td><td>6 copies into ${COURSE.title}</td><td><span class="badge badge-secondary">Dec 16, 2026 · 30 days left</span></td><td class="num"><button class="btn btn-outline btn-sm" id="undo-merge" data-testid="course-merge-undo">${ICONS.undo}Undo merge</button></td></tr>
      </tbody></table></div>
      <p class="hint" style="margin-top:10px">After Dec 16 the merge is final and archived copies are cleaned up. <button class="btn-link" style="font-size:12px" id="finalize">Finalize now</button></p>
    </div>
    <div data-merge-view="undone" class="scard" hidden><h3>Merged copies</h3><p class="sd" style="margin:0">Merge of Nov 16 undone on Nov 18 by Admin Test. 6 courses restored.</p></div>
    <div data-merge-view="none" class="empty" hidden><div class="ic">${ICONS.merge}</div><h3>No merges</h3><p>Courses merged into this one show here for 30 days, with an Undo option.</p></div>`;
}

function openUndoMerge() {
  openDialog(
    `<div class="dialog-head"><h2 class="dialog-title">Undo merge?</h2><p class="dialog-desc">Restores the 6 copies merged into ${COURSE.title} on Nov 16.</p></div>
    <div class="dialog-body" style="font-size:13.5px;line-height:1.6">
      <div class="sec-label" style="margin:0 0 6px;font-size:13px">What comes back</div>
      <ul style="margin:0 0 14px;padding-left:18px">
        <li>6 courses with their original titles and links</li>
        <li>108 enrollments move back with their cohorts (Cohort 1–6)</li>
        <li>186 submissions, 1,154 answers and 781 lesson completions</li>
      </ul>
      <div class="sec-label" style="margin:0 0 6px;font-size:13px">Activity since the merge</div>
      <ul style="margin:0 0 14px;padding-left:18px">
        <li>94 lesson completions and 31 submissions move to the matching item in each restored copy</li>
        <li><b>Week 4</b>: 3 lessons and 1 project will be added to the restored <i>23rd August</i> and <i>05th September</i> courses, with 12 lesson completions</li>
      </ul>
      <div class="alert alert-default">${ICONS.info}<div class="alert-description">Content edits made to ${COURSE.title} since the merge stay on ${COURSE.title}.</div></div>
    </div>
    <div class="dialog-foot"><button class="btn btn-outline btn-sm" data-close>Cancel</button><button class="btn btn-destructive btn-sm" id="undo-go">Undo merge</button></div>`,
    {
      wide: true,
      onMount: (root) =>
        root.querySelector('#undo-go').addEventListener('click', () => (location.href = 'merge.html?undo=1'))
    }
  );
}

/* ------------------------------------------------------------------- mount */

const RENDER = {
  people: renderPeople,
  submissions: renderSubmissions,
  marks: renderMarks,
  attendance: renderAttendance,
  analytics: renderAnalytics,
  newsfeed: renderNewsfeed,
  content: renderContent,
  settings: renderSettings
};

function render() {
  const cohortId = currentCohortId();
  const host = document.getElementById('page');
  host.innerHTML = RENDER[PAGE](cohortId);
  host.querySelector('#add-people')?.addEventListener('click', openAddPeople);
  host.querySelector('#add-post')?.addEventListener('click', openAddPost);
  host.querySelector('#undo-merge')?.addEventListener('click', openUndoMerge);
  host
    .querySelector('#finalize')
    ?.addEventListener('click', () =>
      toast('Finalizing early is an admin action with its own confirm (not prototyped)')
    );
  host.querySelectorAll('[data-pick]').forEach((row) =>
    row.addEventListener('click', () => {
      setParam('cohortId', row.dataset.pick);
      document.getElementById('cohort-filter').innerHTML = '';
      mountCohortFilter(document.getElementById('cohort-filter'));
      refreshCourseNavLinks();
      render();
    })
  );
  document.dispatchEvent(new CustomEvent('pagerender'));
}

document.addEventListener('DOMContentLoaded', () => {
  document.title = `${PAGE_LABEL[PAGE]} · ${COURSE.title} - ClassroomIO`;
  mountCourseShell({
    active: PAGE_LABEL[PAGE],
    label: PAGE_LABEL[PAGE],
    filter: FILTER_PAGES.includes(PAGE),
    treeOpen: PAGE === 'content'
  });
  finishMount();
  document.getElementById('page').classList.toggle('narrow', ['newsfeed', 'settings', 'content'].includes(PAGE));
  render();
  document.addEventListener('cohortchange', render);

  const bar = document.querySelector('.state-bar');
  if (PAGE === 'settings') {
    bar.innerHTML =
      '<span class="lbl">Merge history</span><button data-state="merged">Has a merge</button><button data-state="undone">Undone</button><button data-state="none">No merges</button><a href="index.html">← Map</a>';
    bar.querySelectorAll('[data-state]').forEach((button) =>
      button.addEventListener('click', () => {
        bar.querySelectorAll('[data-state]').forEach((other) => other.classList.toggle('on', other === button));
        document
          .querySelectorAll('[data-merge-view]')
          .forEach((view) => (view.hidden = view.dataset.mergeView !== button.dataset.state));
      })
    );
    bar.querySelector('[data-state="merged"]').classList.add('on');
    if (location.hash === '#merge-history') document.getElementById('merge-history').scrollIntoView();
    return;
  }

  const pages = Object.keys(PAGE_LABEL).filter((page) => !['content', 'settings'].includes(page));
  bar.innerHTML = `<span class="lbl">Page</span>${pages.map((page) => `<a href="${coursePageHref(page)}" class="${page === PAGE ? 'on' : ''}" style="${page === PAGE ? 'background:#fff;color:#0a0a0a' : ''}">${PAGE_LABEL[page]}</a>`).join('')}<a href="index.html">← Map</a>`;
  document.addEventListener('cohortchange', () => {
    bar
      .querySelectorAll('a[href^="course.html"]')
      .forEach((link) => (link.href = coursePageHref(new URL(link.href).searchParams.get('page'))));
  });
});
