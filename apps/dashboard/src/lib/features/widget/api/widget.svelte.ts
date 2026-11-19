import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  ArchiveWidgetRequest,
  CreateWidgetInput,
  CreateWidgetRequest,
  DeleteWidgetRequest,
  GetWidgetDetailRequest,
  PublishWidgetRequest,
  RestoreWidgetRequest,
  RollbackWidgetRequest,
  UpdateWidgetInput,
  UpdateWidgetRequest,
  WidgetDetail
} from '../utils/types';
import { ZCreateWidget, ZUpdateWidget } from '@cio/utils/validation/widget';

import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

class WidgetApi extends BaseApiWithErrors {
  widgetDetail = $state<WidgetDetail | null>(null);

  async getWidget(widgetId: string) {
    return this.execute<GetWidgetDetailRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].$get({
          param: { widgetId }
        }),
      logContext: 'fetching widget detail',
      onSuccess: (response) => {
        this.widgetDetail = response.data;
      }
    });
  }

  async createWidget(fields: CreateWidgetInput) {
    const result = ZCreateWidget.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      snackbar.error('widgets.notifications.validation_failed');
      return null;
    }

    const response = await this.execute<CreateWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets.$post({
          json: result.data
        }),
      logContext: 'creating widget',
      onSuccess: () => {
        snackbar.success('widgets.notifications.created');
      }
    });

    return response?.data ?? null;
  }

  async updateWidget(widgetId: string, fields: UpdateWidgetInput, silent = false) {
    const result = ZUpdateWidget.safeParse(fields);
    if (!result.success) {
      this.errors = mapZodErrorsToTranslations(result.error);
      snackbar.error('widgets.notifications.validation_failed');
      return null;
    }

    const response = await this.execute<UpdateWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].$put({
          param: { widgetId },
          json: result.data
        }),
      logContext: 'updating widget',
      onSuccess: () => {
        if (!silent) snackbar.success('widgets.notifications.saved');
        this.errors = {};
      }
    });

    return response?.data ?? null;
  }

  async publishWidget(widgetId: string) {
    return this.execute<PublishWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].publish.$post({
          param: { widgetId }
        }),
      logContext: 'publishing widget',
      onSuccess: () => {
        snackbar.success('widgets.notifications.published');
      }
    });
  }

  async rollbackWidget(widgetId: string, versionId: string) {
    return this.execute<RollbackWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].rollback.$post({
          param: { widgetId },
          json: { versionId }
        }),
      logContext: 'rolling back widget',
      onSuccess: () => {
        snackbar.success('widgets.notifications.rolled_back');
      }
    });
  }

  /**
   * Membership of the widget list changes, but the list is server-driven: the page owns
   * which page of which filter is on screen, so the caller re-runs the load rather than
   * patching a local array that would drift from the server's page and totals.
   */
  async archiveWidget(widgetId: string) {
    const response = await this.execute<ArchiveWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].archive.$post({
          param: { widgetId }
        }),
      logContext: 'archiving widget',
      onSuccess: () => {
        snackbar.success('widgets.notifications.archived');
      },
      onError: () => {
        snackbar.error('widgets.notifications.archive_failed');
      }
    });

    return response?.data ?? null;
  }

  async deleteWidget(widgetId: string) {
    const response = await this.execute<DeleteWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].$delete({
          param: { widgetId }
        }),
      logContext: 'permanently deleting widget',
      onSuccess: () => {
        snackbar.success('widgets.notifications.permanently_deleted');
      },
      onError: () => {
        snackbar.error('widgets.notifications.delete_failed');
      }
    });

    return response?.data ?? null;
  }

  async restoreWidget(widgetId: string) {
    const response = await this.execute<RestoreWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].restore.$post({
          param: { widgetId }
        }),
      logContext: 'restoring widget',
      onSuccess: () => {
        snackbar.success('widgets.notifications.restored');
      },
      onError: () => {
        snackbar.error('widgets.notifications.restore_failed');
      }
    });

    return response?.data ?? null;
  }
}

export const widgetApi = new WidgetApi();
