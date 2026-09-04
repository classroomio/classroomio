import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  CreateTagGroupRequest,
  CreateTagRequest,
  CreatedTag,
  CreatedTagGroup,
  GetCourseTagsRequest,
  GetTagGroupsRequest,
  OrganizationCourseTags,
  OrganizationTagGroups,
  UpdateTagGroupRequest,
  UpdateCourseTagsRequest,
  UpdateTagRequest
} from '../utils/types';
import type { TTagCreate, TTagGroupCreate, TTagGroupUpdate, TTagUpdate } from '@cio/utils/validation/tag';
import {
  ZCourseTagAssignment,
  ZTagCreate,
  ZTagGroupCreate,
  ZTagGroupUpdate,
  ZTagUpdate
} from '@cio/utils/validation/tag';

import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

class TagApi extends BaseApiWithErrors {
  tagGroups = $state<OrganizationTagGroups>([]);
  courseTags = $state<OrganizationCourseTags>([]);

  async getTagGroups() {
    return this.execute<GetTagGroupsRequest>({
      requestFn: () => classroomio.organization.tags.$get(),
      logContext: 'fetching organization tags',
      onSuccess: (response) => {
        this.tagGroups = response.data;
      },
      onError: () => {
        snackbar.error('snackbar.tags.fetch_failed');
      }
    });
  }

  async createTagGroup(fields: TTagGroupCreate): Promise<CreatedTagGroup | null> {
    const parsed = ZTagGroupCreate.safeParse(fields);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return null;
    }

    let created: CreatedTagGroup | null = null;

    await this.execute<CreateTagGroupRequest>({
      requestFn: () =>
        classroomio.organization.tags.groups.$post({
          json: parsed.data
        }),
      logContext: 'creating tag group',
      onSuccess: (response) => {
        created = response.data;
        snackbar.success('snackbar.tags.group_created');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
        } else {
          snackbar.error('snackbar.tags.save_failed');
        }
      }
    });

    if (created) {
      await this.getTagGroups();
    }

    return created;
  }

  async updateTagGroup(groupId: string, fields: TTagGroupUpdate): Promise<boolean> {
    const parsed = ZTagGroupUpdate.safeParse(fields);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return false;
    }

    let updated = false;

    await this.execute<UpdateTagGroupRequest>({
      requestFn: () =>
        classroomio.organization.tags.groups[':groupId'].$put({
          param: { groupId },
          json: parsed.data
        }),
      logContext: 'updating tag group',
      onSuccess: () => {
        updated = true;
        snackbar.success('snackbar.tags.group_updated');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
        } else {
          snackbar.error('snackbar.tags.save_failed');
        }
      }
    });

    if (updated) {
      await this.getTagGroups();
    }

    return updated;
  }

  async createTag(fields: TTagCreate): Promise<CreatedTag | null> {
    const parsed = ZTagCreate.safeParse(fields);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return null;
    }

    let created: CreatedTag | null = null;

    await this.execute<CreateTagRequest>({
      requestFn: () =>
        classroomio.organization.tags.$post({
          json: parsed.data
        }),
      logContext: 'creating tag',
      onSuccess: (response) => {
        created = response.data;
        snackbar.success('snackbar.tags.tag_created');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
        } else {
          snackbar.error('snackbar.tags.save_failed');
        }
      }
    });

    if (created) {
      await this.getTagGroups();
    }

    return created;
  }

  async updateTag(tagId: string, fields: TTagUpdate): Promise<boolean> {
    const parsed = ZTagUpdate.safeParse(fields);
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return false;
    }

    let updated = false;

    await this.execute<UpdateTagRequest>({
      requestFn: () =>
        classroomio.organization.tags[':tagId'].$put({
          param: { tagId },
          json: parsed.data
        }),
      logContext: 'updating tag',
      onSuccess: () => {
        updated = true;
        snackbar.success('snackbar.tags.tag_updated');
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
        } else {
          snackbar.error('snackbar.tags.save_failed');
        }
      }
    });

    if (updated) {
      await this.getTagGroups();
    }

    return updated;
  }

  async getCourseTags(courseId: string) {
    return this.execute<GetCourseTagsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].tags.$get({
          param: { courseId }
        }),
      logContext: 'fetching course tags',
      onSuccess: (response) => {
        this.courseTags = response.data;
      },
      onError: () => {
        snackbar.error('snackbar.tags.fetch_failed');
      }
    });
  }

  async updateCourseTags(
    courseId: string,
    tagIds: string[],
    options: {
      showSuccessToast?: boolean;
    } = {}
  ): Promise<boolean> {
    const { showSuccessToast = true } = options;

    const parsed = ZCourseTagAssignment.safeParse({ tagIds });
    if (!parsed.success) {
      this.errors = mapZodErrorsToTranslations(parsed.error);
      return false;
    }

    let updated = false;

    await this.execute<UpdateCourseTagsRequest>({
      requestFn: () =>
        classroomio.course[':courseId'].tags.$put({
          param: { courseId },
          json: parsed.data
        }),
      logContext: 'updating course tags',
      onSuccess: (response) => {
        this.courseTags = response.data;
        updated = true;
        if (showSuccessToast) {
          snackbar.success('snackbar.tags.course_tags_updated');
        }
      },
      onError: (result) => {
        if (typeof result === 'string') {
          snackbar.error(result);
          return;
        }

        if ('field' in result && result.field) {
          this.errors[result.field] = result.error;
        } else {
          snackbar.error('snackbar.tags.save_failed');
        }
      }
    });

    return updated;
  }
}

export const tagApi = new TagApi();
