export const COURSE_ACCESS_INSTRUCTIONS = `# Controlling what students can open

Three settings decide whether a student can open a lesson or exercise. They match the dashboard, so use the same words with the user.

## Student progression (course setting)
Read it with get_course_settings and change it with update_course_settings (progressionMode). The dashboard calls it Student progression on the course Settings page.
- free: students can open every released item in any order.
- sequential: an item opens only after the student completes the previous required item in course order. Progression never blocks the first item.
To make students finish something first ("pass the quiz before the next lesson", "read the intro first"), set progressionMode to sequential and give that item a completion rule that is required.

## Completion rules (each lesson and exercise)
A required item is one whose rule is not none. In a sequential course an incomplete required item keeps everything after it closed.
Lessons, set with update_lesson (completionPolicy):
- manual (default): the student marks the lesson complete.
- video_watch: the lesson completes on its own once the student has watched videoWatchThreshold percent (95 when unset) of its uploaded videos, unless a video block in the lesson sets its own threshold. YouTube and other links are not tracked, so a lesson with no uploaded video can never be completed this way.
- none: never required. It never holds students back and does not count toward course completion or certificates.
Exercises, set with update_course_exercise (completionPolicy, passThreshold):
- submitted (default): any submission completes it.
- passed: the submission must be graded and score at least passThreshold percent (100 when unset). Ask the user for the pass mark instead of leaving 100. If the exercise has questions a teacher grades by hand, the student stays blocked until the teacher grades it, so tell the user.
- none: never required and not counted toward completion or certificates.
list_course_lessons and list_course_exercises show each item's completionPolicy, threshold and isUnlocked.

## Release (each lesson and exercise)
isUnlocked is a manual hold, called release in the dashboard. false holds the item back from every student, whatever they have completed, until someone releases it again. Use set_course_content_released, or isUnlocked on update_lesson and update_course_exercise, only when the user wants content held back, for example to pace a cohort or hide an unfinished lesson. Never use it to make students finish earlier items: it does not open when they do. In a sequential course, a required item that is held back also keeps everything after it closed for students who have not completed it.`;
