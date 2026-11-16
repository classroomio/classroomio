/*
 * course-lessons.js — the Content tab: routes/(app)/courses/[id]/lessons/+page.svelte and the feature
 * code it renders (lib/features/course: pages/lessons.svelte, components/lesson/{content-section-list,
 * content-list,content-row,section-header,content-actions,content-page-menu,delete-lesson-confirmation}.svelte,
 * components/content-count-badges.svelte and components/content/{content-create-modal,section-create-stepper,
 * lesson-create-stepper,exercise-create-stepper}.svelte).
 *
 * Data (see model.js for the base shape). Everything below is optional and only written by this tab or
 * course-lesson.js, so a course that never opened them still loads:
 *
 *   course.metadata.isContentGroupingEnabled  false shows one flat list instead of sections (default true).
 *   section = { id, title, lessons[] }       unchanged.
 *   lesson  = { id, kind:'lesson', title, html, published,
 *               videos[]:    { id, type:'youtube'|'vimeo'|'generic'|'upload'|'google_drive', link, title, fileName?, createdAt },
 *               slides[]:    { id, platform, src },
 *               documents[]: { id, name, size, type },
 *               completionPolicy:'manual'|'video_watch'|'none', videoWatchThreshold, commentsEnabled,
 *               callUrl, lessonAt, versions[], previewComplete }
 *   exercise = { id, kind:'exercise', title, html:'', published, description, dueBy, sectionDisplayMode,
 *               allowMultipleAttempts, completionPolicy:'submitted'|'passed', passThreshold,
 *               sections[]:  { id, title, description, order, colorTheme, afterBehavior:{action,exerciseSectionId?} },
 *               questions[]: { id, title, questionType:'RADIO'|..., questionTypeId, points, required, settings{},
 *                              options[]:{ id, label, value, isCorrect, settings? }, exerciseSectionId|null } }
 *
 * `published` is the product's isUnlocked: the lock button on a row flips it. Lessons and exercises can only
 * live inside sections in this model, so with content grouping turned off the flat list still shows them in
 * section order and "Add content" appends to the last section.
 *
 * Reordering: rows drag (HTML5 drag and drop, mouse only) and also carry up/down buttons so it works on touch and
 * with a keyboard. Production uses svelte-dnd-action and saves when "End Reorder" is pressed; here each move saves.
 * Simulated: the exercise template library (production reads exercise_template rows) and the live-session
 * "Past sessions" block, which is not built.
 */
