import { classroomio, type InferResponseType } from '$lib/utils/services/api';

export type GetAllTemplatesMetadataRequest = typeof classroomio.exercise.template.$get;
export type GetAllTemplatesMetadataSuccess = Extract<
  InferResponseType<GetAllTemplatesMetadataRequest>,
  { success: true }
>;
export type GetAllTemplatesMetadataData = GetAllTemplatesMetadataSuccess['data'];

export type GetTemplateByTagRequest = (typeof classroomio.exercise.template)['tag'][':tag']['$get'];
export type GetTemplateByTagSuccess = Extract<InferResponseType<GetTemplateByTagRequest>, { success: true }>;
export type GetTemplateByTagData = GetTemplateByTagSuccess['data'];

export type GetTemplateByIdRequest = (typeof classroomio.exercise.template)[':id']['$get'];
export type GetTemplateByIdSuccess = Extract<InferResponseType<GetTemplateByIdRequest>, { success: true }>;
export type GetTemplateByIdData = GetTemplateByIdSuccess['data'];
