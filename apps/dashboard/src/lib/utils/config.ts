import rootConfig from '../../../../../classroomio.config';
import { resolveConfig, type ResolvedConfig } from '@cio/sdk';
import { registerCertificateTemplates } from '@cio/certificates';

export const appConfig: ResolvedConfig = resolveConfig(rootConfig);

registerCertificateTemplates(Object.values(appConfig.certificateTemplates));
