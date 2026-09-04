import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  countOrganizationDocsByOwner,
  createDoc,
  getLessonCaptureNote,
  getMaxChildSortOrder,
  getDocById,
  getDocByIdIncludingDeleted,
  getNoteVersionById,
  getNoteVersionHistory,
  hardDeleteDoc,
  insertNoteVersion,
  listAccessibleDocs,
  listDocChildren,
  listDocsForSidebar,
  listDocTemplates,
  listPublicDocSlugsForOrganization,
  listTrashedDocs,
  restoreDoc,
  softDeleteDoc,
  updateDoc,
  wouldCreateCycle,
  cascadeNoteVisibility,
  ensurePublicSlugsForSubtree,
  type DocListRow,
  type SidebarNoteRow
} from '@cio/db/queries/docs';
import { selectDocViewTotals } from '@cio/db/queries/analytics';
import { addNoteFavorite, isNoteFavorited, removeNoteFavorite } from '@cio/db/queries/docs/favorite';
import {
  getNoteSharePermission,
  listNoteShares,
  listSharePermissionsForNotes,
  replaceNoteShares,
  type NoteShareGrant
} from '@cio/db/queries/docs/share';
import { getNoteTagsForOrganization, replaceNoteTagAssignments } from '@cio/db/queries/docs/tag';
import { getActiveOrganizationPlan, getOrganizationById, getOrganizationMemberIdByOrgAndProfile } from '@cio/db/queries/organization';
import { verifyLessonBelongsToCourse } from '@cio/core/services/agent/chat-context';
import { BASIC_ORGANIZATION_DOC_LIMIT, PLAN } from '@cio/utils/plans/constants';
import type {
  TCreateNote,
  TCreateNoteFromCourseTemplate,
  TCreateNoteFromTemplate,
  TListNotesQuery,
  TDocOrigin,
  TReplaceNoteShares,
  TUpdateNote,
  TUpdateNoteVisibility
} from '@cio/utils/validation/docs';
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

async function getOrganizationDocDefaultVisibility(organizationId: string): Promise<'private' | 'team'> {
  const organization = await getOrganizationById(organizationId);
  const defaultVisibility = organization?.settings?.notes?.defaultVisibility;

  return defaultVisibility === 'team' ? 'team' : 'private';
}

export async function assertOrganizationDocCreationAllowed(organizationId: string, ownerId: string): Promise<void> {
  const planName = await getOrganizationPlanName(organizationId);

  if (planName !== PLAN.BASIC) {
    return;
  }

  const workspaceCount = await countOrganizationDocsByOwner(organizationId, ownerId);

  if (workspaceCount >= BASIC_ORGANIZATION_DOC_LIMIT) {
    throw new AppError(
      `Your plan allows up to ${BASIC_ORGANIZATION_DOC_LIMIT} organization notes`,
      ErrorCodes.NOTES_LIMIT_REACHED,
      403
    );
  }
}

