import { Slice } from '@tiptap/pm/model';
import { EditorView } from '@tiptap/pm/view';
import * as pmView from '@tiptap/pm/view';

function getPmView() {
	try {
		return pmView;
	} catch (error) {
		console.error(error);
		return null;
	}
}

export function serializeForClipboard(view: EditorView, slice: Slice) {
	// Newer Tiptap/ProseMirror
	if (view && typeof view.serializeForClipboard === 'function') {
		return view.serializeForClipboard(slice);
	}

	// Older version fallback
	const proseMirrorView = getPmView();

	if (proseMirrorView && typeof proseMirrorView?.__serializeForClipboard === 'function') {
		return proseMirrorView.__serializeForClipboard(view, slice);
	}

	throw new Error('No supported clipboard serialization method found.');
}
