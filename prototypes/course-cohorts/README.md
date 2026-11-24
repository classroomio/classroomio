# Course cohorts prototype

Clickable prototype for `prd/course-cohorts/README.md`. Open `index.html` for the screen map and journeys.

Serve the folder with any static server, for example:

```bash
cd prototypes/course-cohorts && python3 -m http.server 4780
```

## Files

| File | What it shows |
| --- | --- |
| `index.html` | Map of journeys and screens |
| `courses.html` | Courses page: copy-detection banner, Merge courses button, Duplicate → Run a new cohort |
| `merge.html` | Merge wizard (4 steps), merging animation, result, conflict state, undo animation (`?undo=1`) |
| `course.html?page=…` | Instructor course pages with the cohort filter: `people`, `submissions`, `marks`, `attendance`, `analytics`, `newsfeed`, `content`, `settings` |
| `lesson.html?item=…` | Lesson / exercise with Lesson settings → Schedule by cohort (`l33` live lesson, `e4` exercise) |
| `cohort.html` | Cohort → Courses, with run window and shifted schedule when adding a course |
| `student.html` | Student course view, own cohort schedule, retake switch (`?persona=retake`) |
| `cohorts.js` / `cohorts.css` | Shared mock data, shells and components |
| `app-theme.css` / `proto.css` | Theme tokens and base recipes copied from the course-templates prototype (mirror `packages/ui`) |

## Component mapping

Everything maps to an existing `@cio/ui` (shadcn-svelte) component:

- Cohort filter: Combobox (`Popover` + `Command`), state in `?cohortId=`
- Schedule field state (Course · Custom · None): `ToggleGroup`
- Wizard progress: onboarding `Stepper`, to be moved to `@cio/ui/custom/stepper`
- Notices: `Alert`; lists: `Table`; states: `Badge`; diffs: `Sheet`; empty states: `Empty`
- Footers follow the dialog button hierarchy: Back `secondary`, Cancel `outline`, primary CTA on the right

## Mock data

One course, **Data Analysis**, merged from 7 per-batch copies into 7 cohorts (123 cohort students + 3 Direct = 126). Today is fixed at Nov 16, 2026 so dates, locks and recordings resolve consistently.
