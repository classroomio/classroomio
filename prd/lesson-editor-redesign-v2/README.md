# Lesson Editor Redesign v2 PRD

## Prototype

A clickable prototype lives at [`prototypes/lesson-editor-redesign-v2/index.html`](../../prototypes/lesson-editor-redesign-v2/index.html). It is one self-contained HTML file. Open it directly in a browser (`open prototypes/lesson-editor-redesign-v2/index.html`), no build step needed.

The prototype shows everything in this PRD working: the five new blocks, the new empty state, and the new Add content menu. It also contains all of v1, unchanged.

When this document and the prototype disagree on a UI detail, the prototype wins. One deliberate exception: the prototype lets blocks be added inside a tab, but in this PRD each tab holds a note and at most one image or video (see Block 3).

## Purpose

v1 ([`prd/lesson-editor-redesign`](../lesson-editor-redesign/README.md)) turned the lesson editor into one canvas of blocks. Admins can add Video, Note, Slides, Document and Image blocks in any order.

v2 adds **five interactive block types** so an admin can build lessons that learners _do_ things in, not only read or watch:

| Block | What it is for |
| --- | --- |
| **Chart** | Show numbers as a bar, line, pie or donut chart |
| **Flashcards** | A deck of cards, question on the front and answer on the back |
| **Tabs** | Split content into named tabs, where each tab holds other blocks |
| **Multiple Choice** | One question with several answers and one correct answer |
| **Process** | A step-by-step walkthrough with an optional image per step |

v2 also changes the **empty state** and the **Add content menu** so all ten block types are easy to find.

## What does not change

Everything in v1 stays as it is. Read the v1 PRD for the full detail. In short:

* One canvas with an ordered list of blocks, reorder by drag or move up/down, remove from the block menu
* Edit / Preview toggle, and Preview as the learner sees the lesson
* Settings in a right-side slider
* Video, Note (with callout styles), Slides, Document and Image blocks and their Add / Change flows
* "Ask AI" drafting a Note block (in v2 the assistant can also write the five new blocks; see AI assistant)
* Autosave, the scroll-position dots, and the mobile layout

v2 only **adds** to these. No v1 behaviour is removed or reworded.

## How the new blocks fit in

Every new block follows the same rules as a v1 block:

* It sits in the lesson's ordered list and can be moved, reordered and removed like any other block.
* It has the same block header in Edit (drag handle, move arrows, type label, "..." menu with Remove block).
* **Adding one inserts a ready-made example**, not a blank form. The admin edits the example in place. The prototype's example content is illustrative only.
* **Edit** is direct: the admin clicks the text on the block and types. There is no separate form or dialog.
* **Preview** hides all the editing controls and shows only what a learner sees. Learners can use the block (flip a card, switch a tab, answer a question).
* Every change autosaves with the same indicator as v1.

A learner's place inside a block (which card is showing, which tab is open, which step they are on, which answer they picked) is **not saved**. It resets when the page is reloaded.

---

## Block 1: Chart

### What it is

One chart with a title and a small table of data behind it. The admin picks how the data is drawn.

### In Edit

* **Title.** A text field above the chart. Placeholder: "Chart title".
* **Chart type.** Four icon buttons: Bar, Line, Pie, Donut. The current type is highlighted. Switching type redraws the chart straight away and keeps the data.
* **Summary line.** A short line under the title that updates by itself, for example "4 data points · Highest Q4 (70)". For Pie and Donut it shows the total instead.
* **Edit data.** A button under the chart opens a small table. Each row has a **Label**, a **Value** and a delete button. Changing any value redraws the chart live as the admin types.
* **Add data point.** Adds a row with the label "New" and value 0 and puts the cursor in the label.

### Rules

* A chart has at least **1** and at most **12** data points. The delete button is disabled when only one row is left. "Add data point" disappears at 12.
* Values are numbers and cannot be negative. Anything else counts as 0.
* Bar and Line charts show a left axis with round, evenly spaced numbers, so the scale always looks tidy.
* Pie and Donut charts give each slice its own colour and show a legend with the label, value and percentage. Donut shows the total in the middle. If every value is 0 the chart shows an empty ring.
* Bar and Line use the primary colour.

