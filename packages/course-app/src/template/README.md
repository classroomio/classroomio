# course-app

`course-app` allows you create beautiful looking university sites in minutes for your SAAS. Companies like Webflow, Jira, Framer, Hubspot, Google all have university sites that helps them educate their customers and create loyal communities.

## Features

- Pages can be managed from json files
- Courses can be managed in markdown
- Sections and Lessons broken into folders and automatically rendered

## Folder Structure

```bash
/src
  /courses
    /course-1-slug
      /section-slug
        lesson-1-slug.md
        lesson-2-slug.md
        ...
        metadata.json
      metadata.json
    metadata.json
    ...
  /lib
    /components
      /ui
      Navigation.svelte
      ...
    /data
      pages.json
      ...
    /utils
      /constants
        page.ts
        ...
      /helpers
        page.ts
        ...
      /stores
        page.ts
        ...
      /types
        page.ts
        ...
  /routes
    ...
```
