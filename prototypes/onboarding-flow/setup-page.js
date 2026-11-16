/*
 * setup-page.js — the Get Started page: routes/(app)/org/[slug]/setup/+page.svelte with
 * lib/features/setup/{components/setup-progress.svelte, utils/setup-navigation.ts}.
 *
 * The six steps, their done state and their destinations come from M.setupSteps(S). Todo rows go where
 * goToSetupItem() sends them; where production shows an info snackbar instead (a lesson before there is a
 * course, an exercise before there is a lesson, publishing before there is a course) this shows the same
 * message from en.json (snackbar.setup.*). Completed rows are inert and dimmed.
 */
(function () {
  const P = window.proto;
  const M = window.model;
  const U = window.AccountUI;
  const esc = P.escapeHtml;

  const COPY = {
    title: 'Get Started',
    description: 'Complete these steps to set up your learning platform',
    completed: 'completed',
    done: 'Done',
    todo: 'Todo',
    infoCourse: 'You need to create a course',
    infoLesson: 'You Need to Create a lesson'
  };

  const ICON_FOR = {
    profile: 'user-plus',
    organization: 'users',
    course: 'book-open',
    lesson: 'file-text',
    exercise: 'file-text',
    publish: 'globe'
  };

  /* goToSetupItem: the destination, or the snackbar message production shows instead. */
  function destination(step, steps) {
    const done = (id) => steps.find((item) => item.id === id)?.done === true;

    switch (step.id) {
      case 'lesson':
        return done('course') ? { href: step.href } : { message: COPY.infoCourse };
      case 'exercise':
        return done('lesson') ? { href: step.href } : { message: COPY.infoLesson };
      case 'publish':
        return done('course') ? { href: step.href } : { message: COPY.infoCourse };
      default:
        return { href: step.href };
    }
  }

  function rowHTML(step) {
    const media = step.done
      ? `<div style="display:flex;width:20px;height:20px;align-items:center;justify-content:center;border-radius:4px;color:#fff">${U.icon('badge-check', 20)}</div>`
      : `<span style="color:#4b5563;display:flex">${U.icon(ICON_FOR[step.id], 20)}</span>`;

    return `
      <div class="ac-item ac-item-muted ac-setup-row${step.done ? ' done' : ''}" data-step="${esc(step.id)}"${step.done ? '' : ' role="button" tabindex="0"'}>
        <div class="ac-item-media">${media}</div>
        <div class="ac-item-content">
          <div class="ac-item-title ${step.done ? 'done' : 'live'}">${esc(step.title)}</div>
          <p class="ac-item-desc ${step.done ? 'done' : ''}">${esc(step.desc)}</p>
        </div>
        <div class="ac-item-actions">
          ${
            step.done
              ? `<button type="button" class="btn btn-secondary btn-sm ac-btn-done" disabled>${COPY.done}</button>`
              : `<button type="button" class="btn btn-outline btn-sm" tabindex="-1">${COPY.todo}${U.icon('chevron-right', 16)}</button>`
          }
        </div>
      </div>`;
  }

  function html(S) {
    const steps = M.setupSteps(S);
    const completed = steps.filter((step) => step.done).length;
    const percent = Math.round((completed / steps.length) * 100);

    return `
      <div class="ac-page ac-w4xl">
        <div class="ac-ph">
          <div class="ac-ph-row">
            <div class="ac-ph-c">
              <h1 class="ac-title">${COPY.title}</h1>
              <p class="ac-sub">${COPY.description}</p>
            </div>
            <div class="ac-act">${U.ringHTML(percent, true)}</div>
          </div>
        </div>
        <div class="ac-body">
          <section class="ac-setup-sec">
            <div class="ac-item ac-item-outline ac-item-default">
              <div class="ac-item-content">
                <p class="ac-item-desc" style="margin-bottom:16px">${COPY.description}</p>
                <div style="display:flex;align-items:center;gap:8px">
                  <p class="ac-item-desc">${completed} of ${steps.length} ${COPY.completed}</p>
                  <div class="ac-setup-dots" aria-hidden="true">${steps.map((step, index) => `<i class="${index < completed ? 'on' : ''}"></i>`).join('')}</div>
                </div>
              </div>
            </div>
            <div class="ac-setup-list" role="list">${steps.map(rowHTML).join('')}</div>
          </section>
        </div>
      </div>`;
  }

  function wire(S) {
    const steps = M.setupSteps(S);

    document.querySelectorAll('.ac-setup-row:not(.done)').forEach((row) => {
      const step = steps.find((item) => item.id === row.dataset.step);
      const go = () => {
        const target = destination(step, steps);

        if (target.message) {
          P.toast(target.message);

          return;
        }

        window.location.href = target.href;
      };

      row.addEventListener('click', go);
      row.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;

        event.preventDefault();
        go();
      });
    });
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.setup = { title: COPY.title, html, wire };
})();
