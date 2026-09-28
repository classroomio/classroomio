import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import { ErrorCodes } from '@cio/utils/constants';
import { ZCreateCourseFromTemplate, ZSaveCourseTemplate } from '@cio/utils/validation/course';
import type { SyncableSettingKey } from '@cio/utils/validation/course';
import { courseApi } from './course.svelte';
import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
import { get } from 'svelte/store';
import { untrack } from 'svelte';
import { goto } from '$app/navigation';
import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { orgNavCountsApi } from '$features/ui/sidebar/org-sidebar/org-nav-counts.svelte';
import { resolve } from '$app/paths';
import { snackbar } from '$features/ui/snackbar/store';
import { t } from '$lib/utils/functions/translations';
import { saveTemplateModal, saveTemplateModalInitialState } from '../utils/store';
import type {
  ConvertCourseTemplateRequest,
  CourseTemplateCards,
  CourseTemplatePreview,
  CourseTemplateUpdates,
  CreateCourseFromTemplateRequest,
  DeleteCourseTemplateRequest,
  DuplicateCourseTemplateRequest,
  GetCourseTemplateUpdatesRequest,
  ListCourseTemplatesRequest,
  PreviewCourseTemplateRequest,
  PullCourseTemplateUpdatesRequest,
  SaveCourseTemplateRequest
} from '../utils/types';

function bumpTemplateUsage(delta: number) {
  currentOrg.update((org) => {
    const templates = org.limits?.templates;
    if (!templates) return org;

    const used = Math.max(0, templates.used + delta);
    return {
      ...org,
      limits: {
        ...org.limits,
        templates: { ...templates, used }
      }
    };
  });
}

function markTemplateLimitReached() {
  currentOrg.update((org) => {
    const templates = org.limits?.templates;
    if (!templates || templates.limit == null) return org;

    return {
      ...org,
      limits: {
        ...org.limits,
        templates: { ...templates, used: Math.max(templates.used, templates.limit) }
      }
    };
  });
}

export class CourseTemplateApi extends BaseApiWithErrors {
  cards = $state<CourseTemplateCards | null>(null);
  preview = $state<CourseTemplatePreview | null>(null);
  updates = $state<CourseTemplateUpdates | null>(null);
  updatesCourseId = $state<string | null>(null);
  listing = $state(true);
  previewLoading = $state(false);
  creating = $state(false);
  saving = $state(false);
  deleting = $state(false);
  pulling = $state(false);
  updatesLoading = $state(false);
  private updatesRequest = 0;
  private listRequest = 0;
  private cardsOrgId: string | null = null;

  /**
   * Loads template cards for the current org. Cards from another org are cleared
   * first, and a response is dropped when a newer request has started since.
   */
  async list() {
    const organizationId = get(currentOrg).id;
    if (!organizationId) return;

    if (this.cardsOrgId !== organizationId) {
      this.cards = null;
      this.cardsOrgId = organizationId;
    }

    const requestId = ++this.listRequest;
    this.listing = true;
    try {
      await this.execute<ListCourseTemplatesRequest>({
        requestFn: () => classroomio.course.template.$get({ query: { organizationId } }),
        logContext: 'listing templates',
        onSuccess: (response) => {
          if (requestId !== this.listRequest) return;

          this.cards = response.data;
        }
      });
    } finally {
      if (requestId === this.listRequest) this.listing = false;
    }
  }

  async loadPreview(templateId: string) {
    const organizationId = get(currentOrg).id;
    if (!organizationId) return;

    this.preview = null;
    this.previewLoading = true;
    try {
      await this.execute<PreviewCourseTemplateRequest>({
        requestFn: () =>
          classroomio.course.template[':templateId'].preview.$get({
            param: { templateId },
            query: { organizationId }
          }),
        logContext: 'previewing template',
        onSuccess: (response) => {
          this.preview = response.data;
        }
      });
    } finally {
      this.previewLoading = false;
    }
  }

  async createCourse(templateId: string, title: string, templateTitle: string) {
    const organizationId = get(currentOrg).id;
    const parsed = ZCreateCourseFromTemplate.safeParse({ title, organizationId });
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return;
    }

