import { BaseApiWithErrors, classroomio } from '$lib/utils/services/api';
import type {
  ArchiveWidgetRequest,
  CreateWidgetInput,
  CreateWidgetRequest,
  DeleteWidgetRequest,
  GetArchivedWidgetsRequest,
  GetWidgetDetailRequest,
  GetWidgetsRequest,
  PublishWidgetRequest,
  RestoreWidgetRequest,
  RollbackWidgetRequest,
  UpdateWidgetInput,
  UpdateWidgetRequest,
  WidgetDetail,
  WidgetListItem
} from '../utils/types';
import { ZCreateWidget, ZUpdateWidget } from '@cio/utils/validation/widget';

import { mapZodErrorsToTranslations } from '$lib/utils/validation';
import { snackbar } from '$features/ui/snackbar/store';

class WidgetApi extends BaseApiWithErrors {
  widgets = $state<WidgetListItem[]>([]);
  archivedWidgets = $state<WidgetListItem[]>([]);
  widgetDetail = $state<WidgetDetail | null>(null);

  async getWidgets() {
    return this.execute<GetWidgetsRequest>({
      requestFn: () => classroomio.organization.widgets.$get(),
      logContext: 'fetching widgets',
      onSuccess: (response) => {
        this.widgets = response.data;
      }
    });
  }

  async getArchivedWidgets() {
    return this.execute<GetArchivedWidgetsRequest>({
      requestFn: () => classroomio.organization.widgets.archived.$get(),
      logContext: 'fetching archived widgets',
      onSuccess: (response) => {
        this.archivedWidgets = response.data;
      },
      onError: () => {
        snackbar.error('widgets.notifications.archived_load_failed');
      }
    });
  }

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
      onSuccess: (response) => {
        this.widgets = [response.data, ...this.widgets];
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
      onSuccess: (response) => {
        if (!silent) snackbar.success('widgets.notifications.saved');
        this.errors = {};
        this.widgets = this.widgets.map((widget) => (widget.id === widgetId ? response.data : widget));
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

  async archiveWidget(widgetId: string) {
    return this.execute<ArchiveWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].archive.$post({
          param: { widgetId }
        }),
      logContext: 'archiving widget',
      onSuccess: (response) => {
        const archivedTarget = this.widgets.find((widget) => widget.id === widgetId);
        if (archivedTarget) {
          const updatedArchivedWidget = { ...archivedTarget, ...response.data };
          this.archivedWidgets = [updatedArchivedWidget, ...this.archivedWidgets.filter((w) => w.id !== widgetId)];
        }
        this.widgets = this.widgets.filter((widget) => widget.id !== widgetId);
        snackbar.success('widgets.notifications.archived');
      },
      onError: () => {
        snackbar.error('widgets.notifications.archive_failed');
      }
    });
  }

  async deleteWidget(widgetId: string) {
    return this.execute<DeleteWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].$delete({
          param: { widgetId }
        }),
      logContext: 'permanently deleting widget',
      onSuccess: () => {
        this.archivedWidgets = this.archivedWidgets.filter((widget) => widget.id !== widgetId);
        snackbar.success('widgets.notifications.permanently_deleted');
      },
      onError: () => {
        snackbar.error('widgets.notifications.delete_failed');
      }
    });
  }

  async restoreWidget(widgetId: string) {
    return this.execute<RestoreWidgetRequest>({
      requestFn: () =>
        classroomio.organization.widgets[':widgetId'].restore.$post({
          param: { widgetId }
        }),
      logContext: 'restoring widget',
      onSuccess: (response) => {
        this.archivedWidgets = this.archivedWidgets.filter((widget) => widget.id !== widgetId);
        this.widgets = [response.data, ...this.widgets.filter((w) => w.id !== widgetId)];
        snackbar.success('widgets.notifications.restored');
      },
      onError: () => {
        snackbar.error('widgets.notifications.restore_failed');
      }
    });
  }
}

export const widgetApi = new WidgetApi();
