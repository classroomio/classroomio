(function () {
  const params = new URLSearchParams(location.search);
  const stage = document.querySelector('.stage');
  const nodes = [...document.querySelectorAll('[data-beat]')];
  const untils = [...document.querySelectorAll('[data-beat-until]')];
  const fades = [...document.querySelectorAll('[data-fade-at]')];

  const max = Math.max(
    0,
    ...nodes.map((n) => +n.dataset.beat),
    ...untils.map((n) => +n.dataset.beatUntil),
    ...fades.map((n) => +n.dataset.fadeAt)
  );

  let beat = Math.min(max, Math.max(0, +params.get('beat') || 0));

  const FIELDS = ['bone', 'dark', 'blue'];
  let field = FIELDS.includes(params.get('theme')) ? params.get('theme') : stage.dataset.tone || 'bone';

  function paintField() {
    ['bone', 'dark', 'blue'].forEach((name) => stage.classList.toggle('field-' + name, name === field));

    const label = document.querySelector('.hud .theme');
    if (label) label.textContent = field;
  }

  function fitStage() {
    if (!stage) return;

    const w = +stage.dataset.w || 1920;
    const h = +stage.dataset.h || 1080;

    stage.style.setProperty('--stage-w', w + 'px');
    stage.style.setProperty('--stage-h', h + 'px');

    const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
    if (!scale) return;

    stage.style.setProperty('--fit', scale);
    stage.style.setProperty('--dx', (window.innerWidth - w * scale) / 2 + 'px');
    stage.style.setProperty('--dy', (window.innerHeight - h * scale) / 2 + 'px');
  }

  function render() {
    nodes.forEach((n) => n.classList.toggle('on', beat >= +n.dataset.beat));
    untils.forEach((n) => n.classList.toggle('gone', beat >= +n.dataset.beatUntil));
    fades.forEach((n) => n.classList.toggle('faded', beat >= +n.dataset.fadeAt));

    const dots = document.querySelector('.hud .dots');
    if (dots) [...dots.children].forEach((d, i) => d.classList.toggle('on', i <= beat));

    const label = document.querySelector('.hud .count');
    if (label) label.textContent = beat + ' / ' + max;

    document.body.dataset.currentBeat = beat;
    dispatchEvent(new CustomEvent('beat', { detail: beat }));
  }

  function go(next) {
    beat = Math.min(max, Math.max(0, next));
    render();
  }

  const hud = document.createElement('div');
  hud.className = 'hud' + (params.get('clean') ? ' hidden' : '');
  hud.innerHTML =
    '<span class="scene">' +
    (document.body.dataset.scene || '') +
    '</span><span class="dots">' +
    Array.from({ length: max + 1 }, () => '<i></i>').join('') +
    '</span><span class="count"></span><span class="theme"></span><kbd>space</kbd><kbd>T</kbd><kbd>R</kbd><kbd>H</kbd><kbd>F</kbd>';
  document.body.appendChild(hud);

  addEventListener('keydown', (e) => {
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      go(beat + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      go(beat - 1);
    } else if (e.key.toLowerCase() === 'r') {
      go(0);
    } else if (e.key.toLowerCase() === 't') {
      field = FIELDS[(FIELDS.indexOf(field) + 1) % FIELDS.length];
      paintField();
    } else if (e.key.toLowerCase() === 'h') {
      hud.classList.toggle('hidden');
    } else if (e.key.toLowerCase() === 'f') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } else if (/^[0-9]$/.test(e.key)) {
      go(+e.key);
    }
  });

  addEventListener('click', () => go(beat + 1));
  addEventListener('resize', fitStage);

  paintField();
  fitStage();
  render();
  addEventListener('DOMContentLoaded', render);
  addEventListener('load', render);

  const auto = +params.get('auto');
  if (auto) {
    setInterval(() => {
      if (beat < max) go(beat + 1);
    }, auto);
  }
})();