async function getReadableNote(organizationId: string, userId: string, roleId: number, docId: string) {
  const note = await getDocById(docId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  const sharePermission = await getNoteSharePermission(docId, userId);
  const access = resolveNoteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (!access.canRead) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return { note, canWrite: access.canWrite, sharePermission };
}

async function getWritableParentNote(params: {
  organizationId: string;
  userId: string;
  roleId: number;
  parentId: string;
}) {
  const parent = await getDocById(params.parentId);

  if (!parent || parent.organizationId !== params.organizationId) {
    throw new AppError('Parent note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  if (parent.origin !== 'organization' || parent.isTemplate) {
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
    throw new AppError('Parent note not found', ErrorCodes.DOC_NOT_FOUND, 404);
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

export async function listDocsService(organizationId: string, userId: string, roleId: number, query: TListNotesQuery) {
  const notes = await listAccessibleDocs({
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

export async function listDocsSidebarService(organizationId: string, userId: string, roleId: number) {
  const notes = await listDocsForSidebar({ organizationId, userId });
  const sharePermissions = await listSharePermissionsForNotes(
    userId,
    notes.map((note) => note.id)
  );

  const sidebarNotes = notes.map((note) => mapSidebarNote(note, organizationId, userId, roleId, sharePermissions));
  const { attachTagsToNotes } = await import('./tags');

  return attachTagsToNotes(organizationId, sidebarNotes);
}

export async function favoriteNoteService(organizationId: string, userId: string, roleId: number, docId: string) {
  await getReadableNote(organizationId, userId, roleId, docId);
  await addNoteFavorite(userId, docId);

  return { docId, favorited: true };
}

export async function unfavoriteNoteService(organizationId: string, userId: string, roleId: number, docId: string) {
  await getReadableNote(organizationId, userId, roleId, docId);
  await removeNoteFavorite(userId, docId);

  return { docId, favorited: false };
}

export async function listNoteSharesService(organizationId: string, userId: string, roleId: number, docId: string) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (note.visibility !== 'private') {
    throw new AppError('Only private notes support individual shares', ErrorCodes.VALIDATION_ERROR, 400);
  }

  return listNoteShares(docId);
}

export async function replaceNoteSharesService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string,
  data: TReplaceNoteShares
) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (note.visibility !== 'private') {
    throw new AppError('Only private notes support individual shares', ErrorCodes.VALIDATION_ERROR, 400);
  }

  const grants = data.grants.filter((grant) => grant.profileId !== note.ownerId);
  await validateShareGrantees(organizationId, grants);

  return replaceNoteShares(docId, userId, grants);
}

export async function listTrashedDocsService(organizationId: string, userId: string) {
  return listTrashedDocs(userId, organizationId);
}

export async function restoreDocService(organizationId: string, userId: string, docId: string) {
  const note = await getDocByIdIncludingDeleted(docId);

  if (!note || note.organizationId !== organizationId || note.ownerId !== userId) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  if (!note.deletedAt) {
    return note;
  }

  const restored = await restoreDoc(docId);

  if (!restored) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return (await getDocById(docId))!;
}

export async function permanentDeleteNoteService(organizationId: string, userId: string, docId: string) {
  const note = await getDocByIdIncludingDeleted(docId);

  if (!note || note.organizationId !== organizationId || note.ownerId !== userId) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  await hardDeleteDoc(docId);

  return { id: docId };
}

export async function getDocService(organizationId: string, userId: string, roleId: number, docId: string) {
  const { note, canWrite } = await getReadableNote(organizationId, userId, roleId, docId);
  const children = await listDocChildren(docId);
  const favorited = await isNoteFavorited(userId, docId);
  const viewRows = await selectDocViewTotals(organizationId, [docId]);
  const publicPageViews = viewRows.find((row) => row.docId === docId)?.views ?? 0;

  return { ...note, canWrite, children, isFavorited: favorited, publicPageViews };
}

export async function createDocService(ownerId: string, roleId: number, data: TCreateNote) {
  if (data.organizationId && data.origin === 'organization') {
    await assertOrganizationDocCreationAllowed(data.organizationId, ownerId);
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
      throw new AppError('A lesson note already exists for this lesson', ErrorCodes.DOC_LESSON_CAPTURE_EXISTS, 409);
    }
  }

  const plainText = htmlToPlainText(data.content ?? '');
  let visibility: 'private' | 'team' | 'public' =
    data.origin === 'organization' ? await getOrganizationDocDefaultVisibility(data.organizationId) : 'private';
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

  const note = await createDoc({
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
      docId: note.id,
      oldContent: null,
      newContent: note.content,
      changedBy: ownerId,
      changeSource: 'manual'
    });
  }

  return { ...(await getDocById(note.id))!, canWrite: true };
}

export async function listDocTemplatesService(organizationId: string, roleId: number) {
  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  return listDocTemplates(organizationId);
}

export async function convertNoteToTemplateService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string
) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (note.origin !== 'organization') {
    throw new AppError('Only workspace notes can become templates', ErrorCodes.VALIDATION_ERROR, 400);
  }

  if (note.isTemplate) {
    return { ...note, canWrite: true };
  }

  const templateNote = await createDoc({
    organizationId,
    ownerId: userId,
    title: note.title,
    content: note.content,
    plainText: note.plainText,
    origin: 'organization',
    visibility: 'private',
    isTemplate: true,
    courseId: null,
    lessonId: null,
    videoAnchors: note.videoAnchors ?? []
  });

  if (templateNote.content) {
    await insertNoteVersion({
      docId: templateNote.id,
      oldContent: null,
      newContent: templateNote.content,
      changedBy: userId,
      changeSource: 'manual'
    });
  }

  const sourceTags = await getNoteTagsForOrganization(organizationId, docId);

  if (sourceTags.length > 0) {
    await replaceNoteTagAssignments(
      templateNote.id,
      sourceTags.map((tag) => tag.id)
    );
  }

  const refreshed = await getDocById(templateNote.id);

  if (!refreshed) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return { ...refreshed, canWrite: true };
}

