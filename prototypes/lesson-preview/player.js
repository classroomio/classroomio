(function () {
  const data = window.LessonPreview;
  if (!data) return;

  const kindLabel = {
    video: { en: 'Video', fr: 'Vidéo' },
    text: { en: 'Article', fr: 'Article' },
    image: { en: 'Diagram', fr: 'Schéma' }
  };

  function t(lang) {
    return data.copy[lang] || data.copy.en;
  }

  function previewLessons(lessons) {
    return (lessons || data.lessons).filter((lesson) => lesson.preview);
  }

  function remaining(lessons, currentId) {
    return previewLessons(lessons).filter((lesson) => lesson.id !== currentId).length;
  }

  function formatPrice(cost, lang) {
    if (!cost) return t(lang).free;
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: data.course.currency,
      maximumFractionDigits: 0
    }).format(cost);
  }

  function ctaLabel(isFree, lang) {
    const copy = t(lang);
    if (isFree) return copy.enroll;
    return copy.buy(formatPrice(data.course.cost, lang));
  }

  function continueLabel(isFree, lang) {
    return isFree ? t(lang).enrollContinue : t(lang).buyContinue;
  }

  function playIcon() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  }

  function pauseIcon() {
    return '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14"/><rect x="14" y="5" width="4" height="14"/></svg>';
  }

  function chevron(dir) {
    return dir === 'prev'
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M15 18l-6-6 6-6"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 18l6-6-6-6"/></svg>';
  }

  function renderStage(lesson, state) {
    const copy = t(state.lang);
    const isVideo = lesson.kind === 'video';
    const playing = state.playing && isVideo && !state.gateOpen;

    if (lesson.kind === 'text') {
      return `
        <div class="pv-stage is-doc" data-role="stage">
          <div class="pv-doc">
            <div class="eyebrow">${copy.articleEyebrow} · ${lesson.section}</div>
            <h3>${lesson.title}</h3>
            ${(lesson.body || []).map((para) => `<p>${para}</p>`).join('')}
          </div>
          ${renderOverlay(state, lesson)}
        </div>`;
    }

    if (lesson.kind === 'image') {
      return `
        <div class="pv-stage is-doc" data-role="stage">
          <div class="pv-doc">
            <div class="eyebrow">${copy.figureEyebrow} · ${lesson.section}</div>
            <h3>${lesson.title}</h3>
            <p>${lesson.summary}</p>
            <div class="pv-figures">
              ${(lesson.figures || [])
                .map(
                  (caption, index) => `
                <div class="pv-figure">
                  <div class="art" style="background:${lesson.poster}; opacity:${0.55 + index * 0.15}"></div>
                  <div class="cap">${index + 1}. ${caption}</div>
                </div>`
                )
                .join('')}
            </div>
          </div>
          ${renderOverlay(state, lesson)}
        </div>`;
    }

    return `
      <div class="pv-stage ${playing ? 'is-playing' : ''}" data-role="stage">
        <div class="pv-poster" style="background:${lesson.poster}"></div>
        <div class="pv-scrim"></div>
        ${
          playing
            ? ''
            : `<button class="pv-play" type="button" data-action="play" aria-label="${copy.play}">
                <span class="pv-play-disk">${playIcon()}</span>
              </button>`
        }
        <div class="pv-chrome">
          <div class="pv-progress" aria-hidden="true"><span></span></div>
          <div class="pv-chrome-row">
            <button class="pv-icon-btn" type="button" data-action="prev" aria-label="${copy.prev}">${chevron('prev')}</button>
            <button class="pv-icon-btn" type="button" data-action="${playing ? 'pause' : 'play'}" aria-label="${playing ? copy.pause : copy.play}">
              ${playing ? pauseIcon() : playIcon()}
            </button>
            <button class="pv-icon-btn" type="button" data-action="next" aria-label="${copy.next}">${chevron('next')}</button>
            <div>
              <div class="pv-now">${copy.playing}</div>
              <p class="pv-title">${lesson.title}</p>
            </div>
            <div class="pv-meta">${lesson.duration}</div>
          </div>
        </div>
        ${renderOverlay(state, lesson)}
      </div>`;
  }

  function renderOverlay(state, lesson) {
    if (!state.gateOpen) return '<div class="pv-overlay" data-role="overlay"></div>';
    const copy = t(state.lang);
    const previews = previewLessons(state.lessons);
    const index = previews.findIndex((item) => item.id === lesson.id);
    const left = Math.max(previews.length - index - 1, 0);
    return `
      <div class="pv-overlay open" data-role="overlay">
        <div class="box">
          <h4>${copy.enrollPromptTitle}</h4>
          <p>${copy.enrollPromptBody(left)}</p>
          <div class="actions">
            <button class="lp-btn lp-btn-primary btn btn-primary" type="button" data-action="cta">${ctaLabel(state.isFree, state.lang)}</button>
            <button class="lp-btn lp-btn-secondary btn btn-outline" type="button" data-action="dismiss">${copy.close}</button>
          </div>
        </div>
      </div>`;
  }

  function renderRail(state) {
    const copy = t(state.lang);
    const previews = previewLessons(state.lessons);
    const current = previews.find((lesson) => lesson.id === state.currentId) || previews[0];
    const more = remaining(state.lessons, current?.id);
    const lockedLeft = Math.max(
      (data.course.lessonCount || (state.lessons || data.lessons).length) - previews.length,
      0
    );

    return `
      <div class="pv-rail">
        <div class="pv-rail-head">
          <div class="h">${copy.playlistTitle}</div>
          <div class="c">${copy.morePreview(more)}</div>
        </div>
        <div class="pv-cards">
          ${previews
            .map((lesson) => {
              const on = lesson.id === current.id ? 'on' : '';
              return `
                <button class="pv-card ${on}" type="button" data-action="select" data-id="${lesson.id}">
                  <div class="thumb" style="background:${lesson.poster}">
                    <span class="kind">${kindLabel[lesson.kind][state.lang]}</span>
                  </div>
                  <div class="body">
                    <div class="nm">${lesson.title}</div>
                    <div class="dur">${lesson.duration}</div>
                  </div>
                </button>`;
            })
            .join('')}
        </div>
        <div class="pv-cta-strip">
          <div class="msg">${continueLabel(state.isFree, state.lang)} · ${lockedLeft} ${copy.lessons}</div>
          <button class="lp-btn lp-btn-primary btn btn-primary btn-sm" type="button" data-action="cta">${ctaLabel(state.isFree, state.lang)}</button>
        </div>
      </div>`;
  }

  function create(root, options) {
    const state = {
      lang: options.lang || 'en',
      isFree: Boolean(options.isFree),
      currentId: options.currentId || data.course.heroLessonId,
      playing: Boolean(options.playing),
      gateOpen: false,
      lessons: options.lessons || data.lessons,
      onCta: options.onCta || function () {},
      onChange: options.onChange || function () {}
    };

    function current() {
      return previewLessons(state.lessons).find((lesson) => lesson.id === state.currentId) || previewLessons(state.lessons)[0];
    }

    function neighbors() {
      const previews = previewLessons(state.lessons);
      const index = previews.findIndex((lesson) => lesson.id === current().id);
      return {
        prev: previews[index - 1] || null,
        next: previews[index + 1] || null,
        index,
        last: index === previews.length - 1
      };
    }

    function render() {
      const lesson = current();
      root.innerHTML = `${renderStage(lesson, state)}${options.hideRail ? '' : renderRail(state)}`;
      queueMicrotask(() => {
        try {
          state.onChange({ ...state, lesson });
        } catch (error) {
          console.error(error);
        }
      });
    }

    function select(id, play) {
      const lesson = previewLessons(state.lessons).find((item) => item.id === id);
      if (!lesson) return;
      state.currentId = id;
      state.gateOpen = false;
      state.playing = Boolean(play) && lesson.kind === 'video';
      render();
    }

    root.addEventListener('click', (event) => {
      const actionEl = event.target.closest('[data-action]');
      if (!actionEl || !root.contains(actionEl)) return;
      const action = actionEl.getAttribute('data-action');
      const { prev, next, last } = neighbors();

      if (action === 'select') select(actionEl.getAttribute('data-id'), current().kind === 'video' ? state.playing : false);
      if (action === 'play') {
        if (current().kind !== 'video') return;
        state.playing = true;
        state.gateOpen = false;
        render();
      }
      if (action === 'pause') {
        state.playing = false;
        render();
      }
      if (action === 'prev' && prev) select(prev.id, state.playing);
      if (action === 'next') {
        if (next) select(next.id, state.playing);
        else if (last) {
          state.playing = false;
          state.gateOpen = true;
          render();
        }
      }
      if (action === 'cta') state.onCta();
      if (action === 'dismiss') {
        state.gateOpen = false;
        render();
      }
    });

    render();

    return {
      getState: () => ({ ...state, lesson: current() }),
      setLang(lang) {
        state.lang = lang;
        render();
      },
      setFree(isFree) {
        state.isFree = isFree;
        render();
      },
      setLessons(lessons) {
        state.lessons = lessons;
        if (!previewLessons(lessons).some((lesson) => lesson.id === state.currentId)) {
          state.currentId = previewLessons(lessons)[0]?.id;
          state.playing = false;
        }
        render();
      },
      select,
      openGate() {
        state.playing = false;
        state.gateOpen = true;
        render();
      }
    };
  }

  window.LessonPreviewPlayer = {
    create,
    previewLessons,
    remaining,
    ctaLabel,
    continueLabel,
    formatPrice,
    t
  };
})();
