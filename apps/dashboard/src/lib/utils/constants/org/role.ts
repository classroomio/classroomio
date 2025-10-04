/**
 * This constant applies to public.organization_roles -> app_name
 */
export const ORG_ROLE = {
  ADMIN: 'admin',
  TUTOR: 'tutor',
  STUDENT: 'student'
};

export type PermissionType =
  | 'course:create'
  | 'course:view'
  | 'course:edit'
  | 'course:delete'
  | 'people:invite'
  | 'assignment:grade'
  | 'assignment:submit'
  | 'testpack:view'
  | 'testpack:edit'
  | 'testpack:submit'
  | 'testpack:delete'
  | 'questionbank:view'
  | 'questionbank:edit'
  | 'questionbank:submit'
  | 'questionbank:delete'
  | 'org:edit'
  | 'org:delete'
  | 'org:invite_members'
  | 'relationship:user_view_only_content';
