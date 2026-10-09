# Fixture attribution

Hand-written fixtures are original works for this repository. Third-party packages are never committed; fetch them with the notes below.

## In git (original, no attribution needed)

- `scorm12-minimal.zip`, `scorm2004-minimal.zip` — one-SCO API exercisers, one per version.
- `scorm2004-three-modules.zip` — three 2004 modules, the quiz graded at 0.8.
- `scorm12-quiz-mastery.zip` — 1.2 quiz with `adlcp:masteryscore` 80 that never sets a status.
- `streamed-launcher.zip` — launcher that frames vendor content from a second origin.
- `reject-external-launch.zip` — SCO whose launch URL is absolute `https://`; import must reject it.
- `reject-assets-only.zip` — manifest with only `asset` resources; import must reject it.

## Not in git (vendored locally only)

- Rustici golf examples, CC BY 3.0, https://scorm.com/scorm-explained/technical-scorm/golf-examples/. Download the SCORM 1.2 and SCORM 2004 editions into `vendor/` and keep the license file beside them.
- Adapt Learning course, GPL-3.0, built in-house from https://github.com/adaptlearning/adapt_authoring. Build with the authoring tool, export SCORM 1.2 and 2004, and place the ZIPs in `vendor/`. GPL-3.0 test use is compatible with this repository's AGPL-3.0.
- Vendor exports (Storyline 360 in 1.2 and 2004 4th edition, Rise 360, Captivate, iSpring, Elucidat default export) stay on the tester's machine only, never in git or `vendor/`.
