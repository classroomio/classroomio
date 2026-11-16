/*
 * course-landing-frame.js — the preview inside the course landing page editor. Mounts the real course landing
 * component of the org theme in edit mode (every section is clickable) and re-renders from the editor's draft,
 * sent as a postMessage. Selecting a section tells the editor, which opens its form.
 */
(function () {
  const P = window.proto;
  const M = window.model;
  const S = P.loadState();
  const params = new URLSearchParams(window.location.search);
  const stored = M.findCourse(S, params.get('id'));
  const root = document.getElementById('site-root');
  let handle = null;
  let theme = '';
  let current = stored;

  function paint(course) {
    current = course;
    const props = window.courseLandingModel.propsOf(S, course, { edit: true });
    const accent = P.parseColor(S.primary) ? S.primary : P.DEFAULT_PRIMARY;

    root.style.setProperty('--primary', accent);
    root.style.setProperty('--primary-foreground', P.readableOn(accent));

    if (handle && theme === props.theme) {
      handle.update(props);
      return;
    }

    handle?.destroy();
    root.innerHTML = '';
    theme = props.theme;
    handle = window.CioCourse.render(root, props.theme, props, {
      onSelect: (key) => window.parent.postMessage({ type: 'cl-picked', key }, '*')
    });
  }

  window.addEventListener('message', (event) => {
    const data = event.data;

    if (data?.type === 'cl-draft') paint(data.course);
    if (data?.type === 'cl-select') handle?.select(data.key);
    if (data?.type === 'cl-scroll') {
      const target = root.querySelector(`[data-landing-section="${data.key}"]`);

      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('a')) event.preventDefault();
  });

  if (stored) paint(stored);
})();
