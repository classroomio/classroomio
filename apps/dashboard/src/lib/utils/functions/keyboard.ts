export function shouldIgnoreGlobalShortcut() {
  const active = document.activeElement;

  if (!active) {
    return false;
  }

  const tag = active.tagName;

  if (tag === 'INPUT' || tag === 'TEXTAREA') {
    return true;
  }

  if (active instanceof HTMLElement && active.isContentEditable) {
    return true;
  }

  return false;
}