(function () {
  'use strict';

  const ICON = {
    section:
      '<path d="M16 5H3"/><path d="M16 12H3"/><path d="M16 19H3"/><path d="M21 5h.01"/><path d="M21 12h.01"/><path d="M21 19h.01"/>',
    lesson:
      '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    exercise:
      '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    dots: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    up: '<path d="m18 15-6-6-6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    book: '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
    video:
      '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
    file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    calendar:
      '<path d="M16 14v2.2l1.6 1"/><path d="M16 2v4"/><path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5"/><path d="M3 10h5"/><path d="M8 2v4"/><circle cx="16" cy="16" r="6"/>',
    paperclip:
      '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
    refresh:
      '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
    check: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'
  };

  function ic(name, size = 16) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:${size}px;height:${size}px;flex-shrink:0">${ICON[name] ?? ''}</svg>`;
  }

  const ui = { reorder: false, editingId: null, editTitle: '', error: '', spinning: false };
  const modal = { open: false };
  let live = null;

  const hasText = (html) =>
    Boolean(html) && (/<svg\b|<img\b|<iframe\b/i.test(html) || html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() !== '');

  function grouped(course) {
    return course.metadata?.isContentGroupingEnabled !== false;
  }

  function sectionsOf(ctx) {
    return ctx.M.ensureCourse(ctx.course).sections;
  }

  function itemsOf(ctx) {
    return sectionsOf(ctx).flatMap((section) => section.lessons);
  }

  function locate(ctx, itemId) {
    for (const section of sectionsOf(ctx)) {
      const index = section.lessons.findIndex((entry) => entry.id === itemId);

      if (index >= 0) return { section, index, item: section.lessons[index] };
    }

    return null;
  }

  function countsOf(items) {
    return {
      lessons: items.filter((item) => item.kind !== 'exercise').length,
      exercises: items.filter((item) => item.kind === 'exercise').length
    };
  }

  function formatDate(value) {
    if (!value) return '';

    try {
      return new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'medium' }).format(new Date(value));
    } catch {
      return String(value);
    }
  }

  /* ---------- exercise templates (simulated library) ---------- */
  const radio = (title, ...answers) => ({
    type: 'RADIO',
    title,
    options: answers.map((answer) => ({ label: answer.replace(/\*$/, ''), isCorrect: answer.endsWith('*') }))
  });
  const multi = (title, ...answers) => ({ ...radio(title, ...answers), type: 'CHECKBOX' });
  const bool = (title, value) => ({ type: 'TRUE_FALSE', title, value });

  const EXERCISE_TAGS = ['HTML', 'CSS', 'JS', 'Typescript', 'ReactJS', 'VueJS', 'NodeJS', 'Python', 'PHP', 'GIT'];
  const EXERCISE_TEMPLATES = [
    { id: 't-html-1', tag: 'HTML', title: 'HTML basics', description: 'Tags, elements and document structure.', questions: [radio('What does HTML stand for?', 'Hyper Text Markup Language*', 'High Tech Modern Language', 'Home Tool Markup Language'), radio('Which tag creates a hyperlink?', '<a>*', '<link>', '<href>'), bool('The <img> tag needs a closing tag.', false), multi('Which of these are valid heading tags?', '<h1>*', '<h6>*', '<h7>', '<heading>')] },
    { id: 't-html-2', tag: 'HTML', title: 'Forms and inputs', description: 'Collect data with form controls.', questions: [radio('Which attribute makes an input required?', 'required*', 'mandatory', 'validate'), radio('Which input type shows a colour picker?', 'type="color"*', 'type="paint"', 'type="palette"'), bool('A <label> can be linked to an input with the for attribute.', true)] },
    { id: 't-css-1', tag: 'CSS', title: 'CSS selectors', description: 'Target elements with the right selector.', questions: [radio('Which selector targets an element with class "card"?', '.card*', '#card', 'card'), radio('Which property changes text colour?', 'color*', 'font-color', 'text-style'), bool('An id selector has higher specificity than a class selector.', true)] },
    { id: 't-css-2', tag: 'CSS', title: 'Flexbox and layout', description: 'Lay out a page with flexbox.', questions: [radio('Which value turns an element into a flex container?', 'display: flex*', 'position: flex', 'flex: container'), radio('Which property centres items on the cross axis?', 'align-items*', 'justify-content', 'text-align'), multi('Which are valid flex-direction values?', 'row*', 'column*', 'diagonal', 'grid')] },
    { id: 't-js-1', tag: 'JS', title: 'JavaScript fundamentals', description: 'Variables, types and functions.', questions: [radio('Which keyword declares a block-scoped variable?', 'let*', 'var', 'define'), radio('What is typeof null?', '"object"*', '"null"', '"undefined"'), bool('=== compares value and type.', true), multi('Which are falsy values?', '0*', '""*', '"0"', '[]')] },
    { id: 't-js-2', tag: 'JS', title: 'Arrays and objects', description: 'Work with collections.', questions: [radio('Which method adds an item to the end of an array?', 'push()*', 'pop()', 'shift()'), radio('Which method returns a new array of transformed items?', 'map()*', 'forEach()', 'splice()'), bool('Objects can be used as map keys without conversion.', false)] },
    { id: 't-ts-1', tag: 'Typescript', title: 'TypeScript types', description: 'Annotate and narrow types.', questions: [radio('Which keyword defines an object shape?', 'interface*', 'shape', 'struct'), radio('What does the unknown type require before use?', 'Narrowing*', 'Nothing', 'A cast to any'), bool('TypeScript types exist at runtime.', false)] },
    { id: 't-react-1', tag: 'ReactJS', title: 'React components', description: 'Props, state and rendering.', questions: [radio('Which hook adds local state to a component?', 'useState*', 'useProps', 'useLocal'), radio('How does a parent pass data to a child?', 'Props*', 'State', 'Refs'), bool('A component must return a single root element or fragment.', true)] },
    { id: 't-vue-1', tag: 'VueJS', title: 'Vue reactivity', description: 'Refs, computed values and directives.', questions: [radio('Which function creates a reactive primitive?', 'ref()*', 'state()', 'watch()'), radio('Which directive renders a list?', 'v-for*', 'v-list', 'v-each'), bool('computed() values are cached until a dependency changes.', true)] },
    { id: 't-node-1', tag: 'NodeJS', title: 'Node.js basics', description: 'Modules, the event loop and the file system.', questions: [radio('Which module reads files?', 'fs*', 'http', 'path'), radio('Which command installs a package?', 'npm install*', 'npm get', 'node add'), bool('Node.js runs JavaScript on a single main thread.', true)] },
    { id: 't-py-1', tag: 'Python', title: 'Python essentials', description: 'Syntax, lists and functions.', questions: [radio('Which keyword defines a function?', 'def*', 'func', 'function'), radio('Which structure is immutable?', 'tuple*', 'list', 'dict'), bool('Python uses indentation to define blocks.', true), multi('Which are Python built-in types?', 'int*', 'str*', 'char', 'float*')] },
    { id: 't-php-1', tag: 'PHP', title: 'PHP syntax', description: 'Variables, arrays and output.', questions: [radio('How does a PHP variable start?', '$*', '@', '&'), radio('Which function prints text?', 'echo*', 'print_text', 'write'), bool('PHP files must end in .html.', false)] },
    { id: 't-git-1', tag: 'GIT', title: 'Git workflow', description: 'Commit, branch and merge.', questions: [radio('Which command records staged changes?', 'git commit*', 'git push', 'git add'), radio('Which command creates a branch?', 'git branch name*', 'git new name', 'git fork name'), bool('git pull fetches and merges.', true), multi('Which commands inspect history?', 'git log*', 'git status', 'git diff*')] }
  ];

  function materialize(template) {
    let counter = 0;
    const id = (prefix) => `${prefix}-${Date.now().toString(36)}${(counter += 1)}`;

    return template.questions.map((entry) => {
      const base = { id: id('q'), title: entry.title, points: 1, required: true, exerciseSectionId: null };

      if (entry.type === 'TRUE_FALSE') {
        return {
          ...base,
          questionType: 'TRUE_FALSE',
          questionTypeId: 4,
          settings: { correctValue: entry.value },
          options: [
            { id: id('o'), label: 'True', value: 'true', isCorrect: entry.value },
            { id: id('o'), label: 'False', value: 'false', isCorrect: !entry.value }
          ]
        };
      }

      return {
        ...base,
        questionType: entry.type,
        questionTypeId: entry.type === 'CHECKBOX' ? 2 : 1,
        settings: {},
        options: entry.options.map((option) => ({ id: id('o'), label: option.label, value: option.label, isCorrect: option.isCorrect }))
      };
    });
  }

  /* ---------- mutations ---------- */
  function createSection(ctx, title) {
    const section = { id: ctx.M.newId('section'), title, lessons: [] };

    sectionsOf(ctx).push(section);
    ctx.commit();

    return section;
  }

  function targetSection(ctx, sectionId) {
    const sections = sectionsOf(ctx);
    const target = sections.find((section) => section.id === sectionId);

    if (target) return target;

    if (sections.length) return sections[sections.length - 1];

    return createSection(ctx, ctx.course.title || 'Content');
  }

  function createLesson(ctx, title, sectionId) {
    const lesson = { id: ctx.M.newId('lesson'), kind: 'lesson', title, html: '', published: true };

    targetSection(ctx, sectionId).lessons.push(lesson);
    ctx.commit();

    return lesson;
  }

  function createExercise(ctx, title, sectionId, template) {
    const exercise = {
      id: ctx.M.newId('exercise'),
      kind: 'exercise',
      title,
      html: '',
      published: true,
      description: template ? template.description : '',
      dueBy: '',
      sectionDisplayMode: 'one_question',
      allowMultipleAttempts: false,
      completionPolicy: 'submitted',
      passThreshold: 100,
      sections: [],
      questions: template ? materialize(template) : []
    };

    targetSection(ctx, sectionId).lessons.push(exercise);
    ctx.commit();

    return exercise;
  }

  function moveItem(ctx, itemId, toSectionId, beforeItemId) {
    const from = locate(ctx, itemId);
    const to = sectionsOf(ctx).find((section) => section.id === toSectionId);

    if (!from || !to) return;

    from.section.lessons.splice(from.index, 1);

    const at = beforeItemId ? to.lessons.findIndex((entry) => entry.id === beforeItemId) : -1;

    to.lessons.splice(at < 0 ? to.lessons.length : at, 0, from.item);
    ctx.commit();
  }

  function moveFlat(ctx, itemId, direction) {
    const sections = sectionsOf(ctx);
    const sizes = sections.map((section) => section.lessons.length);
    const flat = itemsOf(ctx);
    const index = flat.findIndex((entry) => entry.id === itemId);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= flat.length) return;

    const [moved] = flat.splice(index, 1);

    flat.splice(target, 0, moved);

    let cursor = 0;

    sections.forEach((section, sectionIndex) => {
      section.lessons = flat.slice(cursor, cursor + sizes[sectionIndex]);
      cursor += sizes[sectionIndex];
    });
    ctx.commit();
  }

  function moveItemStep(ctx, itemId, direction) {
    if (!grouped(ctx.course)) return moveFlat(ctx, itemId, direction);

    const spot = locate(ctx, itemId);

    if (!spot) return;

    const target = spot.index + direction;

    if (target < 0 || target >= spot.section.lessons.length) return;

    const [moved] = spot.section.lessons.splice(spot.index, 1);

    spot.section.lessons.splice(target, 0, moved);
    ctx.commit();
  }

  function moveSectionTo(ctx, sectionId, beforeSectionId) {
    const sections = sectionsOf(ctx);
    const from = sections.findIndex((section) => section.id === sectionId);

    if (from < 0) return;

    const [moved] = sections.splice(from, 1);
    const at = beforeSectionId ? sections.findIndex((section) => section.id === beforeSectionId) : -1;

    sections.splice(at < 0 ? sections.length : at, 0, moved);
    ctx.commit();
  }

  function moveSectionStep(ctx, sectionId, direction) {
    const sections = sectionsOf(ctx);
    const index = sections.findIndex((section) => section.id === sectionId);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= sections.length) return;

    const [moved] = sections.splice(index, 1);

    sections.splice(target, 0, moved);
    ctx.commit();
  }

  /* ---------- markup ---------- */
  const badge = (type, count, label) =>
    `<span class="cc-badge" title="${label}"><span class="cc-ic-${type}">${ic(type, 12)}</span><span>${count}</span></span>`;

  function chipHTML(esc, iconName, text) {
    return `<span class="cc-chip">${ic(iconName, 11)}${esc(text)}</span>`;
  }

  function metaHTML(ctx, item) {
    const { esc } = ctx;
    const live = ctx.course.type === 'LIVE_CLASS';
    const selfPaced = ctx.course.type !== 'LIVE_CLASS';

    if (item.kind === 'exercise') {
      const questions = (item.questions ?? []).length;
      const chips = [chipHTML(esc, 'help', `${questions} Questions`)];

      if (selfPaced && item.dueBy) chips.push(chipHTML(esc, 'calendar', `Due by: ${formatDate(item.dueBy)}`));

      return `<div class="cc-meta">${chips.join('')}</div>`;
    }

    const videos = (item.videos ?? []).length;
    const documents = (item.documents ?? []).length;
    const note = hasText(item.html);
    const slides = (item.slides ?? []).length;
    const chips = [];

    if (videos) chips.push(chipHTML(esc, 'video', String(videos)));
    if (documents) chips.push(chipHTML(esc, 'file', String(documents)));
    if (note) chips.push(chipHTML(esc, 'file', 'Note'));
    if (slides) chips.push(chipHTML(esc, 'file', 'Slide'));
    if (!chips.length) chips.push(chipHTML(esc, 'paperclip', 'No Content'));
    if (live && item.lessonAt) chips.push(chipHTML(esc, 'calendar', formatDate(item.lessonAt)));

    return `<div class="cc-meta">${chips.join('')}</div>`;
  }

  function menuHTML(items, label = 'Open menu') {
    return `
      <div class="cc-menu">
        <button class="btn btn-ghost cc-ibtn-sm" type="button" data-menu aria-haspopup="menu" aria-expanded="false" aria-label="${label}">${ic('dots', 20)}</button>
        <div class="cc-pop" role="menu" hidden>${items.join('')}</div>
      </div>`;
  }

  function menuItem(act, id, text, extra = '', danger = false) {
    return `<button type="button" role="menuitem" data-act="${act}" data-id="${id}" class="${danger ? 'cc-danger' : ''}" ${extra}>${text}</button>`;
  }

  function itemHTML(ctx, item, orderLabel, showMove) {
    const { esc, course } = ctx;
    const editing = ui.editingId === item.id;
    const blocked = Boolean(ui.editingId && !editing);
    const lockLabel = item.published ? 'Lock' : 'Unlock';
    const href = esc(ctx.M.R.lesson(course.id, item.id));

    const main = editing
      ? `<div class="cc-rowinput">
          <input class="input" data-edit-input value="${esc(ui.editTitle)}" aria-label="Title" aria-invalid="${Boolean(ui.error)}" />
          ${ui.error ? `<p class="cc-err">${esc(ui.error)}</p>` : ''}
        </div>`
      : `<div class="cc-item-main">
          <div class="cc-item-row">
            <span class="cc-ic-${item.kind === 'exercise' ? 'exercise' : 'lesson'}">${ic(item.kind === 'exercise' ? 'exercise' : 'lesson', 14)}</span>
            <a class="cc-item-link" href="${href}">${esc(item.title)}</a>
          </div>
          ${metaHTML(ctx, item)}
        </div>`;

    const actions = editing
      ? `<button class="btn btn-outline" type="button" data-act="cancel-edit">Cancel</button>
         <button class="btn btn-primary" type="button" data-act="save-edit" data-id="${item.id}">Save</button>`
      : `${ui.reorder && showMove ? `<span class="cc-mv"><button type="button" data-act="item-up" data-id="${item.id}" aria-label="Move up">${ic('up', 12)}</button><button type="button" data-act="item-down" data-id="${item.id}" aria-label="Move down">${ic('down', 12)}</button></span>` : ''}
         <button class="btn btn-outline cc-ibtn-sm" type="button" data-act="toggle-lock" data-id="${item.id}" aria-label="${lockLabel}" title="${lockLabel}" ${blocked || editing ? 'disabled' : ''}>${ic(item.published ? 'unlock' : 'lock', 20)}</button>
         ${blocked ? `<button class="btn btn-ghost cc-ibtn-sm" type="button" disabled aria-label="Open menu">${ic('dots', 20)}</button>` : menuHTML([menuItem('edit', item.id, 'Edit'), '<hr />', menuItem('delete', item.id, 'Delete', '', true)])}`;

    return `
      <div class="cc-item${ui.reorder ? ' cc-reordering' : ''}" data-drag="item" data-id="${item.id}" ${ui.reorder ? 'draggable="true"' : ''} data-testid="content-item">
        ${orderLabel ? `<span class="cc-order" style="margin:6px 20px 0 0">${orderLabel}</span>` : ''}
        ${main}
        <div class="cc-item-side">${actions}</div>
      </div>`;
  }

  function sectionHTML(ctx, section, index, total) {
    const { esc } = ctx;
    const editing = ui.editingId === section.id;
    const blocked = Boolean(ui.editingId && !editing);
    const counts = countsOf(section.lessons);
    const hasItems = section.lessons.length > 0;
    const anyUnlocked = section.lessons.some((item) => item.published);
    const lockAll = `${anyUnlocked ? 'Lock' : 'Unlock'} All`;

    const title = editing
      ? `<div class="cc-sec-t">${ic('section', 16)}<div style="flex:1;min-width:0"><input class="input" data-edit-input value="${esc(ui.editTitle)}" aria-label="Section Title" aria-invalid="${Boolean(ui.error)}" />${ui.error ? `<p class="cc-err">${esc(ui.error)}</p>` : ''}</div></div>`
      : `<div class="cc-sec-t">${ic('section', 16)}<p>${esc(section.title)}</p><span class="cc-badges">${badge('lesson', counts.lessons, `${counts.lessons} lessons`)}${badge('exercise', counts.exercises, `${counts.exercises} exercises`)}</span></div>`;

    const actions = editing
      ? `<button class="btn btn-outline" type="button" data-act="cancel-edit">Cancel</button>
         <button class="btn btn-primary" type="button" data-act="save-edit" data-id="${section.id}">Save</button>`
      : `${ui.reorder ? `<span class="cc-mv"><button type="button" data-act="section-up" data-id="${section.id}" aria-label="Move section up" ${index === 0 ? 'disabled' : ''}>${ic('up', 12)}</button><button type="button" data-act="section-down" data-id="${section.id}" aria-label="Move section down" ${index === total - 1 ? 'disabled' : ''}>${ic('down', 12)}</button></span>` : ''}
         <button class="btn btn-outline cc-ibtn-sm" type="button" data-act="add-to-section" data-id="${section.id}" aria-label="Add content to ${esc(section.title)}" ${blocked ? 'disabled' : ''}>${ic('plus', 16)}</button>
         ${blocked ? `<button class="btn btn-ghost cc-ibtn-sm" type="button" disabled aria-label="Open menu">${ic('dots', 20)}</button>` : menuHTML([hasItems ? menuItem('lock-all', section.id, lockAll) : '', menuItem('edit', section.id, 'Edit'), '<hr />', menuItem('delete', section.id, 'Delete', '', true)])}`;

    const body = section.lessons.length
      ? section.lessons.map((item) => itemHTML(ctx, item, '', true)).join('')
      : `<p class="cc-none">No lessons yet</p>`;

    return `
      <div class="cc-sec${ui.reorder ? ' cc-reordering' : ''}" id="section-${section.id}" data-drag="section" data-id="${section.id}" ${ui.reorder ? 'draggable="true"' : ''}>
        <div class="cc-sec-h">${title}<div class="cc-sec-a">${actions}</div></div>
        <div class="cc-sec-b" data-drop-body="${section.id}">${body}</div>
      </div>`;
  }

  function flatHTML(ctx) {
    const items = itemsOf(ctx);

    if (!items.length) return `<p class="cc-none">No lessons yet</p>`;

    return items
      .map((item, index) => {
        const order = index < 9 ? `0${index + 1}` : String(index + 1);

        return `<div class="cc-flat${ui.reorder ? ' cc-reordering' : ''}" data-flat="${item.id}">${itemHTML(ctx, item, order, true).replace(/cc-reordering|draggable="true"/g, '')}</div>`;
      })
      .join('');
  }

  function pageHTML(ctx) {
    const course = ctx.course;
    const sections = sectionsOf(ctx);
    const isGrouped = grouped(course);
    const items = itemsOf(ctx);
    const contentLength = isGrouped ? sections.length : items.length;
    const counts = countsOf(items);
    const unlockedAll = items.every((item) => item.published);
    const busy = Boolean(ui.editingId);

    const header = `
      <div class="cc-ph">
        <div class="cc-ph-main"><h1 class="cc-title">Content</h1></div>
        <div class="cc-actions">
          <button class="btn btn-outline" type="button" data-act="reorder" ${busy ? 'disabled' : ''}>${ui.reorder ? 'End Reorder' : 'Reorder'}</button>
          <button class="btn btn-secondary" type="button" data-act="add-content" ${busy ? 'disabled' : ''} title="Add content (Ctrl+Shift+N)" aria-keyshortcuts="Control+Shift+N">Add content</button>
          <div class="cc-menu">
            <button class="btn btn-secondary cc-ibtn" type="button" data-menu aria-haspopup="menu" aria-expanded="false" aria-label="Content options" title="Content options" ${busy ? 'disabled' : ''}>${ic('dots', 16)}</button>
            <div class="cc-pop" role="menu" hidden>
              <button type="button" role="menuitem" data-act="unlock-all">${ic('unlock', 14)} Unlock all content</button>
              <button type="button" role="menuitem" data-act="toggle-grouping">${ic('section', 14)} ${isGrouped ? 'Disable content grouping' : 'Enable content grouping'}</button>
            </div>
          </div>
          <button class="btn btn-ghost cc-ibtn${ui.spinning ? ' cc-spin' : ''}" type="button" data-act="refresh" aria-label="Refresh" title="Refresh">${ic('refresh', 16)}</button>
        </div>
      </div>`;

    if (contentLength === 0) {
      return `
        <div class="cc-root">
          ${header}
          <div class="cc-empty">
            <span class="cc-empty-ic">${ic('book', 20)}</span>
            <h3>No lessons yet</h3>
            <p>Share your knowledge with the world by creating engaging lessons. Start by clicking on the Add button.</p>
          </div>
        </div>`;
    }

    const stats = `
      <div class="cc-stats" role="region" aria-label="Content">
        <div class="cc-stat"><div class="cc-stat-l">${ic('section', 14)}<span>Sections</span></div><p class="cc-stat-v">${isGrouped ? sections.length : 0}</p></div>
        <div class="cc-stat"><div class="cc-stat-l"><span class="cc-ic-lesson">${ic('lesson', 14)}</span><span>Lessons</span></div><p class="cc-stat-v">${counts.lessons}</p></div>
        <div class="cc-stat"><div class="cc-stat-l"><span class="cc-ic-exercise">${ic('exercise', 14)}</span><span>Exercises</span></div><p class="cc-stat-v">${counts.exercises}</p></div>
      </div>`;

    const list = isGrouped
      ? `<section class="cc-list" data-root>${sections.map((section, index) => sectionHTML(ctx, section, index, sections.length)).join('')}</section>`
      : `<section class="cc-list" data-root>${flatHTML(ctx)}</section>`;

    void unlockedAll;

    return `
      <div class="cc-root">
        ${header}
        ${stats}
        ${ui.reorder ? `<p class="cc-hint">drag a card to reorder</p>` : ''}
        ${list}
      </div>`;
  }

  /* ---------- confirm ---------- */
  function confirmDelete(ctx) {
    return new Promise((resolve) => {
      const host = document.getElementById('modal-host');

      host.innerHTML = `
        <div class="scrim" id="cc-scrim">
          <div class="modal" role="alertdialog" aria-modal="true" aria-label="Delete" style="max-width:384px;padding:8px 24px 24px">
            <h3 style="margin:12px 0 16px;font-size:18px">Delete</h3>
            <p style="font-size:18px;color:var(--foreground)">Are you sure?</p>
            <div style="display:flex;justify-content:space-between;margin-top:20px">
              <button class="btn btn-outline" id="cc-no" type="button">No</button>
              <button class="btn btn-outline" id="cc-yes" type="button">Yes</button>
            </div>
          </div>
        </div>`;

      const close = (value) => {
        host.innerHTML = '';
        document.removeEventListener('keydown', onKey);
        resolve(value);
      };
      const onKey = (event) => {
        if (event.key === 'Escape') close(false);
      };

      document.addEventListener('keydown', onKey);
      host.querySelector('#cc-no').addEventListener('click', () => close(false));
      host.querySelector('#cc-yes').addEventListener('click', () => close(true));
      host.querySelector('#cc-scrim').addEventListener('click', (event) => {
        if (event.target.id === 'cc-scrim') close(false);
      });
      host.querySelector('#cc-no').focus();
    });
  }

  /* ---------- add content modal ---------- */
  const OPTIONS = [
    { type: 'section', title: 'Section', description: 'Group lessons and exercises together.' },
    { type: 'lesson', title: 'Lesson', description: 'Teach with notes, slides, and videos.' },
    { type: 'exercise', title: 'Exercise', description: 'Assess students with quizzes and tasks.' }
  ];
  const SUCCESS = {
    section: 'Section has been created successfully!',
    lesson: 'Lesson has been created successfully!',
    exercise: 'Exercise has been created successfully!'
  };
  const REPEAT = {
    section: 'Create another section',
    lesson: 'Create another lesson',
    exercise: 'Create another exercise'
  };

  function openAdd(ctx, sectionId = '') {
    ui.editingId = null;

    Object.assign(modal, {
      open: true,
      phase: 'form',
      ctxSectionId: sectionId,
      locked: null,
      created: null,
      title: '',
      exStep: 0,
      exKind: 'scratch',
      exTitle: '',
      exTag: EXERCISE_TAGS[0],
      exTemplate: ''
    });

    if (sectionId) {
      Object.assign(modal, { type: 'lesson', step: 0 });
    } else if (grouped(ctx.course)) {
      Object.assign(modal, { type: 'section', step: 1 });
    } else {
      Object.assign(modal, { type: 'lesson', step: 0 });
    }

    modal.initialType = modal.type === 'section' ? 'lesson' : modal.type;
    modal.sectionId = sectionId || (grouped(ctx.course) ? (sectionsOf(ctx)[0]?.id ?? '') : '');
    renderModal(ctx);
  }

  function closeModal() {
    modal.open = false;
    document.getElementById('modal-host').innerHTML = '';
    document.removeEventListener('keydown', onModalKey);
  }

  function onModalKey(event) {
    if (event.key === 'Escape' && modal.open) closeModal();
  }

  function modalFlags(ctx) {
    const isGrouped = grouped(ctx.course);
    const sections = sectionsOf(ctx);
    const fromContext = Boolean(modal.ctxSectionId || modal.locked);
    const requiresSection = isGrouped && modal.type !== 'section';
    const canCreate = !requiresSection || Boolean(modal.sectionId);
    let canProceed = false;
    let primary = 'Create';

    if (modal.type === 'section') {
      canProceed = modal.title.trim().length > 0;
      primary = 'Create section';
    } else if (modal.type === 'lesson') {
      canProceed = modal.title.trim().length > 0 && canCreate;
      primary = 'Create lesson';
    } else if (modal.exStep === 0) {
      canProceed = canCreate;
      primary = 'Next';
    } else {
      canProceed = (modal.exKind === 'scratch' ? modal.exTitle.trim().length > 0 : Boolean(modal.exTemplate)) && canCreate;
      primary = 'Finish';
    }

    return { isGrouped, sections, fromContext, requiresSection, canCreate, canProceed, primary };
  }

  function sectionBlock(ctx, flags) {
    const { esc } = ctx;

    if (!flags.requiresSection) return '';

    const current = flags.sections.find((section) => section.id === modal.sectionId);
    let body;

    if (flags.fromContext) {
      body = `<p class="cc-help" style="font-size:14px;margin:0">Adding to <strong>${esc(modal.locked?.title ?? current?.title ?? 'section')}</strong></p>`;
    } else if (flags.sections.length || modal.locked) {
      body = `<select class="select" data-m-section aria-label="Section">
        ${modal.sectionId ? '' : '<option value="">Select section</option>'}
        ${flags.sections.map((section) => `<option value="${section.id}" ${section.id === modal.sectionId ? 'selected' : ''}>${esc(section.title)}</option>`).join('')}
      </select>`;
    } else {
      body = `<p class="cc-help" style="margin:0">Create a section first to add lessons or exercises.</p>`;
    }

    return `<div class="cc-field"><label class="cc-lab cc-bold">Section</label>${body}</div>`;
  }

  function exerciseBody(ctx, flags) {
    const { esc } = ctx;

    if (modal.exStep === 0) {
      const options = [
        ['scratch', 'From Scratch', 'Create your exercise from scratch if you have your questions already prepared', false],
        ['template', 'Use a Template', 'Select from 100+ templates of predefined exercise to help you get started', false],
        ['ai', 'Use AI', 'You can generate an exercise with AI from your notes', true]
      ];

      return `
        <div>
          <label class="cc-lab" style="margin-bottom:12px">How do you want to create your exercise?</label>
          <div class="cc-opts cc-3" role="radiogroup">
            ${options.map(([id, title, text, disabled]) => `<button type="button" role="radio" aria-checked="${modal.exKind === id}" class="cc-opt${modal.exKind === id ? ' on' : ''}" data-m-kind="${id}" ${disabled ? 'disabled' : ''}><span class="cc-dot"></span><span><b>${title}${disabled ? '<span class="cc-soon">Coming soon</span>' : ''}</b><small>${text}</small></span></button>`).join('')}
          </div>
        </div>`;
    }

    if (modal.exKind === 'scratch') {
      return `<div class="cc-field" style="margin:16px 0"><label class="cc-lab" for="cc-ex-title">Give your exercise a title</label><input class="input" id="cc-ex-title" data-m-extitle placeholder="Exercise name" value="${esc(modal.exTitle)}" autocomplete="off" /></div>`;
    }

    const templates = EXERCISE_TEMPLATES.filter((template) => template.tag === modal.exTag);

    return `
      <div>
        <label class="cc-lab cc-bold">Select a template</label>
        <div class="cc-tags">${EXERCISE_TAGS.map((tag) => `<button type="button" class="cc-tag${tag === modal.exTag ? ' on' : ''}" data-m-tag="${tag}">${tag}</button>`).join('')}</div>
        ${
          templates.length
            ? `<div class="cc-tpls" role="radiogroup">${templates.map((template) => `<button type="button" role="radio" aria-checked="${modal.exTemplate === template.id}" class="cc-opt${modal.exTemplate === template.id ? ' on' : ''}" data-m-template="${template.id}"><span class="cc-dot"></span><span><b>${esc(template.title)}</b><small>${esc(template.description)}</small><small>${template.questions.length} questions</small></span></button>`).join('')}</div><p class="cc-note" style="margin-top:10px">Template library is simulated in the prototype.</p>`
            : `<p class="cc-help">No templates available for this tag.</p>`
        }
      </div>`;
  }

  function renderModal(ctx) {
    if (!modal.open) return;

    const { esc } = ctx;
    const flags = modalFlags(ctx);
    const host = document.getElementById('modal-host');
    const visible = OPTIONS.filter((option) => !(option.type === 'section' && (flags.fromContext || !flags.isGrouped)));
    let body;

    if (modal.phase === 'success' && modal.created) {
      const isSection = modal.created.type === 'section';

      body = `
        <div class="cc-alert" role="status">${ic('check', 18)}<div><b>${SUCCESS[modal.created.type]}</b><span>${esc(modal.created.title)}</span></div></div>
        <div class="cc-foot">
          <button class="btn btn-secondary btn-sm" type="button" data-m="again">${REPEAT[modal.created.type]}</button>
          <div class="cc-foot-r">
            <button class="btn btn-outline btn-sm" type="button" data-m="later">Later</button>
            <button class="btn btn-primary btn-sm" type="button" data-m="primary-success" id="cc-primary-success">${isSection ? 'Add content' : 'Open now'}</button>
          </div>
        </div>`;
    } else if (modal.step === 0) {
      body = `
        <form data-m-form="continue">
          <p class="cc-desc">Select the type of content you want to add.</p>
          <div class="cc-opts ${visible.length >= 3 ? 'cc-3' : 'cc-2'}" role="radiogroup">
            ${visible.map((option) => `<button type="button" role="radio" aria-checked="${modal.type === option.type}" class="cc-opt${modal.type === option.type ? ' on' : ''}" data-m-type="${option.type}"><span class="cc-dot"></span><span><b>${option.title}</b><small>${option.description}</small></span></button>`).join('')}
          </div>
          <div class="cc-foot cc-end"><button class="btn btn-primary btn-sm" type="submit">Continue</button></div>
        </form>`;
    } else {
      let fields;

      if (modal.type === 'section') {
        fields = `<div class="cc-field" style="margin:0"><label class="cc-lab" for="cc-title">Section Title <span style="color:var(--destructive)">*</span></label><input class="input" id="cc-title" data-m-title placeholder="e.g., Module 1: Introduction" value="${esc(modal.title)}" autocomplete="off" /></div>`;
      } else if (modal.type === 'lesson') {
        fields = `<div class="cc-field" style="margin:0"><label class="cc-lab" for="cc-title">Lesson Title <span style="color:var(--destructive)">*</span></label><input class="input" id="cc-title" data-m-title placeholder="e.g., Getting Started with Variables" value="${esc(modal.title)}" autocomplete="off" /></div>`;
      } else {
        fields = exerciseBody(ctx, flags);
      }

      body = `
        <form data-m-form="create">
          ${sectionBlock(ctx, flags)}
          ${fields}
          <div class="cc-foot">
            <button class="btn btn-secondary btn-sm" type="button" data-m="back">Back</button>
            <button class="btn btn-primary btn-sm" type="submit" ${flags.canProceed ? '' : 'disabled'}>${flags.primary}</button>
          </div>
        </form>`;
    }

    const active = document.activeElement;
    const focusKey = active?.getAttribute?.('data-m-title') !== null ? 'title' : active?.getAttribute?.('data-m-extitle') !== null ? 'extitle' : '';
    const caret = active?.selectionStart;

    host.innerHTML = `
      <div class="scrim" id="cc-scrim">
        <div class="modal cc-modal" role="dialog" aria-modal="true" aria-label="Add content">
          <h2>Add content</h2>
          <button class="cc-modal-x" type="button" data-m="close" aria-label="Close">${ic('x', 16)}</button>
          <div class="cc-modal-body">${body}</div>
        </div>
      </div>`;

    document.removeEventListener('keydown', onModalKey);
    document.addEventListener('keydown', onModalKey);
    wireModal(ctx);

    const focusTarget =
      focusKey === 'title'
        ? host.querySelector('[data-m-title]')
        : focusKey === 'extitle'
          ? host.querySelector('[data-m-extitle]')
          : host.querySelector('#cc-primary-success') ?? host.querySelector('[data-m-title], [data-m-extitle]') ?? host.querySelector('[role="radio"][aria-checked="true"]');

    focusTarget?.focus();

    if (focusKey && typeof caret === 'number') focusTarget?.setSelectionRange?.(caret, caret);
  }

  function reflectFooter(ctx) {
    const flags = modalFlags(ctx);
    const submit = document.querySelector('[data-m-form="create"] button[type="submit"]');

    if (submit) submit.disabled = !flags.canProceed;
  }

  function submitCreate(ctx) {
    const flags = modalFlags(ctx);

    if (!flags.canProceed) return;

    let created;

    if (modal.type === 'section') {
      const title = modal.title.trim();
      const section = createSection(ctx, title);

      created = { id: section.id, title, type: 'section' };
    } else if (modal.type === 'lesson') {
      const title = modal.title.trim();
      const lesson = createLesson(ctx, title, flags.requiresSection ? modal.sectionId : '');

      created = { id: lesson.id, title, type: 'lesson' };
    } else if (modal.exStep === 0) {
      modal.exStep = 1;
      renderModal(ctx);

      return;
    } else {
      const template = modal.exKind === 'template' ? EXERCISE_TEMPLATES.find((entry) => entry.id === modal.exTemplate) : null;
      const title = template ? template.title : modal.exTitle.trim();
      const exercise = createExercise(ctx, title, flags.requiresSection ? modal.sectionId : '', template);

      created = { id: exercise.id, title, type: 'exercise' };
    }

    modal.created = created;
    modal.phase = 'success';
    ctx.rerender();
    renderModal(ctx);
  }

  function wireModal(ctx) {
    const host = document.getElementById('modal-host');

    host.querySelector('#cc-scrim')?.addEventListener('click', (event) => {
      if (event.target.id === 'cc-scrim') closeModal();
    });

    host.querySelectorAll('[data-m-type]').forEach((button) =>
      button.addEventListener('click', () => {
        modal.type = button.dataset.mType;
        renderModal(ctx);
      })
    );
    host.querySelectorAll('[data-m-type]').forEach((button) =>
      button.addEventListener('dblclick', () => {
        modal.type = button.dataset.mType;
        modal.step = 1;
        renderModal(ctx);
      })
    );

    host.querySelector('[data-m-form="continue"]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      modal.step = 1;
      renderModal(ctx);
    });

    host.querySelector('[data-m-form="create"]')?.addEventListener('submit', (event) => {
      event.preventDefault();
      submitCreate(ctx);
    });

    host.querySelector('[data-m-title]')?.addEventListener('input', (event) => {
      modal.title = event.target.value;
      reflectFooter(ctx);
    });
    host.querySelector('[data-m-extitle]')?.addEventListener('input', (event) => {
      modal.exTitle = event.target.value;
      reflectFooter(ctx);
    });
    host.querySelector('[data-m-section]')?.addEventListener('change', (event) => {
      modal.sectionId = event.target.value;
      renderModal(ctx);
    });
    host.querySelectorAll('[data-m-kind]').forEach((button) =>
      button.addEventListener('click', () => {
        modal.exKind = button.dataset.mKind;
        renderModal(ctx);
      })
    );
    host.querySelectorAll('[data-m-tag]').forEach((button) =>
      button.addEventListener('click', () => {
        modal.exTag = button.dataset.mTag;
        modal.exTemplate = '';
        renderModal(ctx);
      })
    );
    host.querySelectorAll('[data-m-template]').forEach((button) =>
      button.addEventListener('click', () => {
        modal.exTemplate = button.dataset.mTemplate;
        renderModal(ctx);
      })
    );

    host.querySelectorAll('[data-m]').forEach((button) =>
      button.addEventListener('click', () => {
        const action = button.dataset.m;

        if (action === 'close' || action === 'later') closeModal();

        if (action === 'back') {
          if (modal.type === 'exercise' && modal.exStep > 0) modal.exStep -= 1;
          else modal.step = 0;
          renderModal(ctx);
        }

        if (action === 'again') {
          modal.type = modal.created.type;
          modal.phase = 'form';
          modal.step = 1;
          modal.title = '';
          modal.exStep = 0;
          modal.exTitle = '';
          modal.exTemplate = '';
          renderModal(ctx);
        }

        if (action === 'primary-success') {
          const created = modal.created;

          if (created.type === 'section') {
            modal.locked = { id: created.id, title: created.title };
            modal.sectionId = created.id;
            modal.type = modal.initialType;
            modal.phase = 'form';
            modal.step = 0;
            modal.title = '';
            modal.exStep = 0;
            modal.exTitle = '';
            renderModal(ctx);

            return;
          }

          closeModal();
          window.location.href = ctx.M.R.lesson(ctx.course.id, created.id);
        }
      })
    );
  }

  /* ---------- wiring ---------- */
  function closeMenus(root) {
    root.querySelectorAll('.cc-pop').forEach((pop) => {
      pop.hidden = true;
    });
    root.querySelectorAll('[data-menu]').forEach((button) => button.setAttribute('aria-expanded', 'false'));
  }

  function startEdit(ctx, id) {
    const section = sectionsOf(ctx).find((entry) => entry.id === id);
    const spot = section ? null : locate(ctx, id);

    ui.editingId = id;
    ui.editTitle = section ? section.title : spot?.item.title ?? '';
    ui.error = '';
    ctx.rerender();
    document.querySelector('[data-edit-input]')?.focus();
  }

  function saveEdit(ctx, id) {
    const title = ui.editTitle.trim();

    if (!title) {
      ui.error = 'Title cannot be empty';
      ctx.rerender();
      document.querySelector('[data-edit-input]')?.focus();

      return;
    }

    const section = sectionsOf(ctx).find((entry) => entry.id === id);
    const spot = section ? null : locate(ctx, id);

    if (section) section.title = title;
    else if (spot) spot.item.title = title;

    ui.editingId = null;
    ui.error = '';
    ctx.commit();
    ctx.rerender();
    ctx.say(section ? 'Course section updated successfully' : spot?.item.kind === 'exercise' ? 'Saved Successfully' : 'Updated successfully');
  }

  async function removeContent(ctx, id) {
    const confirmed = await confirmDelete(ctx);

    if (!confirmed) return;

    const sections = sectionsOf(ctx);
    const sectionIndex = sections.findIndex((entry) => entry.id === id);

    if (sectionIndex >= 0) {
      sections.splice(sectionIndex, 1);
      ctx.commit();
      ctx.rerender();
      ctx.say('Course section deleted successfully');

      return;
    }

    const spot = locate(ctx, id);

    if (!spot) return;

    spot.section.lessons.splice(spot.index, 1);
    ctx.commit();
    ctx.rerender();
    ctx.say(spot.item.kind === 'exercise' ? 'Deleted successfully' : 'Lesson deleted successfully');
  }

  function wireDrag(ctx, root) {
    let drag = null;

    const clear = () =>
      root.querySelectorAll('.cc-drop-before, .cc-drop-after, .cc-drop-into, .cc-dragging').forEach((node) => node.classList.remove('cc-drop-before', 'cc-drop-after', 'cc-drop-into', 'cc-dragging'));

    root.addEventListener('dragstart', (event) => {
      if (!ui.reorder) return;

      const node = event.target.closest?.('[data-drag]');

      if (!node) return;

      drag = { type: node.dataset.drag, id: node.dataset.id };
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', drag.id);
      node.classList.add('cc-dragging');
      event.stopPropagation();
    });

    root.addEventListener('dragend', () => {
      drag = null;
      clear();
    });

    root.addEventListener('dragover', (event) => {
      if (!drag) return;

      const itemNode = event.target.closest('[data-drag="item"]');
      const sectionNode = event.target.closest('[data-drag="section"]');

      clear();

      if (drag.type === 'section') {
        if (!sectionNode || sectionNode.dataset.id === drag.id) return;

        event.preventDefault();

        const box = sectionNode.getBoundingClientRect();

        sectionNode.classList.add(event.clientY < box.top + box.height / 2 ? 'cc-drop-before' : 'cc-drop-after');

        return;
      }

      if (itemNode && itemNode.dataset.id !== drag.id) {
        event.preventDefault();

        const box = itemNode.getBoundingClientRect();

        itemNode.classList.add(event.clientY < box.top + box.height / 2 ? 'cc-drop-before' : 'cc-drop-after');

        return;
      }

      if (sectionNode) {
        event.preventDefault();
        sectionNode.classList.add('cc-drop-into');
      }
    });

    root.addEventListener('drop', (event) => {
      if (!drag) return;

      event.preventDefault();

      const itemNode = event.target.closest('[data-drag="item"]');
      const sectionNode = event.target.closest('[data-drag="section"]');
      const dragged = drag;

      drag = null;

      if (dragged.type === 'section' && sectionNode) {
        const sections = sectionsOf(ctx);
        const box = sectionNode.getBoundingClientRect();
        const before = event.clientY < box.top + box.height / 2;
        const index = sections.findIndex((section) => section.id === sectionNode.dataset.id);
        const reference = before ? sections[index] : sections[index + 1];

        moveSectionTo(ctx, dragged.id, reference?.id ?? '');
      } else if (dragged.type === 'item' && sectionNode) {
        if (itemNode && itemNode.dataset.id !== dragged.id) {
          const box = itemNode.getBoundingClientRect();
          const before = event.clientY < box.top + box.height / 2;
          const siblings = sectionsOf(ctx).find((section) => section.id === sectionNode.dataset.id)?.lessons ?? [];
          const index = siblings.findIndex((entry) => entry.id === itemNode.dataset.id);
          const reference = before ? siblings[index] : siblings[index + 1];

          moveItem(ctx, dragged.id, sectionNode.dataset.id, reference?.id ?? '');
        } else {
          moveItem(ctx, dragged.id, sectionNode.dataset.id, '');
        }
      }

      ctx.rerender();
    });
  }

  function onGlobalKey(event) {
    if (!live || !(event.metaKey || event.ctrlKey) || !event.shiftKey || event.key.toLowerCase() !== 'n') return;

    event.preventDefault();

    const target = event.target;

    if (modal.open || target?.closest?.('input, textarea, select, [contenteditable="true"]')) return;

    openAdd(live);
  }

  document.addEventListener('keydown', onGlobalKey);

  window.COURSE_TABS = window.COURSE_TABS || {};
  window.COURSE_TABS.lessons = {
    nav: 'content',
    title: 'Content',
    html: (ctx) => pageHTML(ctx),
    wire(ctx) {
      live = ctx;

      const root = document.querySelector('.cc-root');

      if (!root) return;

      root.addEventListener('click', (event) => {
        const menuButton = event.target.closest('[data-menu]');

        if (menuButton) {
          event.stopPropagation();

          const pop = menuButton.nextElementSibling;
          const willOpen = pop.hidden;

          closeMenus(root);
          pop.hidden = !willOpen;
          menuButton.setAttribute('aria-expanded', String(willOpen));

          return;
        }

        const actor = event.target.closest('[data-act]');

        if (!actor) return;

        closeMenus(root);

        const act = actor.dataset.act;
        const id = actor.dataset.id;
        const course = ctx.course;

        if (act === 'reorder') {
          ui.reorder = !ui.reorder;
          ctx.rerender();
        } else if (act === 'add-content') {
          openAdd(ctx);
        } else if (act === 'add-to-section') {
          openAdd(ctx, id);
        } else if (act === 'unlock-all') {
          const locked = itemsOf(ctx).filter((item) => !item.published);

          if (!locked.length) {
            ctx.say('All content is already unlocked');

            return;
          }

          locked.forEach((item) => {
            item.published = true;
          });
          ctx.commit();
          ctx.rerender();
          ctx.say('All course items unlocked');
        } else if (act === 'toggle-grouping') {
          const next = !grouped(course);

          course.metadata = { ...(course.metadata ?? {}), isContentGroupingEnabled: next };
          ctx.commit();
          ctx.rerender();
          ctx.say(next ? 'Content grouping enabled' : 'Content grouping disabled');
        } else if (act === 'refresh') {
          ui.spinning = true;
          ctx.rerender();
          setTimeout(() => {
            ui.spinning = false;
            document.querySelector('[data-act="refresh"]')?.classList.remove('cc-spin');
          }, 650);
        } else if (act === 'toggle-lock') {
          const spot = locate(ctx, id);

          if (spot) {
            spot.item.published = !spot.item.published;
            ctx.commit();
            ctx.rerender();
          }
        } else if (act === 'lock-all') {
          const section = sectionsOf(ctx).find((entry) => entry.id === id);
          const next = !section.lessons.some((item) => item.published);

          section.lessons.forEach((item) => {
            item.published = next;
          });
          ctx.commit();
          ctx.rerender();
        } else if (act === 'edit') {
          startEdit(ctx, id);
        } else if (act === 'cancel-edit') {
          ui.editingId = null;
          ui.error = '';
          ctx.rerender();
        } else if (act === 'save-edit') {
          saveEdit(ctx, id);
        } else if (act === 'delete') {
          removeContent(ctx, id);
        } else if (act === 'section-up' || act === 'section-down') {
          moveSectionStep(ctx, id, act === 'section-up' ? -1 : 1);
          ctx.rerender();
        } else if (act === 'item-up' || act === 'item-down') {
          moveItemStep(ctx, id, act === 'item-up' ? -1 : 1);
          ctx.rerender();
        }
      });

      document.addEventListener('click', () => closeMenus(root));

      const input = root.querySelector('[data-edit-input]');

      input?.addEventListener('input', (event) => {
        ui.editTitle = event.target.value;

        if (ui.error) {
          ui.error = '';
          root.querySelector('.cc-err')?.remove();
        }
      });
      input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') saveEdit(ctx, ui.editingId);
        if (event.key === 'Escape') {
          ui.editingId = null;
          ui.error = '';
          ctx.rerender();
        }
      });

      wireDrag(ctx, root);

      if (ctx.params.get('add') === 'true' && !modal.open) {
        openAdd(ctx);
      }
    }
  };
})();
