# The Vercel Style Guide

<a aria-label="Vercel logo" href="https://vercel.com">
  <img alt="" src="https://img.shields.io/badge/Made%20by%20Vercel-000000.svg?style=flat-square&logo=Vercel&labelColor=000">
</a>
<a aria-label="NPM version" href="https://www.npmjs.com/package/@vercel/style-guide">
  <img alt="" src="https://img.shields.io/npm/v/@vercel/style-guide.svg?style=flat-square&labelColor=000000">
</a>
<a aria-label="License" href="https://github.com/vercel/style-guide/blob/canary/LICENSE.md">
  <img alt="" src="https://img.shields.io/npm/l/@vercel/style-guide.svg?style=flat-square&labelColor=000000">
</a>
<a aria-label="CI status" href="https://github.com/vercel/style-guide/actions/workflows/quality.yml?query=event%3Apush+branch%3Amain">
  <img alt="" src="https://img.shields.io/github/actions/workflow/status/vercel/style-guide/quality.yml?event=push&branch=main&style=flat-square&labelColor=000000">
</a>

## Introduction

This repository is the home of Vercel's style guide, which includes configs for
popular linting and styling tools.

The following configs are available, and are designed to be used together.

- [Prettier](#prettier)
- [ESLint](#eslint)
- [TypeScript](#typescript)

## Contributing

Please read our [contributing](https://github.com/vercel/style-guide/blob/main/CONTRIBUTING.md)
guide before creating a pull request.

## Installation

All of our configs are contained in one package, `@vercel/style-guide`. To install:

```sh
# If you use npm
npm i --save-dev @vercel/style-guide

# If you use pmpm
pnpm i --save-dev @vercel/style-guide

# If you use Yarn
yarn add --dev @vercel/style-guide
```

Some of our ESLint configs require peer dependencies. We'll note those
alongside the available configs in the [ESLint](#eslint) section.

## Prettier

> Note: Prettier is a peer-dependency of this package, and should be installed
> at the root of your project.
>
> See: https://prettier.io/docs/en/install.html

To use the shared Prettier config, set the following in `package.json`.

```json
{
  "prettier": "@vercel/style-guide/prettier"
}
```

## ESLint

> Note: ESLint is a peer-dependency of this package, and should be installed
> at the root of your project.
>
> See: https://eslint.org/docs/user-guide/getting-started#installation-and-usage

This ESLint config is designed to be composable.

The following base configs are available. You can use one or both of these
configs, but they should always be first in `extends`:

- `@vercel/style-guide/eslint/browser`
- `@vercel/style-guide/eslint/node`

Note that you can scope configs, so that configs only target specific files.
For more information, see: [Scoped configuration with `overrides`](#scoped-configuration-with-overrides).

The following additional configs are available:

- `@vercel/style-guide/eslint/jest`
- `@vercel/style-guide/eslint/jest-react` (includes rules for `@testing-library/react`)
- `@vercel/style-guide/eslint/next` (requires `@next/eslint-plugin-next` to be installed at the same version as `next`)
- `@vercel/style-guide/eslint/playwright-test`
- `@vercel/style-guide/eslint/react`
- `@vercel/style-guide/eslint/typescript` (requires `typescript` to be installed and [additional configuration](#configuring-eslint-for-typescript))

> You'll need to use `require.resolve` to provide ESLint with absolute paths,
> due to an issue around ESLint config resolution (see
> [eslint/eslint#9188](https://github.com/eslint/eslint/issues/9188)).

For example, use the shared ESLint config(s) in a Next.js project, set the
following in `.eslintrc.js`.

```js
module.exports = {
  extends: [
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/react'),
    require.resolve('@vercel/style-guide/eslint/next'),
  ],
};
```

### Configuring ESLint for TypeScript

Some of the rules enabled in the TypeScript config require additional type
information, you'll need to provide the path to your `tsconfig.json`.

For more information, see: https://typescript-eslint.io/docs/linting/type-linting

```js
const { resolve } = require('path');

const project = resolve(__dirname, 'tsconfig.json');

module.exports = {
  root: true,
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
  ],
  parserOptions: {
    project,
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
};
```

### Configuring custom components for `jsx-a11y`

It's common practice for React apps to have shared components like `Button`,
which wrap native elements. You can pass this information along to `jsx-a11y`
via the `components` setting.

The below list is not exhaustive.

```js
module.exports = {
  root: true,
  extends: [require.resolve('@vercel/style-guide/eslint/react')],
  settings: {
    'jsx-a11y': {
      components: {
        Article: 'article',
        Button: 'button',
        Image: 'img',
        Input: 'input',
        Link: 'a',
        Video: 'video',
      },
    },
  },
};
```

### Scoped configuration with `overrides`

ESLint configs can be scoped to include/exclude specific paths. This ensures
that rules don't "leak" into places where those rules don't apply.

In this example, Jest rules are only being applied to files matching Jest's
default test match pattern.

```js
module.exports = {
  extends: [require.resolve('@vercel/style-guide/eslint/node')],
  overrides: [
    {
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
      extends: [require.resolve('@vercel/style-guide/eslint/jest')],
    },
  ],
};
```

#### A note on file extensions

By default, all TypeScript rules are scoped to files ending with `.ts` and
`.tsx`.

However, when using overrides, file extensions must be included or ESLint will
only include `.js` files.

```js
module.exports = {
  overrides: [
    { files: [`directory/**/*.[jt]s?(x)`], rules: { 'my-rule': 'off' } },
  ],
};
```

## TypeScript

To use the shared TypeScript config, set the following in `tsconfig.json`.

```json
{
  "extends": "@vercel/style-guide/typescript"
}
```
