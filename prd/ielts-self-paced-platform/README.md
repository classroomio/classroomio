# Self-Paced IELTS Preparation Platform PRD

## Status
- Draft

## Date
- March 20, 2026

## Purpose
Define the product requirements needed for ClassroomIO to support a serious self-paced IELTS preparation experience that can realistically help learners improve enough to pass the exam and reach target band scores.

---

## 1. Executive Summary

### The Problem
Most online IELTS products fail in one of two ways:
- They provide content without enough exam-like practice.
- They provide practice without enough feedback to explain why learners are stuck.

For a self-paced IELTS course to work, the platform must do more than host lessons. It must support:
- exam-version selection between `Academic` and `General Training`
- timed practice across all four papers
- feedback aligned to official IELTS scoring criteria
- progress tracking by skill, question type, and score blocker
- deliberate practice loops that turn mistakes into improvement

Without these features, learners may complete many lessons and still remain underprepared for the actual test.

### Product Vision
ClassroomIO becomes a serious IELTS preparation platform where a learner can:
1. Diagnose their current level
2. Follow a structured study path
3. Practise each paper under realistic conditions
4. Receive useful feedback and performance analytics
5. Build enough consistency to reach a target band in a fully self-paced format

### Product Outcome
The platform should be capable of supporting a complete self-paced IELTS program, including:
- study content
- drills
- scored exercises
- mock tests
- skill analytics
- Writing and Speaking feedback workflows
- adaptive study planning

---

## 2. Background and Context

IELTS is not only a language test. It is a performance test with fixed task types, strict timing, and band-based scoring. A learner may have decent English and still underperform because of:
- poor task understanding
- weak timing control
- weak familiarity with question types
- poor Writing structure
- weak Speaking development
- lack of accurate review after practice

Official IELTS preparation resources emphasize:
- test format familiarity
- sample questions
- writing scoring criteria
- speaking band descriptors
- realistic trial-test experience

This means a self-paced platform must not be built like a generic course catalog. It must be built like a guided test-preparation system.

### Official Reference Alignment
This PRD is aligned with official IELTS preparation and format resources checked on March 20, 2026:
- IELTS test types and format
- sample test resources
- writing preparation resources
- speaking band descriptors

Sources:
- https://ielts.org/en-us/for-test-takers/how-to-prepare
- https://ielts.org/take-a-test/preparation-resources/sample-test-questions/general-training-test
- https://ielts.org/take-a-test/preparation-resources/writing-test-resources
- https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf

---

## 3. Goals and Non-Goals

### Goals
- Support a full self-paced IELTS preparation journey for `Academic` and `General Training`.
- Enable learners to practise every major IELTS task type in a platform-native way.
- Provide enough structured feedback for learners to understand why they are losing marks.
- Support full mock-test experiences with meaningful review.
- Track learner progress by band target, skill, question type, and recurring weakness.
- Make the platform usable for both first-time candidates and resit candidates.

### Non-Goals
- Replacing the official IELTS exam registration flow
- Delivering official IELTS scores
- Supporting unrelated English certifications in v1
- Building a live tutoring marketplace in v1
- Building a full proctoring system in v1

---

## 4. Target Users

### Primary Users
- IELTS candidates preparing independently
- Resit candidates who missed their target band previously
- Learners targeting immigration, university admission, or professional registration

### Secondary Users
- IELTS teachers authoring prep courses
- Course admins managing mock tests, exercise banks, and learner analytics

### Key Learner Segments

| Segment | Need |
|---------|------|
| First-time learner | Needs structure, exam understanding, and guided practice |
| Resit candidate | Needs diagnosis, score-blocker analysis, and targeted repair |
| Academic candidate | Needs stronger support for academic Reading and Writing Task 1 visuals |
| General Training candidate | Needs stronger support for practical Reading and letter writing |
| Band 5.5 to 6.5 learner | Needs controlled improvement, stronger basics, and repeated routines |
| Band 6.5 to 7.5 learner | Needs consistency, tighter accuracy, and high-quality feedback |

---

## 5. Core Jobs To Be Done

### Learner Jobs
- Help me choose the correct IELTS version and understand the format.
- Help me know my current level honestly.
- Help me focus on the mistakes that are actually keeping my band low.
- Let me practise in a way that feels close to the real exam.
- Show me exactly why my answers are wrong.
- Help me improve Writing and Speaking, not just objective questions.
- Give me a realistic study plan based on my target score and exam date.