### In Preview

* The title is plain text. The type buttons and "Edit data" are hidden.
* The chart animates in when it appears.
* On Pie and Donut, hovering a legend row or a slice dims the others.

---

## Block 2: Flashcards

### What it is

A deck of cards. The learner sees one card at a time, reads the question, flips it to see the answer, and moves to the next card.

### In Edit

* The admin sees the card the same way a learner does, but the text is editable. Click the text and type.
* The card has two sides: **Question** (front) and **Answer** (back). A flip button in the card's corner switches sides so the admin can edit the answer. A trash button beside it removes the card on screen; it is hidden when only one card is left.
* The **Previous / Next** arrows, the counter and the progress bar work the same as for learners.
* The block footer holds only the **number strip**: one button per card. Every number is shown, with no collapsed middle; long decks wrap onto more rows so the admin can see every card. Clicking a number jumps to that card. A **+** button at the end adds a new empty card and puts the cursor in its question.
* There is no per-card toolbar. Flipping and removing live on the card, moving between cards lives on the arrows, and removing the whole block lives in the block's own menu.
* A hint above the card says: click any text to edit it, and use the flip button to edit the answer.

### Rules

* A deck has **1 to 100** cards. **+** is hidden once the deck holds 100.
* Removing a card shows the card before it; removing the first card shows the next one.
* Each side holds up to 1000 characters.
* Moving to a different card always shows its question side first.

### In Preview and for learners

* The learner clicks the card (or presses Space or Enter) to flip it.
* **Previous / Next** arrows move through the deck. Left and Right arrow keys do the same. Previous is disabled on the first card and Next on the last.
* A counter ("2 / 5") and a thin progress bar show where they are.
* Nothing is recorded: no "I knew it / I didn't" rating.

---

## Block 3: Tabs

### What it is

A row of named tabs. Each tab has a short note and can show one image or one video. Use it to group related material, such as "Overview / Setup / Advanced". A tab never holds other blocks.

### In Edit

* **Tab row.** Pill-style tabs. The active tab is highlighted. Click a tab to open it.
* **Rename.** Click the active tab's name and type. The pill grows to fit.
* **Add tab.** An "Add tab" button at the end of the row adds a tab named "New tab", opens it, and selects its name so the admin can type over it.
* **Remove tab.** An X on the active tab removes it and its content. After removing, the first remaining tab opens.
* **Tabs position.** A small control above the row sets the tab row to **left, centre or right**. The default is centre.
* **Tab note.** Each tab starts with a short editable note (for example "A quick overview of what this section covers."). Placeholder: "Write a note for this tab…".
* **Tab media.** Under the note, a tab with no media shows two buttons: **Add image** and **Add video**. Each opens the same picker as the Image and Video blocks. The chosen image or video shows in the tab, with that block's own controls (Change image and image settings, or the video card's Change video), and a **Remove image** / **Remove video** button that brings the two buttons back. A tab holds one item: Change image or Change video replaces it.

### Rules

* A Tabs block has **1 to 10** tabs. The remove button is hidden when one tab is left, and "Add tab" disappears at 10. A tab name is up to 60 characters and a note up to 500.
* A tab holds at most **one** image or video, saved in the Tabs block itself. It never holds other blocks, so the floating add bar, "Ask AI" and the "+" between blocks always add to the main lesson.
* Only the open tab's content is shown. Switching tabs never loses content.
* A tab's video is not part of "watch to complete": only Video blocks can be required.

### In Preview and for learners

* The tab row is shown at the chosen position. Clicking a tab shows that tab's note and content.
* The first tab is open when the lesson loads.
* Rename, add, remove and position controls are hidden.

---

## Block 4: Multiple Choice

### What it is

One question with a few possible answers. One answer is correct. It is a self-check for the learner.

### In Edit

* **Question.** Click the question text and type.
* **Options.** Each option is a line of editable text with a letter badge (A, B, C...).
* **Mark the correct answer.** Click an option's letter badge. That option shows a "Correct answer" tag, and the previous correct option is cleared. Exactly one option is correct at any time.
* **Add option.** An "Add option" button below the list adds a new option ("New option") and puts the cursor in it.
* **Remove option.** Each option has an X button. Letters re-number after a removal.
* **Image (optional).** An image button in the block's top-right corner (Add media, then Image) lets the admin add one image, shown above the question. An X on the image removes it.
* A hint says: "Click a letter to mark the correct answer."

