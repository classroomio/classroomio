# Fixture attribution

Hand-written fixtures are original works for this repository. Third-party packages committed to git are credited below with their open-source licenses. Other vendor packages stay off disk or in local-only directories.

## In git (original, no attribution needed)

- `scorm12-minimal.zip`, `scorm2004-minimal.zip` — one-SCO API exercisers, one per version.
- `scorm2004-three-modules.zip` — three 2004 modules, the quiz graded at 0.8.
- `scorm12-quiz-mastery.zip` — 1.2 quiz with `adlcp:masteryscore` 80 that never sets a status.
- `streamed-launcher.zip` — launcher that frames vendor content from a second origin.
- `vendor-storyline-style.zip` — synthetic Storyline-shaped 1.2 quiz (`index_lms.html` entry point, `adlcp:masteryscore` 80, a 4-second self-generated ffmpeg test-pattern MP4 with a 440 Hz tone) that exercises vendor launch filenames without proprietary exports.
- `vendor-rise-style.zip` — synthetic Rise-shaped 2004 lesson (`indexapi.html` entry point, many small stub assets) that exercises multi-file layouts without proprietary exports.
- `reject-external-launch.zip` — SCO whose launch URL is absolute `https://`; import must reject it.
- `reject-assets-only.zip` — manifest with only `asset` resources; import must reject it.

## In git (third-party, CC BY 3.0)

- Rustici golf examples (`ContentPackaging*.zip`, `Runtime*.zip`, `RunTimeAdvancedCalls_SCORM20043rdEdition.zip`, `Sequencing*.zip`) — created by Rustici Software, LLC and licensed under Creative Commons Attribution 3.0 United States (CC BY 3.0 US), https://creativecommons.org/licenses/by/3.0/us/. Source: https://scorm.com/scorm-explained/technical-scorm/golf-examples/.

## Not in git (vendored locally only)

- Adapt Learning course, GPL-3.0, built in-house from https://github.com/adaptlearning/adapt_authoring. Build with the authoring tool, export SCORM 1.2 and 2004, and place the ZIPs in `vendor/`. GPL-3.0 test use is compatible with this repository's AGPL-3.0.
- Vendor exports (Storyline 360 in 1.2 and 2004 4th edition, Rise 360, Captivate, iSpring, Elucidat default export) stay on the tester's machine only, never in git or `vendor/`.

