import { classroomio, type InferResponseType } from '$lib/utils/services/api';
import type {
  TCreateWidget,
  TPreviewWidget,
  TUpdateWidget,
  TWidgetConfig,
  TWidgetDetail,
  TWidgetPayload
} from '@cio/utils/validation/widget';

export type GetWidgetsRequest = (typeof classroomio.organization)['widgets']['$get'];
export type GetWidgetDetailRequest = (typeof classroomio.organization)['widgets'][':widgetId']['$get'];
export type CreateWidgetRequest = (typeof classroomio.organization)['widgets']['$post'];
export type UpdateWidgetRequest = (typeof classroomio.organization)['widgets'][':widgetId']['$put'];
export type PreviewWidgetRequest = (typeof classroomio.organization)['widgets'][':widgetId']['preview']['$post'];
export type PublishWidgetRequest = (typeof classroomio.organization)['widgets'][':widgetId']['publish']['$post'];
export type RollbackWidgetRequest = (typeof classroomio.organization)['widgets'][':widgetId']['rollback']['$post'];
export type DeleteWidgetRequest = (typeof classroomio.organization)['widgets'][':widgetId']['$delete'];

export type GetWidgetsSuccess = Extract<InferResponseType<GetWidgetsRequest>, { success: true }>;
export type WidgetListItem = GetWidgetsSuccess['data'][number];

export type GetWidgetDetailSuccess = Extract<InferResponseType<GetWidgetDetailRequest>, { success: true }>;
export type WidgetDetailResponse = GetWidgetDetailSuccess['data'];
export type WidgetDetail = TWidgetDetail & WidgetDetailResponse;

export type PublishWidgetSuccess = Extract<InferResponseType<PublishWidgetRequest>, { success: true }>;
export type RollbackWidgetSuccess = Extract<InferResponseType<RollbackWidgetRequest>, { success: true }>;

export type WidgetConfig = TWidgetConfig;
export type WidgetPayload = TWidgetPayload;
export type CreateWidgetInput = TCreateWidget;
export type UpdateWidgetInput = TUpdateWidget;
export type PreviewWidgetInput = TPreviewWidget;