    this.creating = true;
    try {
      await this.execute<CreateCourseFromTemplateRequest>({
        requestFn: () =>
          classroomio.course.template[':templateId'].course.$post({
            param: { templateId },
            json: parsed.data
          }),
        logContext: 'creating course from template',
        onSuccess: (response) => {
          orgNavCountsApi.adjustCount('courses', 1);
          snackbar.success(t.get('course_templates.preview.created', { title: templateTitle }));
          goto(resolve(`/courses/${response.data.id}/lessons`, {}));
        },
        onError: (result) => {
          this.reportError(result);
        }
      });
    } finally {
      this.creating = false;
    }
  }

  async duplicate(templateId: string) {
    this.saving = true;
    try {
      await this.execute<DuplicateCourseTemplateRequest>({
        requestFn: () =>
          classroomio.course.template[':templateId'].duplicate.$post({
            param: { templateId }
          }),
        logContext: 'duplicating template',
        onSuccess: async () => {
          bumpTemplateUsage(1);
          snackbar.success('course_templates.menu.duplicated');
          await this.list();
        },
        onError: (result) => {
          this.reportError(result);
        }
      });
    } finally {
      this.saving = false;
    }
  }

  async saveCopy(courseId: string, title: string) {
    const parsed = ZSaveCourseTemplate.safeParse({ title });
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return;
    }

    this.saving = true;
    try {
      await this.execute<SaveCourseTemplateRequest>({
        requestFn: () =>
          classroomio.course[':courseId'].template.$post({
            param: { courseId },
            json: parsed.data
          }),
        logContext: 'saving course as template',
        onSuccess: (response) => {
          bumpTemplateUsage(1);
          saveTemplateModal.set(saveTemplateModalInitialState);
          snackbar.success('course_templates.save.saved', undefined, {
            label: 'course_templates.save.view_templates',
            onClick: () => {
              const path = get(currentOrgPath);
              void goto(`${path}/courses/templates`);
            }
          });
          void this.list();
          goto(resolve(`/courses/${response.data.id}/lessons`, {}));
        },
        onError: (result) => {
          this.reportError(result);
        }
      });
    } finally {
      this.saving = false;
    }
  }

  async convert(courseId: string) {
    this.saving = true;
    try {
      await this.execute<ConvertCourseTemplateRequest>({
        requestFn: () =>
          classroomio.course[':courseId'].template.convert.$post({
            param: { courseId }
          }),
        logContext: 'converting course to template',
        onSuccess: async () => {
          bumpTemplateUsage(1);
          orgNavCountsApi.adjustCount('courses', -1);
          courseApi.invalidateCourse(courseId);
          await courseApi.get(courseId);
          saveTemplateModal.set(saveTemplateModalInitialState);
          snackbar.success('course_templates.save.converted');
          await this.list();
          goto(resolve(`/courses/${courseId}/lessons`, {}));
        },
        onError: (result) => {
          this.reportError(result);
        }
      });
    } finally {
      this.saving = false;
    }
  }

  /**
   * Refetches template updates on every call so template edits made elsewhere in the
   * session show up. Keeps the current course's updates visible while refreshing.
   * Safe to call from an `$effect`: none of its reads become effect dependencies.
   */
  loadUpdates(courseId: string) {
    return untrack(() => this.fetchUpdates(courseId));
  }

  private async fetchUpdates(courseId: string) {
    if (this.updatesCourseId !== courseId) {
      this.updates = null;
      this.updatesCourseId = null;
    }

    const requestId = ++this.updatesRequest;
    this.updatesLoading = true;
    try {
      await this.execute<GetCourseTemplateUpdatesRequest>({
        requestFn: () =>
          classroomio.course[':courseId']['template-updates'].$get({
            param: { courseId }
          }),
        logContext: 'loading template updates',
        onSuccess: (response) => {
          if (requestId !== this.updatesRequest) return;

          this.updates = response.data;
          this.updatesCourseId = courseId;
        },
        onError: () => {
          if (requestId !== this.updatesRequest) return;

          this.updatesCourseId = null;
        }
      });
    } finally {
      if (requestId === this.updatesRequest) this.updatesLoading = false;
    }
  }

  async pullUpdates(courseId: string, unitIds: string[], settingKeys: SyncableSettingKey[]) {
    const templateTitle = this.updates?.template?.title ?? '';
    this.pulling = true;
    try {
      await this.execute<PullCourseTemplateUpdatesRequest>({
        requestFn: () =>
          classroomio.course[':courseId']['template-updates'].pull.$post({
            param: { courseId },
            json: { unitIds, settingKeys }
          }),
        logContext: 'pulling template updates',
        onSuccess: async (response) => {
          const count = response.data.unitIds.length + response.data.settingKeys.length;
          snackbar.success(t.get('course_templates.sync.pulled', { count, title: templateTitle }));
          courseApi.invalidateCourse(courseId);
          await courseApi.get(courseId);
          this.updatesCourseId = null;
          await this.loadUpdates(courseId);
        },
        onError: (result) => {
          this.reportError(result);
        }
      });
    } finally {
      this.pulling = false;
    }
  }

  async deleteTemplate(courseId: string) {
    this.deleting = true;
    try {
      await this.execute<DeleteCourseTemplateRequest>({
        requestFn: () =>
          classroomio.course[':courseId'].$delete({
            param: { courseId }
          }),
        logContext: 'deleting template',
        onSuccess: async () => {
          bumpTemplateUsage(-1);
          snackbar.success('course_templates.menu.deleted');
          this.success = true;
          await this.list();
        },
        onError: (result) => {
          this.reportError(result);
        }
      });
    } finally {
      this.deleting = false;
    }
  }

  private reportError(result: unknown) {
    if (typeof result === 'string') {
      snackbar.error(result);
      return;
    }

    if (!result || typeof result !== 'object') return;

    if ('code' in result && result.code === ErrorCodes.UPGRADE_REQUIRED) {
      markTemplateLimitReached();
    }

    if ('error' in result && typeof result.error === 'string') {
      snackbar.error(result.error);
    }
  }
}

export const courseTemplateApi = /* @__PURE__ */ new CourseTemplateApi();
