# Insights analytics prototype

Static mock of the cohort, course and organization dashboards described in [`prd/insights-analytics`](../../prd/insights-analytics/README.md).

Open `index.html` in a browser. All people and numbers are generated sample data.

- Every widget shows its metric spec (toggle with "Show metric specs").
- Badges show whether the data exists today: **Data available**, **Derived**, **Needs work**.
- Each dashboard sits inside the real app navigation for its page, with the route shown in the header: the cohort sidebar (`/cohorts/[id]/analytics`, new), the course sidebar (`/courses/[id]/analytics`, replaces the current page) and the org sidebar (`/org/[slug]/analytics`, new, with the existing page renamed "Marketing"). Tags and file paths in the note above the app show what to add, replace or rename.
- In the org view, click "Marketing" in the sidebar to see where the renamed page goes.
- The cohort page has a searchable, filterable learner matrix. Click a row to chart that learner against the cohort average.
- Every card shows skeleton blocks (the dashboard's `Skeleton` style) while its data loads.