### Teacher/Admin Jobs
- Create structured IELTS learning paths.
- Add drills, scored exercises, and mock tests throughout the course.
- Review Writing and Speaking performance if human feedback is enabled.
- Track student performance at paper level and skill level.

---

## 6. Product Principles

- Practice must be exam-aligned, not generic.
- Feedback must explain failure, not just announce it.
- Timed performance matters as much as content coverage.
- Self-paced does not mean unguided.
- Weakness-driven learning is more important than content volume.
- Writing and Speaking need explicit support, not token placeholders.

---

## 7. Functional Requirements

## 7.1 Learner Onboarding and Target Setup

### Purpose
Start each learner with the correct test version, target band, and study path.

### Requirements
- Learner selects `Academic` or `General Training`
- Learner enters:
  - target overall band
  - minimum section bands if required
  - planned exam date
  - prior IELTS history
  - confidence by skill
- Platform runs or recommends a diagnostic assessment
- Platform creates an initial learner profile:
  - strongest paper
  - weakest paper
  - likely score blocker
  - recommended study path

### Why It Matters
IELTS prep fails when all learners receive the same sequence regardless of target, timeline, and weakness.

---

## 7.2 Course Structure and Learning Path

### Purpose
Support a full IELTS curriculum as a structured self-paced journey.

### Requirements
- Courses support modular sections such as:
  - exam foundations
  - Listening
  - Reading
  - Writing Task 1
  - Writing Task 2
  - Speaking
  - mock tests
  - review workshops
- Courses support branching or filtered paths for:
  - Academic-only lessons
  - General Training-only lessons
- Lessons support:
  - notes
  - downloadable materials
  - embedded media
  - linked exercises
  - recommended study sequence

### Why It Matters
IELTS learners need both structured progression and version-specific content where the exam differs.

---

## 7.3 Exercise Engine

### Purpose
Support platform-native practice activities instead of relying only on lesson notes.

### Requirements
- Exercises can be attached to lessons or sections
- Exercise question types must support at minimum:
  - `RADIO`
  - `CHECKBOX`
  - `TRUE_FALSE`
  - `SHORT_ANSWER`
  - `TEXTAREA`
  - `FILL_BLANK`
  - `MATCHING`
  - `ORDERING`
- Exercises support:
  - question-level points
  - answer explanations
  - pass/fail thresholds
  - attempt tracking
  - unlocked/locked status
- Exercises support lesson-level usage patterns such as:
  - quick check
  - skill drill
  - end-of-lesson quiz
  - section review

### IELTS-Specific Requirement
The exercise layer must support explicit practice for:
- Listening form completion
- Listening note completion
- Listening multiple choice
- Listening maps and plans
- Reading True/False/Not Given
- Reading Yes/No/Not Given
- Reading matching headings
- Reading matching information
- Reading summary completion
- Reading sentence completion
- vocabulary and paraphrase drills
- grammar correction drills

### Why It Matters
Learners need repeated, interactive practice on recurring IELTS task types, not only prose explanations.

---

## 7.4 Timed Practice Engine

### Purpose
Recreate the pressure and pacing of IELTS.

### Requirements
- Timer support at:
  - exercise level
  - lesson review level
  - paper level
  - full mock-test level
- Support timed sets for:
  - Listening sections
  - Reading passages
  - Writing Task 1
  - Writing Task 2
  - full Writing paper
  - Speaking simulation prompts
- Support auto-submit or time expiry handling
- Preserve attempt metadata:
  - start time
  - end time
  - time spent
  - paused state if allowed

### Why It Matters
Many learners know the material but collapse under timing pressure.

---

## 7.5 Listening Practice Experience

### Purpose
Deliver IELTS-style Listening in a realistic way.

### Requirements
- Audio playback support for Listening sections
- Audio should be restricted to the intended attempt flow for exam simulation mode
- Question order must match recording order
- Support answer entry formats such as:
  - one word only
  - no more than two words
  - numbers
  - names
- Post-submission review must show:
  - correct answer
  - transcript or relevant transcript segment
  - explanation of distractor or missed signal

### Advanced Requirements
- Track spelling errors separately from comprehension errors
- Track distractor-driven mistakes
- Track performance by Listening question type

---

## 7.6 Reading Practice Experience

### Purpose
Support IELTS Reading with enough fidelity to train strategy and accuracy.

