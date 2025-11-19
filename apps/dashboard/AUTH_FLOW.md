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
  - [x] create a profile by new user.
  - [ ] if sign up was triggered from a subdomain (aka is lms), add profile to org with student role
  - [ ] send verification email

### migrate from supabase

- [x] after login redirect to next page
- [x] after signup redirect to next page (onboarding | lms | )
- [x] implement logout
- [x] forgot password flow
- [x] complete onboarding flow
- [x] change email flow.
- [ ] google auth flow (local and on test environment)
- [ ] support google auth for teacher invite
- [ ] support google auth for student invite

### others

- [ ] block org routes when isOrgSite === true.
- [ ] routes belonging to orgsite should proxy to courseapp (site-theme)

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
