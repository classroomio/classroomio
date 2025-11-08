# Auth flow

Documenting my thoughts on how authentication works in the app.

## Simplified breakdown

### dashboard (app.classroomio.com)

- sign up (email, password or google auth)
- redirect to onboarding.
- redirect to dashboard

### dashboard - invite (admin or teacher)

- insert email into organizationmember table
- click invite link
- sign up or login
- update org with role (as role in invite)

### lms (school.classroomio.com)

- create email and password
- join org as student (automatically).

### lms - invite

- click invite link
- redirect to login and come back to invite page.
- join org as student (automatically).

---

## Better Auth to Supabase TODO

### actions to trigger [in code]

- [ ] After sign up
  - [ ] create a profile by new user.
  - [ ] if sign up was triggered from a subdomain (aka is lms), add profile to org with student role
  - [ ] send verification email

### migrate from supabase

- [ ] google auth flow (local and on test environment)
- [ ] support google auth for teacher invite
- [ ] forgot password flow
- [ ] change email flow.

---

## invite v2.0

should an admin invite student into an org alone?

- yes
- and also give them access to all resources in the org.

student

- send you invite to join course
- you click link in email
- you are redirected to accept page
- you enter your name and password with email prefilled
- you click join.

how do teachers send invite?

- email input field
- teacher can send to multiple emails
- teacher can deactivate access.
- teacher can see who has accepted the invite and when.
