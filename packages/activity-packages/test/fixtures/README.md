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
| `vendor-storyline-style`  | 1.2      | 1           | `""` then finish; never sets a status                              | none                            | 3     | 64,881 B     | 60,985 B | n/a        | `adlcp:masteryscore` 80                                          |
| `vendor-rise-style`       | 2004 4th | 1           | `""` then terminate                                                | none                            | 18    | 3,761 B      | 3,584 B | none       | none                                                             |
| `reject-external-launch`  | 2004 4th | 1, rejected | n/a                                                                | n/a                             | 2     | 1,233 B      | 856 B   | n/a        | n/a                                                              |
| `reject-assets-only`      | 2004 4th | 0, rejected | n/a                                                                | n/a                             | 2     | 1,230 B      | 847 B   | n/a        | n/a                                                              |
| `scorm-timer-test`        | 1.2/2004 | 1           | `normal`, `suspend`, or `time-out` on expiry                       | none                            | 2     | 27,828 B     | 6,994 B | none       | pass mark 80 (quiz); tests active timer, countdown, session time |

The two rejection fixtures are negative tests: `reject-external-launch` has a SCO whose `href` is absolute `https://` and must fail with the external-content error; `reject-assets-only` has only `asset` resources and must fail with the nothing-to-track error.

## Rustici Golf examples (CC BY 3.0)

Eighteen multi-edition packages from Rustici Software (<https://scorm.com/scorm-explained/technical-scorm/golf-examples/>), licensed under CC BY 3.0 US. Committed to ensure CI has real-world multi-edition SCORM packages (1.2, 2004 2nd, 3rd, and 4th Edition) for automated testing.

| Fixture | Version | SCOs | Files | Uncompressed | ZIP | Sequencing | Pass mark |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ContentPackagingMetadata_SCORM20043rdEdition.zip` | 2004 3rd Edition | 1 SCO | 80 | 638,650 B | 407,261 B | none | none |
| `ContentPackagingOneFilePerSCO_SCORM12.zip` | 1.2 | 0 SCOs (19 assets) | 49 | 460,678 B | 357,534 B | none | none |
| `ContentPackagingOneFilePerSCO_SCORM20043rdEdition.zip` | 2004 3rd Edition | 0 SCOs (19 assets) | 78 | 634,363 B | 404,762 B | none | none |
| `ContentPackagingSingleSCO_SCORM11.zip` | 1.1 (CSF) | 0 SCOs | 46 | 411,640 B | 350,757 B | none | none |
| `ContentPackagingSingleSCO_SCORM12.zip` | 1.2 | 1 SCO | 49 | 452,996 B | 356,589 B | none | none |
| `ContentPackagingSingleSCO_SCORM20042ndEdition.zip` | CAM 1.3 | 1 SCO | 88 | 656,227 B | 403,647 B | none | none |
| `ContentPackagingSingleSCO_SCORM20043rdEdition.zip` | 2004 3rd Edition | 1 SCO | 78 | 626,281 B | 403,634 B | none | none |
| `RunTimeAdvancedCalls_SCORM20043rdEdition.zip` | 2004 3rd Edition | 1 SCO | 78 | 656,663 B | 411,126 B | yes | minNormalizedMeasure 0.8 |
| `RuntimeBasicCalls_SCORM12.zip` | 1.2 | 1 SCO | 49 | 469,563 B | 360,842 B | none | none |
| `RuntimeBasicCalls_SCORM20043rdEdition.zip` | 2004 3rd Edition | 1 SCO | 78 | 644,236 B | 408,328 B | yes | none |
| `RuntimeMinimumCalls_SCORM12.zip` | 1.2 | 18 SCOs (1 asset) | 49 | 463,479 B | 358,203 B | none | none |
| `RuntimeMinimumCalls_SCORM20043rdEdition.zip` | 2004 3rd Edition | 18 SCOs (1 asset) | 78 | 637,444 B | 405,525 B | none | none |
| `SequencingForcedSequential_SCORM20043rdEdition.zip` | 2004 3rd Edition | 5 SCOs (1 asset) | 78 | 655,266 B | 409,948 B | yes | none |
| `SequencingPostTestRollup4thEd_SCORM20044thEdition.zip` | 2004 4th Edition | 5 SCOs (1 asset) | 64 | 557,828 B | 385,188 B | yes | none |
| `SequencingPostTestRollup_SCORM20043rdEdition.zip` | 2004 3rd Edition | 5 SCOs (1 asset) | 78 | 655,096 B | 409,828 B | yes | none |
| `SequencingPreOrPostTestRollup_SCORM20043rdEdition.zip` | 2004 3rd Edition | 5 SCOs (1 asset) | 78 | 655,991 B | 410,052 B | yes | none |
| `SequencingRandomTest_SCORM20043rdEdition.zip` | 2004 3rd Edition | 5 SCOs (1 asset) | 78 | 660,489 B | 411,027 B | yes | none |
| `SequencingSimpleRemediation_SCORM20043rdEdition.zip` | 2004 3rd Edition | 5 SCOs (1 asset) | 78 | 658,046 B | 410,263 B | yes | none |

## Local-only vendor packages

Kept locally in `vendor/`, never in git. See `vendor/README.md` for the in-house Adapt course (GPL-3.0) and vendor exports that stay off disk entirely.

