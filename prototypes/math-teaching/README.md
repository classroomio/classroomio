# Math teaching prototype

Clickable mock for [`prd/math-teaching`](../../prd/math-teaching/README.md). Open `index.html` in a browser. It loads KaTeX, MathLive and Compute Engine from jsDelivr, so it needs a network connection.

## Flows

1. **Teacher writes.** An exercise editor with four questions (math expression, numeric, single answer, worked solution).
   - Type `$` or `/math` in any title, option or the description to open the math box, and click a formula to edit it. Pasted `\(…\)`, `\[…\]` and `$…$` become formulas.
   - The math box has **Type** (MathLive with a palette), **Photo** (upload, paste a screenshot or pick a sample, drag a box, convert), **Draw** (a canvas that converts when you pause) and **Ask AI** tabs. Every result goes through an editable review step and an engine validity check before it is inserted.
   - Each answer has a "Check as" mode (any equivalent form, expanded, factored, simplified, number), a per-question student keypad, and **Try an answer**.
2. **Student answers.** A phone-sized quiz with a per-question keypad, an AI tutor hint sheet, and Type / Photo / Draw working for the worked-solution question. Submitting adds a "You" row to the results.
3. **Teacher results.** A student × question grid with hover previews, answer clusters per question with "Mark correct for all" and partial credit, an AI-suggested mark for working that the teacher accepts or edits, and skill mastery with "assign practice".

## What is real and what is sample data

- **Real:** every grade, the "Try an answer" verdicts, answer clustering and the validity checks run [Compute Engine](https://mathlive.io/compute-engine/) in the browser. Math input is real [MathLive](https://mathlive.io/mathfield/), and display is KaTeX, as in production.
- **Sample:** Photo, Draw and Ask AI return canned LaTeX (the real version calls a vision model), the tutor hint wording is scripted, and the AI working suggestions and the 14 students are sample data.