### Rules

* A question has at least **2** and at most **10** options. Remove is disabled when only two are left, and "Add option" disappears at ten.
* The question can be up to 1000 characters and each option up to 500.
* The first example has the correct answer already set. If the admin removes the correct option, the first remaining option becomes correct, so a question is never saved without a correct answer.

### In Preview and for learners

* The hint changes to "Choose one answer."
* The learner clicks an option to select it. They can change their mind before checking.
* **Check answer** is disabled until an option is chosen.
* After checking:
  * The correct option is highlighted green.
  * If the learner picked a wrong one, it is highlighted red.
  * A message appears: "Correct — well done!" or "Not quite. The correct answer is highlighted."
  * Options can no longer be changed, and the button becomes **Try again**.
* **Try again** clears everything so the learner can answer again.
* **Practice only.** The answer is not saved, not graded, and has no effect on lesson completion or progress.

---

## Block 5: Process

### What it is

A walkthrough in steps. The learner sees one step at a time, with a progress stepper across the top.

### In Edit

* **Step heading and body.** Click the heading or body text of the current step and type.
* **Stepper.** A row of numbered circles joined by lines, one per step, each labelled with the step's heading. Clicking a step shows it. Steps before the current one show a tick. The label updates as the admin types the heading. An empty heading shows "Untitled step".
* **Image (optional).** The media button in the toolbar adds one image to the **current step**. The image shows beside the text. A small X on the image removes it.
* **Delete this step.** A trash button in the toolbar deletes the current step.
* **Add step.** An "Add step" button under the block adds a step ("New step", "Describe this step.") and shows it.

### Rules

* A process has at least **1** and at most **20** steps. Delete does nothing when only one is left, and "Add step" disappears at 20. A heading is up to 200 characters and a body up to 2000.
* After deleting a step, the previous step is shown. When the first step is deleted, the next step is shown.
* Each step has its own optional image. A step without an image uses the full width for text.

### In Preview and for learners

* **Back** and **Next** buttons move through the steps. Back is disabled on the first step.
* On the last step, Next becomes **Start over**, which returns to step 1.
* A thin progress bar between the buttons fills as the learner moves forward.
* Clicking a circle in the stepper jumps to that step.
* Edit controls are hidden.

---

## The empty state

When a lesson has no blocks, the canvas shows:

* A heading: **"What goes in this lesson?"**
* A line under it: "Pick a block to begin. You can add more at any time."
* A **grid of tiles**, each with an icon and a label: Note, Video, Image, HTML, Multiple Choice and **All blocks**. All blocks opens the same grouped, searchable list as the floating bar's All blocks button, under the grid. On narrow screens the grid shows 3 columns.
* An **Ask AI** button under the grid (shortcut Cmd/Ctrl + I) that opens the same Ask AI prompt as the floating bar.

Clicking a tile adds that block's ready-made example and the empty state disappears. If the admin later removes every block, the empty state comes back.

The add-content empty state is only visible in Edit. In Preview, an empty lesson shows "Nothing to preview yet" with a prompt to switch to Edit. Learners see "This lesson isn't ready yet" and "Your instructor hasn't added any content to this lesson. Check back soon." Each empty state shows the `MachineBlankLesson` animation.

## Add content menu

* **Between blocks.** The "+" between two blocks opens a menu of all ten block types as tiles, plus **"Ask AI instead"** (shortcut Cmd/Ctrl + I). The new block is inserted exactly at that spot. The menu closes when the admin picks a tile, presses Escape, or clicks elsewhere. Only one menu is open at a time.
* **End of lesson.** A floating bar at the bottom of the canvas pins five types (Note, Video, Image, HTML, Multiple Choice), plus **Ask AI** and an **All blocks** button that opens a searchable list of every type, grouped into Text, Media, Interactive and Advanced. That list also shows planned types (Audio, Poll, Timeline, Code, Embed) as disabled **Coming soon** tiles. The bar always adds to the **end** of the lesson, never into a tab.
* Chart, Flashcards, Tabs, Multiple Choice, Process and HTML carry a **New** badge in every list.

