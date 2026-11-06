# Zapier follow-up plan: app page recipes and trigger delivery

Two follow-ups to [`prototype-implementation-plan.md`](prototype-implementation-plan.md) (the "main plan"):

- **Part A** replaces the prototype's "Triggers & actions" section on the ClassroomIO + {App} page with curated
  recipes, a "Build your own" picker and a collapsed reference. It supersedes the main plan's section 5.4 item 4
  and the recipe table in section 6. Everything else in the main plan still applies.
- **Part B** records why triggers are instant only, what that costs, and the proposed fixes for missed events.

Facts below were checked on 2026-11-04 against Zapier's public app pages, Zapier's docs and this branch
(`feats/zapier-integration`). Anything marked _unverified_ must be tested before the phase that uses it is done.

## Contents

- [Part A: recipes instead of the Triggers & actions grid](#part-a-recipes-instead-of-the-triggers--actions-grid)
  - [A1. What the prototype's section does](#a1-what-the-prototypes-section-does)
  - [A2. Options considered](#a2-options-considered)
  - [A3. Proposed solution](#a3-proposed-solution)
  - [A4. Catalog changes](#a4-catalog-changes)
  - [A5. Recipes for all 20 apps](#a5-recipes-for-all-20-apps)
  - [A6. Pre-filling the course or cohort](#a6-pre-filling-the-course-or-cohort)
  - [A7. Files and phases](#a7-files-and-phases)
  - [A8. Comes with live publish](#a8-comes-with-live-publish)
  - [A9. Verification](#a9-verification)
  - [A10. Product decisions](#a10-product-decisions)
- [Part B: trigger delivery without polling](#part-b-trigger-delivery-without-polling)

---

## Part A: recipes instead of the Triggers & actions grid

### A1. What the prototype's section does

`zapier-handoff.html` ends with "More things you can do with ClassroomIO and {App}": three tabs (Triggers,
Actions, Triggers & Actions), expandable cards with sample data or fields, "Load more", and "Try it" links that
open Zapier's empty editor.

Problems:

1. **It is barely about the app.** Built from the real catalog it would show 14 ClassroomIO triggers, 11 actions
   and 2 searches on every one of the 20 pages, plus one card for the app. The title promises "ClassroomIO and
   Slack" and delivers a ClassroomIO feature list.
2. **A single trigger or action is not something to do.** Users need a pair. "Try it" on a lone trigger opens a
   blank editor.
3. **It repeats Zapier.** Zapier's own integration pages already list every trigger and action of both apps.

Listing every possible pair is not the fix. Counting each app's visible, non-deprecated steps on its public
Zapier page (ClassroomIO triggers × app actions, plus app triggers × ClassroomIO actions):

| App | App triggers | App actions | Possible pairs |
| --- | --- | --- | --- |
| HubSpot | 53 | 41 | ~1,150 |
| Slack | 15 | 24 | ~500 |
| Google Sheets | 10 | 21 | ~400 |
| Mailchimp | 18 | 15 | ~400 |
| Zoom | 19 | 5 | ~280 |
| Calendly | 11 | 8 | ~230 |

Most pairs are nonsense ("Course Published → Delete Slack Message").

### A2. Options considered

| Option | For | Against | Verdict |
| --- | --- | --- | --- |
| Keep the prototype's grid | Already designed | Same content on 20 pages; no complete Zap; repeats Zapier | No |
| Every pair, filterable | "Complete" | Hundreds of cards, mostly meaningless; we would have to label and maintain them | No |
| **Curated recipes + "Build your own" + collapsed reference** | Every card is a complete, useful Zap that opens pre-filled; the picker covers any other pair; the reference keeps the detail without leading with it | Recipes need curating and copy (86) | **Yes** |
| Zapier's Workflow Element or published Zap templates | Maintained by Zapier | Live-publish only; templates must be published per app first | Later, as an addition (A8) |

### A3. Proposed solution

The section becomes three parts, top to bottom. They replace `zapier-capability-grid.svelte` and
`zapier-capability-card.svelte` from the main plan.

#### 1. "Ways to use ClassroomIO with {App}" (the main section)

- **Cards** (`zapier-recipe-card.svelte`, an `Item` or `Card`): two marks (ClassroomIO and the app, in the
  order the Zap runs), a title ("Enroll invitees in prep material when they book"), a one-line sentence built
  from the step labels ("When an invitee books in Calendly, enroll them in a ClassroomIO course"), a mode badge,
  and a primary **Use this Zap** button (`zapier-open-button`, target = the recipe's pre-filled link).
- **Mode badge.** ClassroomIO triggers are always "Instant". An app trigger shows "Instant" or "Checks every
  few minutes", from `isInstant` in the catalog. Zapier's app data marks which triggers are hooks; A5 lists them.
- **Direction tabs** (`Tabs`): "From ClassroomIO" and "Into ClassroomIO", with counts. Hide a tab with no
  recipes (Cal.com, Typeform and Pendo have none from ClassroomIO; Customer.io, Mixpanel and Google Meet have
  none into it). With only one direction, show no tabs.
- **Order:** the primary recipe (the hero's) first, then instant before polling, then catalog order.
- No "Load more": 2 to 6 recipes per app fit on one screen.
- Cards whose ClassroomIO step takes a course or cohort open a small `Popover` on **Use this Zap** to pick one
  first (A6).

#### 2. "Build your own" (`zapier-recipe-builder.svelte`)

A compact form under the recipes for any other pair, without listing hundreds:

- **When this happens:** `Select` grouped "In ClassroomIO" (14 triggers) and "In {App}" (the app's triggers).
- **Do this:** filtered to the other side. A ClassroomIO trigger offers the app's actions; an app trigger offers
  ClassroomIO's 11 actions. Each list ends with "Choose in Zapier", which leaves the step empty.
- **Course or cohort:** shown only when the chosen ClassroomIO step takes one (A6).
- A live sentence preview ("When a course is completed in ClassroomIO, send a channel message in Slack") and an
  **Open in Zapier** button (`zapier-open-button`).
- **While private**, the app's options are the app steps used in its recipes (A5). **After publishing**, they
  come from Zapier's `GET /v2/actions?app=<app key>&action_type=READ|WRITE` (returns `key`, `title`,
  `description`, `is_instant`; scope `zap`), behind the flag (A8).

#### 3. "Everything ClassroomIO can do in Zapier" (collapsed reference)

`zapier-capability-reference.svelte`: an `Accordion`, closed by default, with three groups (14 triggers,
11 actions, 2 searches). Each item shows its description and, for triggers, "Sample data this trigger sends"
from `buildWebhookExampleEnvelope(eventType).data` (first 6 fields). No "Try it" links: the recipes and the
picker already cover that. The same component also goes at the bottom of the App Directory, so the reference
has one home that is not repeated per app in the main content.

#### 4. Two more places recipes help

- **Zaps page empty state:** under "No Zaps yet", a row "Start with a popular recipe" with three recipe cards
  from different apps: `calendly_booking_enroll`, `slack_completed_channel`, `hubspot_list_enroll`.
- **Directory cards:** a muted line "{n} ways to use" under the description.

#### 5. Hero

The hero and its CTA keep using the app's primary recipe (first row in A5). The stats line becomes
"{n} recipes · Instant" when the primary recipe starts in ClassroomIO, or "{n} recipes · {mode}" from the
app trigger's mode otherwise.

### A4. Catalog changes

Extend the shared catalog from main plan section 6 in `packages/utils/src/constants/zapier.ts`:

```ts
export type TZapierRecipeStep =
  | { app: 'classroomio'; type: 'read'; key: TZapierTriggerKey }
  | { app: 'classroomio'; type: 'write'; key: TZapierActionKey }
  | { app: 'partner'; type: 'read'; key: string; isInstant: boolean }
  | { app: 'partner'; type: 'write'; key: string };

export type TZapierRecipe = {
  id: string;
  trigger: TZapierRecipeStep;
  action: TZapierRecipeStep;
};

export type TZapierPartnerApp = {
  slug: string;
  name: string;
  zapierKey: string;
  category: (typeof ZAPIER_APP_CATEGORIES)[number];
  color: string;
  isPopular: boolean;
  isRecent: boolean;
  recipes: readonly TZapierRecipe[];
};

export const ZAPIER_FEATURED_RECIPE_IDS = [
  'calendly_booking_enroll',
  'slack_completed_channel',
  'hubspot_list_enroll'
] as const;
```

- `recipes[0]` is the primary recipe.
- Exactly one of `trigger` and `action` is a ClassroomIO step. A unit test enforces it, and that recipe ids are
  unique across all apps.
- Copy lives in translations, not the constant:
  - `automation.zapier.recipes.<id>.title`
  - `automation.zapier.partner_steps.<slug>.<key>`, the app step's label as Zapier shows it, used in card
    sentences and the picker.
- Add a `prefill` field to each ClassroomIO trigger and action in `ZAPIER_TRIGGERS` / `ZAPIER_ACTIONS`:
  `'courseId' | 'cohortId' | null` (A6).

Utils in `lib/features/automation/utils/zapier-utils.ts`:

- `buildZapierRecipeUrl(recipe, prefill?)` on top of `buildZapierZapUrl`, adding
  `steps[i][params][<field>]` and `steps[i][meta][parammap][<field>]` when a course or cohort is chosen.
- `getRecipeDirection(recipe)`, `sortRecipes(recipes, primaryId)`, `getPartnerSteps(app, type)` (unique app
  steps across recipes, for the picker), `describeRecipe(recipe, app)` (sentence from translation keys).

### A5. Recipes for all 20 apps

Every key below exists on the app's public Zapier page with the right type and is **not hidden** (checked
2026-11-04 with a script against the page data: 86 recipes, 51 out and 35 in, 0 problems). Only two have been opened in Zapier's
editor; A9 lists the check for the rest.

"Out" = from ClassroomIO, "In" = into ClassroomIO. App trigger mode: **I** instant, **P** checks every few
minutes.

#### HubSpot (`HubSpotCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `hubspot_deal_stage_enroll` | In | Updated Deal Stage `updated_deal_stage` (P) | Enroll Student in Course `enroll_student` | Enroll new customers in onboarding when a deal reaches a stage |
| `hubspot_list_enroll` | In | New Contact in List `new_contact_in_list_resthook_v3` (I) | Enroll Student in Course `enroll_student` | Enroll contacts when they join a HubSpot list |
| `hubspot_form_invite` | In | New Form Submission `form_submission_resthook_v3` (I) | Send Course Invite `send_course_invite` | Invite form sign-ups to a course |
| `hubspot_completed_contact` | Out | Course Completed `course_completed` | Create or Update Contact `upsert_contact` | Update the contact when they complete a course |
| `hubspot_certificate_list` | Out | New Certificate `new_certificate` | Add Contact to List `add_to_list_v3` | Add certified learners to a HubSpot list |
| `hubspot_compliance_task` | Out | Compliance Status Changed `compliance_status_changed` | Create Engagement `create_engagement` | Create a follow-up task when training becomes overdue |

#### Salesforce (`SalesforceCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `salesforce_certificate_record` | Out | New Certificate `new_certificate` | Create Record `create_record` | Record each certificate in Salesforce |
| `salesforce_completed_contact` | Out | Course Completed `course_completed` | Update Contact `update_contact` | Update the contact when they complete a course |
| `salesforce_payment_lead` | Out | New Payment Request `new_payment_request` | Create Lead `create_lead` | Create a lead for each payment request |
| `salesforce_contact_enroll` | In | New Contact `new_contact` (P) | Enroll Student in Course `enroll_student` | Enroll new contacts in onboarding |
| `salesforce_opportunity_enroll` | In | Updated Field on Record `updated_field_on_record` (P) | Enroll Student in Course `enroll_student` | Enroll customers when an opportunity closes |

#### Mailchimp (`MailchimpCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `mailchimp_enrollment_subscriber` | Out | New Course Enrollment `new_course_enrollment` | Add/Update Subscriber `memberCreate` | Add new enrollments to an audience |
| `mailchimp_completed_tag` | Out | Course Completed `course_completed` | Add Subscriber to Tag `subscriber_segment` | Tag subscribers who complete a course |
| `mailchimp_removed_untag` | Out | Student Removed from Course `course_member_removed` | Remove Subscriber from Tag `remove_tag` | Remove the course tag when a student leaves |
| `mailchimp_subscriber_student` | In | New Subscriber `new_member` (I) | Add Student to Organization `add_student` | Add new subscribers as students |
| `mailchimp_tag_enroll` | In | New Subscriber in Segment or Tag `subscriber_tag` (P) | Enroll Student in Course `enroll_student` | Enroll subscribers when they get a tag |

#### Customer.io (`CustomerIOV2CLIAPI`, actions only)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `customerio_completed_event` | Out | Course Completed `course_completed` | Create Event `track_event` | Send course completions as events |
| `customerio_enrollment_person` | Out | New Course Enrollment `new_course_enrollment` | Create or Update a Person `create_customer` | Create or update the person when they enroll |
| `customerio_certificate_event` | Out | New Certificate `new_certificate` | Create Event `track_event` | Send certificates as events |
| `customerio_compliance_event` | Out | Compliance Status Changed `compliance_status_changed` | Create Event `track_event` | Start reminder campaigns when training is overdue |
| `customerio_lesson_event` | Out | Lesson Completed `lesson_completed` | Create Event `track_event` | Send lesson progress as events |

#### Slack (`SlackCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `slack_completed_channel` | Out | Course Completed `course_completed` | Send Channel Message `channel_message` | Post to a channel when a course is completed (**opened in Zapier, works**) |
| `slack_submission_dm` | Out | New Exercise Submission `new_submission` | Send Direct Message `direct_message` | Message the tutor when a student submits an exercise |
| `slack_payment_channel` | Out | New Payment Request `new_payment_request` | Send Channel Message `channel_message` | Alert the team about payment requests |
| `slack_compliance_channel` | Out | Compliance Status Changed `compliance_status_changed` | Send Channel Message `channel_message` | Flag overdue training in a channel |
| `slack_certificate_channel` | Out | New Certificate `new_certificate` | Send Channel Message `channel_message` | Celebrate new certificates |
| `slack_member_enroll` | In | New User `team_join` (I) | Enroll Student in Course `enroll_student` | Enroll new workspace members in onboarding |

#### Microsoft Teams (`MSTeamsCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `teams_completed_channel` | Out | Course Completed `course_completed` | Send Channel Message `send_channel_message_from_user` | Post to a channel when a course is completed |
| `teams_submission_chat` | Out | New Exercise Submission `new_submission` | Send Chat Message `send_chat_message` | Message the tutor when a student submits an exercise |
| `teams_compliance_channel` | Out | Compliance Status Changed `compliance_status_changed` | Send Channel Message `send_channel_message_from_user` | Flag overdue training in a channel |
| `teams_session_channel` | Out | Live Session Scheduled `live_session_scheduled` | Send Channel Message `send_channel_message_from_user` | Announce live sessions in a channel |
| `teams_member_enroll` | In | New Team Member `member` (P) | Enroll Student in Course `enroll_student` | Enroll new team members in onboarding |

#### Google Meet (`GoogleMeetCLIAPI`, one action)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `meet_session_meeting` | Out | Live Session Scheduled `live_session_scheduled` | Schedule a Meeting `schedule_meeting` | Create a Meet for each live session |
| `meet_completed_meeting` | Out | Course Completed `course_completed` | Schedule a Meeting `schedule_meeting` | Book a review call when a course is completed |

#### Zoom (`ZoomCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `zoom_enrollment_registrant` | Out | New Course Enrollment `new_course_enrollment` | Create Webinar Registrant `create_registrant` | Register new students for a webinar |
| `zoom_cohort_registrant` | Out | New Cohort Member `new_cohort_member` | Create Meeting Registrant `create_meeting_registrant` | Register cohort members for the kickoff meeting |
| `zoom_session_meeting` | Out | Live Session Scheduled `live_session_scheduled` | Create Meeting `create_meeting` | Create a Zoom meeting for each live session |
| `zoom_registrant_enroll` | In | New Webinar Registrant `new_registrant` (I) | Enroll Student in Course `enroll_student` | Enroll webinar registrants in prep material |
| `zoom_joiner_lesson` | In | New Participant Joined Webinar or Meeting `new_joiner` (I) | Mark Lesson Complete `mark_lesson_complete` | Mark the live lesson complete when a learner joins |

#### Zendesk (`ZendeskV2CLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `zendesk_tag_enroll` | In | New Tag Added to Ticket `new_tag_ticket` (P) | Enroll Student in Course `enroll_student` | Enroll a customer when an agent tags their ticket |
| `zendesk_compliance_ticket` | Out | Compliance Status Changed `compliance_status_changed` | Create Ticket `ticket` | Open a ticket when training becomes overdue |
| `zendesk_payment_ticket` | Out | New Payment Request `new_payment_request` | Create Ticket `ticket` | Open a ticket for each payment request |
| `zendesk_completed_user` | Out | Course Completed `course_completed` | Update User `update_user` | Record completed training on the Zendesk user |
| `zendesk_user_enroll` | In | New User `user_v2` (P) | Enroll Student in Course `enroll_student` | Enroll new Zendesk users in a getting-started course |

The main plan made "compliance → ticket" Zendesk's primary recipe. This plan makes "ticket tag → enroll" the
primary instead: it is the support-deflection story customers ask for.

#### Intercom (`IntercomV2CLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `intercom_completed_message` | Out | Course Completed `course_completed` | Send Message to Contact `send_message_to_contact` | Message users when they complete a course |
| `intercom_completed_tag` | Out | Course Completed `course_completed` | Add Tag to Contact `add_tag_to_contact` | Tag users who finish onboarding |
| `intercom_lesson_event` | Out | Lesson Completed `lesson_completed` | Create Data Event `create_data_event` | Send lesson progress as events |
| `intercom_user_enroll` | In | New User `new_user_created` (I) | Enroll Student in Course `enroll_student` | Enroll new users in onboarding |
| `intercom_tag_enroll` | In | Tag Added to User `user_tag` (I) | Enroll Student in Course `enroll_student` | Enroll users when they're tagged |

#### Calendly (`CalendlyCLIAPI`, triggers only in these recipes)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `calendly_booking_enroll` | In | Invitee Created or Rescheduled `invitee_created` (I) | Enroll Student in Course `enroll_student` | Enroll invitees in prep material when they book (**opened in Zapier, works**) |
| `calendly_noshow_invite` | In | Invitee No Show Created `invitee_no_show_created` (I) | Send Course Invite `send_course_invite` | Send a self-paced course to no-shows |
| `calendly_form_student` | In | New Routing Form Submission `routing_form_submission` (I) | Add Student to Organization `add_student` | Add routing form leads as students |
| `calendly_cancel_remove` | In | Invitee Canceled `invitee_canceled` (I) | Remove Student from Course `remove_course_member` | Remove the prep course when a booking is canceled |

#### Cal.com (`CalComCLIAPI`, triggers only)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `calcom_booking_enroll` | In | Booking Created `booking_created` (I) | Enroll Student in Course `enroll_student` | Enroll attendees in prep material when they book |
| `calcom_cancel_remove` | In | Booking Cancelled `booking_cancelled` (I) | Remove Student from Course `remove_course_member` | Remove the prep course when a booking is cancelled |
| `calcom_meeting_invite` | In | Meeting Ended `meeting_ended` (I) | Send Course Invite `send_course_invite` | Send the follow-up course after the call |

#### Google Sheets (`GoogleSheetsV2CLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `sheets_completed_row` | Out | Course Completed `course_completed` | Create Spreadsheet Row `add_row` | Log completions in a sheet |
| `sheets_certificate_row` | Out | New Certificate `new_certificate` | Create Spreadsheet Row `add_row` | Keep a certificate register |
| `sheets_compliance_row` | Out | Compliance Status Changed `compliance_status_changed` | Create Spreadsheet Row `add_row` | Log compliance changes |
| `sheets_payment_row` | Out | New Payment Request `new_payment_request` | Create Spreadsheet Row `add_row` | Track payment requests |
| `sheets_row_enroll` | In | New Spreadsheet Row `new_row_notify_hook` (I) | Enroll Student in Course `enroll_student` | Enroll everyone added to a sheet |
| `sheets_row_cohort` | In | New Spreadsheet Row `new_row_notify_hook` (I) | Add Student to Cohort `add_cohort_member` | Add everyone in a sheet to a cohort |

#### Notion (`NotionCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `notion_completed_item` | Out | Course Completed `course_completed` | Create Data Source Item `create_database_item` | Track completions in a database |
| `notion_submission_item` | Out | New Exercise Submission `new_submission` | Create Data Source Item `create_database_item` | Queue submissions for review |
| `notion_course_page` | Out | Course Published `course_published` | Create Page `create_page` | Add a page for each new course |
| `notion_item_enroll` | In | New Data Source Item `new_data_source_item` (I) | Enroll Student in Course `enroll_student` | Enroll people added to a database |

#### Confluence (`ConfluenceCloudCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `confluence_course_page` | Out | Course Published `course_published` | Create Page or Blog Post `pageCreate` | Create a page when a course is published |
| `confluence_session_page` | Out | Live Session Scheduled `live_session_scheduled` | Create Page or Blog Post `pageCreate` | Create an agenda page for each live session |
| `confluence_page_announce` | In | New Page or Blog Post `pageList` (P) | Post to Cohort Feed `post_cohort_announcement` | Announce new docs to a cohort |

#### Typeform (`TypeformCLIAPI`, triggers only)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `typeform_entry_enroll` | In | New Entry `entries_resthook_v2` (I) | Enroll Student in Course `enroll_student` | Enroll respondents in a course |
| `typeform_entry_cohort` | In | New Entry `entries_resthook_v2` (I) | Add Student to Cohort `add_cohort_member` | Add applicants to a cohort |
| `typeform_entry_student` | In | New Entry `entries_resthook_v2` (I) | Add Student to Organization `add_student` | Add respondents as students |

#### Jotform (`JotFormCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `jotform_submission_enroll` | In | New Submission `new_submission` (I) | Enroll Student in Course `enroll_student` | Enroll people who submit a form |
| `jotform_completed_form` | Out | Course Completed `course_completed` | Assign Prefilled Form `assign_prefilled_form` | Send a feedback form when a course is completed |
| `jotform_submission_student` | In | New Submission `new_submission` (I) | Add Student to Organization `add_student` | Add people who submit a form as students |

#### Pendo (`ReceptiveCLIAPI`, Pendo Feedback, triggers only)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `pendo_status_enroll` | In | Request Status Changed `feature_status_changed` (I) | Enroll Student in Course `enroll_student` | Enroll requesters in a course when their request ships |
| `pendo_status_announce` | In | Request Status Changed `feature_status_changed` (I) | Post to Cohort Feed `post_cohort_announcement` | Announce shipped requests to a cohort |

The main plan's Pendo recipe used `create_update_end_user`, which Zapier marks **hidden**. Drop it. See A10.

#### Mixpanel (`MixpanelCLIAPI`, actions only)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `mixpanel_completed_event` | Out | Course Completed `course_completed` | Track Event `track` | Track course completions |
| `mixpanel_enrollment_event` | Out | New Course Enrollment `new_course_enrollment` | Track Event `track` | Track enrollments |
| `mixpanel_lesson_event` | Out | Lesson Completed `lesson_completed` | Track Event `track` | Track lesson progress |
| `mixpanel_certificate_profile` | Out | New Certificate `new_certificate` | Create or Update Profile `engage` | Mark certified users on their profile |

#### Circle (`CircleCLIAPI`)

| Id | Dir | When | Do | Title |
| --- | --- | --- | --- | --- |
| `circle_member_enroll` | In | New Member Added `new_member` (P) | Enroll Student in Course `enroll_student` | Enroll new community members in a welcome course |
| `circle_certificate_space` | Out | New Certificate `new_certificate` | Add Member to Space `add_space_member` | Unlock a space when a learner earns a certificate |
| `circle_completed_tag` | Out | Course Completed `course_completed` | Tag Member `tag_members` | Tag members who complete a course |
| `circle_cohort_group` | Out | New Cohort Member `new_cohort_member` | Add Member to Space Group `add_space_group_member` | Give cohort members access to a space group |
| `circle_removed_student` | In | Member Removed `community_member_removed` (P) | Remove Student from Organization `remove_student` | Remove students who leave the community |

### A6. Pre-filling the course or cohort

Zapier's pre-filled Zap docs allow field values: `steps[i][params][<field>]=<value>` plus
`steps[i][meta][parammap][<field>]=<label>` for the label a dropdown shows. Our Zapier app's fields are:

| ClassroomIO step | Field |
| --- | --- |
| Triggers with a course filter (`new_course_enrollment`, `course_completed`, and the other course events) | `courseId` (optional) |
| `new_cohort_member` | `cohortId` (optional) |
| `enroll_student`, `send_course_invite`, `remove_course_member`, `mark_lesson_complete` | `courseId` (required) |
| `add_cohort_member`, `post_cohort_announcement` | `cohortId` (required) |

So a recipe can open with the admin's own course already chosen. **Use this Zap** on such a card opens a
`Popover` with a course (or cohort) `Select` from the org's existing course and cohort lists, defaulting to
"Choose in Zapier", and an **Open in Zapier** button. The picker in A3 shows the same select.

_Unverified:_ that `webintent` and the documented embed URL both honour `params` and `meta[parammap]` for our
dynamic dropdowns. Test with one trigger and one action before shipping; if it does not work, hide the select
and keep the rest.

### A7. Files and phases

Changes to the main plan:

| Main plan | Change |
| --- | --- |
| Phase 1 | Catalog gets `TZapierRecipe`, the A5 recipes, `ZAPIER_FEATURED_RECIPE_IDS`, `prefill` on ClassroomIO steps. Add `buildZapierRecipeUrl` with params, `describeRecipe`, `sortRecipes`, `getPartnerSteps`. Tests: one ClassroomIO step per recipe, unique ids, URL params encoded, prefill only on steps that support it |
| Phase 3 | Zaps page empty state adds "Start with a popular recipe" |
| Phase 4 | Directory cards add "{n} ways to use"; capability reference at the bottom |
| Phase 5 | Replace `zapier-capability-grid.svelte` and `zapier-capability-card.svelte` with `zapier-recipe-list.svelte`, `zapier-recipe-card.svelte`, `zapier-recipe-builder.svelte`, `zapier-capability-reference.svelte`, and `zapier-prefill-popover.svelte` |
| Phase 7 | Add the live additions in A8 |

Translations: 86 recipe titles and 64 app step labels. Add them in one pass and run
`pnpm translate`.

### A8. Comes with live publish

Built now, hidden by `PUBLIC_ZAPIER_LISTING` like the rest of the main plan's Phase 7:

| Feature | How |
| --- | --- |
| Picker offers every app step | API route `GET /organization/automation/zapier/apps/:slug/actions?type=read\|write` calls Zapier `GET /v2/actions?app=<zapierKey>&action_type=READ\|WRITE` (accepts an app key, so no UUID mapping) with the admin's linked token; cache 24 h per app. Hide deprecated and helper steps (label contains "Deprecated", "Legacy", "Dropdown", or key starts with `_zap`) |
| "In use" badge on recipe cards | Match the admin's Zaps from `/v2/zaps` (main plan Phase 7) on both steps' app and action keys |
| Zapier's published templates | `GET /v1/zap-templates?client_id=…&apps=<app>`, shown as extra cards labelled "Template". Only after we publish templates in Zapier |

### A9. Verification

- Unit tests above, plus a test that every recipe id has a translation key in `en.json`.
- Manual, signed in to a Zapier account that accepted the invite: open every recipe's link (86) and confirm both
  steps load with the expected app and event. Record failures here and fix the row. Delete the draft Zaps this
  creates.
- Prefill: one course trigger, one course action, one cohort action (A6).
- App page at 375px and 1280px: tabs hide when one direction is empty; the popover fits on mobile.

### A10. Product decisions

| Question | Recommendation |
| --- | --- |
| Pendo: Zapier's app is Pendo Feedback, with no product-usage trigger and its only action hidden | Keep it with the two feedback recipes, or replace it with an app that has the usage story. Product call |
| Google Meet has one action, so only 2 recipes | Keep; it is the Workspace alternative to Zoom |
| Featured recipes on the Zaps page | Calendly booking → enroll, course completed → Slack, HubSpot list → enroll |
| Recipe count | 2 to 6 per app as listed; add more only with a customer story behind them |

---

## Part B: trigger delivery without polling

### B1. Why there are no polling triggers

- The original PRD ([classroomio/classroomio#667](https://github.com/classroomio/classroomio/pull/667), on
  `main`) planned polling-only triggers because the webhooks platform did not exist yet: "Triggers in v1:
  polling only. No webhook dependency. Real-time REST Hooks ship in v1.1 once the webhooks PRD lands."
- The webhooks platform shipped in October 2026.
- The PRD rewrite ([classroomio/classroomio#1441](https://github.com/classroomio/classroomio/pull/1441), open)
  made every trigger instant and listed polling as a non-goal: "Polling triggers (superseded by webhooks)".
  `apps/zapier` on this branch follows it: every event trigger is `type: 'hook'`
  (`apps/zapier/src/lib/event-trigger.ts`). `performList` only feeds Zapier's "Test trigger" step from
  `/webhooks/samples`; it never runs in a live Zap.

Instant is the right default: Zaps run seconds after the event instead of 1 to 15 minutes later (depending on
the customer's Zapier plan), our API is called only when something happens, list endpoints need no
`?since=`/cursor support, and high-volume events (submissions, lesson completions) can be triggers at all.

### B2. What instant costs today

Delivery behavior on this branch (`packages/utils/src/constants/webhook.ts`,
`packages/core/src/services/webhook/deliver.ts`, `packages/db/src/queries/webhook/webhook.ts`):

| Behavior | Value |
| --- | --- |
| Attempts per event | 3: immediately, after 10 s, after 60 s (`WEBHOOK_RETRY_DELAYS_MS`) |
| After the last failure | Delivery marked `GAVE_UP`; the event is not sent again |
| Health | Each `GAVE_UP` adds 1 to `consecutiveFailures`; "degraded" at 20, auto-disabled at 100; admins are emailed on both |
| Zapier returns 410 (Zap turned off or deleted) | The managed subscription is deleted |
| Redeliver | The Webhooks tab's queries only cover customer endpoints (`isCustomerEndpoint`), so Zapier-managed subscriptions have no redeliver today |

**Gap:** if Zapier's hooks endpoint is unreachable for more than about 70 seconds, events in that window never
reach the customer's Zaps. A polling trigger would have caught up on its next check.

### B3. Proposed solutions

1. **Longer retry schedule (recommended).** Change `WEBHOOK_RETRY_DELAYS_MS` to
   `[10_000, 60_000, 300_000, 1_800_000, 7_200_000]` and `WEBHOOK_MAX_ATTEMPTS` to 6: about 2.6 hours of
   retries. It applies to all webhooks, which benefits customer endpoints too. Failures are counted per
   `GAVE_UP` delivery, not per attempt, so the degraded and auto-disable thresholds keep their meaning. Check
   that the BullMQ delayed jobs in `apps/jobs/src/workers/webhooks.ts` use these delays and that retention
   (`WEBHOOK_RETENTION_DAYS = 30`) covers them. Update the tests for delivery scheduling.
2. **Show and redeliver failed Zapier events.** In the main plan's "Active ClassroomIO triggers" list (Zaps
   page), show the last failed delivery per trigger and a **Redeliver failed events** action for the last 24
   hours. Add org-admin routes that reuse the existing redeliver service for managed subscriptions, scoped to the
   org's Zapier grants (the customer-endpoint filter stays on the Webhooks tab).
3. **Record the decision.** Merge [classroomio/classroomio#1441](https://github.com/classroomio/classroomio/pull/1441), or fold its trigger
   decision into `prd/zapier/README.md` on this branch, so the PRD on `main` stops saying "polling only".
4. **Document it.** Help Center and the Zapier app description: triggers are instant; failed deliveries are
   retried for about 2.6 hours; admins are emailed when deliveries keep failing.

Not recommended: **polling fallback triggers.** They would add a second version of every trigger (Zapier shows
these as "New Subscriber (Polling)" next to "New Subscriber", which confuses users), need `?since=`/cursor
support on every list endpoint, and catch up only for Zaps built on the polling version. Revisit only if
delivery logs show events lost after solution 1.

### B4. Done when

- Retry schedule changed, tests updated, and a delivery to an endpoint that fails for 10 minutes then recovers
  arrives on a later attempt.
- Zaps page shows failed deliveries per trigger and redelivers them for the org's own Zapier subscriptions only;
  a non-admin gets 403.
- The PRD no longer says polling.
