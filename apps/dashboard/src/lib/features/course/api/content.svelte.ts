import { BaseApiWithErrors } from '$lib/utils/services/api';

export class ContentApi extends BaseApiWithErrors {}

export const contentApi = new ContentApi();
