# @cio/course-app

Create a university site for your SAAS in seconds, ready to go. Just add your content.

## Usage

To create a template run:

```bash
npx @cio/course-app@latest name-of-your-project -t name-of-template --course
```

### Commands

The CLI accepts the following arguments

- argument 1 : `name-of-project` this argument is the name of your project
- argument 2 : `--template name-of-template` this argument is the name of the template you wish to use
- argument 3 : `--courses` an option to use our demo courses

## Available Templates

- cal
- classic
- minimalistic
- posthog
- webflow

## Developing

Once you've created a project, then `cd into your project` and install dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```