---

## Data and API (high level)

v1 already stores the lesson as an ordered list of blocks, where each block has a type and its own content. v2 adds five new block types to that list. Each new block keeps its own content with the block:

| Block | What is saved |
| --- | --- |
| Chart | Title, chart type, list of label + value pairs |
| Flashcards | List of cards, each with a question and an answer (in order) |
| Tabs | Tab row position, and for each tab: its name, its note, and one optional image or video |
| Multiple Choice | Question, list of options, which option is correct, optional image |
| Process | List of steps, each with a heading, body text and optional image |

Notes for developers:

* Images in Multiple Choice and Process use the same upload and media handling as the v1 Image block.
* A tab's image or video is stored in the Tabs block's own data, with the same data rules as an Image or Video block. A tab's video gets the same treatment as a Video block: its asset must belong to the organization, it shows in the media library's usage, its playback links are signed, its encoding status is polled, and public pages receive only its public fields.
* Learner activity (flipped cards, open tab, current step, chosen answer) is **not** stored. No new learner tables are needed.
* Validation limits: Chart 1–12 data points, values 0 or more; Flashcards 1–100 cards, each side up to 1000 characters; Tabs 1–10 tabs, names up to 60 characters and notes up to 500; Multiple Choice 2–10 options, exactly 1 correct, question up to 1000 characters and options up to 500; Process 1–20 steps, headings up to 200 characters and bodies up to 2000.
* Lessons created before v2 are unaffected.

## AI assistant

The AI assistant can create and edit all five new blocks, the same way it writes Notes.

* It has one tool per block: `write_lesson_chart_block`, `write_lesson_flashcards_block`, `write_lesson_tabs_block`, `write_lesson_multiple_choice_block` and `write_lesson_process_block`. Without a block id the tool adds a new block, at the end or next to a block the assistant names; with a block id and the `version` it read (as `expectedVersion`) it replaces that block's content. If the block changed since the assistant read it, including being placed in another lesson, the tool refuses with a version conflict and the assistant reads the lesson again and redoes the change.
* It reads these blocks' content when it looks at a lesson, so it can edit them, and it can remove them. It still cannot remove Video, Slides, Document or Image blocks.
* A request for a multiple-choice question inside a lesson becomes a Multiple Choice block. A graded quiz is still an exercise.
* It can give a tab an image from a link the teacher provides, but it cannot add a video or pick a different one. When it rewrites the tabs, a tab it keeps (same id) without sending an image keeps its video; giving that tab an image, or removing the tab, removes the video.
* Images the assistant writes (a tab image, a Multiple Choice image, a Process step image) must be https links. An existing image that is not https is shown to it as `keepImage`; sending `keepImage` back keeps the image, and leaving out both the image and `keepImage` removes it.
* Each block type declares this in its contract (`agent` in `packages/utils/src/validation/block/definitions/`), so the assistant's tools are built from the registry.

## Non-goals

* Saving, grading or reporting learner answers, ratings or scores
* Blocks inside a tab
* Importing chart data from CSV or a spreadsheet
* More than one image per question or step, or video inside a Process step
* More chart types (area, scatter, stacked) or multiple series
* More than one correct answer, or other question types, in Multiple Choice
* Changing any v1 behaviour

---

## Acceptance Criteria

### Shared

- [ ] Chart, Flashcards, Tabs, Multiple Choice and Process each appear in the "+" menu between blocks and in **All blocks**, in that order after Note, Video, Slides, Document and Image.
- [ ] Adding any of the five inserts a ready-made, working example.
- [ ] Each can be reordered by drag handle and move up/down, and removed from its "..." menu, like any v1 block.
- [ ] Every edit autosaves and survives a page reload.
- [ ] Preview hides all editing controls for every new block.
- [ ] Learner position inside a block is not saved and resets on reload.
- [ ] All v1 behaviour (canvas, Preview, Settings slider, existing five types, AI Note, mobile layout) is unchanged.
- [ ] The new blocks are usable on a phone-width screen with no sideways page scroll.

### Chart

