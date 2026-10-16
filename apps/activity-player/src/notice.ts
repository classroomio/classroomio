export const NOTICE_VISIBLE_MS = 12_000;

export interface NoticeContent {
  message: string;
  actionLabel: string;
  dismissLabel: string;
  onAction: () => void;
}

export interface Notice {
  show: (content: NoticeContent) => void;
  hide: () => void;
}

/**
 * Binds the player's snackbar markup. A shown notice hides itself after a
 * while, on its action and on dismiss.
 */
export function createNotice(doc: Document): Notice {
  const container = doc.getElementById('notice');
  const text = doc.getElementById('notice-text');
  const action = doc.getElementById('notice-action') as HTMLButtonElement | null;
  const dismiss = doc.getElementById('notice-dismiss') as HTMLButtonElement | null;

  if (!container || !text || !action || !dismiss) throw new Error('Player markup is missing the notice');

  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let onAction: (() => void) | null = null;

  const hide = () => {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = null;
    onAction = null;
    container.hidden = true;
  };

  action.addEventListener('click', () => {
    const run = onAction;
    hide();
    run?.();
  });
  dismiss.addEventListener('click', hide);

  return {
    show(content) {
      text.textContent = content.message;
      action.textContent = content.actionLabel;
      dismiss.setAttribute('aria-label', content.dismissLabel);
      dismiss.title = content.dismissLabel;
      onAction = content.onAction;
      container.hidden = false;

      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(hide, NOTICE_VISIBLE_MS);
    },
    hide
  };
}
