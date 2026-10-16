import { THEME_TOKENS, type PlayerUiLabels, type PlayerUiState } from './inbound';
import { computeNavState } from './nav-state';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CHECK_ICON = ['M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0', 'm9 12 2 2 4-4'];
const LOCK_ICON = [
  'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2',
  'M7 11V7a5 5 0 0 1 10 0v4'
];

export interface ToolbarActions {
  previous: () => void;
  next: () => void;
  select: (identifier: string) => void;
  exitImmersive: () => void;
}

export interface Toolbar {
  render: (ui: PlayerUiState) => void;
  setImmersive: (immersive: boolean) => void;
  setStatus: (text: string | null) => void;
  closeMenu: () => void;
  isMenuOpen: () => boolean;
  watchActivity: (doc: Document) => void;
}

function requireElement<T extends Element>(doc: Document, id: string): T {
  const element = doc.getElementById(id);

  if (!element) throw new Error(`Player markup is missing #${id}`);

  return element as unknown as T;
}

function icon(doc: Document, paths: string[]): SVGSVGElement {
  const svg = doc.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'i');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');

  for (const data of paths) {
    const path = doc.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', data);
    svg.appendChild(path);
  }

  return svg;
}

function setButtonLabel(button: HTMLButtonElement, label: string): void {
  button.setAttribute('aria-label', label);
  button.title = label;
}

/**
 * Sets the embedder's theme colors on the player page. Tokens outside the
 * known list are ignored.
 */
export function applyTheme(doc: Document, theme: Record<string, string>): void {
  for (const token of THEME_TOKENS) {
    const value = theme[token];

    if (value) doc.documentElement.style.setProperty(`--${token}`, value);
    else doc.documentElement.style.removeProperty(`--${token}`);
  }
}

/**
 * Binds the toolbar markup in the player page and renders the module nav
 * from the embedder's state. The toolbar shows for multi-module packages,
 * for a status message, and while the player is fullscreen or full-window,
 * where it also offers exit.
 */
export function createToolbar(doc: Document, actions: ToolbarActions): Toolbar {
  const toolbar = requireElement<HTMLElement>(doc, 'toolbar');
  const nav = requireElement<HTMLElement>(doc, 'module-nav');
  const previousButton = requireElement<HTMLButtonElement>(doc, 'nav-previous');
  const nextButton = requireElement<HTMLButtonElement>(doc, 'nav-next');
  const menuButton = requireElement<HTMLButtonElement>(doc, 'nav-menu');
  const menuAnchor = menuButton.parentElement as HTMLElement;
  const menuLabel = requireElement<HTMLElement>(doc, 'nav-menu-label');
  const menuPanel = requireElement<HTMLElement>(doc, 'nav-menu-panel');
  const menuSummary = requireElement<HTMLElement>(doc, 'nav-menu-summary');
  const menuList = requireElement<HTMLElement>(doc, 'nav-menu-list');
  const timeLimit = requireElement<HTMLElement>(doc, 'time-limit');
  const timeLimitText = requireElement<HTMLElement>(doc, 'time-limit-text');
  const status = requireElement<HTMLElement>(doc, 'status');
  const exitButton = requireElement<HTMLButtonElement>(doc, 'exit-fullscreen');
  const view = doc.defaultView ?? window;

  let labels: PlayerUiLabels | null = null;
  let hasMenu = false;
  let immersive = false;
  let hasStatus = false;

  const isMenuOpen = () => !menuPanel.hidden;

  const updateVisibility = () => {
    toolbar.hidden = !hasMenu && !immersive && !hasStatus;
    exitButton.hidden = !immersive;
    if (labels) setButtonLabel(exitButton, labels.exitFullscreen);
  };

  const closeMenu = () => {
    if (!isMenuOpen()) return;

    menuPanel.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    menuPanel.hidden = false;
    menuButton.setAttribute('aria-expanded', 'true');

    const current = menuList.querySelector<HTMLButtonElement>('[aria-current="true"]');
    (current ?? menuList.querySelector<HTMLButtonElement>('button:not(:disabled)'))?.focus();
  };

  const renderMenuItems = (ui: PlayerUiState) => {
    menuList.replaceChildren();

    ui.units.forEach((unit, index) => {
      const isCurrent = unit.identifier === ui.currentIdentifier;
      const item = doc.createElement('button');
      item.type = 'button';
      item.className = 'btn menu-item';
      item.disabled = unit.locked && !isCurrent;
      if (isCurrent) item.setAttribute('aria-current', 'true');
      if (unit.locked) item.title = ui.labels.locked;

      const mark = doc.createElement('span');
      mark.className = unit.completed ? 'menu-item-mark done' : 'menu-item-mark';
      if (unit.completed) mark.appendChild(icon(doc, CHECK_ICON));
      else if (unit.locked) mark.appendChild(icon(doc, LOCK_ICON));
      else mark.textContent = String(index + 1);

      const title = doc.createElement('span');
      title.className = 'menu-item-title';
      title.textContent = unit.title;

      item.append(mark, title);
      item.addEventListener('click', () => {
        closeMenu();
        actions.select(unit.identifier);
      });
      menuList.appendChild(item);
    });
  };

  const render = (ui: PlayerUiState) => {
    labels = ui.labels;
    const state = computeNavState(ui.units, ui.currentIdentifier);
    hasMenu = state.hasMenu;

    nav.hidden = !state.hasMenu;
    previousButton.disabled = state.previous.disabled;
    nextButton.disabled = state.next.disabled;
    setButtonLabel(previousButton, state.previous.locked ? ui.labels.locked : ui.labels.previous);
    setButtonLabel(nextButton, state.next.locked ? ui.labels.locked : ui.labels.next);

    const position = ui.labels.position || `${state.currentIndex + 1} / ${ui.units.length}`;
    menuLabel.textContent = state.currentTitle ? `${position} · ${state.currentTitle}` : position;
    menuButton.setAttribute('aria-label', `${ui.labels.menu}: ${menuLabel.textContent}`);
    menuSummary.textContent = ui.labels.complete;
    menuSummary.hidden = !ui.labels.complete;
    menuList.setAttribute('aria-label', ui.labels.menu);
    renderMenuItems(ui);

    timeLimit.hidden = !ui.timeLimit;
    timeLimitText.textContent = ui.timeLimit ?? '';
    timeLimit.title = ui.labels.timeLimit;

    if (!state.hasMenu) closeMenu();
    updateVisibility();
  };

  const watchActivity = (watched: Document) => {
    const isPlayerDocument = watched === doc;

    watched.addEventListener('pointerdown', (event) => {
      if (!isPlayerDocument || !menuAnchor.contains(event.target as Node)) closeMenu();
    });
    watched.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape' || !isMenuOpen()) return;

      event.preventDefault();
      closeMenu();
      menuButton.focus();
    });
  };

  previousButton.addEventListener('click', () => actions.previous());
  nextButton.addEventListener('click', () => actions.next());
  menuButton.addEventListener('click', () => (isMenuOpen() ? closeMenu() : openMenu()));
  exitButton.addEventListener('click', () => actions.exitImmersive());
  view.addEventListener('blur', closeMenu);
  watchActivity(doc);

  return {
    render,
    setImmersive(next) {
      immersive = next;
      doc.documentElement.classList.toggle('immersive', next);
      updateVisibility();
    },
    setStatus(text) {
      hasStatus = Boolean(text);
      status.textContent = text ?? '';
      status.hidden = !hasStatus;
      updateVisibility();
    },
    closeMenu,
    isMenuOpen,
    watchActivity
  };
}
