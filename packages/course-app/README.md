<a href="https://courseapp.oncws.com/">
  <img alt="Create beautiful course websites to educate your customers" src="https://cdn.courseapp.oncws.com/courseapp-og.png" />
  <h1 align="center">CourseApp by ClassroomIO</h1>
  <p align="center">
    Create beautiful course websites to educate your customers.
    <br />
    <a href="https://courseapp.oncws.com">Website</a>  |  <a href="https://dub.sh/ciodiscord">Join Discord community</a>
  </p>
</a>

# CourseApp

Create a beautiful course website in seconds with our SvelteKit-powered CLI tool. Choose from multiple templates and customize your content through a simple file structure.

## Quick Start

```bash
pnpx @classroomio/course-app@latest
```

You'll be prompted to:
1. Enter a project name (or use `.` for current directory)
2. Select a template
3. Choose whether to include demo courses

## Available Templates

- `cal` - Cal.com inspired design
- `classic` - Traditional course layout
- `minimal` - Clean, minimalist design
- `posthog` - PostHog-style interface
- `webflow` - Webflow-inspired template

## Project Structure

```bash
your-project/
├── src/
│   ├── courses/                 # Your course content
│   │   ├── course-slug/
│   │   │   ├── metadata.json    # Course details
│   │   │   ├── section-1/
│   │   │   │   ├── metadata.json    # Section details
│   │   │   │   ├── lesson-1.md      # Lesson content
│   │   │   │   └── lesson-2.md
│   │   │   └── section-2/
│   │   └── another-course/
│   └── lib/
│       ├── components/          # Template-specific components
│       │   ├── cal/            # Cal.com template components
│       │   ├── classic/        # Classic template components
│       │   ├── minimal/        # Minimal template components
│       │   ├── posthog/        # PostHog template components
│       │   ├── webflow/        # Webflow template components
│       │   └── ui/             # Shared UI components
│       ├── data/               # Site configuration
│       │   └── pages.json      # Page layouts and content
│       └── utils/
│           ├── constants/      # App constants
│           ├── helpers/        # Helper functions
│           ├── stores/         # Svelte stores
│           └── types/         # TypeScript definitions
```

## Course Configuration

### Course Metadata

Each course needs a `metadata.json` file:

```json
{
  "title": "Your Course Title",
  "description": "Course description",
  "banner": "https://path-to-banner-image.jpg",
  "created_at": "24-11-2024",
  "cost": 0,
  "currency": "USD",
  "type": "paced"
}
```

### Section Metadata

Each section folder requires a `metadata.json`:

```json
{
  "title": "Section Title",
  "unlocked": true
}
```

### Lesson Content

Lessons are written in Markdown (`.md`) files:

```markdown
---
title: 'Lesson Title'
---

Your lesson content here...

## Supports Markdown Features

- Lists
- Code blocks
- Images
- And more!
```

## Customization

### Templates

Each template has its own component set in `src/lib/components/[template-name]/`. The active template is determined by the `VITE_TEMPLATE` environment variable.

### Navigation & Site Settings

Update `src/lib/data/pages.json` to customize your site settings. The file contains an array of three main page configurations:

```json
[
  {
    "id": "shared-page",
    "title": "Shared",
    "slug": "#",
    "sections": [
      // Global components like SEO, navigation, and footer
    ]
  },
  {
    "id": "home-page",
    "title": "Home Page",
    "slug": "/",
    "sections": [
      // Home page specific sections like hero, features, testimonials
    ]
  },
  {
    "id": "courses-page",
    "title": "Courses Page",
    "slug": "/courses",
    "sections": [
      // Course page specific sections
    ]
  }
]
```

Each page configuration includes:

1. **Shared Page** (`shared-page`):
   - Contains global components used across all pages
   - Configures SEO settings, main navigation, and footer
   - Always present regardless of the current route

2. **Home Page** (`home-page`):
   - Landing page configuration (`/` route)
   - Includes sections like header, about, featured courses, instructors, FAQ, testimonials, and CTAs
   - Configurable marketing sections to showcase your platform

3. **Courses Page** (`courses-page`):
   - Course listing page configuration (`/courses` route)
   - Contains course-specific header and layout settings
   - Manages how courses are displayed and filtered

Each section can be toggled with the `show` property and customized through its `settings` object. Here is a breakdown of each page

```ts
type Page = {
  id: string;
  title: string;
  slug: string;
  status: 'draft' | 'published';
  sections: Section[];
};

type Section = {
  settings: Record<string, any>;
  show: boolean;
  type: string;
};
```

## API Routes

The project includes built-in API routes:

- `/api/courses` - Returns all courses with their metadata
- Individual course data is dynamically loaded based on the URL structure

## Development

After creating your project:

```bash
cd your-project
pnpm install
pnpm run dev
```

## Next up

- More templates ;)
- Create quizzes
- Authentication
- Learning paths
- And more!
