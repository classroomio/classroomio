import type { Editor } from '@tiptap/core';
import type { TNoteCommentAnchor } from '@cio/utils/validation/notes';

export function createThreadId() {
  return crypto.randomUUID();
}

export function buildCommentAnchor(editor: Editor, threadId: string): TNoteCommentAnchor {
  const { from, to } = editor.state.selection;
  const quotedText = editor.state.doc.textBetween(from, to, ' ').trim();
  const prefixStart = Math.max(0, from - 30);
  const suffixEnd = Math.min(editor.state.doc.content.size, to + 30);
  const prefix = editor.state.doc.textBetween(prefixStart, from, ' ').trim();
  const suffix = editor.state.doc.textBetween(to, suffixEnd, ' ').trim();

  return {
    version: 1,
    threadId,
    quotedText,
    prefix: prefix || undefined,
    suffix: suffix || undefined
  };
}

export function stripCommentMarkFromHtml(html: string, threadId: string): string {
  if (typeof document === 'undefined') {
    return html;
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  template.content.querySelectorAll(`span[data-note-comment="${threadId}"]`).forEach((element) => {
    const parent = element.parentNode;

    if (!parent) {
      return;
    }

    while (element.firstChild) {
      parent.insertBefore(element.firstChild, element);
    }

    parent.removeChild(element);
  });

  return template.innerHTML;
}

export function scrollToCommentAnchor(root: HTMLElement, anchor: TNoteCommentAnchor) {
  const mark = root.querySelector(`span[data-note-comment="${anchor.threadId}"]`);

  if (mark instanceof HTMLElement) {
    mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
    mark.classList.add('note-comment-mark-active');
    window.setTimeout(() => mark.classList.remove('note-comment-mark-active'), 1600);

    return;
  }

  const plainText = root.textContent ?? '';
  const needle = [anchor.prefix, anchor.quotedText, anchor.suffix].filter(Boolean).join('') || anchor.quotedText;
  const index = plainText.indexOf(needle || anchor.quotedText);

  if (index < 0) {
    return;
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  let targetNode: Text | null = null;
  let targetOffset = 0;
  const targetIndex = index + (anchor.prefix?.length ?? 0);

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text;
    const nextOffset = offset + textNode.data.length;

    if (targetIndex >= offset && targetIndex <= nextOffset) {
      targetNode = textNode;
      targetOffset = targetIndex - offset;
      break;
    }

    offset = nextOffset;
  }

  if (!targetNode) {
    return;
  }

  const range = document.createRange();
  range.setStart(targetNode, targetOffset);
  range.setEnd(targetNode, Math.min(targetNode.data.length, targetOffset + anchor.quotedText.length));

  const pulse = document.createElement('span');
  pulse.className = 'note-comment-anchor-pulse';
  range.surroundContents(pulse);
  pulse.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => {
    const parent = pulse.parentNode;

    if (!parent) {
      return;
    }

    while (pulse.firstChild) {
      parent.insertBefore(pulse.firstChild, pulse);
    }

    parent.removeChild(pulse);
    parent.normalize();
  }, 1600);
}
