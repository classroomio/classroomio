import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetAllTemplatesMetadataResponse = typeof classroomio.exercise.template.$get;
export type GetAllTemplatesMetadataSuccess = Extract<
  InferResponseType<GetAllTemplatesMetadataResponse>,
  { success: true }
>;
export type GetAllTemplatesMetadataData = GetAllTemplatesMetadataSuccess['data'];

export type GetTemplateByIdResponse = (typeof classroomio.exercise.template)[':id']['$get'];
export type GetTemplateByIdSuccess = Extract<InferResponseType<GetTemplateByIdResponse>, { success: true }>;
export type GetTemplateByIdData = GetTemplateByIdSuccess['data'];
