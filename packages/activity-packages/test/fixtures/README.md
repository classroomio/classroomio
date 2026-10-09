# Test fixtures

Hand-written packages plus vendor notes. Rebuild with `node test/fixtures/build-fixtures.mjs` from `packages/activity-packages`. Sources are the contract; the `.zip` files are built artifacts committed beside them.

## Baselines (recorded 9 October 2026)

| Fixture                   | Version  | SCOs        | Exit it sets                                                       | Suspend data                    | Files | Uncompressed | ZIP     | Sequencing | Pass mark                                                        |
| ------------------------- | -------- | ----------- | ------------------------------------------------------------------ | ------------------------------- | ----- | ------------ | ------- | ---------- | ---------------------------------------------------------------- |
| `scorm12-minimal`         | 1.2      | 1           | every value: `""`, `suspend`, `logout`, or left unset              | `bookmark=page-3` (18 chars)    | 2     | 6,871 B      | 2,062 B | n/a        | none                                                             |
| `scorm2004-minimal`       | 2004 4th | 1           | every value: `""`, `suspend`, `normal`, `logout`, `time-out`       | `slide=4` (7 chars)             | 2     | 7,875 B      | 2,190 B | none       | none                                                             |
| `scorm2004-three-modules` | 2004 4th | 3           | module 1 `normal`; module 2 `suspend` then `normal`; quiz `normal` | `concept=2` (9 chars, module 2) | 4     | 5,692 B      | 2,691 B | none       | quiz `minNormalizedMeasure` 0.8 with `satisfiedByMeasure="true"` |
| `scorm12-quiz-mastery`    | 1.2      | 1           | `""` then finish; never sets a status                              | none                            | 2     | 2,480 B      | 1,268 B | n/a        | `adlcp:masteryscore` 80                                          |
| `streamed-launcher`       | 2004 4th | 1 launcher  | `normal` (relayed from the vendor frame)                           | none in the launcher            | 2     | 3,457 B      | 1,659 B | none       | none                                                             |
| `reject-external-launch`  | 2004 4th | 1, rejected | n/a                                                                | n/a                             | 2     | 1,233 B      | 856 B   | n/a        | n/a                                                              |
| `reject-assets-only`      | 2004 4th | 0, rejected | n/a                                                                | n/a                             | 2     | 1,230 B      | 847 B   | n/a        | n/a                                                              |

The two rejection fixtures are negative tests: `reject-external-launch` has a SCO whose `href` is absolute `https://` and must fail with the external-content error; `reject-assets-only` has only `asset` resources and must fail with the nothing-to-track error.

## Vendor packages

Kept locally in `vendor/`, never in git. See `vendor/README.md` for the Rustici golf examples (CC BY 3.0), the in-house Adapt course (GPL-3.0), and the vendor exports that stay off disk entirely.