- [ ] The admin can set a title and choose Bar, Line, Pie or Donut; the chart redraws immediately and keeps its data.
- [ ] "Edit data" shows a Label and Value row per data point; changing a value redraws the chart live.
- [ ] "Add data point" adds a "New" row with value 0 and focuses its label; it is hidden at 12 points.
- [ ] The last remaining data point cannot be deleted.
- [ ] Negative or non-numeric values are treated as 0.
- [ ] The summary line updates itself (highest point for Bar/Line, total for Pie/Donut).
- [ ] Pie and Donut show a legend with label, value and percentage; Donut shows the total in the centre.
- [ ] An all-zero Pie or Donut shows an empty ring and does not error.
- [ ] In Preview the title is plain text, and the type buttons and "Edit data" are hidden.

### Flashcards

- [ ] The admin can type directly into the question and the answer of the current card.
- [ ] Flip (card click in Preview, the flip button on the card in Edit) switches between question and answer with a 3D turn.
- [ ] The number strip is the only thing in the Edit footer; it jumps to a card, and "+" adds an empty card and focuses its question.
- [ ] A trash button beside the flip button removes the card on screen; the last card has no trash button.
- [ ] The number strip shows every card number and wraps onto more rows.
- [ ] Previous/Next and Left/Right keys move through the deck; Space/Enter flips; the ends are disabled.
- [ ] The counter and progress bar always match the current card.
- [ ] Changing card always shows the question side first.

### Tabs

- [ ] The admin can rename a tab by clicking its name.
- [ ] "Add tab" adds "New tab", opens it, and selects its name for typing.
- [ ] Removing a tab removes its content and opens the first remaining tab; the last tab cannot be removed.
- [ ] The admin can set the tab row to left, centre or right; centre is the default.
- [ ] Each tab has an editable note.
- [ ] A tab without media shows "Add image" and "Add video", which open the Image and Video pickers.
- [ ] A tab holds one image or video; Change image / Change video replaces it, and "Remove image" / "Remove video" clears it.
- [ ] A tab never holds other blocks.
- [ ] Switching tabs never loses content.
- [ ] In Preview, clicking a tab shows its note and its image or video; edit controls are hidden; the first tab is open on load.

### Multiple Choice

- [ ] The admin can edit the question and each option by typing.
- [ ] Clicking a letter marks that option correct and clears the previous one; exactly one is correct at a time.
- [ ] Removing the correct option makes the first remaining option correct.
- [ ] "Add option" adds an option and focuses it; letters re-number after a removal.
- [ ] A question cannot go below 2 options.
- [ ] The admin can add one optional image above the question.
- [ ] In Preview, "Check answer" is disabled until an option is chosen, and the learner can change their choice before checking.
- [ ] After checking, the correct option is green, a wrong pick is red, a message is shown, options are locked, and the button reads "Try again".
- [ ] "Try again" resets the block.
- [ ] No answer is saved and nothing changes in lesson progress.

### Process

- [ ] The admin can edit the heading and body of the current step by typing.
- [ ] The stepper shows one labelled circle per step; passed steps show a tick; the label follows the heading as it is typed; an empty heading shows "Untitled step".
- [ ] The admin can add one optional image to the current step and remove it; the layout changes between text-only and text-plus-image.
- [ ] "Add step" adds a step and shows it; "Delete this step" removes the current step and shows the previous one (the next one when the first step is deleted); the last step cannot be deleted.
- [ ] Back and Next move between steps; Back is disabled on step 1; on the last step Next becomes "Start over" and returns to step 1.
- [ ] Clicking a stepper circle jumps to that step; the progress bar always matches.

### Empty state and Add content menu

- [ ] A lesson with no blocks shows "What goes in this lesson?", the supporting line, the five-tile grid with All blocks, and Ask AI, in Edit only.
- [ ] Clicking a tile adds that example and removes the empty state; deleting every block brings it back.
- [ ] The grid shows 3 columns on narrow screens.
- [ ] The "+" between blocks opens a ten-tile menu plus "Ask AI instead", and inserts at that exact position.
- [ ] The menu closes on pick, Escape, outside click, or when another menu opens.
- [ ] The floating bar adds to the end of the lesson, never into a tab.

## Status

Draft. Depends on v1 shipping first.