export async function unsetNoteTemplateService(organizationId: string, userId: string, roleId: number, docId: string) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  if (!note.isTemplate) {
    return { ...note, canWrite: true };
  }

  const updated = await updateDoc(docId, {
    isTemplate: false,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  const refreshed = await getDocById(docId);

  if (!refreshed) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
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
}): Promise<DocListRow> {
  const source = await getDocById(params.sourceNoteId);

  if (!source) {
    throw new AppError('Template not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  const note = await createDoc({
    organizationId: params.organizationId,
    ownerId: params.ownerId,
    title: source.title,
    content: source.content,
    plainText: source.plainText,
    origin: 'organization',
    visibility: params.visibility,
    isTemplate: false,
    courseId: null,
    lessonId: null,
    videoAnchors: source.videoAnchors ?? [],
    parentId: params.parentId ?? null,
    sortOrder: params.sortOrder ?? 0,
    coverImageUrl: source.coverImageUrl ?? null
  });

  if (note.content) {
    await insertNoteVersion({
      docId: note.id,
      oldContent: null,
      newContent: note.content,
      changedBy: params.ownerId,
      changeSource: 'manual'
    });
  }

  const children = await listDocChildren(params.sourceNoteId);

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

  const refreshed = await getDocById(note.id);

  if (!refreshed) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return refreshed;
}

export async function createDocFromTemplateService(
  ownerId: string,
  organizationId: string,
  roleId: number,
  data: TCreateNoteFromTemplate
) {
  if (!isOrgTeamRole(roleId)) {
    throw new AppError('Forbidden', ErrorCodes.FORBIDDEN, 403);
  }

  const template = await getDocById(data.templateNoteId);

  if (
    !template ||
    template.organizationId !== organizationId ||
    !template.isTemplate ||
    template.origin !== 'organization'
  ) {
    throw new AppError('Template not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  await assertOrganizationDocCreationAllowed(organizationId, ownerId);

  const visibility = await getOrganizationDocDefaultVisibility(organizationId);
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

export async function createDocFromCourseTemplateService(
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
    throw new AppError('Template not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  await assertOrganizationDocCreationAllowed(organizationId, ownerId);

  const visibility = await getOrganizationDocDefaultVisibility(organizationId);
  const plainText = htmlToPlainText(template.introHtml ?? '');

  const rootNote = await createDoc({
    organizationId,
    ownerId,
    title: template.title,
    content: template.introHtml ?? '',
    plainText,
    origin: 'organization',
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
      docId: rootNote.id,
      oldContent: null,
      newContent: rootNote.content,
      changedBy: ownerId,
      changeSource: 'manual'
    });
  }

  const children: DocListRow[] = [];

  for (const [index, moduleTitle] of template.modules.entries()) {
    const child = await createDoc({
      organizationId,
      ownerId,
      title: moduleTitle,
      content: '',
      plainText: '',
      origin: 'organization',
      visibility,
      isTemplate: false,
      courseId: null,
      lessonId: null,
      videoAnchors: [],
      parentId: rootNote.id,
      sortOrder: index
    });

    const refreshedChild = await getDocById(child.id);

    if (refreshedChild) {
      children.push(refreshedChild);
    }
  }

  const refreshedRoot = await getDocById(rootNote.id);

  if (!refreshedRoot) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return {
    rootNote: { ...refreshedRoot, canWrite: true },
    children: children.map((child) => ({ ...child, canWrite: true }))
  };
}

export async function updateDocService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string,
  data: TUpdateNote
) {
  const { note: existing, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note: existing, organizationId, userId, roleId, sharePermission });

  const nextContent = data.content ?? existing.content;
  const nextTitle = data.title ?? existing.title;
  const nextVideoAnchors = data.videoAnchors ?? existing.videoAnchors;
  const nextIsPinned = data.isPinned ?? existing.isPinned;
  const nextParentId = data.parentId !== undefined ? data.parentId : existing.parentId;
  const nextSortOrder = data.sortOrder ?? existing.sortOrder;
  const nextCoverImageUrl = data.coverImageUrl !== undefined ? data.coverImageUrl : existing.coverImageUrl;
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

      if (await wouldCreateCycle(docId, data.parentId)) {
        throw new AppError('Cannot move note under its own descendant', ErrorCodes.VALIDATION_ERROR, 400);
      }

      if (parent.visibility === 'team') {
        nextOwnerId = parent.ownerId;
      }
    }
  }

  const updated = await updateDoc(docId, {
    title: nextTitle,
    content: nextContent,
    plainText: htmlToPlainText(nextContent),
    videoAnchors: nextVideoAnchors,
    isPinned: nextIsPinned,
    parentId: nextParentId,
    sortOrder: nextSortOrder,
    coverImageUrl: nextCoverImageUrl,
    ownerId: nextOwnerId,
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  if (contentChanged) {
    await insertNoteVersion({
      docId,
      oldContent: existing.content,
      newContent: nextContent,
      changedBy: userId,
      changeSource: 'manual'
    });
  }

  const note = await getDocById(docId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return { ...note, canWrite: true };
}

export async function updateDocVisibilityService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string,
  data: TUpdateNoteVisibility
) {
  const { note: existing, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note: existing, organizationId, userId, roleId, sharePermission });

  if (existing.origin !== 'organization') {
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
    const takenSlugs = await listPublicDocSlugsForOrganization(organizationId, docId);
    const requestedSlug = data.slug?.trim();
    const baseSlug = requestedSlug || slugifyTitle(existing.title);
    nextSlug = resolveSlugCollision(baseSlug, takenSlugs);
  }

  const updated = await updateDoc(docId, {
    visibility: data.visibility,
    ...(data.visibility === 'public' ? { slug: nextSlug ?? undefined } : {}),
    updatedAt: new Date().toISOString()
  });

  if (!updated) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  await cascadeNoteVisibility(docId, data.visibility);

  if (data.visibility === 'public') {
    await ensurePublicSlugsForSubtree(organizationId, docId);
  }

  const note = await getDocById(docId);

  if (!note) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return { ...note, canWrite: true };
}

