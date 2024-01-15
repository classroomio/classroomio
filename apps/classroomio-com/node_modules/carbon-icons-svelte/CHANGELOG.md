# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [12.3.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v12.3.0) - 2023-09-02

**Features**

- upgrade `@carbon/icons` to v11.26.0 (net +47 icons)

## [12.2.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v12.2.0) - 2023-08-26

**Features**

- upgrade `@carbon/icons` to v11.25.0 (net +2 icons)

## [12.1.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v12.1.0) - 2023-07-19

**Features**

- support Svelte version 4; minimum Svelte version required for TypeScript users is now 3.55

## [12.0.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v12.0.0) - 2023-07-08

**Breaking Changes**

- rename `UndefinedGlyph` to `DiamondFillGlyph`

**Features**

- upgrade `@carbon/icons` to v11.16.1 (net +98 icons)

## [11.4.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v11.4.0) - 2022-10-14

**Features**

- upgrade `@carbon/icons` to v11.10.0 (net +4 icons)

## [11.3.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v11.3.0) - 2022-09-16

**Features**

- upgrade `@carbon/icons` to v11.8.0 (net +59 icons)

## [11.2.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v11.2.0) - 2022-07-22

**Features**

- upgrade `@carbon/icons` to v11.6.0 (net +1 icon)

## [11.1.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v11.1.0) - 2022-05-27

**Features**

- upgrade `@carbon/icons` to v11.3.0 (net +16 icons)

## [11.0.1](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v11.0.1) - 2022-04-03

**Fixes**

- avoid duplicate exports from `lib/index.js`

## [11.0.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v11.0.0) - 2022-04-03

**Breaking Changes**

- move icons to the top-level `lib` folder (e.g., `carbon-icons-svelte/lib/Add.svelte`)
- specify icon size using the `size` prop (`16 | 20 | 24 | 32`); the default size is `16`
- default slot has been removed
- forwarded events have been removed

## [10.45.1](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.45.1) - 2022-03-19

**Fixes**

- `CarbonIcon` interface should not extend svg attributes or include fill, stroke, width, height props
- add missing prop descriptions to `CarbonIconProps`

## [10.45.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.45.0) - 2022-03-12

**Features**

- upgrade `@carbon/icons` to v10.48.0 (net +144 icons)

## [10.44.4](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.44.4) - 2022-01-22

**Fixes**

- generate typedef for source Svelte components (i.e., `Add16.svelte.d.ts`)

## [10.44.3](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.44.3) - 2021-12-15

**Fixes**

- set `type="module"` in package.json

## [10.44.2](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.44.2) - 2021-12-14

**Fixes**

- revert addition of `exports.import` field in `package.json`

## [10.44.1](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.44.1) - 2021-12-14

**Fixes**

- specify `exports.import` field in `package.json` to appease vite 2.7 "incorrectly packaged" warning

## [10.44.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.44.0) - 2021-12-03

**Features**

- upgrade `@carbon/icons` to v10.44 (net +232 icons)

## [10.38.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.38.0) - 2021-09-05

**Features**

- upgrade `@carbon/icons` to v10.38 (net +356 icons)

## [10.37.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.37.0) - 2021-09-05

**Features**

- upgrade `@carbon/icons` to v10.37 (no net change)

## [10.36.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.36.0) - 2021-07-22

**Features**

- upgrade `@carbon/icons` to v10.36 (net +570 icons)

**Fixes**

- ignore `a11y-mouse-events-have-key-events` warning

## [10.35.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.35.0) - 2021-07-08

- upgrade `@carbon/icons` to v10.35 (net -20 icons)

## [10.33.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.33.0) - 2021-06-14

- upgrade `@carbon/icons` to v10.33.0 (net +140 icons)

## [10.28.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.28.0) - 2021-03-24

- upgrade `@carbon/icons` to v10.28.0 (net +156 icons)

## [10.27.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.27.0) - 2021-03-18

- Bump `@carbon/icons` to v10.27.0 (no net change)
- use `SvelteComponentTyped` interface for type definitions

## [10.23.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.23.0) - 2021-01-10

- Bump `@carbon/icons` to 10.23.0 (net +328 icons)

## [10.21.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.21.0) - 2020-11-16

- Bump `@carbon/icons` to 10.21.0 (net +772 icons)
- Refactor TypeScript definitions to be more concise/performant

## [10.17.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.17.0) - 2020-09-04

- Bump `@carbon/icons` to 10.17.0 (+216 icons)
- Use new Svelte component events interface in TypeScript definitions

## [10.15.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.15.0) - 2020-08-09

- Fix TypeScript definitions to stub the `on:event` directive
- Bump `@carbon/icons` build dependency to 10.15.0

## [10.14.1](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.14.1) - 2020-07-24

