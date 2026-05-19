import { AppError, ErrorCodes } from '@api/utils/errors';
import {
  archiveWidget,
  createWidget,
  createWidgetVersion,
  getWidgetListItemById,
  getNextWidgetVersion,
  getPublishedWidgetPayloadByPublicKey,
  getWidgetById,
  getWidgetVersionById,
  listWidgetCourses,
  listWidgetVersions,
  listWidgetsByOrganization,
  replaceWidgetCourses,
  updateWidget
} from '@cio/db/queries/widget';
import {
  ZWidgetPayload,
  getDefaultWidgetConfig,
  normalizeWidgetConfig,
  type TCreateWidget,
  type TRollbackWidget,
  type TUpdateWidget
} from '@cio/utils/validation/widget';

import { getOrganizationById } from '@cio/db/queries/organization';
import {
  buildWidgetPayload,
  generateWidgetPublicKey,
  getCourseBaseUrl,
  getCourseWidgetScriptUrl,
  getWidgetEmbedCode,
  getWidgetHostedEmbedUrl,
  listWidgetAvailableEditorData
} from './widget-payload';

export async function listOrganizationWidgets(orgId: string) {
  try {
    return await listWidgetsByOrganization(orgId);
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to list widgets',
      ErrorCodes.WIDGET_FETCH_FAILED,
      500
    );
  }
}

