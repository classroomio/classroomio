import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countWorkspaceNotesByOwner,
  createNote,
  getLessonCaptureNote,
  getMaxChildSortOrder,
  getNoteById,
  getNoteByIdIncludingDeleted,
  getNoteVersionById,
  getNoteVersionHistory,
  hardDeleteNote,
  insertNoteVersion,
  listAccessibleNotes,
  listNoteChildren,
  listNotesForSidebar,
  listNoteTemplates,
  listPublicNoteSlugsForOrganization,
  listTrashedNotes,
  restoreNote,
  softDeleteNote,
  updateNote,
  wouldCreateCycle,
  cascadeNoteVisibility,
  type NoteListRow,
  type SidebarNoteRow
} from '@cio/db/queries/notes';
import { addNoteFavorite, isNoteFavorited, removeNoteFavorite } from '@cio/db/queries/notes/favorite';
import {
  getNoteSharePermission,
  listNoteShares,
  listSharePermissionsForNotes,
  replaceNoteShares,
  type NoteShareGrant
} from '@cio/db/queries/notes/share';
import { getNoteTagsForOrganization, replaceNoteTagAssignments } from '@cio/db/queries/notes/tag';
import { getActiveOrganizationPlan, getOrganizationById, getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { verifyLessonBelongsToCourse } from '@cio/core/services/agent/chat-context';
import { BASIC_WORKSPACE_NOTE_LIMIT, PLAN } from '@cio/utils/plans/constants';
import type {
  TCreateNote,
  TCreateNoteFromCourseTemplate,
  TCreateNoteFromTemplate,
  TListNotesQuery,
  TNoteOrigin,
  TReplaceNoteShares,
  TUpdateNote,
  TUpdateNoteVisibility
} from '@cio/utils/validation/notes';
import { resolveSlugCollision, slugifyTitle } from '@cio/utils/validation/shared/slug';
import { getCourseTemplateById } from '@cio/utils/constants/note-course-templates';
import type { TPlan } from '@db/types';
import { assertNoteWriteAccess, isOrgTeamRole, resolveNoteAccess } from './access';

function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getOrganizationPlanName(orgId: string): Promise<TPlan> {
  const activePlan = await getActiveOrganizationPlan(orgId);
  const planName = activePlan?.planName;

  if (planName === PLAN.EARLY_ADOPTER || planName === PLAN.ENTERPRISE || planName === PLAN.BASIC) {
    return planName;
  }

  return 'BASIC';
}

async function getWorkspaceNoteDefaultVisibility(organizationId: string): Promise<'private' | 'team'> {
  const organization = await getOrganizationById(organizationId);
  const defaultVisibility = organization?.settings?.notes?.defaultVisibility;

  return defaultVisibility === 'team' ? 'team' : 'private';
}

export async function assertWorkspaceNoteCreationAllowed(organizationId: string, ownerId: string): Promise<void> {
  const planName = await getOrganizationPlanName(organizationId);

  if (planName !== PLAN.BASIC) {
    return;
  }

  const workspaceCount = await countWorkspaceNotesByOwner(organizationId, ownerId);

  if (workspaceCount >= BASIC_WORKSPACE_NOTE_LIMIT) {
    throw new AppError(
      `Your plan allows up to ${BASIC_WORKSPACE_NOTE_LIMIT} workspace notes`,
      ErrorCodes.NOTES_LIMIT_REACHED,
      403
    );
  }
}

async function getReadableNote(organizationId: string, userId: string, roleId: number, noteId: string) {
  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const sharePermission = await getNoteSharePermission(noteId, userId);
  const access = resolveNoteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (!access.canRead) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { note, canWrite: access.canWrite, sharePermission };
}

async function getWritableParentNote(params: {
  organizationId: string;
  userId: string;
  roleId: number;
  parentId: string;
}) {
  const parent = await getNoteById(params.parentId);

  if (!parent || parent.organizationId !== params.organizationId) {
    throw new AppError('Parent note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  if (parent.origin !== 'workspace' || parent.isTemplate) {
    throw new AppError('Invalid parent note', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const sharePermission = await getNoteSharePermission(params.parentId, params.userId);
  const access = resolveNoteAccess({
    note: parent,
    organizationId: params.organizationId,
    userId: params.userId,
    roleId: params.roleId,
    sharePermission
  });

  if (!access.canWrite) {
    throw new AppError('Parent note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return parent;
}

function mapSidebarNote(
  note: SidebarNoteRow,
  organizationId: string,
  userId: string,
  roleId: number,
  sharePermissions: Map<string, 'read' | 'write'>
) {
  const sharePermission = sharePermissions.get(note.id) ?? null;
  const access = resolveNoteAccess({ note, organizationId, userId, roleId, sharePermission });

  return {
    ...note,
    canWrite: access.canWrite
  };
}

async function validateShareGrantees(organizationId: string, grants: NoteShareGrant[]) {
  const uniqueProfileIds = Array.from(new Set(grants.map((grant) => grant.profileId)));

  for (const profileId of uniqueProfileIds) {
    const memberId = await getOrganizationMemberIdByOrgAndProfile(organizationId, profileId);

    if (!memberId) {
      throw new AppError('One or more share recipients are invalid', ErrorCodes.VALIDATION_ERROR, 400, 'grants');
    }
  }
}

async function validateLessonCaptureContext(params: { organizationId: string; courseId?: string; lessonId?: string }) {
  if (!params.lessonId || !params.courseId) {
    throw new AppError('Lesson capture notes require courseId and lessonId', ErrorCodes.VALIDATION_ERROR, 400);
  }

  await verifyLessonBelongsToCourse(params.lessonId, params.courseId);
}

export async function listNotesService(organizationId: string, userId: string, roleId: number, query: TListNotesQuery) {
  const notes = await listAccessibleNotes({
    organizationId,
    userId,
    isTeamMember: isOrgTeamRole(roleId),
    scope: query.scope,
    origin: query.origin,
    courseId: query.courseId,
    lessonId: query.lessonId,
    search: query.search,
    tagId: query.tagId,
    isTemplate: query.isTemplate
  });

  const { attachTagsToNotes } = await import('./tags');

  return attachTagsToNotes(organizationId, notes);
}

export async function listNotesSidebarService(organizationId: string, userId: string, roleId: number) {
  const notes = await listNotesForSidebar({ organizationId, userId });
  const sharePermissions = await listSharePermissionsForNotes(
    userId,
    notes.map((note) => note.id)
  );

  const sidebarNotes = notes.map((note) => mapSidebarNote(note, organizationId, userId, roleId, sharePermissions));
  const { attachTagsToNotes } = await import('./tags');

  return attachTagsToNotes(organizationId, sidebarNotes);
}

export async function favoriteNoteService(organizationId: string, userId: string, roleId: number, noteId: string) {
  await getReadableNote(organizationId, userId, roleId, noteId);
  await addNoteFavorite(userId, noteId);

  return { noteId, favorited: true };
}

export async function unfavoriteNoteService(organizationId: string, userId: string, roleId: number, noteId: string) {
  await getReadableNote(organizationId, userId, roleId, noteId);
  await removeNoteFavorite(userId, noteId);

  return { noteId, favorited: false };
}

export async function listNoteSharesService(organizationId: string, userId: string, roleId: number, noteId: string) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (note.visibility !== 'private') {
    throw new AppError('Only private notes support individual shares', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return listNoteShares(noteId);
}

export async function replaceNoteSharesService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TReplaceNoteShares
) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (note.visibility !== 'private') {
    throw new AppError('Only private notes support individual shares', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const grants = data.grants.filter((grant) => grant.profileId !== note.ownerId);
  await validateShareGrantees(organizationId, grants);

  return replaceNoteShares(noteId, userId, grants);
}

export async function listTrashedNotesService(organizationId: string, userId: string) {
  return listTrashedNotes(userId, organizationId);
}

export async function restoreNoteService(organizationId: string, userId: string, noteId: string) {
  const note = await getNoteByIdIncludingDeleted(noteId);

  if (!note || note.organizationId !== organizationId || note.ownerId !== userId) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  if (!note.deletedAt) {
    return note;
  }

  const restored = await restoreNote(noteId);

  if (!restored) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return (await getNoteById(noteId))!;
}

export async function permanentDeleteNoteService(organizationId: string, userId: string, noteId: string) {
  const note = await getNoteByIdIncludingDeleted(noteId);

  if (!note || note.organizationId !== organizationId || note.ownerId !== userId) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  await hardDeleteNote(noteId);

  return { id: noteId };
}

export async function getNoteService(organizationId: string, userId: string, roleId: number, noteId: string) {
  const { note, canWrite } = await getReadableNote(organizationId, userId, roleId, noteId);
  const children = await listNoteChildren(noteId);
  const favorited = await isNoteFavorited(userId, noteId);

  return { ...note, canWrite, children, isFavorited: favorited };
}

export async function createNoteService(ownerId: string, roleId: number, data: TCreateNote) {
  if (data.organizationId && data.origin === 'workspace') {
    await assertWorkspaceNoteCreationAllowed(data.organizationId, ownerId);
  }

  if (data.origin === 'lesson_capture') {
    await validateLessonCaptureContext({
      organizationId: data.organizationId,
      courseId: data.courseId,
      lessonId: data.lessonId
    });

    const existing = await getLessonCaptureNote({
      organizationId: data.organizationId,
      ownerId,
      lessonId: data.lessonId!
    });

    if (existing) {
      throw new AppError('A lesson note already exists for this lesson', ErrorCodes.NOTE_LESSON_CAPTURE_EXISTS, 409);
    }
  }

  const plainText = htmlToPlainText(data.content ?? '');
  let visibility: 'private' | 'team' | 'public' =
    data.origin === 'workspace' ? await getWorkspaceNoteDefaultVisibility(data.organizationId) : 'private';
  let noteOwnerId = ownerId;
  let parentId: string | null = data.parentId ?? null;
  let sortOrder = data.sortOrder ?? 0;

  if (data.parentId) {
    const parent = await getWritableParentNote({
      organizationId: data.organizationId,
      userId: ownerId,
      roleId,
      parentId: data.parentId
    });

    visibility = parent.visibility;
    noteOwnerId = parent.visibility === 'team' ? parent.ownerId : ownerId;
    parentId = parent.id;
    sortOrder = data.sortOrder ?? (await getMaxChildSortOrder(parent.id)) + 1;
  }

  const note = await createNote({
    organizationId: data.organizationId,
    ownerId: noteOwnerId,
    title: data.title,
    content: data.content ?? '',
    plainText,
    origin: data.origin,
    visibility,
    isTemplate: false,
    courseId: data.courseId ?? null,
    lessonId: data.lessonId ?? null,
    videoAnchors: data.videoAnchors ?? [],
    parentId,
    sortOrder
  });

  if (note.content) {
    await insertNoteVersion({
      noteId: note.id,
      oldContent: null,
      newContent: note.content,
      changedBy: ownerId,
      changeSource: 'manual'
    });
  }

  return { ...(await getNoteById(note.id))!, canWrite: true };
}

export async function listNoteTemplatesService(organizationId: string, roleId: number) {
  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return listNoteTemplates(organizationId);
}

export async function convertNoteToTemplateService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string
) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (note.origin !== 'workspace') {
    throw new AppError('Only workspace notes can become templates', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (note.isTemplate) {
    return { ...note, canWrite: true };
  }

  const templateNote = await createNote({
    organizationId,
    ownerId: userId,
    title: note.title,
    content: note.content,
    plainText: note.plainText,
    origin: 'workspace',
    visibility: 'private',
    isTemplate: true,
    courseId: null,
    lessonId: null,
    videoAnchors: note.videoAnchors ?? []
  });

  if (templateNote.content) {
    await insertNoteVersion({
      noteId: templateNote.id,
      oldContent: null,
      newContent: templateNote.content,
      changedBy: userId,
      changeSource: 'manual'
    });
  }

  const sourceTags = await getNoteTagsForOrganization(organizationId, noteId);

  if (sourceTags.length > 0) {
    await replaceNoteTagAssignments(
      templateNote.id,
      sourceTags.map((tag) => tag.id)
    );
  }

  const refreshed = await getNoteById(templateNote.id);

  if (!refreshed) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...refreshed, canWrite: true };
}

export async function unsetNoteTemplateService(organizationId: string, userId: string, roleId: number, noteId: string) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (!note.isTemplate) {
    return { ...note, canWrite: true };
  }

  const updated = await updateNote(noteId, {
    isTemplate: false,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const refreshed = await getNoteById(noteId);

  if (!refreshed) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...refreshed, canWrite: true };
}

async function copyTemplateNoteTree(params: {
  sourceNoteId: string;
  organizationId: string;
  ownerId: string;
  visibility: 'private' | 'team' | 'public';
  parentId?: string | null;
  sortOrder?: number;
}): Promise<NoteListRow> {
  const source = await getNoteById(params.sourceNoteId);

  if (!source) {
    throw new AppError('Template not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  const note = await createNote({
    organizationId: params.organizationId,
    ownerId: params.ownerId,
    title: source.title,
    content: source.content,
    plainText: source.plainText,
    origin: 'workspace',
    visibility: params.visibility,
    isTemplate: false,
    courseId: null,
    lessonId: null,
    videoAnchors: source.videoAnchors ?? [],
    parentId: params.parentId ?? null,
    sortOrder: params.sortOrder ?? 0
  });

  if (note.content) {
    await insertNoteVersion({
      noteId: note.id,
      oldContent: null,
      newContent: note.content,
      changedBy: params.ownerId,
      changeSource: 'manual'
    });
  }

  const children = await listNoteChildren(params.sourceNoteId);

  for (const [index, child] of children.entries()) {
    await copyTemplateNoteTree({
      sourceNoteId: child.id,
      organizationId: params.organizationId,
      ownerId: params.ownerId,
      visibility: params.visibility,
      parentId: note.id,
      sortOrder: index
    });
  }

  const refreshed = await getNoteById(note.id);

  if (!refreshed) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return refreshed;
}

export async function createNoteFromTemplateService(
  ownerId: string,
  organizationId: string,
  roleId: number,
  data: TCreateNoteFromTemplate
) {
  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const template = await getNoteById(data.templateNoteId);

  if (
    !template ||
    template.organizationId !== organizationId ||
    !template.isTemplate ||
    template.origin !== 'workspace'
  ) {
    throw new AppError('Template not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  await assertWorkspaceNoteCreationAllowed(organizationId, ownerId);

  const visibility = await getWorkspaceNoteDefaultVisibility(organizationId);
  const copied = await copyTemplateNoteTree({
    sourceNoteId: template.id,
    organizationId,
    ownerId,
    visibility
  });

  const templateTags = await getNoteTagsForOrganization(organizationId, template.id);

  if (templateTags.length > 0) {
    await replaceNoteTagAssignments(
      copied.id,
      templateTags.map((tag) => tag.id)
    );
  }

  return { ...copied, canWrite: true };
}

export async function createNoteFromCourseTemplateService(
  ownerId: string,
  organizationId: string,
  roleId: number,
  data: TCreateNoteFromCourseTemplate
) {
  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const template = getCourseTemplateById(data.templateId);

  if (!template) {
    throw new AppError('Template not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  await assertWorkspaceNoteCreationAllowed(organizationId, ownerId);

  const visibility = await getWorkspaceNoteDefaultVisibility(organizationId);
  const plainText = htmlToPlainText(template.introHtml ?? '');

  const rootNote = await createNote({
    organizationId,
    ownerId,
    title: template.title,
    content: template.introHtml ?? '',
    plainText,
    origin: 'workspace',
    visibility,
    isTemplate: false,
    courseId: null,
    lessonId: null,
    videoAnchors: [],
    parentId: null,
    sortOrder: 0
  });

  if (rootNote.content) {
    await insertNoteVersion({
      noteId: rootNote.id,
      oldContent: null,
      newContent: rootNote.content,
      changedBy: ownerId,
      changeSource: 'manual'
    });
  }

  const children: NoteListRow[] = [];

  for (const [index, moduleTitle] of template.modules.entries()) {
    const child = await createNote({
      organizationId,
      ownerId,
      title: moduleTitle,
      content: '',
      plainText: '',
      origin: 'workspace',
      visibility,
      isTemplate: false,
      courseId: null,
      lessonId: null,
      videoAnchors: [],
      parentId: rootNote.id,
      sortOrder: index
    });

    const refreshedChild = await getNoteById(child.id);

    if (refreshedChild) {
      children.push(refreshedChild);
    }
  }

  const refreshedRoot = await getNoteById(rootNote.id);

  if (!refreshedRoot) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return {
    rootNote: { ...refreshedRoot, canWrite: true },
    children: children.map((child) => ({ ...child, canWrite: true }))
  };
}

export async function updateNoteService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TUpdateNote
) {
  const { note: existing, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note: existing, organizationId, userId, roleId, sharePermission });

  const nextContent = data.content ?? existing.content;
  const nextTitle = data.title ?? existing.title;
  const nextVideoAnchors = data.videoAnchors ?? existing.videoAnchors;
  const nextIsPinned = data.isPinned ?? existing.isPinned;
  const nextParentId = data.parentId !== undefined ? data.parentId : existing.parentId;
  const nextSortOrder = data.sortOrder ?? existing.sortOrder;
  const contentChanged = data.content !== undefined && data.content !== existing.content;
  let nextOwnerId = existing.ownerId;

  if (data.parentId !== undefined && data.parentId !== existing.parentId) {
    if (data.parentId) {
      const parent = await getWritableParentNote({
        organizationId,
        userId,
        roleId,
        parentId: data.parentId
      });

      if (parent.visibility !== existing.visibility) {
        throw new AppError('Child note visibility must match parent', ErrorCodes.VALIDATION_ERROR, 400);
      }

      if (await wouldCreateCycle(noteId, data.parentId)) {
        throw new AppError('Cannot move note under its own descendant', ErrorCodes.VALIDATION_ERROR, 400);
      }

      if (parent.visibility === 'team') {
        nextOwnerId = parent.ownerId;
      }
    }
  }

  const updated = await updateNote(noteId, {
    title: nextTitle,
    content: nextContent,
    plainText: htmlToPlainText(nextContent),
    videoAnchors: nextVideoAnchors,
    isPinned: nextIsPinned,
    parentId: nextParentId,
    sortOrder: nextSortOrder,
    ownerId: nextOwnerId,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  if (contentChanged) {
    await insertNoteVersion({
      noteId,
      oldContent: existing.content,
      newContent: nextContent,
      changedBy: userId,
      changeSource: 'manual'
    });
  }

  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...note, canWrite: true };
}

export async function updateNoteVisibilityService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  data: TUpdateNoteVisibility
) {
  const { note: existing, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note: existing, organizationId, userId, roleId, sharePermission });

  if (existing.origin !== 'workspace') {
    throw new AppError('Only workspace notes can be shared', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Only team members can share notes', ErrorCodes.UNAUTHORIZED, 403);
  }

  if (existing.isTemplate) {
    throw new AppError('Templates cannot be shared', ErrorCodes.VALIDATION_ERROR, 400);
  }

  let nextSlug = existing.slug ?? null;

  if (data.visibility === 'public') {
    const takenSlugs = await listPublicNoteSlugsForOrganization(organizationId, noteId);
    const requestedSlug = data.slug?.trim();
    const baseSlug = requestedSlug || slugifyTitle(existing.title);
    nextSlug = resolveSlugCollision(baseSlug, takenSlugs);
  }

  const updated = await updateNote(noteId, {
    visibility: data.visibility,
    ...(data.visibility === 'public' ? { slug: nextSlug ?? undefined } : {}),
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  await cascadeNoteVisibility(noteId, data.visibility);

  const note = await getNoteById(noteId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...note, canWrite: true };
}

export async function deleteNoteService(organizationId: string, userId: string, roleId: number, noteId: string) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });
  await softDeleteNote(noteId);
  return { id: noteId };
}

export async function getNoteVersionHistoryService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  endRange: number
) {
  await getReadableNote(organizationId, userId, roleId, noteId);
  return getNoteVersionHistory(noteId, endRange);
}

export async function restoreNoteVersionService(
  organizationId: string,
  userId: string,
  roleId: number,
  noteId: string,
  versionId: number
) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, noteId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  const version = await getNoteVersionById(noteId, versionId);

  if (!version?.newContent) {
    throw new AppError('Note version not found', ErrorCodes.NOTE_VERSION_NOT_FOUND, 404);
  }

  const restoredContent = version.newContent;

  await updateNote(noteId, {
    content: restoredContent,
    plainText: htmlToPlainText(restoredContent),
    updatedAt: new Date().toISOString()
  });

  await insertNoteVersion({
    noteId,
    oldContent: note.content,
    newContent: restoredContent,
    changedBy: userId,
    changeSource: 'restore'
  });

  const updatedNote = await getNoteById(noteId);

  if (!updatedNote) {
    throw new AppError('Note not found', ErrorCodes.NOTE_NOT_FOUND, 404);
  }

  return { ...updatedNote, canWrite: true };
}

export async function getWorkspaceNoteUsageService(organizationId: string, ownerId: string) {
  const planName = await getOrganizationPlanName(organizationId);
  const used = await countWorkspaceNotesByOwner(organizationId, ownerId);
  const limit = planName === PLAN.BASIC ? BASIC_WORKSPACE_NOTE_LIMIT : null;

  return {
    planName,
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0)
  };
}

export type { TNoteOrigin, NoteListRow };