### Requirements
- Reading passages support:
  - section title
  - passage body
  - question groups
  - question-type labels
- Support Academic and General Training passage banks separately
- Question groups support major IELTS Reading patterns
- Post-submission review must show:
  - correct answer
  - evidence location or explanation
  - likely error reason

### Advanced Requirements
- Passage annotation or highlighting in review mode
- Track performance by question type
- Track time per passage or question group

---

## 7.7 Writing Practice and Evaluation

### Purpose
Support meaningful Writing improvement instead of only collecting essays.

### Requirements
- Writing tasks must support:
  - Academic Task 1
  - General Training Task 1
  - Task 2 essays
- Writing editor must support:
  - timer
  - word count
  - draft autosave
  - prompt display
  - planning notes area or planning guidance
- Feedback must map to official Writing criteria:
  - `Task Achievement/Task Response`
  - `Coherence and Cohesion`
  - `Lexical Resource`
  - `Grammatical Range and Accuracy`
- Support both:
  - AI-assisted feedback
  - human-reviewed feedback when enabled

### Additional Requirements
- Model answers at different quality levels or band levels
- rewrite workflow after feedback
- self-assessment checklist before submission
- recurring grammar error tracking

### Why It Matters
Writing is one of the most common score blockers and cannot be solved by multiple-choice practice.

---

## 7.8 Speaking Practice and Evaluation

### Purpose
Support realistic Speaking preparation in a self-paced format.

### Requirements
- Speaking tasks must support:
  - Part 1 short-answer prompts
  - Part 2 cue cards
  - Part 3 follow-up prompts
- Part 2 must support a one-minute preparation stage
- Learner can record responses
- Learner can replay their own recordings
- Feedback must map to official Speaking criteria:
  - `Fluency and Coherence`
  - `Lexical Resource`
  - `Grammatical Range and Accuracy`
  - `Pronunciation`

### Additional Requirements
- prompt banks by common IELTS topic families
- follow-up question generation or curated prompt trees
- repair-strategy training for hesitation and reformulation
- pronunciation notes or clarity-focused feedback

### Why It Matters
Speaking in a self-paced system requires structured prompt handling and performance review, not only reading sample answers.

---

## 7.9 Full Mock Tests

### Purpose
Give learners a realistic test rehearsal and readiness signal.

### Requirements
- Full mock tests support:
  - Listening
  - Reading
  - Writing
  - Speaking simulation
- Mock tests can be taken as:
  - full exam flow
  - paper-only mode
  - section-only mode
- Result screen must show:
  - overall performance summary
  - paper-by-paper breakdown
  - question-type breakdown
  - Writing and Speaking feedback if available
  - recommended next actions

### Why It Matters
Mock tests are where learners discover whether their training holds under pressure.

---

## 7.10 Review, Error Log, and Weakness Tracking

### Purpose
Turn practice into improvement.

### Requirements
- Every attempt should generate review data
- Platform should track recurring mistakes by:
  - skill
  - paper
  - question type
  - rubric criterion
  - grammar pattern
  - vocabulary weakness
- Learner should have a personal error log
- Platform should recommend targeted next practice from error patterns

### Example Error Categories
- distractor trap
- poor paraphrase recognition
- timing issue
- spelling issue
- off-task writing
- weak paragraph development
- unclear speaking expansion

### Why It Matters
Without structured review, learners repeat the same mistakes and only gain false confidence.

---

## 7.11 Study Planning and Adaptive Prep

### Purpose
Help learners stay on a realistic path to their band goal.

### Requirements
- Learner can choose a prep timeline such as:
  - `4 weeks`
  - `8 weeks`
  - `12 weeks`
- Platform recommends weekly workload based on:
  - target band
  - current level
  - exam date
  - weak papers
- Plan updates based on performance
- Study planner should include:
  - drills
  - full practice
  - review blocks
  - mock tests
  - recovery days or lighter review days

---

## 7.12 Progress Analytics

### Purpose
Give learners and course admins meaningful visibility into readiness.

### Learner Analytics
- current estimated level
- trend by paper
- trend by question type
- Writing criterion history
- Speaking criterion history
- error-log trends
- study consistency metrics

### Admin Analytics
- completion rates
- exercise difficulty
- common failure patterns across learners
- most-failed question types
- most-used and least-used practice assets

### Why It Matters
A serious prep platform must show whether learners are actually getting closer to target.

