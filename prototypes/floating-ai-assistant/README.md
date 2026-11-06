# Floating AI assistant prototype

The course AI assistant can move. It opens docked in the side panel, exactly as it does today, and the pop-out icon in the Assistant button pops it out into a floating window the learner or teacher can drag anywhere while they keep reading or editing. Every assistant capability stays available in both modes.

Open [`index.html`](./index.html) in a browser (serve the folder over HTTP, for example `python3 -m http.server`). The page needs `support.js` beside it. This folder is not wired into the dashboard.

## Behavior

The top bar has a combo button: **Assistant** on the left, the pop-out icon on the right. The icon is Lucide [`picture-in-picture-2`](https://lucide.dev/icons/picture-in-picture-2), which is the one to use in the dashboard (`@lucide/svelte/icons/picture-in-picture-2`). The pop-out icon appears only in the combo button, not in the panel header.

| Action | Result |
| --- | --- |
| Click **Assistant** | Opens the assistant docked in the side panel. Click again to close it |
| Click the pop-out icon (docked or closed) | Opens the assistant as a floating window at the bottom right |
| Click the pop-out icon (floating) | Docks it back into the side panel |
| **Expand** in the floating header | Docks it back as the normal side-panel chat |
| **Close** in the floating header | Closes the assistant |
| Drag the grip or header (floating) | Moves the window. Release within 56px of the right edge and a dashed "Release to dock to the side" zone appears and docks it |
| Resize (floating) | Drag the bottom-right corner |
| Narrow panel (docked) | The header collapses New chat and History into a "⋯" menu |
| Select text in the lesson | An **Ask AI** chip quotes the selection into the composer |

Docked header: New chat, History and Close. Floating header: the drag grip, **Expand** and **Close** only. Every icon button has a tooltip.

A one-time tip appears under the pop-out icon the first time the panel opens docked: "Tip: use the pop-out icon to float the assistant while you work." It is dismissed by its close button or by using the pop-out icon, and it does not return.

## What it reproduces from the product

The panel mirrors the production assistant: header with title, conversation title, New chat, History and usage bar; user and assistant bubbles with token counts; tool-call lines; the plan card with **Implement Plan**; the progress card with Stop; the changes card; the composer with attach, model picker and the five quick actions; and the "Don't reload the page" banner while a plan runs. Try **Upload a document to create a course**, then **Implement Plan**.

Not reproduced: the `@` mention popover, the student view with its monthly message cap, inline plan editing and template forms.

## Building it for real

The assistant is already a side-panel app (`features/side-panel/side-panel-rail.svelte`, `features/ai-assistant/panel.ts`). Floating can be added as a mode of the rail, with the pop-out icon in the course header's Assistant button: a `floatable` flag on the panel definition, a `mode` and window rectangle in the side-panel store persisted per panel in `localStorage`, a drag handle on the assistant header, and `sidePanel.width = 0` while floating so the course layout reclaims the space. Floating only applies at `md` and wider. Below that the panel stays full width, as it is today.