- Add TypeScript definitions for module imports

## [10.14.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.14.0) - 2020-07-20

- Bump `@carbon/icons` build dependency to 10.14.0 (348 icons)

## [10.13.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.13.0) - 2020-06-20

- Bump `@carbon/icons` build dependency to 10.13.0

## [10.12.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.12.0) - 2020-06-08

- Bump `@carbon/icons` build dependency to 10.12.0 (468 new icons)

- Add new default SVG attribute `fill="currentColor"` which can still be overridden using the style attribute (e.g. `<CarbonIcon style="fill: red" />`)

## [10.10.2](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.10.2) - 2020-05-02

- Bump `@carbon/icons` build dependency to 10.10.2

- Refactor to use fs async I/O methods with `util.promisify`

- Replace `tape` with Node.js `assert`

## [10.10.1](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.10.1) - 2020-04-21

- Remove `engines` field from package.json because node version >=12 is only required for development, not consumption

## [10.10.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.10.0) - 2020-04-17

- Bump `@carbon/icons` build dependency to 10.10.0

- Prune development dependencies (husky, commitlint, prettier)

- Replace jest with tape

- Use recursive `fs.rmdirSync` (requires Node.js version >=12)

- Build and run script in Travis CI

## [10.9.3](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.9.3) - 2020-03-27

- Bump `@carbon/icons` build dependency to 10.9.3

- Bump `@carbon/icon-helpers` build dependency to 10.6.0

- Use `defaultAttributes.preserveAspectRatio` from `@carbon/icon-helpers`

## [10.9.2](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.9.2) - 2020-03-20

- Bump `@carbon/icons` build dependency to 10.9.2

## [10.9.2-rc.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.9.2-rc.0) - 2020-03-11

- Bump `@carbon/icons` build dependency to 10.9.2-rc.0; skips version 10.9.1 due to breaking change (resolved by [carbon-design-system/carbon/pull/5536](https://github.com/carbon-design-system/carbon/pull/5536))

## [10.9.0-rc.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.9.0-rc.0) - 2020-02-12

- Bump `@carbon/icons` build dependency to 10.9.0-rc.0

## [10.8.4](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.8.4) - 2020-02-01

- Bump `@carbon/icons` build dependency to 10.8.2

## [10.8.3](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.8.3) - 2020-01-27

- Bump `@carbon/icons` build dependency to 10.8.1

- Update documentation in README to include CodeSandbox examples

## [10.8.2](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.8.2) - 2019-12-30

- Fix focusring bug by removing `on:focus`, `on:blur` events
  ([#20](https://github.com/carbon-design-system/carbon-icons-svelte/issues/20))

- Use strict equality check for `tabindex` ('0') to override `focusable` prop

## [10.8.1](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.8.1) - 2019-12-29

- Forward `on:keyup`, `on:keydown`, `on:focus`, `on:blur` events
  ([#17](https://github.com/carbon-design-system/carbon-icons-svelte/issues/17))

- Mark constant assignments as reactive
  ([#18](https://github.com/carbon-design-system/carbon-icons-svelte/issues/18))

## [10.8.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.8.0) - 2019-12-22

- Upgrade @carbon/icons to 10.8.0
  ([#11](https://github.com/carbon-design-system/carbon-icons-svelte/issues/11))

- Support optional `id` prop
  ([#14](https://github.com/carbon-design-system/carbon-icons-svelte/issues/14))

- Add data selector to svg element for easier querying
  ([#15](https://github.com/carbon-design-system/carbon-icons-svelte/issues/1))

## [10.8.0-rc.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v10.8.0-rc.0) - 2019-12-14

- Upgrade @carbon/icons to 10.8.0-rc.0

- Use build-info.json from @carbon/icons to generate library and icon index
  ([#6](https://github.com/carbon-design-system/carbon-icons-svelte/issues/6))

## [1.0.1](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v1.0.1) - 2019-12-14

- Add rollup set-up to examples
  ([#3](https://github.com/carbon-design-system/carbon-icons-svelte/issues/3))

- Update documentation for usage, API, forwarded events
  ([#2](https://github.com/carbon-design-system/carbon-icons-svelte/issues/2))

## [1.0.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v1.0.0) - 2019-12-13

- Breaking changes: remove `width`, `height` props, change `focusable` prop from string to boolean

- Use `formatAttributes`, `toString` utilities from `@carbon/icon-helpers`
  ([#4](https://github.com/carbon-design-system/carbon-icons-svelte/issues/4))

## [0.1.0](https://github.com/carbon-design-system/carbon-icons-svelte/releases/tag/v0.1.0) - 2019-12-13

- Initial release (using `@carbon/icons@10.6.1`, `@carbon/icon-helpers@10.4.0`)
