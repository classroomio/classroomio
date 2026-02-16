# Self-Hosted Single-Org + Invite-Only Signup

## Purpose
Ensure self-hosted instances support only one organization, auto-enroll new users as students, and restrict signups to invite-only when configured by org admins.

## Goals
- Enforce a single organization per self-hosted instance.
- Automatically add any non-member user as a student in the self-hosted org.
- Use a single domain for dashboard + LMS in self-hosted mode.
- Allow admins to disable public signups and enforce invite-only access.

## Constraints
- First signup can create the only org; subsequent org creation is blocked.
- Users without membership are treated as students and routed to `/lms`.
- Students cannot access `/org/[slug]` routes.
- Org switching UI is hidden in self-hosted mode.

## Backend Changes
- Add `PUBLIC_IS_SELFHOSTED` to API env schema.
- Add an org count/first-org query to detect the singleton org.
- In `createOrganizationWithOwner` and `createOrg`, block org creation when self-hosted and an org exists.
- In the account bootstrap (`GET /account`), auto-add user as `ROLE.STUDENT` to the single org if they are not a member.

## Frontend Changes
- In `getOrgSiteInfo`, when self-hosted, treat the root domain as the org site by returning the single org even without subdomain.
- In app init routing, if self-hosted and user has no orgs, route to `/lms`.
- Hide org switching and create-org UI in self-hosted mode.

## Invite-Only Signup Setting
- Add `settings.signup.inviteOnly` to `organization.settings` and allow updates via `ZUpdateOrganization`.
- Add a toggle in `org/[slug]/settings/org` labeled “Allow public signups” with a description.
- Hide signup link/buttons in Auth UI and navigation when invite-only is enabled.
- Only allow signups when invite context exists:
  - `invite_token` query param (course invite)
  - `redirect` contains `/invite/t/` (org invite)
  - `redirect` contains `invite_token` (course invite redirect)
- If invite-only and no invite context, show a message and hide the signup form.
- Enforce invite-only on the backend to block non-invite signup attempts.

## Open UX Copy
- Signup message when invite-only and no invite context.
- Description text for “Allow public signups” toggle.
