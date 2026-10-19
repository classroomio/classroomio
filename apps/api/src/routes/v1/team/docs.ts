export const ORG_ADMIN_RULE =
  'The automation actor (the key creator) must be an org admin, or this fails with 403. The role is checked on every call, so a creator who loses admin access loses it for the key too.';

export const TEAM_UPDATE_DESCRIPTION = [
  "Change a team member's organization role, their name, or both. Send only the fields to change.",
  'roleId switches the member between admin (1) and tutor (2), under the same rules as the dashboard team settings: you cannot change your own role (400), and the organization must keep at least one admin (400).',
  'A pending member can have their role changed; their invite is updated to match.',
  "name sets the full name on the member's profile and only works once they have joined (400 for a pending member). The profile is shared, so the new name shows in every organization the person belongs to.",
  'Email, password, username and avatar belong to the person and cannot be changed here.',
  'Inviting and removing team members are not part of the public API yet.'
].join(' ');

export const teamForbiddenResponse = (scope: 'team:read' | 'team:write') => ({
  description: `The key has neither the public_api:* nor the ${scope} scope, or the automation actor is not an org admin`
});