---

## 7.13 Content Authoring for IELTS Instructors

### Purpose
Make it practical to build and maintain high-quality IELTS prep content.

### Requirements
- Create lesson-linked exercises without manual database work
- Tag exercises by:
  - paper
  - test version
  - question type
  - band range
  - topic
  - skill focus
- Create mock-test bundles from existing question banks
- Add model answers and explanation blocks
- Reuse exercise templates across courses

### Why It Matters
The IELTS domain depends heavily on repeatable task patterns. Good author tooling reduces friction and improves consistency.

---

## 8. User Flows

## 8.1 Learner First-Run Flow
1. Learner enrolls in IELTS prep course
2. Learner selects `Academic` or `General Training`
3. Learner enters target band and exam date
4. Platform runs diagnostic or assigns diagnostic set
5. Platform generates study path and first-week plan

## 8.2 Lesson-to-Practice Flow
1. Learner studies lesson note
2. Learner completes attached exercise
3. Learner receives immediate results
4. Platform logs mistakes
5. Platform recommends next drill or review task

## 8.3 Writing Improvement Flow
1. Learner attempts timed writing task
2. Platform scores or annotates response
3. Learner reviews criterion-level feedback
4. Learner rewrites one paragraph or full task
5. Platform tracks revision quality over time

## 8.4 Mock-Test Flow
1. Learner starts full mock
2. Learner completes papers under timing rules
3. Platform returns score and breakdown
4. Platform highlights weakest score blockers
5. Learner receives targeted follow-up plan

---

## 9. MVP Scope

### Must Have
- learner onboarding with target-band setup
- Academic vs General Training branching
- lesson-linked exercises
- timed Listening and Reading practice
- timed Writing task submissions
- Speaking prompt and recording support
- full mock-test capability
- criterion-based Writing and Speaking feedback
- learner error log
- progress dashboard

### Should Have
- model answers by band range
- adaptive study plans
- exercise tagging by question type and band level
- attempt-level analytics for admins

### Later
- richer Speaking AI feedback
- automated prompt generation
- peer review workflows
- mobile-native speaking rehearsal features

---

## 10. Success Metrics

### Learner Success Metrics
- % of learners completing diagnostic within first 3 days
- % of active learners completing at least one full mock test
- % of learners with measurable improvement across 4 weeks
- Writing resubmission rate after feedback
- Speaking practice completion rate

### Product Success Metrics
- average weekly practice attempts per active IELTS learner
- mock-test completion rate
- review completion rate after wrong answers
- exercise completion rate by question type
- retention from onboarding to first mock test

### Outcome Metrics
- self-reported learner confidence increase
- % of learners reporting target-band attainment
- % of resit learners reporting improvement from prior attempt

---

## 11. Risks and Failure Modes

- Too much passive content, not enough active practice
- Weak Writing and Speaking feedback quality
- Poor exam realism in timed flows
- Lack of separation between Academic and General Training content
- Generic analytics that do not show score blockers
- Exercise banks that are large but poorly tagged
- Publish path that creates lessons but omits exercises

---

## 12. Technical/Product Notes for ClassroomIO

### Current Platform Implications
- Lesson notes alone are not enough for IELTS prep.
- Exercise support is essential at the course-content level.
- Course authoring must make it easy to attach real exercises to lessons and sections.
- Draft publishing should eventually support course exercises directly if course generation is intended to be complete at publish time.

### Immediate Product Gaps to Close
- robust IELTS exercise library support
- mock-test packaging and scheduling
- Writing and Speaking scoring workflows
- richer learner analytics tied to band improvement

---

## 13. Open Questions

- Should Writing feedback be AI-only, human-only, or hybrid by pricing tier?
- Should Speaking practice support audio only in v1, or audio plus transcript plus scoring?
- Should mock tests be locked by schedule or always open?
- Should estimated band prediction be shown directly to learners, or only criterion-level trends?
- Should draft publishing create exercises automatically as part of full AI-authored course generation?

---

## 14. Recommendation

The platform should treat IELTS as a practice-and-feedback product, not a content-delivery product. The strongest investment areas are:
- real exercises
- timed practice
- Writing and Speaking feedback
- mock tests
- weakness-driven analytics

If these areas are implemented well, ClassroomIO can support a self-paced IELTS course that is materially more useful than a traditional LMS course with notes and quizzes.
