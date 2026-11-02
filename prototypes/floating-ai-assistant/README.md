# Floating AI assistant prototype

The course AI assistant can move. It opens docked in the side panel, exactly as it does today, and a **Minimize** button pops it out into a floating window the learner or teacher can drag anywhere while they keep reading or editing. Every assistant capability stays available in both modes.

Open [`index.html`](./index.html) in a browser (serve the folder over HTTP, for example `python3 -m http.server`). The page needs `support.js` beside it. This folder is not wired into the dashboard.

## Behavior

| Action | Result |
| --- | --- |
| Click **Assistant** in the top bar | Opens the assistant docked in the side panel. Click again to close it and click once more to bring it back in the mode it was last in |
| **Minimize** (docked) | Pops the panel out as a floating window. The page content gets its full width back |
| Drag the header (floating) | Moves the window. Release within 56px of the right edge and a dashed "Release to dock to the side" zone appears and docks it |
| **Expand to side panel** (floating) | Docks the window back into the side panel |
| Double-click the header | Toggles docked and floating |
| Tuck into the edge (floating) | Hides the window behind a small edge tab. The tab, or the pill at the bottom of the page, brings it back where it was |
| Resize (floating) | Drag the window corners |
| Narrow panel | The header collapses its buttons into a "⋯" menu, and Minimize becomes icon only |
| Select text in the lesson | An **Ask AI** chip quotes the selection into the composer |

A one-time tip appears under the Minimize button the first time the panel opens docked: "Tip: use Minimize to float the assistant while you work." It is dismissed by its close button, by clicking Minimize, or by closing the panel, and it does not return.

## What it reproduces from the product

The panel mirrors the production assistant: header with title, conversation title, New chat, History and usage bar; user and assistant bubbles with token counts; tool-call lines; the plan card with **Implement Plan**; the progress card with Stop; the changes card; the composer with attach, model picker and the five quick actions; and the "Don't reload the page" banner while a plan runs. Try **Upload a document to create a course**, then **Implement Plan**.

Not reproduced: the `@` mention popover, the student view with its monthly message cap, inline plan editing and template forms.

## Building it for real

The assistant is already a side-panel app (`features/side-panel/side-panel-rail.svelte`, `features/ai-assistant/panel.ts`). Floating can be added as a mode of the rail: a `floatable` flag on the panel definition, a `mode` and window rectangle in the side-panel store persisted per panel in `localStorage`, a drag handle on the assistant header, and `sidePanel.width = 0` while floating so the course layout reclaims the space. Floating only applies at `md` and wider. Below that the panel stays full width, as it is today.