export async function deleteDocService(organizationId: string, userId: string, roleId: number, docId: string) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });
  await softDeleteDoc(docId);
  return { id: docId };
}

export async function getNoteVersionHistoryService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string,
  endRange: number
) {
  await getReadableNote(organizationId, userId, roleId, docId);
  return getNoteVersionHistory(docId, endRange);
}

export async function restoreDocVersionService(
  organizationId: string,
  userId: string,
  roleId: number,
  docId: string,
  versionId: number
) {
  const { note, sharePermission } = await getReadableNote(organizationId, userId, roleId, docId);
  assertNoteWriteAccess({ note, organizationId, userId, roleId, sharePermission });

  const version = await getNoteVersionById(docId, versionId);

  if (!version?.newContent) {
    throw new AppError('Note version not found', ErrorCodes.DOC_VERSION_NOT_FOUND, 404);
  }

  const restoredContent = version.newContent;

  await updateDoc(docId, {
    content: restoredContent,
    plainText: htmlToPlainText(restoredContent),
    updatedAt: new Date().toISOString()
  });

  await insertNoteVersion({
    docId,
    oldContent: note.content,
    newContent: restoredContent,
    changedBy: userId,
    changeSource: 'restore'
  });

  const updatedNote = await getDocById(docId);

  if (!updatedNote) {
    throw new AppError('Note not found', ErrorCodes.DOC_NOT_FOUND, 404);
  }

  return { ...updatedNote, canWrite: true };
}

export async function getOrganizationDocUsageService(organizationId: string, ownerId: string) {
  const planName = await getOrganizationPlanName(organizationId);
  const used = await countOrganizationDocsByOwner(organizationId, ownerId);
  const limit = planName === PLAN.BASIC ? BASIC_ORGANIZATION_DOC_LIMIT : null;

  return {
    planName,
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0)
  };
}

export type { TDocOrigin, DocListRow };
