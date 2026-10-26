import {
  ZPublicApiEmailTemplateParam,
  ZPublicApiEmailTemplateQuery,
  ZPublicApiSaveEmailTemplate,
  ZPublicApiSendTestEmailTemplate
} from '@cio/utils/validation/public-api';

import type { ClassroomIoApiClient } from '../api-client';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';

const ORG_ADMIN_RULE = 'the API key creator must be an org admin';

const READ_ONLY: ToolAnnotations = { readOnlyHint: true, destructiveHint: false };
const WRITE: ToolAnnotations = { readOnlyHint: false, destructiveHint: false };
const DESTRUCTIVE: ToolAnnotations = { readOnlyHint: false, destructiveHint: true };

export const ZListEmailTemplatesToolInput = ZPublicApiEmailTemplateQuery;

export const ZGetEmailTemplateToolInput = ZPublicApiEmailTemplateParam;

export const ZUpdateEmailTemplateToolInput = ZPublicApiSaveEmailTemplate.safeExtend(ZPublicApiEmailTemplateParam.shape);

export const ZResetEmailTemplateToolInput = ZPublicApiEmailTemplateParam;

export const ZSendTestEmailTemplateToolInput = ZPublicApiSendTestEmailTemplate.safeExtend(
  ZPublicApiEmailTemplateParam.shape
);

const listEmailTemplatesShape = ZListEmailTemplatesToolInput.shape as unknown as ZodRawShapeCompat;
const getEmailTemplateShape = ZGetEmailTemplateToolInput.shape as unknown as ZodRawShapeCompat;
const updateEmailTemplateShape = ZUpdateEmailTemplateToolInput.shape as unknown as ZodRawShapeCompat;
const resetEmailTemplateShape = ZResetEmailTemplateToolInput.shape as unknown as ZodRawShapeCompat;
const sendTestEmailTemplateShape = ZSendTestEmailTemplateToolInput.shape as unknown as ZodRawShapeCompat;

export function registerEmailTemplateTools(server: McpServer, apiClient: ClassroomIoApiClient) {
  server.tool(
    'list_email_templates',
    `List the student emails your organization can customize in one language, without their bodies; ${ORG_ADMIN_RULE}. Use get_email_template for a body.`,
    listEmailTemplatesShape,
    READ_ONLY,
    async (args) => {
      const query = ZListEmailTemplatesToolInput.parse(args);
      const result = await apiClient.listEmailTemplates(query);
      return jsonContent(result);
    }
  );

  server.tool(
    'get_email_template',
    `Get a student email template with its body and allowed placeholders; ${ORG_ADMIN_RULE}.`,
    getEmailTemplateShape,
    READ_ONLY,
    async (args) => {
      const params = ZGetEmailTemplateToolInput.parse(args);
      const result = await apiClient.getEmailTemplate(params);
      return jsonContent(result);
    }
  );

  server.tool(
    'update_email_template',
    `Save the body and, optionally, the subject of a student email in one language; ${ORG_ADMIN_RULE}. Requires a paid plan.`,
    updateEmailTemplateShape,
    WRITE,
    async (args) => {
      const { emailId, locale, ...payload } = ZUpdateEmailTemplateToolInput.parse(args);
      const result = await apiClient.updateEmailTemplate(
        { emailId, locale },
        ZPublicApiSaveEmailTemplate.parse(payload)
      );
      return jsonContent(result);
    }
  );

  server.tool(
    'reset_email_template',
    `Reset a student email in one language to the default, permanently deleting the saved version; ${ORG_ADMIN_RULE}. Requires a paid plan.`,
    resetEmailTemplateShape,
    DESTRUCTIVE,
    async (args) => {
      const params = ZResetEmailTemplateToolInput.parse(args);
      const result = await apiClient.resetEmailTemplate(params);
      return jsonContent(result);
    }
  );

  server.tool(
    'send_test_email_template',
    `Send a test of a student email, filled with sample values, to up to 5 addresses; ${ORG_ADMIN_RULE}. Without content or subject it tests the current template.`,
    sendTestEmailTemplateShape,
    WRITE,
    async (args) => {
      const { emailId, locale, ...payload } = ZSendTestEmailTemplateToolInput.parse(args);
      const result = await apiClient.sendTestEmailTemplate(
        { emailId, locale },
        ZPublicApiSendTestEmailTemplate.parse(payload)
      );
      return jsonContent(result);
    }
  );
}

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(data)
      }
    ]
  };
}