export async function createOrganizationWidget(orgId: string, userId: string, data: TCreateWidget) {
  try {
    const widget = await createWidget({
      organizationId: orgId,
      name: data.name,
      layoutType: data.layoutType,
      selectionMode: data.selectionMode,
      publicKey: generateWidgetPublicKey(),
      config: normalizeWidgetConfig(data.config ?? getDefaultWidgetConfig()),
      createdByUserId: userId,
      updatedByUserId: userId
    });

    await replaceWidgetCourses(widget.id, data.selectedCourseIds);

    const listItem = await getWidgetListItemById(orgId, widget.id);

    if (!listItem) {
      throw new AppError('Widget not found after creation', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    return listItem;
  } catch (error) {
    throw new AppError(
      error instanceof Error ? error.message : 'Failed to create widget',
      ErrorCodes.WIDGET_CREATE_FAILED,
      500
    );
  }
}

export async function getOrganizationWidgetDetail(orgId: string, widgetId: string) {
  try {
    const widget = await getWidgetById(orgId, widgetId);
    if (!widget) {
      throw new AppError('Widget not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    const organization = await getOrganizationById(orgId);
    if (!organization) {
      throw new AppError('Organization not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    const [selectedCourses, versions, editorData] = await Promise.all([
      listWidgetCourses(widget.id),
      listWidgetVersions(orgId, widget.id),
      listWidgetAvailableEditorData(orgId)
    ]);

    return {
      widget: {
        ...widget,
        config: normalizeWidgetConfig(widget.config as Record<string, unknown>, editorData.planName),
        selectedCourseIds: selectedCourses.map((course) => course.courseId),
        embedCode: getWidgetEmbedCode(widget.publicKey),
        hostedEmbedUrl: getWidgetHostedEmbedUrl(widget.publicKey),
        publicScriptUrl: getCourseWidgetScriptUrl()
      },
      organization: {
        id: organization.id,
        name: organization.name,
        siteName: organization.siteName ?? '',
        customDomain: organization.customDomain
      },
      orgBaseUrl: getCourseBaseUrl(organization.siteName ?? '', organization.customDomain),
      availableCourses: editorData.availableCourses,
      availableTags: editorData.availableTags,
      versions,
      planGatedFields: editorData.planGatedFields,
      planName: editorData.planName
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to get widget detail',
      ErrorCodes.WIDGET_FETCH_FAILED,
      500
    );
  }
}

export async function updateOrganizationWidget(orgId: string, widgetId: string, userId: string, data: TUpdateWidget) {
  try {
    const existingWidget = await getWidgetById(orgId, widgetId);
    if (!existingWidget) {
      throw new AppError('Widget not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    const updatedWidget = await updateWidget(orgId, widgetId, {
      name: data.name ?? existingWidget.name,
      layoutType: data.layoutType ?? existingWidget.layoutType,
      selectionMode: data.selectionMode ?? existingWidget.selectionMode,
      config: normalizeWidgetConfig((data.config ?? existingWidget.config) as Record<string, unknown>),
      hasUnpublishedChanges: true,
      updatedByUserId: userId
    });

    if (!updatedWidget) {
      throw new AppError('Widget not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    if (data.selectedCourseIds) {
      await replaceWidgetCourses(widgetId, data.selectedCourseIds);
    }

    const listItem = await getWidgetListItemById(orgId, widgetId);

    if (!listItem) {
      throw new AppError('Widget not found after update', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    return listItem;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to update widget',
      ErrorCodes.WIDGET_UPDATE_FAILED,
      500
    );
  }
}

export async function deleteOrganizationWidget(orgId: string, widgetId: string, userId: string) {
  try {
    const archivedWidget = await archiveWidget(orgId, widgetId, userId);
    if (!archivedWidget) {
      throw new AppError('Widget not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    return archivedWidget;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to delete widget',
      ErrorCodes.WIDGET_DELETE_FAILED,
      500
    );
  }
}

export async function publishOrganizationWidget(orgId: string, widgetId: string, userId: string) {
  try {
    const widget = await getWidgetById(orgId, widgetId);
    if (!widget) {
      throw new AppError('Widget not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    const payload = await buildWidgetPayload(widget);
    const nextVersion = await getNextWidgetVersion(widget.id);
    const version = await createWidgetVersion({
      widgetId: widget.id,
      version: nextVersion,
      configSnapshot: normalizeWidgetConfig(widget.config as Record<string, unknown>),
      payloadSnapshot: payload,
      runtimeManifest: {
        version: 'v1',
        release: 'current',
        entryUrl: getCourseWidgetScriptUrl()
      },
      publishedByUserId: userId
    });

    const updatedWidget = await updateWidget(orgId, widget.id, {
      status: 'PUBLISHED',
      hasUnpublishedChanges: false,
      latestPublishedVersionId: version.id,
      updatedByUserId: userId
    });

    return {
      widget: updatedWidget,
      version,
      payload,
      embedCode: getWidgetEmbedCode(widget.publicKey),
      hostedEmbedUrl: getWidgetHostedEmbedUrl(widget.publicKey),
      publicScriptUrl: getCourseWidgetScriptUrl()
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to publish widget',
      ErrorCodes.WIDGET_PUBLISH_FAILED,
      500
    );
  }
}

export async function rollbackOrganizationWidget(
  orgId: string,
  widgetId: string,
  userId: string,
  data: TRollbackWidget
) {
  try {
    const [widget, version] = await Promise.all([
      getWidgetById(orgId, widgetId),
      getWidgetVersionById(orgId, widgetId, data.versionId)
    ]);

    if (!widget) {
      throw new AppError('Widget not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    if (!version) {
      throw new AppError('Widget version not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    const nextVersion = await getNextWidgetVersion(widgetId);
    const rollbackVersion = await createWidgetVersion({
      widgetId: widget.id,
      version: nextVersion,
      configSnapshot: version.configSnapshot,
      payloadSnapshot: version.payloadSnapshot,
      runtimeManifest: version.runtimeManifest,
      rolledBackFromVersionId: version.id,
      publishedByUserId: userId
    });

    const updatedWidget = await updateWidget(orgId, widgetId, {
      status: 'PUBLISHED',
      hasUnpublishedChanges: false,
      latestPublishedVersionId: rollbackVersion.id,
      updatedByUserId: userId
    });

    return {
      widget: updatedWidget,
      version: rollbackVersion
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to rollback widget',
      ErrorCodes.WIDGET_ROLLBACK_FAILED,
      500
    );
  }
}

export async function getPublishedWidgetPayload(publicKey: string) {
  try {
    const payload = await getPublishedWidgetPayloadByPublicKey(publicKey);
    if (!payload) {
      throw new AppError('Widget not found', ErrorCodes.WIDGET_NOT_FOUND, 404);
    }

    return ZWidgetPayload.parse(payload);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error instanceof Error ? error.message : 'Failed to fetch widget payload',
      ErrorCodes.WIDGET_PAYLOAD_FETCH_FAILED,
      500
    );
  }
}
