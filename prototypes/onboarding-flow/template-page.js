/*
 * template-page.js — one template in full, at template.html?id=<templateId> (M.R.template).
 *
 * Production has no separate page: it shows the preview dialog (see templates-page.js) and, for a
 * template the org owns, opens the template's own course editor. This page is the prototype's way to
 * inspect a template: the whole outline with every lesson's content and videos, every exercise with its
 * questions, and the same side panel the dialog has (type, counts, settings, "Shows off", course name
 * and "Use template"). For org templates it also offers Duplicate and Delete, which the gallery's menu
 * has. Content is the real launch-template fixtures (templates-data.js).
 */
(function () {
  const U = window.CIOCourseUI;
  const M = window.model;
  const P = window.proto;
  const { icon, esc } = U;

  let S = null;
  let template = null;
  let busy = false;

  const params = new URLSearchParams(window.location.search);
  const templateId = params.get('id');

  function optionsHTML(question) {
    const options = question.options ?? [];

    if (question.type === 'WORD_BANK') {
      const correct = options.filter((option) => option.correct).map((option) => option.label);
      const distractors = options.filter((option) => !option.correct).map((option) => option.label);

      return `
        ${question.template ? `<p class="td-qtext">${esc(question.template)}</p>` : ''}
        <div class="td-chips">${correct.map((label) => `<span class="td-chip td-chip-ok">${esc(label)}</span>`).join('')}${distractors.map((label) => `<span class="td-chip">${esc(label)}</span>`).join('')}</div>`;
    }

    if (question.type === 'ORDERING') {
      return `<ol class="td-opts td-opts-ord">${options.map((option) => `<li>${esc(option.label)}</li>`).join('')}</ol>`;
    }

    if (question.type === 'MATCHING') {
      return `<ul class="td-opts">${options.filter((option) => option.correct).map((option) => `<li class="ok">${esc(option.label)}</li>`).join('')}</ul>`;
    }

    if (['FILL_BLANK', 'SHORT_ANSWER', 'NUMERIC'].includes(question.type)) {
      const accepted = options.filter((option) => option.correct).map((option) => option.label);

      return accepted.length ? `<p class="td-accepted"><span>Accepted</span> ${accepted.map(esc).join(', ')}</p>` : '';
    }

    if (!options.length) return '';

    return `<ul class="td-opts">${options
      .map((option) => `<li class="${option.correct ? 'ok' : ''}">${option.correct ? icon('check', 14) : '<span class="td-dot"></span>'}<span>${esc(option.label)}</span></li>`)
      .join('')}</ul>`;
  }

  function questionsHTML(questions, offset = 0) {
    return questions
      .map(
        (question, index) => `
        <li class="td-q">
          <div class="td-qh"><span class="td-qn">${offset + index + 1}</span><p>${esc(question.title)}</p><span class="td-qt">${esc(U.QUESTION_TYPES[question.type] ?? question.type)}</span></div>
          ${optionsHTML(question)}
        </li>`
      )
      .join('');
  }

  function exerciseBodyHTML(exercise) {
    let offset = 0;
    const sections = (exercise.exerciseSections ?? [])
      .map((section) => {
        const block = `
          <div class="td-xsec">
            <p class="td-xsec-t">${esc(section.title)}</p>
            <ol class="td-qs">${questionsHTML(section.questions, offset)}</ol>
            ${section.goToTitle ? `<p class="td-xsec-n">Then go to “${esc(section.goToTitle)}”</p>` : section.submit ? '<p class="td-xsec-n">Then submit</p>' : ''}
          </div>`;

        offset += section.questions.length;

        return block;
      })
      .join('');

    return `
      ${exercise.html ? `<div class="cx-prose">${exercise.html}</div>` : ''}
      ${exercise.questions?.length ? `<ol class="td-qs">${questionsHTML(exercise.questions)}</ol>` : ''}
      ${sections}`;
  }

  function videosHTML(lesson) {
    if (!lesson.videos?.length) return '';

    return `
      <div class="td-videos">
        <p class="td-vh">${icon('video', 14)} ${U.plural(lesson.videos.length, 'video', 'videos')}</p>
        ${lesson.videos
          .map(
            (video) => `
          <a class="td-video" href="https://www.youtube.com/watch?v=${esc(video.youtubeId)}" target="_blank" rel="noopener noreferrer">
            <img src="https://i.ytimg.com/vi/${esc(video.youtubeId)}/hqdefault.jpg" alt="" loading="lazy" onerror="this.remove()" />
            <span>${esc(video.title)}</span>${icon('ext', 14)}
          </a>`
          )
          .join('')}
      </div>`;
  }

  function sectionHTML(section, index) {
    const items = section.lessons.length + section.exercises.length;

    return `
      <section class="td-section">
        <h3 class="td-sh"><span class="td-sn">${index + 1}</span>${esc(section.title || 'Untitled section')}<small>${U.plural(items, 'item', 'items')}</small></h3>
        ${section.lessons
          .map(
            (lesson) => `
          <details class="td-item">
            <summary><span class="td-ic td-ic-lesson">${icon('lesson', 16)}</span><span class="td-it">${esc(lesson.title)}</span>${lesson.videos?.length ? `<span class="td-meta">${icon('video', 12)} ${lesson.videos.length}</span>` : ''}<span class="td-chev">${icon('chevron', 16)}</span></summary>
            <div class="td-body">${lesson.html ? `<div class="cx-prose">${lesson.html}</div>` : '<p class="td-empty">This lesson has no content yet.</p>'}${videosHTML(lesson)}</div>
          </details>`
          )
          .join('')}
        ${section.exercises
          .map(
            (exercise) => `
          <details class="td-item">
            <summary><span class="td-ic td-ic-exercise">${icon('exercise', 16)}</span><span class="td-it">${esc(exercise.title)}</span>${exercise.final ? '<span class="cx-badge cx-badge-outline cx-badge-sm">Final</span>' : ''}<span class="td-meta">${U.plural(exercise.questionCount, 'question', 'questions')}</span><span class="td-chev">${icon('chevron', 16)}</span></summary>
            <div class="td-body">${exerciseBodyHTML(exercise)}</div>
          </details>`
          )
          .join('')}
      </section>`;
  }

  function chipsHTML(list) {
    return list.length ? `<div class="td-chips">${list.map((entry) => `<span class="td-chip">${esc(entry)}</span>`).join('')}</div>` : '';
  }

  function landingContentHTML() {
    const metadata = template.meta?.metadata ?? {};
    const callout = template.meta?.callout;
    const blocks = [];

    if (metadata.skills?.length) blocks.push(`<p class="pv-h">Skills</p>${chipsHTML(metadata.skills)}`);
    if (metadata.tools?.length) blocks.push(`<p class="pv-h">Tools</p>${chipsHTML(metadata.tools)}`);
    if (metadata.requirements) blocks.push(`<p class="pv-h">Requirements</p><p class="td-side-p">${esc(metadata.requirements)}</p>`);
    if (metadata.goals) blocks.push(`<p class="pv-h">Goals</p><p class="td-side-p">${esc(metadata.goals)}</p>`);
    if (callout) blocks.push(`<p class="pv-h">Callout</p><p class="td-side-p"><b>${esc(callout.title)}</b><br />${esc(callout.description)}</p>`);

    return blocks.join('');
  }

  function sideHTML() {
    const counts = U.countsOf(template);
    const settings = U.settingRows(template.settings);
    const badge = U.typeBadge(template.type);

    return `
      <aside class="td-side">
        <div class="td-card">
          ${U.bannerImg(template.bannerImage, 'class="td-banner"')}
          <div class="td-card-b">
            <div class="pv-meta">
              ${badge ? U.typeBadgeHTML(template.type) : ''}
              <span class="pv-curated">${template.global ? 'Curated template' : 'Your template'}</span>
            </div>
            <p class="pv-counts">${counts.sections} sections · ${counts.lessons} lessons · ${counts.exercises} exercises</p>
            <div class="cx-field">
              <label class="cx-label" for="td-name">Course name</label>
              <input class="input" id="td-name" autocomplete="off" value="${esc(template.title)}" />
            </div>
            <button class="btn btn-primary td-use" type="button" id="td-use">${busy ? `<span class="cx-spin"></span>Copying ${U.plural(counts.sections, 'section', 'sections')}, ${U.plural(counts.lessons, 'lesson', 'lessons')}…` : 'Use template'}</button>
            ${
              template.global
                ? ''
                : `<div class="td-ops"><button class="btn btn-secondary btn-sm" type="button" id="td-dup">Duplicate</button><button class="btn btn-outline btn-sm td-danger" type="button" id="td-del">Delete</button></div>`
            }
          </div>
        </div>
        ${
          settings.length
            ? `<div class="td-card td-card-p"><p class="pv-h td-h0">Settings</p><ul class="pv-list">${settings.map((row) => `<li>${icon('check', 16)}<span>${esc(row)}</span></li>`).join('')}</ul></div>`
            : ''
        }
        ${
          template.highlights.length
            ? `<div class="td-card td-card-p"><p class="pv-h td-h0">Shows off</p><ul class="pv-list">${template.highlights.map((highlight) => `<li>${icon('check', 16)}<span><b>${esc(highlight.title)}</b><small>${esc(highlight.description)}</small></span></li>`).join('')}</ul></div>`
            : ''
        }
        ${landingContentHTML() ? `<div class="td-card td-card-p">${landingContentHTML().replace('<p class="pv-h">', '<p class="pv-h td-h0">')}</div>` : ''}
      </aside>`;
  }

  function notFoundHTML() {
    return `
      <div class="cx-wrap tg-page">
        <div class="td-missing">
          <h1 class="tg-title">Template not found</h1>
          <p class="tg-sub">It may have been deleted.</p>
          <a class="btn btn-primary" href="${esc(M.R.templates)}">Back to the template gallery</a>
        </div>
      </div>`;
  }

  function html(state) {
    S = state;
    template = U.findTemplate(S, templateId);

    if (!template) return notFoundHTML();

    document.title = `${template.title} - ClassroomIO`;

    return `
      <div class="cx-wrap tg-page">
        <div class="tg-head">
          <a class="tg-back" href="${esc(M.R.templates)}">${icon('arrowLeft', 16)}<span>Template gallery</span></a>
          <h1 class="tg-title">${esc(template.title)}</h1>
          <p class="tg-sub td-desc">${esc(template.description)}</p>
        </div>
        <div class="td-layout">
          <div class="td-main">
            <div class="td-outline-h">
              <h2>Course outline</h2>
              <div class="td-outline-a">
                <button class="btn btn-ghost btn-sm" type="button" id="td-expand">Expand all</button>
                <button class="btn btn-ghost btn-sm" type="button" id="td-collapse">Collapse all</button>
              </div>
            </div>
            ${template.outline.map(sectionHTML).join('')}
          </div>
          ${sideHTML()}
        </div>
      </div>`;
  }

  function wire(state, helpers) {
    S = state;

    if (!template) return;

    const details = () => [...document.querySelectorAll('.td-item')];

    document.querySelector('#td-expand').addEventListener('click', () => details().forEach((item) => (item.open = true)));
    document.querySelector('#td-collapse').addEventListener('click', () => details().forEach((item) => (item.open = false)));

    const name = document.querySelector('#td-name');
    const use = document.querySelector('#td-use');

    name.addEventListener('input', () => {
      use.disabled = !name.value.trim();
    });
    name.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && name.value.trim()) use.click();
    });
    use.addEventListener('click', () => {
      if (busy || !name.value.trim()) return;

      U.useTemplate(S, template, name.value, {
        onBusy: () => {
          busy = true;
          use.disabled = true;
          name.disabled = true;
          use.innerHTML = `<span class="cx-spin"></span>Copying ${U.plural(U.countsOf(template).sections, 'section', 'sections')}, ${U.plural(U.countsOf(template).lessons, 'lesson', 'lessons')}…`;
        }
      });
    });

    document.querySelector('#td-dup')?.addEventListener('click', () => {
      if (U.templateAtLimit(S)) {
        P.toast(`Your plan includes ${U.plural(U.templateLimit(S), 'template', 'templates')}`, {
          error: true,
          action: 'Upgrade',
          onAction: () => window.pricing.open({ state: S, item: 'general', commit: helpers.commit, onUpgrade: helpers.rerender })
        });

        return;
      }

      const copy = U.duplicateTemplate(S, template);

      U.flash('Template duplicated');
      window.location.href = M.R.template(copy.id);
    });
    document.querySelector('#td-del')?.addEventListener('click', () =>
      U.confirmDelete({
        onDelete: () => {
          U.deleteTemplate(S, template.id);
          U.flash('Template deleted');
          window.location.href = `${M.R.templates}?scope=org`;
        }
      })
    );
  }

  window.PAGES = window.PAGES || {};
  window.PAGES.courses = { title: 'Template', html, wire };
})();
